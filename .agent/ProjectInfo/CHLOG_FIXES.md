# Change Log & Fixes

## v0.2.0 (2026-01-17)
### Features Added:
- **Inline Editing**: Native spreadsheet-like editing (double-click to edit) in the Browser view.
- **Table Maintenance**: Integrated CHECK, ANALYZE, REPAIR, and OPTIMIZE tools with results view.
- **Truncate Support**: Added "Empty Table" functionality.
- **Bulk Actions**: Optimized table list with "Select All/None" logic.
- **User Management**: Improved user list and added password rotation/generation.
- **Standardization**: Unified header layout and interactive icons across all views.
- **Branding**: Official transition to **OmniMIN**.

### Fixes:
- Fixed missing Lucide icon imports and compilation blockers.
- Resolved redundant command registrations.
- Improved sidebar navigation state persistence.

## v0.1.0-alpha (In Progress)
### Features Added:
- **Rust Implementation**: Initialized Tauri 2.0 project.
- **Backend Architecture**: Implemented `mysql_async` based connection pooling.
- **Command Set**: Added `connect_db`, `get_databases`, `get_tables`, and `execute_query` commands.
- **UI Design**: Implemented initial Glassmorphism design system.
- **Theme Support**: Added dynamic Dark/Light mode switching.
- **UI Refinement**: Configured window to start **Maximized** for professional experience.
- **Phase 2 Implementation**: Completed Multi-Server Dashboard with persistent storage.
- **Modernization**: Full integration of **Tailwind CSS v4**.
- **Documentation**: Synchronized all project intelligence in `.agent/ProjectInfo/`.
- **UI Parity**: Implemented "Classic phpMyAdmin" light theme and professional action icons.
- **Metadata**: Added Table Counts (Database view) and Overhead (Table structure) parity.
- **UX**: Applied pointer cursors to all interactive elements for better feedback.
- **Navigation**: Implemented automatic sidebar reset when returning to the server dashboard.

### Fixes & Refactors:
- **Architecture Shift**: Pivot from PHP-Wrapper (Sidecar) to Pure Native (Rust) for better performance and smaller footprint.
- **Resource Management**: Removed PHP binaries from bundling requirements.
- **Port Detection**: Implemented dynamic port searching for internal communication (though now using direct Tauri commands).

## Known Issues:
- [ ] UI is currently restricted to a basic loading screen (`index.html`).
- [ ] Need to implement complex data type parsing in Rust (converting MySQL values to JSON).
- [ ] Implement Multi-Server Dashboard (Phase 2).
