use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::io::{Read, Write};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// 图片存储目录
    pub images_dir: Option<String>,
    /// 缩略图目录
    pub thumbnails_dir: Option<String>,
    /// 是否自动生成缩略图
    pub auto_generate_thumbnails: bool,
    /// 缩略图最大宽度
    pub thumbnail_max_width: u32,
    /// 缩略图最大高度
    pub thumbnail_max_height: u32,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            images_dir: None,
            thumbnails_dir: None,
            auto_generate_thumbnails: true,
            thumbnail_max_width: 400,
            thumbnail_max_height: 400,
        }
    }
}

/// 获取配置文件路径
pub fn get_config_path() -> PathBuf {
    if cfg!(debug_assertions) {
        // 开发模式：使用项目根目录
        let mut path = std::env::current_exe().unwrap();
        for _ in 0..5 {
            path.pop();
        }
        path.push("config.json");
        path
    } else {
        // 生产模式：使用应用数据目录
        let config_dir = dirs::config_dir()
            .unwrap_or_else(|| {
                let mut path = std::env::current_exe().unwrap();
                path.pop();
                path
            });

        let mut path = config_dir;
        path.push("images-manage");
        path.push("config.json");
        path
    }
}

/// 加载配置
pub fn load_config() -> AppConfig {
    let config_path = get_config_path();

    if !config_path.exists() {
        // 创建默认配置文件
        let default_config = AppConfig::default();
        let _ = save_config(&default_config);
        return default_config;
    }

    let mut file = match fs::File::open(&config_path) {
        Ok(f) => f,
        Err(e) => {
            eprintln!("无法打开配置文件: {}, 使用默认配置", e);
            return AppConfig::default();
        }
    };

    let mut contents = String::new();
    if let Err(e) = file.read_to_string(&mut contents) {
        eprintln!("无法读取配置文件: {}, 使用默认配置", e);
        return AppConfig::default();
    }

    match serde_json::from_str(&contents) {
        Ok(config) => config,
        Err(e) => {
            eprintln!("解析配置文件失败: {}, 使用默认配置", e);
            AppConfig::default()
        }
    }
}

/// 保存配置
pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path();

    // 确保配置目录存在
    if let Some(parent) = config_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建配置目录失败: {}", e))?;
        }
    }

    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;

    let mut file = fs::File::create(&config_path)
        .map_err(|e| format!("创建配置文件失败: {}", e))?;

    file.write_all(json.as_bytes())
        .map_err(|e| format!("写入配置文件失败: {}", e))?;

    Ok(())
}

/// 获取图片存储目录
pub fn get_images_dir() -> PathBuf {
    let config = load_config();

    if let Some(dir) = config.images_dir {
        // 如果配置了相对路径，相对于项目根目录或应用目录
        let path = PathBuf::from(&dir);
        if path.is_absolute() {
            return path;
        }

        // 相对路径：基于配置文件所在目录
        let config_path = get_config_path();
        if let Some(parent) = config_path.parent() {
            return parent.join(path);
        }
    }

    // 默认：使用配置文件同级的 images 目录
    let config_path = get_config_path();
    let mut base_dir = config_path.parent().unwrap_or(&config_path).to_path_buf();
    base_dir.push("images");
    base_dir
}

/// 获取缩略图目录
pub fn get_thumbnails_dir() -> PathBuf {
    let config = load_config();

    if let Some(dir) = config.thumbnails_dir {
        let path = PathBuf::from(&dir);
        if path.is_absolute() {
            return path;
        }

        let config_path = get_config_path();
        if let Some(parent) = config_path.parent() {
            return parent.join(path);
        }
    }

    // 默认：使用图片目录下的 thumbnails 子目录
    let mut path = get_images_dir();
    path.push("thumbnails");
    path
}
