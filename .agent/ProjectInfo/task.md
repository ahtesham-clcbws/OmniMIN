# Task: OmniMIN (Omnipresent Mongo-to-Incremental-Native Database Manager)

## v0.1.0-alpha (In Progress)
### Features Added:
- **Rust Implementation**: Initialized Tauri 2.0 project.
- **Backend Architecture**: Implemented `mysql_async` based connection pooling.
- **Command Set**: Added `connect_db`, `get_databases`, `get_tables`, and `execute_query` commands.
- **UI Design**: Implemented Glassmorphism design system.
- **Theme Support**: Added dynamic Dark/Light mode switching.
- **Documentation**: Created full suite of project intelligence in `.agent/ProjectInfo/`.

## Progress Roadmap

### Phase 1: Core Data Operations ✅
- [x] **Alter Table Structure**: Add/modify/drop columns
- [x] **Insert/Delete Rows UI**: Data entry and removal forms
- [x] **Advanced Filters**: WHERE clause builder
- [x] **Column Sorting**: Handle ORDER BY in browser
- [x] **Auto-complete**: SQL suggestions

### Phase 2: Performance & Query Enhancements ✅
- [x] **Multi-query Execution**: Support for multiple result sets
- [x] **Query Profiling**: Timing and row counts
- [x] **SQL Formatter**: Pretty-print SQL
- [x] **AI Settings**: Model detection & Connection test (Ollama/Gemini/OpenAI)
- [x] **Performance Monitoring**: FPS/Memory Overlay
- [x] **Manual Debug Logger**: Dev-mode issue reporter
- [x] **URL Navigation Refactor**: Migrated ViewTabs, Dashboard, and Sidebar to URL-first routing
- [x] **Context-Aware Toolbar**: Unified DB/Table toolbar with auto-switching
- [x] **UI Polish**: Restored secondary toolbar styling & Added pagination limits
- [x] **Active Tab Fix**: ViewTabs now uses URL matching for active state (Triggers fix)
- [x] **Pagination Logic Fix**: Added `limit` to query key so it triggers refetch on change
- [x] **Pagination Refinement**: Custom limits (10-1000) & Show All with warning
- [x] **Sticky Columns**: First column (checkbox) stays fixed on horizontal scroll
- [x] **Row Actions**: Added Edit/Copy/Delete actions column (Fixed, Horizontal Scroll Safe)
- [x] **Custom Confirmations**: Replaced native alerts with Modal for safer UI
- [x] **Action Visibility**: Row actions are always visible (removed hover dependency)
- [x] **Advanced Column Features**: Warning styling, Copy Column (with Toast), Visibility Toggle, Resizable Columns

### Phase 3: Advanced Features (Continuous Improvement)
- [x] **Table Maintenance**: Optimize/Repair/Analyze (Bulk & Individual)
- [x] **Table Operations**: Rename, Copy, and Maintenance UI
- [x] **BLOB Preview**: Image display in grid
- [x] **JSON Formatter**: Pretty-print JSON fields
- [x] **Export Templates**: Save configurations
- [/] **Server Monitoring**: Real-time charts (Basic implemented, needs advanced charts)
- [x] **Row Editor**: Modal for Edit and Copy (Insert) with NULL handling
    - [x] Unify Insert Page with Row Editor Logic
- [-] **Emoji Support**: Skipped (User Request/OS Limitation)

### Phase 4: Schema & Logic Enhancements ✅ COMPLETE
- [x] **Foreign Keys**: Inline manager in Structure tab
- [x] **Routines**: Create/Edit Stored Procedures & Functions
- [x] **Triggers/Events**: Create/Edit UI
- [x] **Status Variables**: Categorized & Editable Global Status
- [x] **Charsets**: Dedicated Charset Manager
- [x] **Indexes**: UI in Structure Tab (Create/Drop/View)

### Phase 5: Schema Designer & Advanced UI
- [x] Create dedicated "Operations" tab at database level
- [x] Implement Rename, Copy, Collation change, and Drop Database
- [x] **Database Export & Schema Generators**
    - [x] Extended `Export.tsx` with multi-format support.
    - [x] Added `Laravel`, `Prisma`, `TypeScript`, `Go`, `Zod`, `JSON`, and `Mermaid` generators.
    - [x] Integrated code preview and copy-to-clipboard.
    - [x] Resolved module resolution and syntax errors.
- [ ] Search Refinement (Planned for future)
- [ ] Multi-table database-wide search UI.

## Documentation Architecture
- [x] Consolidated artifacts in `.agent/ProjectInfo/`
- [x] Session logs in `.agent/ProjectInfo/agent_logs/`

## ⛔ Out of Scope
- **Replication / Cluster Management** (Infrastructure task)
- **Binary Log Inspection** (Niche debugging)
- **Tracking System** (Git is source of truth)
