import { create } from 'zustand';
// import { persist } from 'zustand/middleware'; // Removed for native persistence

interface ServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
}

interface QueryHistoryItem {
  sql: string;
  timestamp: Date;
}

export interface AIConfig {
    provider: 'ollama' | 'gemini' | 'openai' | 'disabled';
    apiKey?: string;
    model: string;
    endpoint?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface ExportTemplate {
    id: string;
    name: string;
    options: any; // Using any for flexibility with JSON
}

interface AppState {
  theme: 'dark' | 'light' | 'ultra-light' | 'neo';
  accentColor: string;
  density: 'compact' | 'default' | 'comfortable';
  fontFamily: string;
  view: 'dashboard' | 'browser' | 'settings' | 'query' | 'structure' | 'designer' | 'routines' | 'export' | 'import';
  dashboardViewMode: 'grid' | 'list';
  tableViewMode: 'grid' | 'list';
  showSettings: boolean;
  showSystemDbs: boolean;
  
  // Selection Context
  currentServer: ServerConfig | null;
  currentDb: string | null;
  currentTable: string | null;
  queryHistory: QueryHistoryItem[];

  // Export Templates
  exportTemplates: ExportTemplate[];
  addExportTemplate: (template: ExportTemplate) => void;
  removeExportTemplate: (id: string) => void;

  // Colors
  customColors: { id: string; hex: string; label: string }[];
  addCustomColor: (color: { id: string; hex: string; label: string }) => void;
  removeCustomColor: (id: string) => void;

  // Fonts
  customFonts: { id: string; label: string; family: string; type: 'system' | 'custom'; src?: string }[];
  addCustomFont: (font: { id: string; label: string; family: string; type: 'system' | 'custom'; src?: string }) => void;
  removeCustomFont: (id: string) => void;

  // Actions
  setPreferences: (prefs: any) => void;
  setTheme: (theme: 'dark' | 'light' | 'ultra-light' | 'neo') => void;
  setAccentColor: (color: string) => void;
  setDensity: (density: AppState['density']) => void;
  setFontFamily: (font: string) => void;
  setView: (view: AppState['view']) => void;
  setShowSettings: (show: boolean) => void;
  setDashboardViewMode: (mode: 'grid' | 'list') => void;
  setTableViewMode: (mode: 'grid' | 'list') => void;
  setShowSystemDbs: (show: boolean) => void;
  
  // UI State
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;

  // UI Modals
  showCreateDbModal: boolean;
  setShowCreateDbModal: (show: boolean) => void;
  showEditServerModal: boolean;
  setShowEditServerModal: (show: boolean) => void;
  showCreateTableModal: boolean;
  setShowCreateTableModal: (show: boolean) => void;
  showUsersModal: boolean;
  setIsUsersModalOpen: (show: boolean) => void;

  dashboardSearchTerm: string;
  setDashboardSearchTerm: (term: string) => void;

  // Performance & Debug Settings
  debugMode: boolean;
  performanceMonitoring: boolean;
  showPerformanceOverlay: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  setDebugMode: (enabled: boolean) => void;
  setPerformanceMonitoring: (enabled: boolean) => void;
  setShowPerformanceOverlay: (show: boolean) => void;
  setLogLevel: (level: 'debug' | 'info' | 'warn' | 'error') => void;

  // AI Configuration
  aiConfig: AIConfig;
  setAIConfig: (config: AIConfig) => void;

