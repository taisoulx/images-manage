use std::path::Path;

pub fn validate_image_format(path: &str) -> Result<bool, String> {
    let path_obj = Path::new(path);
    let extension = path_obj
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("");

    match extension.to_lowercase().as_str() {
        "jpg" | "jpeg" | "png" | "webp" => Ok(true),
        _ => Ok(false),
    }
}
