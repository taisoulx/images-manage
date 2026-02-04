use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use actix_cors::Cors;
use std::path::Path;
use std::fs;
use std::sync::Mutex;
use std::thread;
use std::net::SocketAddr;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::database::{self, ImageRecord};
use crate::commands;

// 全局服务器句柄
static SERVER_HANDLE: Mutex<Option<ServerHandle>> = Mutex::new(None);

#[derive(Debug, Serialize, Deserialize)]
struct NetworkInfo {
    ip_address: String,
    port: u16,
    url: String,
    all_addresses: Vec<String>,
    hostname: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct HealthResponse {
    status: String,
    server: String,
    version: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ImageResponse {
    id: i32,
    filename: String,
    path: String,
    size: i64,
    thumbnail_path: Option<String>,
    description: Option<String>,
    created_at: String,
}

impl From<ImageRecord> for ImageResponse {
    fn from(record: ImageRecord) -> Self {
        ImageResponse {
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

struct ServerHandle {
    _local_addr: SocketAddr,
    shutdown_tx: tokio::sync::oneshot::Sender<()>,
}

/// 启动 API 服务器
pub fn start_server() -> Result<String, String> {
    // 检查是否已经有服务器在运行
    let mut handle = SERVER_HANDLE.lock().unwrap();
    if handle.is_some() {
        return Ok("服务器已在运行中".to_string());
    }

    // 注意：在生产环境中，前端由 Tauri webview 加载，不需要 dist 目录
    // API 服务器只提供 API 接口供局域网设备访问

    // 创建运行时
    let rt = tokio::runtime::Runtime::new().map_err(|e| format!("创建运行时失败: {}", e))?;

    // 创建 shutdown channel
    let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel::<()>();

    // 在新线程中运行服务器
    thread::spawn(move || {
        rt.block_on(async {
            // 配置端口
            let port = 3000;
            let bind_addr = format!("0.0.0.0:{}", port);

            // 构建 Actix Web 服务器（仅 API 接口，不服务前端静态文件）
            let http_server = HttpServer::new(|| {
                App::new()
                    .wrap(Cors::permissive())
                    .service(
                        web::scope("/api")
                            .route("/health", web::get().to(health_check))
                            .route("/network", web::get().to(get_network_info))
                            .route("/images", web::get().to(get_all_images))
                            .route("/images/search", web::get().to(search_images))
                            .route("/images/{id}", web::get().to(get_image))
                            .route("/images/{id}/file", web::get().to(get_image_file))
                            .route("/images/{id}/thumbnail", web::get().to(get_image_thumbnail))
                            .route("/images/{id}", web::put().to(update_image))
                            .route("/images/{id}", web::delete().to(delete_image))
                    )
                    // 404 处理
                    .default_service(web::route().to(not_found))
            })
            .bind(&bind_addr);

            let http_server = match http_server {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("绑定端口失败: {}", e);
                    return;
                }
            };

            let server = http_server.run();

            // 等待 shutdown 信号或服务器结束
            tokio::select! {
                _ = server => {
                    println!("服务器正常结束");
                }
                _ = shutdown_rx => {
                    println!("收到停止信号，正在关闭服务器...");
                }
            }
        });
    });

    // 保存服务器句柄
    let server_handle = ServerHandle {
        _local_addr: "0.0.0.0:3000".parse().unwrap(),
        shutdown_tx,
    };
    *handle = Some(server_handle);

    Ok("服务器启动成功".to_string())
}

/// 停止 API 服务器
pub fn stop_server() -> Result<String, String> {
    let mut handle = SERVER_HANDLE.lock().unwrap();

    if let Some(server_handle) = handle.take() {
        // 发送停止信号
        let _ = server_handle.shutdown_tx.send(());
        Ok("服务器已停止".to_string())
    } else {
        // 没有服务器在运行，尝试清理端口
        #[cfg(unix)]
        {
            use std::process::Command;

            let output = Command::new("lsof")
                .args(["-ti:3000"])
                .output();

            if output.is_ok() {
                let stdout = output.unwrap().stdout;
                if !stdout.is_empty() {
                    let pids = String::from_utf8_lossy(&stdout);
                    for pid in pids.lines() {
                        let _ = Command::new("kill")
                            .args(["-9", pid.trim()])
                            .spawn();
                    }
                    return Ok("服务器已停止（清理了占用端口的进程）".to_string());
                }
            }
        }

        Ok("服务器未在运行".to_string())
    }
}

/// 获取服务器状态
pub fn get_server_status() -> Result<bool, String> {
    let handle = SERVER_HANDLE.lock().unwrap();
    Ok(handle.is_some())
}

// API 处理函数

async fn health_check() -> impl Responder {
    HttpResponse::Ok().body(serde_json::to_string(&HealthResponse {
        status: "ok".to_string(),
        server: "images-manage-api".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    }).unwrap())
}

async fn get_network_info() -> impl Responder {
    let ip_address = get_local_ip();
    let port = 3000;
    let url = format!("http://{}:{}", ip_address, port);

    let mut all_addresses = get_all_local_ips();
    all_addresses.sort();
    all_addresses.dedup();

    HttpResponse::Ok().body(serde_json::to_string(&NetworkInfo {
        ip_address,
        port,
        url,
        all_addresses,
        hostname: get_hostname(),
    }).unwrap())
}

async fn get_all_images() -> impl Responder {
    match database::get_all_images() {
        Ok(records) => {
            let images: Vec<ImageResponse> = records.into_iter().map(Into::into).collect();
            HttpResponse::Ok().json(serde_json::json!({ "images": images }))
        }
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("查询图片失败: {}", e)
            }))
        }
    }
}

