
# Backend API (Tauri Commands)

This document lists the exposed Tauri commands available for `invoke` calls from the frontend.
Source: `src-tauri/src/lib.rs`.

## Server Management
| Command | Description |
|---------|-------------|
| `connect_db` | Connect to a database server. |
| `get_saved_servers` | Retrieve list of saved server configurations. |
| `save_server` | Save/Update a server configuration. |
| `delete_server` | Delete a saved server. |
| `get_server_info` | Get current server version and status. |
| `get_process_list` | Get active processes. |
| `get_status_variables` | Get global status variables. |
| `get_server_variables` | Get server configuration variables. |

## Database Operations
| Command | Description |
|---------|-------------|
| `get_databases` | List all databases. |
| `create_database` | Create a new database. |
| `drop_database` | Delete a database. |
| `rename_database` | Rename a database. |
| `copy_database` | Copy database (structure + data option). |
| `change_collation` | Change database collation. |
| `get_collations` | Get list of available collations. |

## Table Operations
| Command | Description |
|---------|-------------|
| `get_tables` | List tables in a database with stats. |
| `get_columns` | Get column definitions for a table. |
| `rename_table` | Rename a table. |
| `truncate_table` | Empty a table. |
| `copy_table` | Copy a table. |
| `table_maintenance` | Optimize, Repair, Check, etc. |

## Feature Specific
### Users
- `get_users`, `create_user`, `drop_user`, `rename_user`
- `get_grants`, `update_privilege`, `flush_privileges`

### Events & Triggers
- `get_events`, `create_event`, `drop_event`
- `get_triggers`, `create_trigger`, `drop_trigger`

### Relations (Foreign Keys)
- `get_foreign_keys`, `add_foreign_key`, `drop_foreign_key`

### Import/Export
- `export_database`, `import_database`, `import_sql`, `import_csv`

### AI
- `generate_sql`, `explain_query`
