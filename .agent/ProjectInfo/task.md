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

### Phase 3: Advanced Features (Active)
- [x] **Table Maintenance**: Optimize/Repair/Analyze (Bulk & Individual)
- [x] **Table Operations**: Rename, Copy, and Maintenance UI
- [x] **BLOB Preview**: Image display in grid
- [x] **JSON Formatter**: Pretty-print JSON fields
- [x] **Export Templates**: Save configurations
- [x] **Server Monitoring**: Real-time charts

## Documentation Architecture
- [x] Consolidated artifacts in `.agent/ProjectInfo/`
- [x] Session logs in `.agent/ProjectInfo/agent_logs/`

## ⛔ Out of Scope
- **Replication / Cluster Management** (Infrastructure task)
- **Binary Log Inspection** (Niche debugging)
- **Tracking System** (Git is source of truth)
