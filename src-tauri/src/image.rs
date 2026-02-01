use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageMetadata {
    pub exif_make: Option<String>,
    pub exif_model: Option<String>,
    pub exif_iso: Option<i32>,
    pub exif_aperture: Option<f32>,
    pub exif_exposure_time: Option<String>,
    pub gps_latitude: Option<f64>,
    pub gps_longitude: Option<f64>,
    pub gps_altitude: Option<f64>,
    pub description: Option<String>,
}

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

pub fn get_image_dimensions(path: &str) -> Option<(u32, u32)> {
    None
}
