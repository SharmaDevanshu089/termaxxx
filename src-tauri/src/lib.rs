// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use window_vibrancy::{apply_acrylic, apply_blur, apply_mica};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "windows")]
            apply_acrylic(&window, Some((40, 30, 55, 110).into()))
                .expect("Failed to apply acrylic");

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
