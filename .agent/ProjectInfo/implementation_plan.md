# Implementation Plan - Phase 5: Advanced Features & Operations

> [!NOTE]
> **v0.2.0 (Completed)**: Inline Spreadsheet Editing and Table Maintenance features have been successfully ported and modernized for the React architecture.

## Goal Description
Implement advanced database management features to achieve feature parity with phpMyAdmin. This includes a visual Database Schema Designer, a Global Search tool, a comprehensive Export/Import system, and detailed Server/Database operations.

## User Review Required
> [!IMPORTANT]
> **Backend Dependency**: The "Designer", "Export", and "Import" features require significant backend logic. We will implement new Rust commands to handle streaming and large file operations.

## Proposed Changes

### 1. Server Information Dashboard
**Filename:** `mian-server-details-page.jpeg`
Replace the current generic dashboard with a detailed Server Home view.

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- Create `div id="server-home-view"` with:
    - **General Settings**: Server connection collation.
    - **Appearance Settings**: Theme, Language.
    - **System Info**: Version, Documentation.

#### [MODIFY] [www/app.js](file:///d:/PhpMyAdmin-Native/www/app.js)
- Fetch server variables on connection.
- Populate `server-home-view`.


### 3. Global Search Interface
**Filename:** `seelcted-database-search.jpeg`
Search across multiple tables.

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- Create Global Search UI (Keywords, Search Mode, Table Multi-select).

#### [MODIFY] [www/app.js](file:///d:/PhpMyAdmin-Native/www/app.js)
- Implement `executeGlobalSearch` to iterate selected tables and aggregate results.

### 4. Export Interface
**Filename:** `selected-database-Export.jpeg`
Quick and Custom export options.

#### [MODIFY] [src-tauri/src/lib.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/lib.rs)
- Implement `export_database` (Streaming SQL dump).

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- Create Export UI (Quick/Custom modes, Output format, Object creation options).

### 5. Query Interface (QBE & Multi-table)
**Filename:** `selected-database-query-QueryByExample.jpeg` & `selected-database-query-MultiTableQuery.jpeg`

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- Update `tab-query` to support two modes: **Multi-table query** and **Query by example**.
- **QBE UI**: Dropdowns for Table/Column, Criteria inputs, Sort order.
- **Multi-table UI**: "Use tables" selection, AND/OR logic builders.

#### [MODIFY] [www/app.js](file:///d:/PhpMyAdmin-Native/www/app.js)
- Implement Query Builder logic to generate SQL from visual inputs.

### 6. Enhanced SQL Execution
**Filename:** `selected-database-SQL.jpeg`

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- Add "Rollback when finished", "Enable foreign key checks", "Bind parameters" to SQL tab.
- Add Toolbar (Clear, Format).

#### [MODIFY] [src-tauri/src/lib.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/lib.rs)
- Update `execute_query` to accept options for Transaction and Rollback.

### 7. Database Operations
**Filename:** `selected-database-operations.jpeg`

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- Create Operations UI:
    - Create Table.
    - Rename Database.
    - Copy Database (Structure/Data).
    - Collation settings.

#### [MODIFY] [src-tauri/src/lib.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/lib.rs)
- Implement `rename_database`, `copy_database`, `change_collation`.

### 8. Data Import Interface
**Filename:** `selected-database-import.jpeg`

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- Create Import UI: File Upload (Drag & Drop), Partial Import, SQL compatibility.

#### [MODIFY] [src-tauri/src/lib.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/lib.rs)
- Implement `import_database` (Read file, parse SQL, execute).#### [NEW] [files related to events]

## Architecture Refactor Proposal: Client-Side HTML Generation
**Goal**: Move HTML generation (Table rows, Pagination) from Backend (`common.rs`) to Frontend (`browser.js`).
**Impact Analysis**:
- **Backend**: `common.rs` becomes a pure JSON serializer. Removes hardcoded HTML strings from Rust. Simpler, faster to compile.
- **Frontend**: `browser.js` gains rendering functions. Allows using JS template literals/components. specific Tailwind classes can be adjusted instantly without recompiling Rust.
- **Performance**: Negligible difference for local apps. Slightly better "perceived" performance as UI can render skeletons while fetching JSON.
- **Maintenance**: **High**. Decouples UI from Logic. Frontend devs don't need to touch Rust to change a button color or icon.
- **Risk**: Low. Requires rewriting `render_table_html` and `render_pagination_html` in JS.

