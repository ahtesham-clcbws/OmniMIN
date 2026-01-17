# Best Practices & Code Standards

## UI/UX Principles
- **Density Over Spacing**: This is a professional tool. Favor information-dense layouts over overly spaced mobile-first designs.
- **Visual Feedback**: Every interactive element, including table rows (when browseable) and icon buttons, must use `cursor: pointer`.
- **Dual-Theming**: Always ensure new components look professional in both **Futuristic Dark** (Glassmorphism) and **Classic phpMyAdmin** (Light) themes.
- **Glassmorphism (Dark)**: Use `backdrop-filter: blur(16px)` and subtle transparent offsets.
- **Standard Colors (Light)**: Stick to the classic phpMyAdmin palette: `#235a81` (Accent), `#d3dce3` (Borders), `#f5f5f5` (Zebra rows).

## Backend (Rust)
- Keep `AppState` synchronized with the UI.
- Use `mysql_async` for all database operations to prevent IO blocking.
- Handle data type conversions in the backend; the frontend should receive clean JSON.
- Offload heavy operations (like database statistics calculations) to Rust commands.

## API & Data Strategy
- **Minimal Payload APIs**: Do not create "god APIs" that return everything. Create specialized endpoints for specific views to minimize unnecessary data transfer and memory usage.
    - *Example*: `get_sidebar_tables(db)` (Name only) vs `get_structure_tables(db)` (Name, Rows, Size, AutoIncrement).
    - *Example*: `get_database_list_sidebar()` vs `get_database_stats_main()`.
- **Lazy Loading**: Only fetch data when the specific tab or view is active. Do not pre-load "Operations" or "Structure" data when the user is in "Browse" mode.
- **Modularization**: Refactor backend commands to accept granular parameters (`needs_stats: bool`, `limit: Option<u32>`) where appropriate to reuse logic without bloating responses.

## Code Quality
- **Command Registration**: Always register new commands in `src-tauri/src/lib.rs` inside the `invoke_handler`.
- **Error Handling**: Bubble up Rust errors to the frontend using `String` mapped results.
- **Styling**: Favor CSS variables (`--accent`, `--bg-primary`) over hardcoded hex codes to ensure theme compatibility.
