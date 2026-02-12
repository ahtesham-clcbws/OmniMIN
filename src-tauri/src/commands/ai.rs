use tauri::{command, Manager};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use reqwest::Client;
use crate::commands::preferences::{AppPreferences, AIConfig};

fn get_prefs_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let config_dir = app_handle.path().app_config_dir().map_err(|e| e.to_string())?;
    Ok(config_dir.join("preferences.json"))
}

async fn get_ai_config_internal(app_handle: &tauri::AppHandle) -> Result<AIConfig, String> {
    let path = get_prefs_path(app_handle)?;
    if !path.exists() {
        return Ok(AIConfig::default());
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let prefs: AppPreferences = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(prefs.ai_config)
}

#[derive(Deserialize)]
struct OllamaResponse {
    response: String,
}

#[derive(Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

#[derive(Deserialize)]
struct OpenAIChoice {
    message: OpenAIMessage,
}

#[derive(Deserialize)]
struct OpenAIMessage {
    content: String,
}

#[derive(Deserialize)]
struct GeminiResponse {
    candidates: Vec<GeminiCandidate>,
}

#[derive(Deserialize)]
struct GeminiCandidate {
    content: GeminiContent,
}

#[derive(Deserialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Deserialize)]
struct GeminiPart {
    text: String,
}

#[command]
pub async fn generate_sql(app_handle: tauri::AppHandle, prompt: String, schema_context: String) -> Result<String, String> {
    let config = get_ai_config_internal(&app_handle).await?;
    let client = Client::new();

    let system_prompt = format!(
        "You are an expert SQL assistant. Generate a valid SQL query for the following request. \
        Target Database Schema: \n{}\n \
        Return ONLY the SQL query, no markdown, no explanation. If you cannot generate SQL, return a SQL comment explaining why.",
        schema_context
    );

    match config.provider.as_str() {
        "ollama" => {
            let endpoint = config.endpoint.unwrap_or("http://localhost:11434".to_string());
            let url = format!("{}/api/generate", endpoint);
            
            let body = serde_json::json!({
                "model": config.model,
                "prompt": format!("{}\n\nUser Request: {}", system_prompt, prompt),
                "stream": false,
                "options": {
                    "temperature": config.temperature
                }
            });

            let res = client.post(&url)
                .json(&body)
                .send()
                .await
                .map_err(|e| e.to_string())?;

            if !res.status().is_success() {
                 return Err(format!("Ollama Error: {}", res.status()));
            }

            let ollama_res: OllamaResponse = res.json().await.map_err(|e| e.to_string())?;
            Ok(ollama_res.response.trim().to_string())
        },
        "gemini" => {
            let api_key = config.api_key.ok_or("Gemini API Key not set")?;
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}", 
                config.model, api_key
            );

            let body = serde_json::json!({
                "contents": [{
                    "parts": [{
                        "text": format!("{}\n\nUser Request: {}", system_prompt, prompt)
                    }]
                }],
                "generationConfig": {
                    "temperature": config.temperature,
                    "maxOutputTokens": config.max_tokens
                }
            });

            let res = client.post(&url)
                .json(&body)
                .send()
                .await
                .map_err(|e| e.to_string())?;

            if !res.status().is_success() {
                let err_text = res.text().await.unwrap_or_default();
                return Err(format!("Gemini Error: {}", err_text));
            }

            let gemini_res: GeminiResponse = res.json().await.map_err(|e| e.to_string())?;
            if let Some(candidate) = gemini_res.candidates.first() {
                if let Some(part) = candidate.content.parts.first() {
                     return Ok(part.text.trim().to_string());
                }
            }
            Err("No response from Gemini".to_string())
        },
        "openai" => {
            let api_key = config.api_key.ok_or("OpenAI API Key not set")?;
            let url = "https://api.openai.com/v1/chat/completions";

            let body = serde_json::json!({
                "model": config.model,
                "messages": [
                    { "role": "system", "content": system_prompt },
                    { "role": "user", "content": prompt }
                ],
                "temperature": config.temperature
            });

            let res = client.post(url)
                .header("Authorization", format!("Bearer {}", api_key))
                .json(&body)
                .send()
                .await
                .map_err(|e| e.to_string())?;

            if !res.status().is_success() {
                let err_text = res.text().await.unwrap_or_default();
                return Err(format!("OpenAI Error: {}", err_text));
            }

            let openai_res: OpenAIResponse = res.json().await.map_err(|e| e.to_string())?;
            if let Some(choice) = openai_res.choices.first() {
                return Ok(choice.message.content.trim().to_string());
            } else {
                return Err("No response from OpenAI".to_string());
            }
        },
        "disabled" => Err("AI Assistance is disabled in settings".to_string()),
        _ => Err("Unsupported AI provider".to_string())
    }
}

