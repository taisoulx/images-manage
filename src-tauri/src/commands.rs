use crate::config::{self, AppConfig};
use crate::database::{self, ImageRecord};
use crate::image::validate_image_format;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::Path;
use std::io::Read;
use tauri::command;
use hex;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub version: String,
    pub rust_version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageInfo {
    pub id: i32,
    pub filename: String,
    pub path: String,
    pub size: i64,
    pub thumbnail_path: Option<String>,
    pub description: Option<String>,
    pub created_at: String,
}

impl From<ImageRecord> for ImageInfo {
    fn from(record: ImageRecord) -> Self {
        ImageInfo {
            id: record.id,
            filename: record.filename,
            path: record.path,
            size: record.size,
            thumbnail_path: record.thumbnail_path,
            description: record.description,
            created_at: record.created_at,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadResult {
    pub success: bool,
    pub message: String,
    pub image_id: Option<i32>,
    pub file_size: Option<i64>,
}

// 计算文件的 SHA256 哈希值
fn calculate_file_hash(path: &Path) -> Result<String, String> {
    let mut file = match fs::File::open(path) {
        Ok(f) => f,
        Err(e) => return Err(format!("无法打开文件: {}", e)),
    };

    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];

    loop {
        let n = match file.read(&mut buffer) {
            Ok(0) => break,
            Ok(n) => n,
            Err(e) => return Err(format!("读取文件失败: {}", e)),
        };
        hasher.update(&buffer[..n]);
    }

    Ok(hex::encode(hasher.finalize()))
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
        return Err("密码错误".to_string());
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
    match database::get_all_images() {
        Ok(records) => {
            let images: Vec<ImageInfo> = records.into_iter().map(Into::into).collect();
            Ok(images)
        }
        Err(e) => Err(format!("查询图片失败: {}", e)),
    }
}

#[command]
pub fn search_images(query: String) -> Result<Vec<ImageInfo>, String> {
    if query.trim().is_empty() {
        return match database::get_all_images() {
            Ok(records) => {
                let images: Vec<ImageInfo> = records.into_iter().map(Into::into).collect();
                Ok(images)
            }
            Err(e) => Err(format!("搜索图片失败: {}", e)),
        };
    }

    match database::search_images(&query) {
        Ok(records) => {
            let images: Vec<ImageInfo> = records.into_iter().map(Into::into).collect();
            Ok(images)
        }
        Err(e) => Err(format!("搜索图片失败: {}", e)),
    }
}

#[command]
pub fn upload_image(path: String) -> Result<UploadResult, String> {
    let file_path = Path::new(&path);

    // 验证文件存在
    if !file_path.exists() {
        return Err(format!("文件不存在: {}", path));
    }

    // 获取文件元数据
    let metadata = match fs::metadata(&file_path) {
        Ok(meta) => meta,
        Err(e) => return Err(format!("无法读取文件元数据: {}", e)),
    };

    let file_size = metadata.len() as i64;

    // 获取文件名和扩展名
    let filename = match file_path.file_name() {
        Some(name) => name.to_string_lossy().to_string(),
        None => return Err("无法获取文件名".to_string()),
    };

    let extension = match file_path.extension() {
        Some(ext) => format!(".{}", ext.to_string_lossy()),
        None => return Err("无法获取文件扩展名".to_string()),
    };

    // 验证图片格式
    if let Err(e) = validate_image_format(&path) {
        return Err(format!("图片格式验证失败: {}", e));
    }

    // 计算文件哈希
    let hash = match calculate_file_hash(file_path) {
        Ok(h) => h,
        Err(e) => return Err(format!("计算文件哈希失败: {}", e)),
    };

    // 检查图片是否已存在
    match database::image_exists_by_hash(&hash) {
        Ok(true) => {
            return Ok(UploadResult {
                success: true,
                message: format!("文件 '{}' 已存在，跳过上传", filename),
                image_id: None,
                file_size: Some(file_size),
            });
        }
        Ok(false) => {}
        Err(e) => return Err(format!("检查图片是否存在失败: {}", e)),
    }

    // 确保图片存储目录存在
    database::ensure_images_dir()?;

    // 获取目标存储路径
    let storage_path = database::get_image_storage_path(&hash, &extension);

    // 确保目标目录存在（使用哈希前缀作为子目录）
    if let Some(parent) = storage_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建存储目录失败: {}", e))?;
        }
    }

