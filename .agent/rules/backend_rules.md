
# Backend (Tauri/Rust) Coding Rules

## 1. Modularization
- **Rule**: Do NOT put all commands in a single file.
- **Pattern**: Group related commands into a file in `src-tauri/src/commands/<domain>.rs`.
    - Example: `database.rs` for DB ops, `users.rs` for User management.

## 2. Error Handling
- **Rule**: All commands must return `Result<T, String>`.
- **Pattern**: Map Rust errors to strings immediately using `.map_err(|e| e.to_string())`.
    - Do not use `unwrap()` in production code. Use `?` or explicit matching.
    
```rust
#[tauri::command]
pub async fn my_command(state: State<'_, AppState>) -> Result<(), String> {
    let pool = state.pool.lock().unwrap(); // Lock is okay to unwrap if poisoned
    // ...
    conn.query("...").await.map_err(|e| e.to_string())
}
```

## 3. Database Access
- **Rule**: Use the shared connection pool from `AppState`.
- **Pattern**: 
    1. Get the pool guard: `let pool = state.pool.lock().unwrap();`
    2. Get a connection: `let mut conn = pool.get_conn().await...`
    3. Execute query using `mysql_async`.

## 4. Command Registration
- **Rule**: Every new command MUST be registered in `src-tauri/src/lib.rs`.
- **Pattern**: Add function path to `tauri::generate_handler![ ... ]`.
