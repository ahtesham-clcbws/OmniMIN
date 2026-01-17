# General Project Instructions

This project is **OmniMIN** (formerly LuminaSQL/PhpMyAdmin-Native), a modern, high-performance database management tool built with **Tauri**, **React**, and **Rust**.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Shadcn UI.
- **Backend**: Rust (Tauri), `mysql_async` for database connectivity.
- **State Management**: Zustand (`useAppStore`), React Query.

## Current Project Status
- **Server Management**: Core server overview/dashboard is being consolidated. Administrative actions (Flush, Processes, Users) are implemented.
- **Database Operations**: Structure view implemented with bulk Drop/Truncate actions. SQL Query editor supports templates and AI-powered explanations.
- **Persistence**: Application preferences are synced between the frontend (camelCase) and the backend (snake_case) via the `load_preferences` and `save_preferences` Tauri commands.

## Ongoing Tasks
- [x] Finalize `ServerDashboard` refactoring (deduplication of `ServerOverview`).
- [ ] Implement placeholders for Search, Operations, Privileges across all views.
- [ ] Refine `QueryEditor` features (Save Query, Format SQL).
- [ ] Develop the `Export` component's full functionality.

## Core API Patterns
- **Database Query**: Always use `dbApi.executeQuery(dbName, sql, options)`. Note that `dbName` can be an empty string for server-level commands.
- **Preference Mapping**: Always map frontend camelCase (e.g., `accentColor`) to backend snake_case (e.g., `accent_color`) during sync.
