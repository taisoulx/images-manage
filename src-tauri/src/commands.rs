use serde::{Deserialize, Serialize};
use tauri::command;

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

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    version: String,
    rust_version: String,
}
