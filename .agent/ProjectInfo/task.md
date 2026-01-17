# Task: OmniMIN (Omnipresent Mongo-to-Incremental-Native Database Manager)

## v0.1.0-alpha (In Progress)
### Features Added:
- **Rust Implementation**: Initialized Tauri 2.0 project.
- **Backend Architecture**: Implemented `mysql_async` based connection pooling.
- **Command Set**: Added `connect_db`, `get_databases`, `get_tables`, and `execute_query` commands.
- **UI Design**: Implemented Glassmorphism design system.
- **Theme Support**: Added dynamic Dark/Light mode switching.
- **Documentation**: Created full suite of project intelligence in `.agent/ProjectInfo/`.

## Planning
- [x] Redesign architecture for Rust SQL client <!-- id: 0 -->
- [ ] Define MVP Features (Connect, List DBs, List Tables, Query) <!-- id: 1 -->

## Backend (Rust)
- [x] Add SQL dependencies (`mysql_async` or `sqlx`) to `Cargo.toml` <!-- id: 2 -->
- [x] Implement Connection Handler <!-- id: 3 -->
- [x] Implement Database/Table Discovery logic (inc. Rows & Size) <!-- id: 4 -->
- [x] Implement Query Execution logic <!-- id: 5 -->

## Frontend (JS/CSS)
- [x] Select/Integrate UI Framework (Modern CSS -> Tailwind v4) <!-- id: 6 -->
- [/] Integrate Tailwind CSS v4 <!-- id: 14 -->
- [x] Create Login/Connection Page <!-- id: 7 -->
- [x] Create Dashboard Layout (Sidebar for DBs, Main for Data) <!-- id: 8 -->
- [x] Implement Data Table View <!-- id: 9 -->
- [x] Implement Dark/Light Mode <!-- id: 13 -->
- [x] Configure Maximized Window Start <!-- id: 15 -->

## Phase 2: Multi-Server Dashboard
- [x] Design Multi-Server Storage Architecture <!-- id: 16 -->
- [x] Implement Local Config Storage (Rust) <!-- id: 17 -->
- [x] Create Dashboard Home View <!-- id: 18 -->
- [x] Implement "Add Server" Management UI <!-- id: 19 -->
- [x] Implement Server Selection & Connection Switching <!-- id: 20 -->
- [x] Implement Server Status/Stats Widget <!-- id: 21 -->

## Phase 3: Information-Dense UI
- [x] Implement Compact Layout Variables (CSS) <!-- id: 24 -->
- [x] Add Context Bar (Breadcrumbs) to SQL Browser <!-- id: 25 -->
- [x] Implement Tabbed Navigation (Structure, SQL, etc.) <!-- id: 33 -->
- [x] Premium Glass Server Cards & Dashboard <!-- id: 34 -->
- [x] Persistent Password Storage & Direct Connect <!-- id: 35 -->
- [x] Refactor Sidebar for Nested Schema Explorer <!-- id: 26 -->
    - [x] Implement Expand/Collapse (Plus Icon) logic <!-- id: 29 -->
    - [x] Ensure Grid/List toggle works for Table List.
- [x] **Documentation Architecture**:
    - [x] Migrate `ProjectInfo` to `.agent/ProjectInfo`.
    - [x] Standardize `.agent` folder structure (rules, workflows).
    - [x] Consolidate `instructions.md` into `PATTERNS.md`.
    - [x] Add Pointer Cursors for all interactive items <!-- id: 30 -->
    - [x] **Refine Dashboard Density & Colors**:
    - [x] Compactor Layout: Reduce padding and font sizes.
    - [x] Toolbar: Align search and add button in a single row.
    - [x] Theme: Fix light mode by using CSS variables for all hardcoded colors.
    - [x] Icons: Add distinctive colors to Lucide icons.
    - [x] Server Cards: Iconless Connect, Icon-only Edit/Delete (-20% size).
    - [x] Global Sidebar: Increased icon visibility (larger size, thicker strokes, minimal padding).
    - [x] Fix Breadcrumb: Show server name instead of 'undefined'.
    - [x] Fix Table Loading: Added missing `tab-browse` and fixed table IDs.
    - [x] Fix `main.js` Errors: Resolved TypeError in logger and ReferenceError in global listeners.
    - [x] Integrate Lucide Icons (Replacing emojis with SVGs).
    - [x] Fix Broken UI Controls (Add Server, Theme Toggle, Edit Modal).
    - [x] Implement Main-Sidebar Navigation Synchronization <!-- id: 44 -->
    - [x] Fix: Clear sidebar on Dashboard navigation <!-- id: 45 -->
    - [x] Optimize Data Table Density <!-- id: 27 -->
    - [x] Fix "No Database Selected" Error on Table Select <!-- id: 32 -->
    - [x] Fix Search View: `table-search-container` leaking into Browse tab. <!-- id: 32-b -->