async fn search_images(web::Query(query): web::Query<HashMap<String, String>>) -> impl Responder {
    let search_term = query.get("search").map(|s| s.as_str()).unwrap_or("");

    if search_term.trim().is_empty() {
        match database::get_all_images() {
            Ok(records) => {
                let images: Vec<ImageResponse> = records.into_iter().map(Into::into).collect();
                HttpResponse::Ok().json(serde_json::json!({ "images": images }))
            }
            Err(e) => {
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": format!("查询图片失败: {}", e)
                }))
            }
        }
    } else {
        match database::search_images(search_term) {
            Ok(records) => {
                let images: Vec<ImageResponse> = records.into_iter().map(Into::into).collect();
                HttpResponse::Ok().json(serde_json::json!({ "images": images }))
            }
            Err(e) => {
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": format!("搜索图片失败: {}", e)
                }))
            }
        }
    }
}

async fn get_image(path: web::Path<i32>) -> impl Responder {
    let id = path.into_inner();

    match commands::get_image_by_id(id) {
        Ok(image_info) => {
            // Convert ImageInfo to ImageResponse manually
            let response = ImageResponse {
                id: image_info.id,
                filename: image_info.filename,
                path: image_info.path,
                size: image_info.size,
                thumbnail_path: image_info.thumbnail_path,
                description: image_info.description,
                created_at: image_info.created_at,
            };
            HttpResponse::Ok().body(serde_json::to_string(&response).unwrap())
        }
        Err(e) => {
            HttpResponse::NotFound().json(serde_json::json!({
                "error": format!("图片不存在: {}", e)
            }))
        }
    }
}

async fn get_image_file(path: web::Path<i32>) -> impl Responder {
    let id = path.into_inner();

    match commands::get_image_by_id(id) {
        Ok(image) => {
            let file_path = Path::new(&image.path);

            if !file_path.exists() {
                return HttpResponse::NotFound().body("文件不存在");
            }

            // 读取文件
            match fs::read(&file_path) {
                Ok(data) => {
                    // 确定 MIME 类型
                    let mime_type_str = mime_guess::from_path(&file_path)
                        .first()
                        .map(|m| m.to_string())
                        .unwrap_or_else(|| "application/octet-stream".to_string());

                    HttpResponse::Ok()
                        .content_type(mime_type_str.as_str())
                        .insert_header(("Cache-Control", "public, max-age=86400"))
                        .body(data)
                }
                Err(e) => {
                    HttpResponse::InternalServerError().body(format!("读取文件失败: {}", e))
                }
            }
        }
        Err(e) => {
            HttpResponse::NotFound().json(serde_json::json!({
                "error": format!("图片不存在: {}", e)
            }))
        }
    }
}

async fn get_image_thumbnail(path: web::Path<i32>) -> impl Responder {
    let id = path.into_inner();

    match commands::get_image_by_id(id) {
        Ok(image) => {
            let file_path = Path::new(&image.path);

            if !file_path.exists() {
                return HttpResponse::NotFound().body("文件不存在");
            }

            // 读取文件
            match fs::read(&file_path) {
                Ok(data) => {
                    HttpResponse::Ok()
                        .content_type("image/jpeg")
                        .insert_header(("Cache-Control", "public, max-age=31536000, immutable"))
                        .body(data)
                }
                Err(e) => {
                    HttpResponse::InternalServerError().body(format!("读取文件失败: {}", e))
                }
            }
        }
        Err(e) => {
            HttpResponse::NotFound().json(serde_json::json!({
                "error": format!("图片不存在: {}", e)
            }))
        }
    }
}