## Verification Plan
1. **Designer**: Verify relationships allows visual understanding.
2. **Search**: Verify global search finds records across tables.
3. **Export/Import**: Verify round-trip (Export DB -> Drop -> Import) restores data.
4. **Operations**: Verify Copy Database functionality.
5. **Queries**: Verify QBE generates valid SQL.
#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- Create Import UI: File Upload (Drag & Drop, Zip/Gzip support).
- **Partial Import**: "Allow interruption", "Skip this number of queries".
- **Compatibility**: SQL Mode dropdown.

# Implementation Plan - Phase 6: Deep Feature Parity (Table Mastery)

## Goal Description
Achieve true distinctiveness and power-user capability by implementing table-specific operations, foreign key management, and deep analysis tools, matching the detailed capabilities shown in the provided screenshots.

### 1. Context-Aware Operations Tab (Table vs Database)
**Ref**: `Screenshot 5` (Table Operations)
Transition the `Operations` tab to be context-sensitive.

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- **Table Mode**:
    - **Move Table**: Rename/Move to another DB.
    - **Table Options**: Engine, Collation, Auto_Increment.
    - **Copy Table**: Structure/Data/Both.
    - **Maintenance**: Analyze, Check, Optimize, Flush, Repair.
    - **Delete**: Truncate, Drop.

#### [MODIFY] [src-tauri/src/lib.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/lib.rs)
- Implement `table_maintenance(op: String, table: String)`.
- Implement `truncate_table`.
- Reuse/enhance `rename_table` (move) and `copy_table`.

### 2. Relation View & Structure Refinements
**Ref**: `Screenshot 11 & 12` (Structure, Relation View)

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- **Structure Tab**:
    - Ensure it handles both Database View (Table List) and Table View (Columns List).
    - Add **Index Management** grid (Create/Drop indexes) in Table View.
    - Add **Row Statistics** panel (Space usage, Row count) in Table View.

#### [NEW] [src-tauri/src/commands/indexes.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/commands/indexes.rs)
- `get_indexes(db, table)`
- `add_index(db, table, columns, type, name)`
- `drop_index(db, table, name)`

#### [MODIFY] [src-tauri/src/commands/table.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/commands/table.rs)
- Implement `get_table_structure_html(db, table)` to render:
    - Columns List (Name, Type, Null, Default, Action Buttons).
    - Indexes List (Name, Type, Columns, Action Buttons).

#### [NEW] [www/js/modules/indexes.js](file:///d:/PhpMyAdmin-Native/www/js/modules/indexes.js)
- Handle "Add Index" modal logic.
- Handle "Drop Index" confirmation.

#### [MODIFY] [www/js/modules/structure.js](file:///d:/PhpMyAdmin-Native/www/js/modules/structure.js)
- Update `loadStructure` to switch between `get_tables_html` (DB context) and `get_table_structure_html` (Table context).

### 2.2 User Management (Privileges & Security)
**Goal**: Manage database users and their privileges.

#### [NEW] [src-tauri/src/commands/users.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/commands/users.rs)
- `get_users`: return list of users with global privileges.
- `create_user(name, host, password)`
- `drop_user(name, host)`
- `grant_privileges(user, host, privileges, db, table)`
- `get_privileges(user, host)`
- `flush_privileges`

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- Add "Users" tab to the Server Home view (or top level global tab?). Currently tabs are DB/Table context.
- Server Home is best place for User Management as users are global.
- "Users" Tab in Server Home dashboard view.

#### [NEW] [www/js/modules/users.js](file:///d:/PhpMyAdmin-Native/www/js/modules/users.js)
- Handle fetching user list.
- User creation modal with password.
- Handle fetching user list.
- User creation modal with password.
- Grants management UI (checkboxes for SELECT, INSERT, etc).

