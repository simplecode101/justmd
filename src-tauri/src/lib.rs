use std::fs;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::Path;
use std::sync::Mutex;
use tauri::Manager;

struct PendingFile(Mutex<Option<String>>);

fn log(msg: &str) {
    let path = std::env::temp_dir().join("fastmd_debug.log");
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&path) {
        let t = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default();
        let _ = writeln!(f, "[{:.3}] {}", t.as_secs_f64(), msg);
    }
}

#[tauri::command]
fn get_pending_file(state: tauri::State<PendingFile>) -> Option<String> {
    let path = state.0.lock().unwrap().take();
    log(&format!("get_pending_file -> {:?}", path));
    path
}

#[tauri::command]
fn log_frontend(msg: String) {
    log(&format!("[UI] {}", msg));
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn file_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let raw_args: Vec<String> = std::env::args().collect();
    log(&format!("start pid={} args={:?}", std::process::id(), raw_args));

    let initial = raw_args.iter().skip(1).find(|a| !a.starts_with("--")).cloned();
    log(&format!("initial pending={:?}", initial));

    tauri::Builder::default()
        .manage(PendingFile(Mutex::new(initial)))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(path) = args.iter().skip(1).find(|a| !a.starts_with("--")) {
                log(&format!("hot_start pending={}", path));
                *app.state::<PendingFile>().0.lock().unwrap() = Some(path.clone());
            }
        }))
        .invoke_handler(tauri::generate_handler![get_pending_file, log_frontend, read_file, file_exists])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
