use tauri::State;
use crate::AppState;
use std::collections::HashMap;
use mysql_async::prelude::*;

#[derive(serde::Serialize)]
pub struct ServerStatus {
    connections: u64,
    bytes_received: u64,
    bytes_sent: u64,
    queries: u64,
}

#[tauri::command]
pub async fn get_server_status(state: State<'_, AppState>) -> Result<ServerStatus, String> {
    let pool = {
        let pool_guard = state.pool.lock().unwrap();
        pool_guard.as_ref().cloned().ok_or("Not connected")?
    };
    let mut conn = pool.get_conn().await.map_err(|e| e.to_string())?;

    let query = "SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected', 'Bytes_received', 'Bytes_sent', 'Questions')";
    let result: Vec<(String, String)> = conn.query(query).await.map_err(|e| e.to_string())?;

    let mut map: HashMap<String, u64> = HashMap::new();
    for (key, val) in result {
        map.insert(key, val.parse().unwrap_or(0));
    }

    Ok(ServerStatus {
        connections: *map.get("Threads_connected").unwrap_or(&0),
        bytes_received: *map.get("Bytes_received").unwrap_or(&0),
        bytes_sent: *map.get("Bytes_sent").unwrap_or(&0),
        queries: *map.get("Questions").unwrap_or(&0),
    })
}