async fn update_image(
    path: web::Path<i32>,
    info: web::Json<HashMap<String, serde_json::Value>>,
) -> impl Responder {
    let id = path.into_inner();
    let description = info.get("description").and_then(|v| v.as_str());
    let filename = info.get("filename").and_then(|v| v.as_str());

    match commands::update_image_info(id, filename.map(String::from), description.map(String::from)) {
        Ok(_) => {
            HttpResponse::Ok().json(serde_json::json!({ "success": true }))
        }
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": e
            }))
        }
    }
}

async fn delete_image(path: web::Path<i32>) -> impl Responder {
    let id = path.into_inner();

    match commands::delete_image(id) {
        Ok(_) => {
            HttpResponse::Ok().json(serde_json::json!({ "success": true }))
        }
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("删除图片失败: {}", e)
            }))
        }
    }
}

async fn not_found() -> impl Responder {
    HttpResponse::NotFound().json(serde_json::json!({
        "error": "Not Found"
    }))
}

// 辅助函数

fn get_local_ip() -> String {
    let addresses = get_all_local_ips();

    if addresses.is_empty() {
        return "localhost".to_string();
    }

    // 优先返回 en0, en1 等主要网络接口的地址
    let priority_interfaces = ["en0", "en1", "wlan0", "Wi-Fi"];

    for interface in priority_interfaces {
        if addresses.contains(&interface.to_string()) {
            // 这个逻辑需要系统调用来获取接口对应的IP
            // 简化处理，返回第一个地址
        }
    }

    // 返回第一个非本地地址
    for addr in &addresses {
        if !addr.starts_with("127.") && !addr.starts_with("fe80:") {
            return addr.clone();
        }
    }

    addresses[0].clone()
}

fn get_all_local_ips() -> Vec<String> {
    let mut addresses = Vec::new();

    // 在 macOS 上使用 ifconfig
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;

        if let Ok(output) = Command::new("ifconfig")
            .args(["-a"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut current_interface = String::new();

            for line in stdout.lines() {
                // 检测网络接口名称
                if line.contains(": flags=") && !line.contains("LOOPBACK") {
                    if let Some(if_name) = line.split(':').next() {
                        current_interface = if_name.trim().to_string();
                    }
                }

                // 检测 inet 地址（IPv4）
                if line.trim().starts_with("inet ") && current_interface != "lo0" {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        let ip = parts[1];
                        if ip != "127.0.0.1" {
                            addresses.push(ip.to_string());
                        }
                    }
                }
            }
        }
    }

    // 在 Windows 上使用 ipconfig
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        if let Ok(output) = Command::new("ipconfig")
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut current_adapter = String::new();

            for line in stdout.lines() {
                // 检测适配器名称
                if line.trim().ends_with(':') {
                    current_adapter = line.trim().trim_end_matches(':').to_string();
                }

                // 检测 IPv4 地址
                if line.trim().starts_with("IPv4 Address") {
                    let parts: Vec<&str> = line.split(':').collect();
                    if parts.len() >= 2 {
                        let ip = parts[1].trim();
                        // 过滤掉 127.x.x.x 和 169.254.x.x (APIPA)
                        if !ip.starts_with("127.") && !ip.starts_with("169.254.") && !ip.is_empty() {
                            addresses.push(ip.to_string());
                        }
                    }
                }
            }
        }
    }

    // 在 Linux 上使用 ip 命令
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;

        if let Ok(output) = Command::new("ip")
            .args(["-4", "addr", "show"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if line.trim().starts_with("inet ") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        let ip_with_cidr = parts[1];
                        if let Some(ip) = ip_with_cidr.split('/').next() {
                            if ip != "127.0.0.1" {
                                addresses.push(ip.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    // 添加 localhost 作为备用
    if addresses.is_empty() {
        addresses.push("127.0.0.1".to_string());
    }

    addresses
}

fn get_hostname() -> String {
    std::env::var("HOSTNAME").unwrap_or_else(|_| {
        std::process::Command::new("hostname")
            .output()
            .map(|output| String::from_utf8_lossy(&output.stdout).trim().to_string())
            .unwrap_or_else(|_| "localhost".to_string())
    })
}
