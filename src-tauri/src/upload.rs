use std::fs;
use std::io::Read;
use std::path::Path;
use sha2::{Digest, Sha256};
use hex;

#[derive(Debug)]
pub struct UploadResult {
    pub success: bool,
    pub message: String,
    pub image_id: Option<i32>,
    pub file_size: Option<i64>,
}

// 计算文件的 SHA256 哈希值
pub fn calculate_file_hash(path: &Path) -> Result<String, String> {
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

/// 上传图片文件
pub fn upload_image_from_path(path: &str) -> Result<UploadResult, String> {
    use crate::database;
    use crate::image::validate_image_format;

    let file_path = Path::new(path);

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
    if let Err(e) = validate_image_format(path) {
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
