use tauri::{AppHandle, Manager};
use serde::{Serialize, Deserialize};
use std::fs;
use std::path::PathBuf;
use chrono::Local;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone)]
pub struct DebugLog {
    pub id: String,
    pub timestamp: String,
    pub issue_type: String,
    pub message: String,
    pub page_route: String,
    pub console_logs: Vec<String>,
    pub metadata: LogMetadata,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct LogMetadata {
    pub app_version: String,
    pub platform: String,
    pub screen_resolution: String,
}

fn get_debug_logs_dir(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_data = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let debug_dir = app_data.join("ManualDebugLogs");
    
    if !debug_dir.exists() {
        fs::create_dir_all(&debug_dir).map_err(|e| e.to_string())?;
    }
    
    Ok(debug_dir)
}

#[tauri::command]
pub fn save_debug_log(app_handle: AppHandle, log: DebugLog) -> Result<String, String> {
    let debug_dir = get_debug_logs_dir(&app_handle)?;
    
    // Generate unique ID and timestamp if not provided
    let mut log = log;
    if log.id.is_empty() {
        log.id = Uuid::new_v4().to_string();
    }
    if log.timestamp.is_empty() {
        log.timestamp = Local::now().to_rfc3339();
    }
    
    // Create filename: YYYY-MM-DD_HH-mm-ss_[issue-type]_[id].json
    let now = Local::now();
    let filename = format!(
        "{}_{}.json",
        now.format("%Y-%m-%d_%H-%M-%S"),
        log.issue_type.replace(" ", "-").to_lowercase()
    );
    
    let file_path = debug_dir.join(&filename);
    
    // Serialize to pretty JSON
    let json = serde_json::to_string_pretty(&log).map_err(|e| e.to_string())?;
    
    // Write to file
    fs::write(&file_path, json).map_err(|e| e.to_string())?;
    
    Ok(log.id)
}

#[tauri::command]
pub fn get_debug_logs(app_handle: AppHandle) -> Result<Vec<DebugLog>, String> {
    let debug_dir = get_debug_logs_dir(&app_handle)?;
    
    let mut logs = Vec::new();
    
    // Read all JSON files in the directory
    if let Ok(entries) = fs::read_dir(&debug_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(log) = serde_json::from_str::<DebugLog>(&content) {
                        logs.push(log);
                    }
                }
            }
        }
    }
    
    // Sort by timestamp (newest first)
    logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    
    Ok(logs)
}

#[tauri::command]
pub fn delete_debug_log(app_handle: AppHandle, id: String) -> Result<(), String> {
    let debug_dir = get_debug_logs_dir(&app_handle)?;
    
    // Find and delete the file with matching ID
    if let Ok(entries) = fs::read_dir(&debug_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(log) = serde_json::from_str::<DebugLog>(&content) {
                        if log.id == id {
                            fs::remove_file(&path).map_err(|e| e.to_string())?;
                            return Ok(());
                        }
                    }
                }
            }
        }
    }
    
    Err(format!("Debug log with ID {} not found", id))
}

#[tauri::command]
pub fn clear_all_debug_logs(app_handle: AppHandle) -> Result<usize, String> {
    let debug_dir = get_debug_logs_dir(&app_handle)?;
    
    let mut count = 0;
    
    // Delete all JSON files
    if let Ok(entries) = fs::read_dir(&debug_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                if fs::remove_file(&path).is_ok() {
                    count += 1;
                }
            }
        }
    }
    
    Ok(count)
}