- [x] Implement Resizable SQL Editor Area <!-- id: 28 -->
- [x] Implement "Query by Example" (QBE) Search Flow <!-- id: 36 -->
- [x] UI: Complete Search Form with 1:1 Parity Appearance <!-- id: 46 -->
- [x] Phase 4: full phpMyAdmin Parity & Light Theme Redesign <!-- id: 37 -->

## Phase 5: Advanced Features & Operations (In Progress)
- [x] Implement Structure View Parity (Metrics, Bulk Actions, Quick Create) <!-- id: 59 -->
- [x] Implement Global Database Search <!-- id: 52 -->
- [x] Implement Database Operations (Rename, Copy, Collation) <!-- id: 56 -->
- [x] Implement Server Home Stats <!-- id: 50 -->
- [ ] Implement Database Schema Designer <!-- id: 51 -->

## Phase 6: Deep Feature Parity (Table Mastery)
- [x] Implement Table Operations (Rename/Move, Maintenance, Copy) <!-- id: 60 -->
- [x] **Architecture Refactor**: Modularize `app.js` into core/features/utils <!-- id: 64 -->
- [x] **Theme Engine & Playground** <!-- id: 65 -->
  - [x] Light/Dark Mode
  - [x] Accent Colors (Blue, Purple, Green, etc.)
  - [x] View Density (Compact, Default, Comfortable)
  - [x] Font Selection
- [x] **Gap Analysis**: Created `GAP_ANALYSIS.md` to track missing legacy features.
- [x] Implement Relation View (Foreign Key Manager) <!-- id: 61 -->
- [-] **Implement Index Management & Row Stats**
    - [x] Create `indexes.rs` module for `get_indexes`, `add_index`, `drop_index`
    - [x] Integrate into `mod.rs` and `lib.rs`
    - [x] Update `table.rs` to support `get_table_structure_html` (columns + indexes)
    - [x] Frontend `structure.js`: view indexes, add index form, drop index
    - [ ] Add `show_row_stats` (optional/later)
- [x] **User Management**: Privileges, Create/Drop User, Grant/Revoke <!-- id: 71 -->
- [x] **Triggers & Events**: List, Create, Edit, Drop <!-- id: 72 -->
    - [x] Backend: `triggers.rs` (get, create, drop triggers/events)
    - [x] Frontend: `triggers.js` (list, create modal, drop logic)
    - [x] Register commands in `mod.rs` and `lib.rs`
    - [x] Update `index.html` with Tabs and Modals
    - [x] Verify Triggers creation
    - [x] Verify Events creation
- [x] **Stored Procedures & Functions**: Editor, Executor <!-- id: 73 -->
- [x] **Table Maintenance**: Check, Analyze, Repair, Optimize <!-- id: 74 -->
- [ ] **Tracking & History**: Table-level change tracking <!-- id: 75 -->
- [ ] **Variables & Charsets**: Server variable editor <!-- id: 76 -->
- [ ] **Advisors**: Performance recommendations <!-- id: 77 -->

### Phase 6.7: Structure Designer & Column Reordering
- [ ] **Structure View**:
  - [ ] Implement Drag & Drop Column Reordering UI
  - [ ] Backend: `alter_table_order(db, table, column, after_column)`