    // 复制图片文件到存储目录
    fs::copy(&file_path, &storage_path)
        .map_err(|e| format!("复制图片文件失败: {}", e))?;

    // 将存储路径转换为字符串（用于数据库）
    let storage_path_str = storage_path
        .to_str()
        .ok_or_else(|| "存储路径编码错误".to_string())?;

    // 插入数据库（使用存储路径而不是原始路径）
    let image_id = match database::insert_image(&filename, storage_path_str, file_size, &hash) {
        Ok(id) => id,
        Err(e) => {
            // 如果数据库插入失败，删除已复制的文件
            let _ = fs::remove_file(&storage_path);
            return Err(format!("保存图片信息到数据库失败: {}", e));
        }
    };

    Ok(UploadResult {
        success: true,
        message: format!("文件 '{}' 上传成功", filename),
        image_id: Some(image_id),
        file_size: Some(file_size),
    })
}

/// 获取应用配置
#[command]
pub fn get_config() -> AppConfig {
    config::load_config()
}

/// 更新应用配置
#[command]
pub fn update_config(config: AppConfig) -> Result<(), String> {
    config::save_config(&config)
}

/// 获取图片存储目录
#[command]
pub fn get_images_directory() -> String {
    config::get_images_dir()
        .to_str()
        .unwrap_or("")
        .to_string()
}

/// 获取缩略图目录
#[command]
pub fn get_thumbnails_directory() -> String {
    config::get_thumbnails_dir()
        .to_str()
        .unwrap_or("")
        .to_string()
}

/// 获取配置文件路径
#[command]
pub fn get_config_file_path() -> String {
    config::get_config_path()
        .to_str()
        .unwrap_or("")
        .to_string()
}

/// 读取图片文件并返回 base64 编码的数据
#[command]
pub fn get_image_data(path: String) -> Result<String, String> {
    use std::fs;
    use base64::{Engine as _, engine::general_purpose};

    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err(format!("文件不存在: {}", path));
    }

    // 读取文件内容
    let data = fs::read(file_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;

    // 转换为 base64
    let base64_string = general_purpose::STANDARD.encode(&data);

    // 根据文件扩展名确定 MIME 类型
    let mime_type = match file_path.extension().and_then(|e| e.to_str()) {
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("png") => "image/png",
        Some("webp") => "image/webp",
        Some("gif") => "image/gif",
        _ => "image/jpeg",
    };

    Ok(format!("data:{};base64,{}", mime_type, base64_string))
}

