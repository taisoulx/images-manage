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
        ])
        .setup(|app| {
            #[cfg(desktop)]
            {
                let _window = app.get_webview_window("main").unwrap();
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
