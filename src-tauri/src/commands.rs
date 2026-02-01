use crate::image::validate_image_format;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    version: String,
    rust_version: String,
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
    let expiration = SystemTime::now() + std::time::Duration::from_secs(86400); // 24小时

    let payload = serde_json::json!({
        "exp": expiration.duration_since(UNIX_EPOCH).unwrap().as_secs(),
        "sub": "admin",
    });

    Ok(serde_json::to_string(&payload).map_err(|e| e.to_string())?)
}
