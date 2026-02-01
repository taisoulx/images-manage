use crate::image::validate_image_format;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    version: String,
    rust_version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageInfo {
    id: Option<i32>,
    filename: String,
    path: String,
    size: i64,
    thumbnail_path: Option<String>,
    created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadResult {
    success: bool,
    message: String,
    image_id: Option<i32>,
}

#[command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[command]
pub fn ping() -> String {
    "pong".to_string()
}

#[command]
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        rust_version: env!("CARGO_PKG_RUST_VERSION").to_string(),
    }
}

#[command]
pub fn validate_image(path: String) -> Result<bool, String> {
    validate_image_format(&path)
}

#[command]
pub async fn login(password: String) -> Result<String, String> {
    if password != "admin" {
        return Err("密码错误".to_string())
    }

    use std::time::{SystemTime, UNIX_EPOCH};
    let expiration = SystemTime::now() + std::time::Duration::from_secs(86400);

    let payload = serde_json::json!({
        "exp": expiration.duration_since(UNIX_EPOCH).unwrap().as_secs(),
        "sub": "admin",
    });

    Ok(serde_json::to_string(&payload).map_err(|e| e.to_string())?)
}

#[command]
pub fn get_all_images() -> Result<Vec<ImageInfo>, String> {
    Ok(vec![])
}

#[command]
pub fn search_images(_query: String) -> Result<Vec<ImageInfo>, String> {
    Ok(vec![])
}

#[command]
pub fn upload_image(path: String) -> Result<UploadResult, String> {
    use std::fs;
    use std::path::Path;

    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err(format!("文件不存在: {}", path));
    }

    let metadata = match fs::metadata(&file_path) {
        Ok(meta) => meta,
        Err(e) => return Err(format!("无法读取文件元数据: {}", e)),
    };

    let _file_size = metadata.len();

    let filename = match file_path.file_name() {
        Some(name) => name.to_string_lossy().to_string(),
        None => return Err("无法获取文件名".to_string()),
    };

    Ok(UploadResult {
        success: true,
        message: format!("文件 '{}' 上传成功", filename),
        image_id: None,
    })
}
