---
description: Workflow for handling database schema changes
---

# Database Migration Workflow (OmniMIN)

Since OmniMIN connects to *external* databases, "migration" usually means updating the *management features* or *internal metadata* (if any), OR executing SQL against the user's database.

## 1. Modifying Internal Metadata (Preferences)
If you need to store new fields in the user's hidden preference file (e.g., `config.json`):
1.  **Backend**: Update the `ProgramConfig` struct in `src-tauri/src/models.rs` (or equivalent).
2.  **Frontend**: Update the corresponding TypeScript interface in `src/stores/useAppStore.ts` (or `types/`).
3.  **Sync**: Ensure `load_preferences` and `save_preferences` commands in Rust handle the new field.

## 2. Execution against User Database
If the task requires running DDL (Data Definition Language) against a user's DB:
1.  **Safety Check**: **NEVER** run `DROP`, `TRUNCATE`, or `ALTER` without explicit user confirmation (UI Modal).
2.  **Command**: Use `dbApi.executeQuery` (Frontend) or `mysql_async::Conn::exec` (Backend).
3.  **Error Handling**: Wrap in `try/catch` and show a `showToast('error')` on failure.

## 3. Backend Struct Updates
If the schema of a *system view* (like `SHOW PROCESSLIST`) changes or you need new columns:
1.  Update the Rust Struct (`#[derive(Serialize)]`).
2.  Ensure the SQL query selects the new columns.
3.  Restart `tauri dev` to recompile Rust.