- [ ] **Main View & Data Browser**:
    - [ ] Fix Tab Switching logic in `browser.js`.
    - [ ] Implement scrollable table container (fixed header).
- [ ] **Workspace & Editing**: Inline Spreadsheet Editing <!-- id: 70 --> [DONE]
- [ ] Implement Advanced Insert (Multi-row, Functions, Ignore) <!-- id: 63 -->
- [ ] Implement Advanced Search (Find & Replace, QBE) <!-- id: 64 -->
- [ ] Implement Query Analysis (Explain SQL, Options) <!-- id: 65 -->

## React Migration (Golden Stack) - COMPLETED
- [x] Install Dependencies (React, Zustand, Query, Router, Radix)
- [x] Configure Vite & TypeScript
- [x] Set up Folder Structure & Entry Points
- [x] Port Sidebar (Global & Explorer)
- [x] Port Dashboard View
- [x] Port Browser View (Table Data)
- [x] Port Query Editor
- [x] Implement Zustand Store (AppState)
- [x] Port Structure View
- [x] Legacy Code Cleanup

## Phase 5: Advanced Features & Operations
- [x] Implement Structure View Parity (Metrics, Bulk Actions, Quick Create)
- [x] Implement Global Database Search
- [x] Implement Database Operations (Rename, Copy, Collation)
- [x] Implement SQL Tab features (History, Formatter)
- [ ] Implement Server Home Stats
- [ ] **Implement Database Schema Designer (React Flow / DnD)**

## Phase 6: Deep Feature Parity
- [x] Implement Relation View (Foreign Key Manager)
- [x] User Management
- [x] Triggers & Events
- [x] Stored Procedures
- [x] Table Maintenance

## Phase 8: Post-Launch (Designer)
- [x] **Database Schema Designer**:
  - [x] Drag & Drop Interface (`@xyflow/react`)
  - [x] Visual Table Relations (Foreign Key Edges)
  - [ ] Export to SQL (CREATE SCHEMA)
  - [ ] **Advanced Export Targets**:
    - [ ] Laravel (Migrations/Models)
    - [ ] React/TypeScript (Interfaces)
    - [ ] Prisma (Schema)

## Phase 10: Universal Database Support (Architecture 2.0)
### ✅ Tier 1: Native Grid Support (Perfect Fit)
- [ ] **Refactor Backend**: Create `DatabaseDriver` trait.
- [ ] **Implement Drivers**:
  - [ ] `PostgreSQL` (tokio-postgres)
  - [ ] `SQLite` (sqlx-sqlite)
  - [ ] `MSSQL` (tiberius)
  - [ ] `MariaDB` (mysql_async variant)
  - [ ] `CockroachDB` (Postgres wire protocol)

### ⚠️ Tier 2: Adapted Support (JSON/Tree View)
- [ ] **NoSQL Adapters**:
  - [ ] `MongoDB` (Collections as Tables, Documents as Rows)
  - [ ] `Redis` (Keyspaces as Tables, KV pairs as Rows)
- [ ] **Frontend Modularization**:
  - [ ] Abstract core views (`DataGrid`, `Sidebar`) to support swappable renderers.
  - [ ] Create specialized feature modules (e.g., `features/mongo`, `features/redis`) to isolate logic.
- [ ] **Frontend**: Implement JSON Cell Renderer for nested data.

### 🛠️ Tier 3: Specialized UI
- [ ] **Graph DB**: `Neo4j` (Use Schema Designer canvas as Node Explorer).

## Phase 11: Resilience & Persistence
- [ ] **Config Persistence**:
  - [x] Configure `servers.json` in `app_config_dir` (Done).
  - [ ] **Migrate Preferences**:
    - [ ] Create `AppConfig` struct in Rust.
    - [ ] Move Theme/Sidebar settings from `localStorage` to `preferences.json`.
  - [ ] Ensure `WebView` data folder structure is robust.
- [ ] **Session Recovery**: Restore previous tabs/queries on restart.

