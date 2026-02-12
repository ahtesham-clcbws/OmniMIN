use tauri::State;
use crate::state::AppState;
use crate::commands::common::mysql_to_json;
use mysql_async::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct QueryResponse {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub affected_rows: u64,
    pub last_insert_id: u64,
    pub duration_ms: f64,
}

#[derive(Serialize)]
pub struct QueryResultHtml {
    pub head_html: String,
    pub body_html: String,
    pub pagination_html: String,
    pub count: usize,
    pub total_rows: u64,
    pub query_time: f64,
}

#[derive(Deserialize, Default)]
pub struct QueryOptions {
    pub rollback: Option<bool>,
    pub disable_fk_checks: Option<bool>,
}

#[tauri::command]
pub async fn execute_query(sql: String, db: Option<String>, options: Option<QueryOptions>, state: State<'_, AppState>) -> Result<Vec<QueryResponse>, String> {
    let pool = {
        let pool_guard = state.pool.lock().unwrap();
        pool_guard.as_ref().cloned().ok_or("Not connected")?
    };
    let mut conn = pool.get_conn().await.map_err(|e| e.to_string())?;

    if let Some(db_name) = db {
        if !db_name.is_empty() {
            conn.query_drop(format!("USE `{}`", db_name)).await.map_err(|e| e.to_string())?;
        }
    }

    let opts = options.unwrap_or_default();
    
    if opts.disable_fk_checks.unwrap_or(false) {
        conn.query_drop("SET FOREIGN_KEY_CHECKS = 0").await.map_err(|e| e.to_string())?;
    }
    
    if opts.rollback.unwrap_or(false) {
        conn.query_drop("START TRANSACTION").await.map_err(|e| e.to_string())?;
    }

    let start_set = std::time::Instant::now();
    // Use query_iter to get the first result set
    let mut query_result = conn.query_iter(&sql).await.map_err(|e| format!("SQL Error: {}", e))?;

    let mut columns: Vec<String> = Vec::new();
    if let Some(col_slice) = query_result.columns() {
        for col in col_slice.iter() {
            columns.push(col.name_str().into_owned());
        }
    }

    let affected_rows = query_result.affected_rows();
    let last_insert_id = query_result.last_insert_id().unwrap_or(0);

    // Collect rows for this set
    let rows_data: Vec<mysql_async::Row> = query_result.collect().await.map_err(|e| e.to_string())?;
    let mut final_rows = Vec::new();

    for row in rows_data {
        let mut row_values = Vec::new();
        for i in 0..columns.len() {
            let val: mysql_async::Value = row.get(i).unwrap_or(mysql_async::Value::NULL);
            row_values.push(mysql_to_json(val));
        }
        final_rows.push(row_values);
    }

    // Capture duration for this set
    let duration = start_set.elapsed().as_secs_f64() * 1000.0;

    // TODO: Support multiple result sets. mysql_async 0.34 changes iteration logic significantly.
    // For now we return the first result set.
    
    let results = vec![QueryResponse {
        columns,
        rows: final_rows,
        affected_rows,
        last_insert_id,
        duration_ms: duration,
    }];
    
    if opts.rollback.unwrap_or(false) {
        conn.query_drop("ROLLBACK").await.map_err(|e| e.to_string())?;
    }
    
    if opts.disable_fk_checks.unwrap_or(false) {
         conn.query_drop("SET FOREIGN_KEY_CHECKS = 1").await.map_err(|e| e.to_string())?;
    }

    Ok(results)
}

#[tauri::command]
pub async fn execute_query_html(sql: String, db: Option<String>, state: State<'_, AppState>) -> Result<QueryResultHtml, String> {
    let start = std::time::Instant::now();
    
    let results = execute_query(sql, db, None, state).await?;
    let main_result = results.get(0).ok_or("No results returned")?;
    
    let (head, body) = crate::commands::common::render_table_html(&main_result.columns, &main_result.rows);
    
    Ok(QueryResultHtml {
        head_html: head,
        body_html: body,
        pagination_html: "".to_string(),
        count: main_result.rows.len(),
        total_rows: main_result.rows.len() as u64,
        query_time: start.elapsed().as_secs_f64() * 1000.0,
    })
}
