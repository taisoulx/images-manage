use tauri::Manager;

mod commands;
mod database;
mod image;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::ping,
            commands::get_system_info,
            commands::validate_image,
            commands::login,
            commands::get_all_images,
            commands::search_images,
            commands::upload_image,
        ])
        .setup(|app| {
            #[cfg(desktop)]
            {
                let _window = app.get_webview_window("main").unwrap();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
