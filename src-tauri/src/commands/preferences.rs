use tauri::command;
use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppPreferences {
    pub theme: String,
    pub accent_color: String,
    pub density: String,
    pub font_family: String,
    pub dashboard_view_mode: String,
    pub show_system_dbs: bool,
    pub query_history: Vec<QueryHistoryItem>,
    // Performance & Debug Settings
    pub debug_mode: bool,
    pub performance_monitoring: bool,
    pub show_performance_overlay: bool,
    pub log_level: String,
    
    // AI Settings
    pub ai_config: AIConfig,
    
    // Export Templates
    pub export_templates: Vec<ExportTemplate>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExportTemplate {
    pub id: String,
    pub name: String,
    pub options: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AIConfig {
    pub provider: String, // "openai" | "ollama" | "gemini" | "disabled"
    pub api_key: Option<String>,
    pub model: String,
    pub endpoint: Option<String>, // For Ollama
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

impl Default for AIConfig {
    fn default() -> Self {
        Self {
            provider: "ollama".to_string(), // Default to local privacy-first
            api_key: None,
            model: "llama3".to_string(),
            endpoint: Some("http://localhost:11434".to_string()),
            temperature: Some(0.3),
            max_tokens: Some(2048),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QueryHistoryItem {
    pub sql: String,
    pub timestamp: String,
}

impl Default for AppPreferences {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            accent_color: "blue".to_string(),
            density: "default".to_string(),
            font_family: "sans".to_string(),
            dashboard_view_mode: "grid".to_string(),
            show_system_dbs: false,
            query_history: vec![],
            // Performance defaults
            debug_mode: false,
            performance_monitoring: false,
            show_performance_overlay: false,
            log_level: "info".to_string(),
            // AI defaults
            ai_config: AIConfig::default(),
            export_templates: vec![],
        }
    }
}

fn get_prefs_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let config_dir = app_handle.path().app_config_dir().map_err(|e| e.to_string())?;
    if !config_dir.exists() {
        let _ = fs::create_dir_all(&config_dir);
    }
    Ok(config_dir.join("preferences.json"))
}

#[command]
pub fn load_preferences(app_handle: tauri::AppHandle) -> Result<AppPreferences, String> {
    let path = get_prefs_path(&app_handle)?;
    if !path.exists() {
        return Ok(AppPreferences::default());
    }

    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let prefs: AppPreferences = serde_json::from_str(&content).unwrap_or(AppPreferences::default());
    Ok(prefs)
}

#[command]
pub fn save_preferences(
    app_handle: tauri::AppHandle, 
    preferences: AppPreferences
) -> Result<(), String> {
    let path = get_prefs_path(&app_handle)?;
    let content = serde_json::to_string_pretty(&preferences).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}
