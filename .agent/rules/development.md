# OmniMIN Development Rules

## 1. Frontend Standards
- **Component Pattern**: Prefer functional components with hooks.
- **Styling**: Use Vanilla CSS for core layout tokens and Tailwind for utility styling. Avoid arbitrary values; use standard Tailwind scale.
- **Icons**: Use `Lucide` icons exclusively.
- **State**: Use the centralized `useAppStore` for global application state (current server, current db, preferences).
- **Notifications**: Use `useNotificationStore` for user feedback.

## 2. API & Data Handling
- **Querying**: Use `@tanstack/react-query` for all data fetching.
- **Database Calls**: Adhere to the `dbApi` signature. Backend expects `db` as the first argument and `sql` as the second.
- **Case Transformation**: Follow the convention: Frontend = camelCase, Backend/Database = snake_case.

## 3. Backend (Rust) Standards
- **Command Naming**: Use `snake_case` for all Tauri command names.
- **Error Handling**: Always return `Result<T, String>` from commands to allow frontend to catch and display errors.
- **State**: Use the `AppState` managed by Tauri to access the database pool and configuration.

## 4. UI/UX Principles
- **Aesthetics**: Maintain a "Premium Tech" look with glassmorphism, subtle gradients, and custom themes.
- **Feedback**: Every destructive action (Drop, Truncate, Flush) must have a confirmation prompt.
- **Persistence**: User preferences (theme, density, view mode) must be saved automatically to local storage/config via the backend.
