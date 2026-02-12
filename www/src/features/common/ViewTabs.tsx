import React from 'react';
import { 
    Table, LayoutGrid, FileCode, PenTool, FileText, Download, Upload, 
    Search, Plus, Settings, Zap, Key
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

interface Tab {
    id: string;
    label: string;
    icon: React.ElementType;
}

export function ViewTabs() {
    const location = useLocation();
    const { serverId, dbName, tableName } = useParams();
    const navigate = useNavigate();

    if (!dbName) return null;

    // 1. Define Tab Sets
    const dbTabs: Tab[] = [
        { id: 'structure', label: 'Structure', icon: LayoutGrid },
        { id: 'query', label: 'SQL', icon: FileCode },
        { id: 'search', label: 'Search', icon: Search },
        { id: 'routines', label: 'Routines', icon: FileText },
        { id: 'triggers', label: 'Triggers', icon: Zap },
        { id: 'events', label: 'Events', icon: Zap },
        { id: 'designer', label: 'Designer', icon: PenTool },
        { id: 'export', label: 'Export', icon: Download },
        { id: 'import', label: 'Import', icon: Upload },
        { id: 'operations', label: 'Operations', icon: Settings },
        { id: 'privileges', label: 'Privileges', icon: Key },
    ];

    const tableTabs: Tab[] = [
        { id: 'browser', label: 'Browse', icon: Table },
        { id: 'structure', label: 'Structure', icon: LayoutGrid },
        { id: 'query', label: 'SQL', icon: FileCode },
        { id: 'search', label: 'Search', icon: Search },
        { id: 'insert', label: 'Insert', icon: Plus },
        { id: 'export', label: 'Export', icon: Download },
        { id: 'import', label: 'Import', icon: Upload },
        { id: 'operations', label: 'Operations', icon: Settings },
        { id: 'triggers', label: 'Triggers', icon: Zap },
    ];

    // 2. Select Active Set
    const tabs = tableName ? tableTabs : dbTabs;

    const handleNavigate = (tabId: string) => {
        let path = `/server/${serverId}/${dbName}`;

        if (tableName) {
            // Table Context
            if (tabId === 'browser') path += `/table/${tableName}`;
            else if (tabId === 'structure') path += `/table/${tableName}/structure`;
            else path += `/table/${tableName}/${tabId}`;
        } else {
            // DB Context
            // Structure is default for DB
            if (tabId === 'structure') path += ``; 
            else if (tabId === 'query') path += `/sql`; // Match phpmyadmin 'SQL' tab -> '/sql'
            else path += `/${tabId}`;
        }
        
        navigate(path);
    };

    const isTabActive = (tabId: string) => {
        if (tableName) {
            // Table Context
            if (tabId === 'browser') return location.pathname.endsWith(`/table/${tableName}`) || location.pathname.endsWith(`/table/${tableName}/`);
            if (tabId === 'structure') return location.pathname.includes('/structure'); 
            // Generic match for others
            return location.pathname.includes(`/${tabId}`);
        } else {
            // DB Context
            if (tabId === 'structure') return location.pathname.endsWith(`/${dbName}`) || location.pathname.endsWith(`/${dbName}/`) || (location.pathname.includes('/structure') && !tableName);
            if (tabId === 'query') return location.pathname.endsWith('/sql');
            return location.pathname.includes(`/${tabId}`);
        }
    };

    return (
        <div className="flex items-center gap-1 border-b border-border bg-canvas px-4 pt-4 overflow-x-auto scrollbar-none">
            {tabs.map(tab => {
                const isActive = isTabActive(tab.id);

                return (
                    <button
                        key={tab.id}
                        onClick={() => handleNavigate(tab.id)}
                        className={cn(
                            "flex h-full items-center border-0 bg-transparent gap-1.5 px-3 py-1 rounded-none text-[13px] font-bold transition-all whitespace-nowrap",
                            isActive
                            ? "bg-primary/10 text-primary"
                            : "text-text-muted hover:text-text-main hover:bg-white/5"
                        )}
                        title={tab.label}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