/// 更新图片信息
#[command]
pub fn update_image_info(id: i32, filename: Option<String>, description: Option<String>) -> Result<(), String> {
    use rusqlite::params;
    use crate::database::get_connection;
    use std::path::Path;

    let conn = get_connection()
        .map_err(|e| format!("获取数据库连接失败: {}", e))?;

    // 获取当前图片信息
    let current_image = get_image_by_id(id)?;

    // 处理文件名更新
    if let Some(new_filename) = filename {
        // 验证文件名不为空
        if new_filename.trim().is_empty() {
            return Err("文件名不能为空".to_string());
        }

        // 获取文件扩展名
        let old_path = Path::new(&current_image.path);
        let extension = old_path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("jpg");

        // 构建新文件名（保留扩展名）
        let new_filename_with_ext = if new_filename.contains('.') {
            // 如果用户输入包含扩展名，提取不含扩展名的部分并加上原扩展名
            let name_without_ext = new_filename.rsplit_once('.').map(|(name, _)| name).unwrap_or(&new_filename);
            format!("{}.{}", name_without_ext, extension)
        } else {
            format!("{}.{}", new_filename.trim(), extension)
        };

        // 检查文件名是否已存在（排除当前图片）
        let mut existing = conn.prepare(
            "SELECT id FROM images WHERE filename = ?1 AND id != ?2"
        ).map_err(|e| format!("准备查询失败: {}", e))?;

        let exists = existing.exists(params![&new_filename_with_ext, id])
            .map_err(|e| format!("检查文件名是否存在失败: {}", e))?;

        if exists {
            return Err(format!("文件名 '{}' 已存在，请使用其他名称", new_filename_with_ext));
        }

        // 重命名文件
        if old_path.exists() {
            let new_path = old_path.with_file_name(&new_filename_with_ext);
            fs::rename(&old_path, &new_path)
                .map_err(|e| format!("重命名文件失败: {}", e))?;

            // 更新数据库
            conn.execute(
                "UPDATE images SET filename = ?1, path = ?2, updated_at = datetime('now') WHERE id = ?3",
                params![&new_filename_with_ext, new_path.to_str().unwrap(), id],
            ).map_err(|e| format!("更新文件名失败: {}", e))?;
        }
    }

    // 处理描述更新
    if let Some(desc) = description {
        let desc_str = desc.trim();
        let desc_value = if desc_str.is_empty() { None } else { Some(desc_str) };

        conn.execute(
            "UPDATE images SET description = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![desc_value, id],
        ).map_err(|e| format!("更新描述失败: {}", e))?;
    }

    Ok(())
}

/// 根据ID获取图片信息
#[command]
pub fn get_image_by_id(id: i32) -> Result<ImageInfo, String> {
    use rusqlite::params;
    use crate::database::get_connection;

    let conn = get_connection()
        .map_err(|e| format!("获取数据库连接失败: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT id, filename, path, size, thumbnail_path, description, created_at FROM images WHERE id = ?1"
    )
    .map_err(|e| format!("准备查询失败: {}", e))?;

    let image = stmt.query_row(params![id], |row| {
        Ok(ImageInfo {
            id: row.get(0)?,
            filename: row.get(1)?,
            path: row.get(2)?,
            size: row.get(3)?,
            thumbnail_path: row.get(4)?,
            description: row.get(5)?,
            created_at: row.get(6)?,
        })
    })
    .map_err(|e| format!("查询图片失败: {}", e))?;

    Ok(image)
}

/// 删除图片
#[command]
pub fn delete_image(id: i32) -> Result<(), String> {
    use rusqlite::params;
    use crate::database::get_connection;

    let conn = get_connection()
        .map_err(|e| format!("获取数据库连接失败: {}", e))?;

    // 先获取图片信息
    let image = get_image_by_id(id)?;

    // 删除数据库记录
    conn.execute(
        "DELETE FROM images WHERE id = ?1",
        params![id],
    )
    .map_err(|e| format!("删除数据库记录失败: {}", e))?;

    // 删除文件
    let file_path = Path::new(&image.path);
    if file_path.exists() {
        fs::remove_file(file_path)
            .map_err(|e| format!("删除文件失败: {}", e))?;
    }

    Ok(())
}

/// 启动 API 服务器
#[command]
pub fn start_server() -> Result<String, String> {
    use std::process::Command;

    // 在后台启动服务器
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/c", "start /B npm run server"])
            .spawn()
            .map_err(|e| format!("启动服务器失败: {}", e))?;
        Ok("服务器启动中...".to_string())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Command::new("npm")
            .args(["run", "server"])
            .spawn()
            .map_err(|e| format!("启动服务器失败: {}", e))?;
        Ok("服务器启动中...".to_string())
    }
}
