
---
description: Workflow for debugging full-stack issues (Rust + React)
---

# Debugging Workflow

Use this workflow when you encounter crashes, blank screens, or API failures.

## 1. Categorize the Issue
- **Frontend (UI/State)**: Console errors, rendering glitches, unresponsive buttons.
- **Backend (Rust/DB)**: Connection failures, detailed error logs in terminal, crashes.

## 2. Frontend Debugging (DevTools)
1.  Running `npm run tauri dev` opens a WebView window.
2.  **Right-click** anywhere and select **Inspect Element** to open Chrome DevTools.
3.  Check:
    - **Console**: For JS/React errors.
    - **Network**: Note that Tauri IPC calls do NOT appear in the Network tab.
    - **Application**: Check LocalStorage (for persisted preferences).

## 3. Backend Debugging (Terminal)
The terminal running `npm run tauri dev` streams standard output (`println!`) and errors (`eprintln!`).

1.  Look for `panic!` messages or Rust backtraces.
2.  Use `println!("Debug: {:?}", variable);` in Rust code to inspect values.
3.  If a command fails, `invoke` will throw a Promise rejection in JS.
    - **Catch it**: `invoke(...).catch(err => console.error(err))`

## 4. Common Issues
- **"Command not found"**: Did you forget to register it in `lib.rs`?
- **"Database not connected"**: Check if `connect_db` was called. The pool is Global but needs initialization.
- **"Missing Permissions"**: Check `tauri.conf.json` capabilities (though v2 uses a different system, v1 uses allowlist).

## 5. Reset
If state is corrupted:
1.  Clear LocalStorage in DevTools.
2.  Restart the dev server.
