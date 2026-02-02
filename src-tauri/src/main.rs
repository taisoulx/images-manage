use tauri::Manager;

mod commands;
mod config;
mod database;
mod image;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::ping,
            commands::get_system_info,
            commands::validate_image,
            commands::login,
            commands::get_all_images,
            commands::search_images,
            commands::upload_image,
            commands::get_config,
            commands::update_config,
            commands::get_images_directory,
            commands::get_thumbnails_directory,
            commands::get_config_file_path,
            commands::get_image_data,
            commands::update_image_info,
            commands::get_image_by_id,
            commands::delete_image,
            commands::start_server,
            commands::stop_server,
            commands::get_server_status,
        ])
        .setup(|app| {
            #[cfg(desktop)]
            {
                let window = app.get_webview_window("main").unwrap();

                // 监听窗口关闭事件，自动停止服务器
                let _app_handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { .. } = event {
                        println!("应用即将关闭，正在停止 API 服务器...");
                        // 同步停止服务器
                        let _ = commands::stop_server();
                    }
                });
            }

            // 初始化数据库
            if let Err(e) = database::init_database() {
                eprintln!("数据库初始化失败: {}", e);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
