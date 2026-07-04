// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
#[cfg(target_os = "windows")]
use window_vibrancy::apply_acrylic;
use std::path::Path;
use std::process::Command;

#[derive(serde::Serialize)]
struct SystemInfo {
    username: String,
    hostname: String,
    os: String,
    kernel: String,
    uptime: String,
    memory: String,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_initial_cwd() -> Result<String, String> {
    std::env::current_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_home_dir() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        std::env::var("USERPROFILE")
            .map_err(|_| "Could not find USERPROFILE env var".to_string())
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::env::var("HOME")
            .map_err(|_| "Could not find HOME env var".to_string())
    }
}

#[tauri::command]
fn get_system_info() -> SystemInfo {
    let username = std::env::var("USERNAME")
        .or_else(|_| std::env::var("USER"))
        .unwrap_or_else(|_| "sharma".to_string());

    let hostname = std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "termaxxx-pc".to_string());

    #[cfg(target_os = "windows")]
    let os = "Windows 11 Home / Hyprland Windows Edition".to_string();
    #[cfg(target_os = "macos")]
    let os = "macOS Sequoia / Hyprland Mac Edition".to_string();
    #[cfg(target_os = "linux")]
    let os = "Arch Linux / Hyprland DE".to_string();
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    let os = "Generic Unix / Hyprland DE".to_string();

    #[cfg(target_os = "windows")]
    let kernel = "Windows NT 10.0.22631".to_string();
    #[cfg(target_os = "macos")]
    let kernel = "Darwin 23.4.0".to_string();
    #[cfg(target_os = "linux")]
    let kernel = "Linux 6.8.9-arch1-1".to_string();
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    let kernel = "Generic Kernel".to_string();

    // Mock realistic uptime and memory
    let uptime = "3 hours, 42 minutes".to_string();
    let memory = "7.84 GiB / 15.91 GiB (49%)".to_string();

    SystemInfo {
        username,
        hostname,
        os,
        kernel,
        uptime,
        memory,
    }
}

#[tauri::command]
fn resolve_directory(cwd: &str, target: &str) -> Result<String, String> {
    let current_path = Path::new(cwd);
    let target_path = Path::new(target);
    
    let resolved_path = if target_path.is_absolute() {
        target_path.to_path_buf()
    } else {
        current_path.join(target_path)
    };

    if let Ok(canonical) = resolved_path.canonicalize() {
        if canonical.is_dir() {
            let path_str = canonical.to_string_lossy().to_string();
            // Clean up the Windows UNC prefix if present (e.g. \\?\)
            let clean_path = if path_str.starts_with(r"\\?\") {
                path_str[4..].to_string()
            } else {
                path_str
            };
            Ok(clean_path)
        } else {
            Err("Not a directory".to_string())
        }
    } else {
        Err("Directory does not exist".to_string())
    }
}

#[tauri::command]
fn execute_command(command: &str, cwd: &str) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    let mut cmd = Command::new("powershell");
    #[cfg(target_os = "windows")]
    cmd.args(["-NoProfile", "-NonInteractive", "-Command", command]);

    #[cfg(not(target_os = "windows"))]
    let mut cmd = Command::new("sh");
    #[cfg(not(target_os = "windows"))]
    cmd.args(["-c", command]);

    if !cwd.is_empty() {
        cmd.current_dir(cwd);
    }

    match cmd.output() {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            if out.status.success() {
                Ok(stdout)
            } else {
                Err(format!("{}{}", stdout, stderr))
            }
        }
        Err(e) => Err(e.to_string()),
    }
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
        .invoke_handler(tauri::generate_handler![
            greet,
            get_initial_cwd,
            get_home_dir,
            get_system_info,
            resolve_directory,
            execute_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
