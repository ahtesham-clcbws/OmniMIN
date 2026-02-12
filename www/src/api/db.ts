import { invoke } from '@tauri-apps/api/core';
import { TauriCommands, CommandName, QueryResult } from './commands';

// Re-export types for consumers
export type { Database, Table, BrowseResult, SavedServer } from './commands';

// Mock invoke for browser dev mode (since window.__TAURI__ won't exist in pure browser)
const isTauri = 'window' in globalThis && '__TAURI__' in window;

async function safeInvoke<K extends CommandName>(
    cmd: K, 
    args?: TauriCommands[K][0]
): Promise<TauriCommands[K][1]> {
    if (isTauri) {
        // @ts-ignore - Tauri invoke signature is loose, we enforce strictness here
        return invoke(cmd, args);
    }
    console.warn(`[Mock] Invoke: ${cmd}`, args);
    // Return mocks for development
    if (cmd === 'get_tables') return [] as any;
    if (cmd === 'get_databases') return [] as any;
    if (cmd === 'get_saved_servers_local') return [] as any;
    return {} as any;
}



export const dbApi = {
    getStatusVariables: async (filter?: string) => {
        return safeInvoke('get_status_variables', { filter });
    },

    getServerVariables: async (filter?: string) => {
        return safeInvoke('get_server_variables', { filter });
    },

    getCharsets: async () => {
        return safeInvoke('get_charsets');
    },

    getCollationsFull: async () => {
        return safeInvoke('get_collations_full');
    },

    getDatabases: async () => {
        return safeInvoke('get_databases');
    },

    getTables: async (db: string) => {
        return safeInvoke('get_tables', { db });
    },
    // Table Data
    getColumns: async (db: string, table: string) => {
        return safeInvoke('get_columns', { db, table });
    },

    browseTable: async (db: string, table: string, page: number, limit: number) => {
        return safeInvoke('browse_table_html', { db, table, page, limit });
    },

    browseTableRaw: async (db: string, table: string, page: number, limit: number, sortColumn?: string, sortDirection?: string, filters?: import('./commands').Filter[]) => {
        return safeInvoke('browse_table', { db, table, page, limit, sort_column: sortColumn, sort_direction: sortDirection, filters });
    },

    updateCell: async (db: string, table: string, column: string, value: any, pk_col: string, pk_val: any) => {
        return safeInvoke('update_cell', { db, table, column, value, primary_key_col: pk_col, primary_key_val: pk_val });
    },

    updateRow: async (db: string, table: string, row: Record<string, any>, pk_col: string, pk_val: any) => {
        return safeInvoke('update_row', { db, table, row, primary_key_col: pk_col, primary_key_val: pk_val });
    },

    insertRows: async (db: string, table: string, rows: Record<string, any>[]) => {
        return safeInvoke('insert_rows', { db, table, rows });
    },

    executeQuery: async (db: string, query: string, options?: any) => {
        return safeInvoke('execute_query', { db, sql: query, options });
    },

    getProcessList: async () => {
        return safeInvoke('get_process_list');
    },



    getMonitorData: async () => {
        return safeInvoke('get_monitor_data');
    },

    getServerStatus: async () => {
        return safeInvoke('get_server_status');
    },

    getRelations: async (db: string): Promise<QueryResult> => {
        const sql = `
            SELECT 
                TABLE_NAME, 
                COLUMN_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME 
            FROM 
                information_schema.KEY_COLUMN_USAGE 
            WHERE 
                TABLE_SCHEMA = '${db}' 
                AND REFERENCED_TABLE_NAME IS NOT NULL;
        `;
        const res = await safeInvoke('execute_query', { db, sql });
        return res[0];
    },

    getServerStats: async (): Promise<QueryResult> => {
        // Fetch most things in one go, but uptime is tricky. 
        // We'll use a safer query that works on most MySQL/MariaDB.
        const sql = `
            SELECT 
                VERSION() as version, 
                (SELECT VARIABLE_VALUE FROM information_schema.GLOBAL_STATUS WHERE VARIABLE_NAME = 'UPTIME') as uptime, 
                CURRENT_USER() as user, 
                DATABASE() as current_db
        `;
        // Note: global_status might not be enabled or named differently.
        // Fallback to purely VERSION/USER/DB first if it fails.
        return safeInvoke('execute_query', { sql }).then(r => r[0]).catch(() => {
             return safeInvoke('execute_query', { sql: "SELECT VERSION() as version, 0 as uptime, CURRENT_USER() as user, '' as current_db" }).then(r => r[0]);
        });
    },

    getCreateTable: async (db: string, table: string) => {
        const res = await safeInvoke('execute_query', { db, sql: `SHOW CREATE TABLE \`${table}\`` });
        return res[0].rows?.[0]?.[1] || ''; // Row 0, Col 1 contains the Create Table SQL
    },

    getProcedures: async (db: string) => {
        const sql = `SHOW PROCEDURE STATUS WHERE Db = '${db}'`;
        return safeInvoke('execute_query', { db, sql }).then(r => r[0]);
    },

    runMaintenance: async (db: string, tables: string[], operation: 'CHECK' | 'ANALYZE' | 'REPAIR' | 'OPTIMIZE') => {
        const tableList = tables.map(t => `\`${t}\``).join(',');
        const sql = `${operation} TABLE ${tableList}`;
        return safeInvoke('execute_query', { db, sql }).then(r => r[0]);
    },

    // Server Management
    connect: async (config: any) => {
        return safeInvoke('connect_db', { config });
    },

    getSavedServers: async () => {
        return safeInvoke('get_saved_servers_local');
    },

    saveServer: async (server: any) => {
        return safeInvoke('save_server_local', { server });
    },

    async getForeignKeys(db: string, table: string) {
        return safeInvoke('get_foreign_keys', { db, table });
    },

    async deleteServer(id: string) {
        return safeInvoke('delete_server_local', { id });
    },

    dropDatabase: async (name: string) => {
        return safeInvoke('drop_database', { name });
    },

    createDatabase: async (name: string, collation?: string) => {
        return safeInvoke('create_database', { name, collation });
    },

    getCollations: async () => {
        return safeInvoke('get_collations');
    },

    // User Management
    getUsers: async () => {
        return safeInvoke('get_users');
    },

    createUser: async (name: string, host: string, pass: string) => {
        return safeInvoke('create_user', { name, host, password: pass });
    },

    dropUser: async (name: string, host: string) => {
        return safeInvoke('drop_user', { name, host });
    },

    renameUser: async (oldName: string, oldHost: string, newName: string, newHost: string) => {
        return safeInvoke('rename_user', { oldName, oldHost, newName, newHost });
    },

    getGrants: async (name: string, host: string) => {
        return safeInvoke('get_grants', { name, host });
    },

    getPrivilegeMatrix: async (name: string, host: string) => {
        return safeInvoke('get_privilege_matrix', { name, host });
    },

    updatePrivilege: async (name: string, host: string, privilege: string, level: string, isGrant: boolean) => {
        return safeInvoke('update_privilege', { name, host, privilege, level, isGrant });
    },

    changePassword: async (name: string, host: string, pass: string) => {
        return safeInvoke('change_password', { name, host, password: pass });
    },

    flushPrivileges: async () => {
        return safeInvoke('flush_privileges');
    },

    // Import/Export
    exportDatabase: async (db: string, file: string, options: import('./commands').ExportOptions) => {
        return safeInvoke('export_database', { db, file, options });
    },

    importDatabase: async (db: string, file: string) => {
        return safeInvoke('import_database', { db, file });
    },

    importSql: async (db: string, sql: string) => {
        return safeInvoke('import_sql', { db, sql });
    },

    getCsvPreview: async (filePath: string, delimiter: string) => {
        return safeInvoke('get_csv_preview', { filePath, delimiter });
    },

    importCsv: async (db: string, table: string, filePath: string, options: any) => {
        return safeInvoke('import_csv', { db, table, filePath, options });
    },

    // Routines
    getRoutines: async (db: string) => {
        return safeInvoke('get_routines', { db });
    },

    getRoutineDefinition: async (db: string, name: string, type: 'PROCEDURE' | 'FUNCTION') => {
        return safeInvoke('get_routine_definition', { db, name, routineType: type });
    },

    saveRoutine: async (db: string, oldName: string, type: 'PROCEDURE' | 'FUNCTION', sql: string) => {
        return safeInvoke('save_routine', { db, oldName, routineType: type, sql });
    },

    dropRoutine: async (db: string, name: string, type: 'PROCEDURE' | 'FUNCTION') => {
        return safeInvoke('drop_routine', { db, name, routineType: type });
    },

    // Triggers
    getTriggers: async (db: string) => {
        return safeInvoke('get_triggers', { db });
    },
    
    createTrigger: async (db: string, name: string, table: string, time: string, event: string, statement: string) => {
        return safeInvoke('create_trigger', { db, name, table, time, event, statement });
    },

    dropTrigger: async (db: string, name: string) => {
        return safeInvoke('drop_trigger', { db, name });
    },

    // Events
    getEvents: async (db: string) => {
        return safeInvoke('get_events', { db });
    },

    createEvent: async (db: string, name: string, schedule: string, status: string, statement: string) => {
        return safeInvoke('create_event', { db, name, schedule, status, statement });
    },

    dropEvent: async (db: string, name: string) => {
        return safeInvoke('drop_event', { db, name });
    },

    // Indexes
    getIndexes: async (db: string, table: string) => {
        return safeInvoke('get_indexes', { db, table });
    },

    addIndex: async (db: string, table: string, name: string, columns: string[], type: string) => {
        return safeInvoke('add_index', { db, table, indexName: name, columns, indexType: type });
    },

    dropIndex: async (db: string, table: string, name: string) => {
        return safeInvoke('drop_index', { db, table, name });
    },

    // Search
    globalSearch: async (term: string, db?: string) => {
        return safeInvoke('global_search', { term, db });
    },

    // Snippets
    getSnippets: async () => {
        return safeInvoke('get_snippets');
    },
    saveSnippet: async (snippet: any) => {
        return safeInvoke('save_snippet', { snippet });
    },
    deleteSnippet: async (id: string) => {
        return safeInvoke('delete_snippet', { id });
    },

    // AI
    getAIConfig: async () => {
        return safeInvoke('get_ai_config');
    },
    saveAIConfig: async (config: any) => {
        return safeInvoke('save_ai_config', { config });
    },
    generateSQL: async (prompt: string, schema_context: string) => {
        return safeInvoke('generate_sql', { prompt, schema_context });
    },
    explainQuery: async (sql: string) => {
        return safeInvoke('explain_query', { sql });
    }
};