#[command]
pub async fn explain_query(app_handle: tauri::AppHandle, sql: String) -> Result<String, String> {
    let config = get_ai_config_internal(&app_handle).await?;
    let client = Client::new();

    let system_prompt = "You are an expert database engineer. Explain the following SQL query in simple, concise terms. Focus on performance implications and logic.";

    match config.provider.as_str() {
        "ollama" => {
            let endpoint = config.endpoint.unwrap_or("http://localhost:11434".to_string());
            let url = format!("{}/api/generate", endpoint);
            
            let body = serde_json::json!({
                "model": config.model,
                "prompt": format!("{}\n\nSQL: {}", system_prompt, sql),
                "stream": false
            });

            let res = client.post(&url).json(&body).send().await.map_err(|e| e.to_string())?;
            let ollama_res: OllamaResponse = res.json().await.map_err(|e| e.to_string())?;
            Ok(ollama_res.response.trim().to_string())
        },
        "gemini" => {
             let api_key = config.api_key.ok_or("Gemini API Key not set")?;
             let url = format!(
                 "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}", 
                 config.model, api_key
             );
 
             let body = serde_json::json!({
                 "contents": [{
                     "parts": [{
                         "text": format!("{}\n\nSQL: {}", system_prompt, sql)
                     }]
                 }]
             });
 
             let res = client.post(&url).json(&body).send().await.map_err(|e| e.to_string())?;
             let gemini_res: GeminiResponse = res.json().await.map_err(|e| e.to_string())?;
             if let Some(candidate) = gemini_res.candidates.first() {
                 if let Some(part) = candidate.content.parts.first() {
                      return Ok(part.text.trim().to_string());
                 }
             }
             Err("No response from Gemini".to_string())
        },
        "openai" => {
             let api_key = config.api_key.ok_or("OpenAI API Key not set")?;
             let url = "https://api.openai.com/v1/chat/completions";
     
             let body = serde_json::json!({
                  "model": config.model,
                  "messages": [
                      { "role": "system", "content": system_prompt },
                      { "role": "user", "content": sql }
                  ]
              });
     
              let res = client.post(url).header("Authorization", format!("Bearer {}", api_key)).json(&body).send().await.map_err(|e| e.to_string())?;
              let openai_res: OpenAIResponse = res.json().await.map_err(|e| e.to_string())?;
              if let Some(choice) = openai_res.choices.first() {
                  return Ok(choice.message.content.trim().to_string());
              }
              Err("No response from OpenAI".to_string())
        },
        _ => Err("Unsupported or disabled provider".to_string())
    }
}

#[derive(Serialize)]
pub struct AIModel {
    pub id: String,
    pub name: String,
}

#[derive(Deserialize)]
struct GeminiModelsResponse {
    models: Vec<GeminiModel>,
}

#[derive(Deserialize)]
struct GeminiModel {
    name: String,
    #[serde(rename = "displayName")]
    display_name: String,
}

#[derive(Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaModelParams>,
}

#[derive(Deserialize)]
struct OllamaModelParams {
    name: String,
}

#[derive(Deserialize)]
struct OpenAIModelsResponse {
    data: Vec<OpenAIModel>,
}

#[derive(Deserialize)]
struct OpenAIModel {
    id: String,
}

#[command]
pub async fn get_ai_models(app_handle: tauri::AppHandle, config: Option<AIConfig>) -> Result<Vec<AIModel>, String> {
    let config = match config {
        Some(c) => c,
        None => get_ai_config_internal(&app_handle).await?,
    };
    let client = Client::new();
    let mut models = Vec::new();

    match config.provider.as_str() {
        "gemini" => {
             let api_key = config.api_key.ok_or("Gemini API Key not set")?;
             let url = format!("https://generativelanguage.googleapis.com/v1beta/models?key={}", api_key);
             let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
             
             if !res.status().is_success() {
                 let err = res.text().await.unwrap_or_default();
                 return Err(format!("Gemini Error: {}", err));
             }

             let data: GeminiModelsResponse = res.json().await.map_err(|e| e.to_string())?;
             for m in data.models {
                 // Gemini returns "models/gemini-1.5-flash", we want just the ID part usually, or the full thing.
                 // The API expects "models/gemini-1.5-flash" for generation? 
                 // Actually generateContent URL format is .../models/{model}:generateContent
                 // So if ID is "models/gemini-1.5-flash", we might need to strip "models/" or just use it.
                 // Let's check documentation: POST https://.../v1beta/models/gemini-pro:generateContent
                 // The response `name` is `models/gemini-pro`. So we should likely strip `models/`.
                 let id = m.name.replace("models/", "");
                 models.push(AIModel {
                     id: id.clone(),
                     name: m.display_name,
                 });
             }
        },
        "ollama" => {
            let endpoint = config.endpoint.unwrap_or("http://localhost:11434".to_string());
            let url = format!("{}/api/tags", endpoint);
            let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
            
             if !res.status().is_success() {
                 return Err(format!("Ollama Error: {}", res.status()));
             }

            let data: OllamaTagsResponse = res.json().await.map_err(|e| e.to_string())?;
            for m in data.models {
                models.push(AIModel { 
                    id: m.name.clone(), 
                    name: m.name 
                });
            }
        },
        "openai" => {
            let api_key = config.api_key.ok_or("OpenAI API Key not set")?;
            let url = "https://api.openai.com/v1/models";
            let res = client.get(url)
                .header("Authorization", format!("Bearer {}", api_key))
                .send()
                .await
                .map_err(|e| e.to_string())?;

             if !res.status().is_success() {
                 let err = res.text().await.unwrap_or_default();
                 return Err(format!("OpenAI Error: {}", err));
             }

            let data: OpenAIModelsResponse = res.json().await.map_err(|e| e.to_string())?;
            for m in data.data {
                // Filter for chat models roughly
                if m.id.starts_with("gpt") || m.id.starts_with("o1") {
                    models.push(AIModel {
                        id: m.id.clone(),
                        name: m.id,
                    });
                }
            }
            // Sort OpenAI models
            models.sort_by(|a, b| a.id.cmp(&b.id));
        },
        _ => {}
    }

    Ok(models)
}
