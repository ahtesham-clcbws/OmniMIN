import { invoke } from '@tauri-apps/api/core';

export interface DebugLog {
  id: string;
  timestamp: string;
  issue_type: string;
  message: string;
  page_route: string;
  console_logs: string[];
  metadata: {
    app_version: string;
    platform: string;
    screen_resolution: string;
  };
}

export const debugApi = {
  saveLog: async (log: Omit<DebugLog, 'id' | 'timestamp'>): Promise<string> => {
    return invoke('save_debug_log', { log: { ...log, id: '', timestamp: '' } });
  },
  
  getLogs: async (): Promise<DebugLog[]> => {
    return invoke('get_debug_logs');
  },
  
  deleteLog: async (id: string): Promise<void> => {
    return invoke('delete_debug_log', { id });
  },
  
  clearAll: async (): Promise<number> => {
    return invoke('clear_all_debug_logs');
  },
};
