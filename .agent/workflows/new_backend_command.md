
---
description: Workflow for adding new Tauri backend commands
---

# New Backend Command Workflow

Use this workflow when you need to expose new functionality from Rust to the React frontend.

## 1. Definition
1.  Identify the domain (e.g., `database`, `user`, `config`).
2.  Open or Create `src-tauri/src/commands/<domain>.rs`.

## 2. Implementation
1.  Define the function with `#[tauri::command]`.
2.  Ensure it is `async` if it performs I/O.
3.  Inject state if needed: `state: State<'_, AppState>`.
4.  Return `Result<T, String>` for error handling.

```rust
#[tauri::command]
pub async fn my_action(arg: String, state: State<'_, AppState>) -> Result<String, String> {
    // Implementation
}
```

## 3. Registration
1.  Open `src-tauri/src/lib.rs`.
2.  Import the module if new: `pub mod <domain>;`.
3.  Add the command to `tauri::generate_handler!`:
    ```rust
    commands::<domain>::my_action,
    ```

## 4. Documentation
1.  Update `.agent/BACKEND_API.md` with the new command name and description.

## 5. Verification
1.  Frontend: Call it using `invoke('my_action', { arg: 'value' })`.
2.  Run `npm run tauri dev`.
3.  Check terminal for compilation errors.