  setCurrentServer: (server: ServerConfig | null) => void;
  setCurrentDb: (db: string | null) => void;
  setCurrentTable: (table: string | null) => void;
  addHistory: (sql: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
      theme: 'dark',
      accentColor: 'blue',
      density: 'default',
      fontFamily: 'sans',
      view: 'dashboard',
      dashboardViewMode: 'grid',
      tableViewMode: 'list',
      showSettings: false,
      showSystemDbs: false,
      currentServer: null,
      currentDb: null,
      currentTable: null,
      queryHistory: [],
      customFonts: [],
      customColors: [],

      setPreferences: (prefs) => set({
          theme: prefs.theme as any,
          accentColor: prefs.accentColor,
          density: prefs.density as any,
          fontFamily: prefs.fontFamily,
          dashboardViewMode: prefs.dashboardViewMode as any,
          tableViewMode: prefs.tableViewMode ?? 'list' as any,
          showSystemDbs: prefs.showSystemDbs,
          queryHistory: prefs.queryHistory.map((q: any) => ({ ...q, timestamp: new Date(q.timestamp) })),
          // Performance settings
          debugMode: prefs.debugMode ?? false,
          performanceMonitoring: prefs.performanceMonitoring ?? false,
          showPerformanceOverlay: prefs.showPerformanceOverlay ?? false,
          logLevel: prefs.logLevel ?? 'info',
          // AI Config
          aiConfig: prefs.ai_config || {
            provider: 'disabled',
            model: 'llama3',
            endpoint: 'http://localhost:11434',
            temperature: 0.3,
            maxTokens: 2048
          },
          // Export Templates
          exportTemplates: prefs.export_templates || [],
      }),

      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setDensity: (density) => set({ density }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setView: (view) => set({ view }),
      setShowSettings: (show) => set({ showSettings: show }),
      setDashboardViewMode: (mode) => set({ dashboardViewMode: mode }),
      setTableViewMode: (mode) => set({ tableViewMode: mode }),
      setShowSystemDbs: (show) => set({ showSystemDbs: show }),
      
      showHelp: false,
      setShowHelp: (show) => set({ showHelp: show }),

      showCreateDbModal: false,
      setShowCreateDbModal: (show) => set({ showCreateDbModal: show }),
      showEditServerModal: false,
      setShowEditServerModal: (show) => set({ showEditServerModal: show }),
      showCreateTableModal: false,
      setShowCreateTableModal: (show) => set({ showCreateTableModal: show }),

      showUsersModal: false,
      setIsUsersModalOpen: (show: boolean) => set({ showUsersModal: show }),

      dashboardSearchTerm: '',
      setDashboardSearchTerm: (term) => set({ dashboardSearchTerm: term }),

      // Performance & Debug Settings defaults
      debugMode: false,
      performanceMonitoring: false,
      showPerformanceOverlay: false,
      logLevel: 'info',
      setDebugMode: (enabled) => set({ debugMode: enabled }),
      setPerformanceMonitoring: (enabled) => set({ performanceMonitoring: enabled }),
      setShowPerformanceOverlay: (show) => set({ showPerformanceOverlay: show }),
      setLogLevel: (level) => set({ logLevel: level }),

      // AI Config
      aiConfig: {
        provider: 'disabled',
        model: 'llama3',
        endpoint: 'http://localhost:11434',
        temperature: 0.3,
        maxTokens: 2048
      },
      setAIConfig: (config) => set({ aiConfig: config }),

      // Export Templates
      exportTemplates: [],
      addExportTemplate: (template) => set((state) => ({
          exportTemplates: [...state.exportTemplates, template]
      })),
      removeExportTemplate: (id) => set((state) => ({
          exportTemplates: state.exportTemplates.filter(t => t.id !== id)
      })),

      setCurrentServer: (currentServer) => set({ currentServer }),
      setCurrentDb: (currentDb) => set({ currentDb }),
      setCurrentTable: (currentTable) => set({ currentTable }),
      addHistory: (sql) => set((state) => {
          return { 
              queryHistory: [{ sql, timestamp: new Date() }, ...state.queryHistory].slice(0, 50) 
          } as Partial<AppState>;
      }),
      addCustomColor: (color) => set((state) => ({
          customColors: [...state.customColors, color]
      })),
      removeCustomColor: (id) => {
          const state = get();
          if (state.accentColor === id) {
              set({ accentColor: 'blue' });
          }
          set((state) => ({
              customColors: state.customColors.filter(c => c.id !== id)
          }));
      },
      addCustomFont: (font) => set((state) => ({ 
          customFonts: [...state.customFonts, font] 
      })),
      removeCustomFont: (id) => set((state) => ({
          customFonts: state.customFonts.filter(f => f.id !== id)
      }))
}));
