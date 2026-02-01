use tauri::Manager;

mod commands;
mod database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::ping,
            commands::get_system_info,
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