### 2.3 Triggers & Events Management
**Goal**: Manage database triggers and scheduled events.

#### [NEW] [src-tauri/src/commands/triggers.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/commands/triggers.rs)
- [x] `get_triggers(db)`
- [x] `create_trigger(db, name, table, time, event, statement)`
- [x] `drop_trigger(db, name)`
- [x] `get_events(db)`
- [x] `create_event(...)` - (Note: Implemented as create_event backend, frontend pending)
- [x] `drop_event(db, name)`

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- Add "Triggers" and "Events" tabs to the Database View (when a DB is selected).

#### [NEW] [www/js/modules/triggers.js](file:///d:/PhpMyAdmin-Native/www/js/modules/triggers.js)
- Fetch and display list of triggers/events.
- Modals for creating new items.

### 2.5 Scalability & Architecture Refactor (New)
**Goal**: Split the monolithic `app.js` into modular components to improve maintainability as requested by the user.

#### [NEW] [www/js/](file:///d:/PhpMyAdmin-Native/www/js/)
- **Core**: `main.js`, `core/state.js`, `core/api.js` (Tauri wrappers).
- **Features**: `modules/auth.js`, `modules/dashboard.js`, `modules/operations.js`, `modules/browser.js`.
- **Utils**: `utils/ui.js`, `utils/formatters.js`.

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- Update script tags to use ESM (`type="module"`).

### 2.6 Theme Engine & SQL Playground (Revised)
**Ref**: User Feedback (Custom Fonts, Colors, Themes)
**Goal**: Implement a robust Theme Engine allowing deep customization of the UI.

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- **Theme Settings UI**:
    - **Mode**: Light / Dark / Auto.
    - **Density**: Compact (Flat) / Comfortable / Spacious.
    - **Colors**: Primary (Accent), Secondary (Backgrounds) color pickers.
    - **Typography**: Dropdown for App Font and Monospace Font.
- **SQL Playground**:
    - Dedicated full-screen SQL view with multiple tabs (`Untitled.sql`).
    - Sidebar playground mode.

#### [MODIFY] [www/js/modules/ui.js](file:///d:/PhpMyAdmin-Native/www/js/modules/ui.js) (Proposed)
- Implement `ThemeManager` class.
- Apply CSS variables dynamically (`--accent`, `--font-main`, `--bg-main`).
- Load/Save theme preferences to `app_settings.json`.

#### [PROPOSED FONTS TO INCLUDE]
- **UI**: Inter (Clean), Outfit (Premium), Roboto (Classic).
- **Code**: JetBrains Mono, Fira Code.

### 2.7 Structure Designer & Column Reordering (Revised)

### 2.7 Structure Designer & Column Reordering (Revised)
**Ref**: User Feedback (Drag & Drop Columns)
**Goal**: Allow effortless reordering of table columns using drag-and-drop in the Structure view.

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- **Structure Grid**: Add drag handles to column rows.
- **Feedback**: Visual indicators for drop targets (before/after columns).

#### [MODIFY] [src-tauri/src/lib.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/lib.rs)
- Implement `reorder_column(db, table, column, after_column)`.
- *Note*: This is complex in MySQL; it requires knowing the full column definition to run `MODIFY COLUMN ... AFTER ...`. We may need to fetch the definition first.

### 2.9 Premium Dashboard & Global Sidebar (REFINED x2)
**Ref**: User Feedback ("Too big UI", "Single row", "Colored icons", "Light theme fix")
**Goal**: Optimize dashboard density and ensure robust theme switching.

#### [MODIFY] [www/style.css](file:///d:/PhpMyAdmin-Native/www/style.css)
- **Compact Layout**:
    - Reduce `.view-pane` padding (from 60px 80px to 32px 48px).
    - Reduce `.dashboard-title` size (from 3.5rem to 2.2rem).
    - Reduce `.premium-card` padding and grid gap.
- **Toolbar**: 
    - Set `.dashboard-toolbar` to `flex-direction: row` with `align-items: center`.
    - Allow search box to grow and button to stay fixed.
- **Theme Variables**:
    - Replace hardcoded colors (e.g., `#0d1117`, `#161b22`) with CSS variables (`--bg-canvas`, `--bg-surface`, `--border-dim`).
    - Ensure `light-mode` overrides these variables correctly.
- **Icon Colors**:
    - Add classes for icon coloring (e.g., `.icon-blue`, `.icon-green`, `.icon-orange`).

#### [MODIFY] [www/js/modules/theme.js](file:///d:/PhpMyAdmin-Native/www/js/modules/theme.js)
- Update `apply()` to set `--bg-canvas`, `--bg-surface`, and `--border-dim` for both themes.

#### [MODIFY] [www/js/modules/dashboard.js](file:///d:/PhpMyAdmin-Native/www/js/modules/dashboard.js)
- Add color classes to Lucide icons in the server card template.

### 3. Advanced Data Manipulation (Insert & Search)
**Ref**: `Screenshot 6, 7, 8, 10`

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- **Insert Tab**:
    - Support **Multi-row insert** (looping UI).
    - Add **Function** dropdown (MD5, NOW, etc.).
    - Add **Ignore** errors checkbox.
- **Search Tab**:
    - Add **Find and Replace** sub-tab.
    - Enhace **QBE** with "Operator" dropdowns (=, LIKE, >, <).

#### [MODIFY] [www/app.js](file:///d:/PhpMyAdmin-Native/www/app.js)
- Update Insert logic to map functions.
- Implement Find & Replace backend call `UPDATE table SET col = REPLACE(col, find, replace)`.

### 4. Query Analysis & Browse Refinements
**Ref**: `Screenshot 1, 2, 3, 4`

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- **Browse/SQL**:
    - Add **Explain SQL** button.
    - Add "Extra Options" toggle (Partial/Full text).
- **Explain Output**:
    - Modal or specific view to show `EXPLAIN` results.

#### [MODIFY] [src-tauri/src/lib.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/lib.rs)
- Implement `explain_query` (Run `EXPLAIN ...` and return structured result).

- Implement `explain_query` (Run `EXPLAIN ...` and return structured result).

### 5. Settings & Configuration System (Refined)
**Ref**: User Request (3-Tier Settings)
Implement a hierarchical settings system.

#### Tier 1: App Settings (Global)
- **Use Case**: Theme (Light/Dark), Font Size, Default Language, window behavior.
- **Storage**: `app_settings.json` (Global).
- **UI**: Main Settings Tab (Gear Icon).

#### Tier 2: Server Settings (Per Server)
- **Use Case**: Server color/alias, Connection timeout, "Production" mode warning.
- **Storage**: Inside `servers.json` array (each server object has `settings: {}`).
- **UI**: Edit Server Modal or "Server Settings" sub-tab in Server Home.

#### Tier 3: Database Settings (Per Database)
- **Use Case**: Default Charset, Custom Comments/Notes for DB, Visibility toggles.
- **Storage**: `db_settings.json` (Map: `ServerID -> DbName -> Settings`).
- **UI**: Operations Tab (Database Context).

#### [MODIFY] [src-tauri/src/lib.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/lib.rs)
- Implement `save_db_settings`, `get_db_settings`.
- Update `ServerConfig` struct to include `settings` field.

# Implementation Plan - Phase 7: Post-Launch Features

## Goal Description
Implement the visual Database Schema Designer after the core application is feature-complete and stable.

### 1. Database Schema Designer
**Filename:** `selected-database-designer.jpeg`
Visual tool for Entity-Relationship Diagrams.

#### [MODIFY] [src-tauri/src/lib.rs](file:///d:/PhpMyAdmin-Native/src-tauri/src/lib.rs)
- Implement `get_foreign_keys(db: String)`.

#### [MODIFY] [www/index.html](file:///d:/PhpMyAdmin-Native/www/index.html)
- Add Canvas/SVG container to `tab-designer`.

#### [MODIFY] [www/app.js](file:///d:/PhpMyAdmin-Native/www/app.js)
- Render table cards and relationship lines (FK links).
