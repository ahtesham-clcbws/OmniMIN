import React from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { 
    LayoutGrid, Database, Table2, FileCode, Play, 
    Download, Upload, Settings, Shield, Zap, Layers 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DatabaseLayout() {
    const { serverId, dbName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // In strict nested routing, we might rely on URL params, 
    // but legacy components rely on store. We should sync them if needed, 
    // but ideally components read params.
    
    // Navigation Items
    const tabs = [
        { id: 'structure', label: 'Structure', icon: LayoutGrid, path: '' }, // Root of /:dbName is structure
        { id: 'sql', label: 'SQL', icon: FileCode, path: 'sql' },
        { id: 'search', label: 'Search', icon: Database, path: 'search' }, // Reuse Database icon?
        { id: 'query', label: 'Query', icon: Play, path: 'query' },
        { id: 'export', label: 'Export', icon: Download, path: 'export' },
        { id: 'import', label: 'Import', icon: Upload, path: 'import' },
        { id: 'operations', label: 'Operations', icon: Settings, path: 'operations' },
        { id: 'privileges', label: 'Privileges', icon: Shield, path: 'privileges' },
        { id: 'routines', label: 'Routines', icon: Zap, path: 'routines' },
        { id: 'events', label: 'Events', icon: Layers, path: 'events' },
        { id: 'triggers', label: 'Triggers', icon: Zap, path: 'triggers' }, // reuse zap
        { id: 'designer', label: 'Designer', icon: Table2, path: 'designer' },
    ];

    const currentTab = tabs.find(t => {
        if (t.path === '') return location.pathname.endsWith(`/${dbName}`) || location.pathname.endsWith(`/${dbName}/`);
        return location.pathname.includes(`/${dbName}/${t.path}`);
    })?.id || 'structure';

    const handleTabClick = (path: string) => {
        const target = path ? `/server/${serverId}/${dbName}/${path}` : `/server/${serverId}/${dbName}`;
        navigate(target);
    };

    return (
        <div className="h-full flex flex-col bg-main text-text-main overflow-hidden">
            {/* secondary toolbar */}
            <div className="h-10 border-b border-border bg-surface/30 flex items-center px-4 py-0! overflow-x-auto custom-scrollbar flex-shrink-0">
                {tabs.map(tab => {
                     const isActive = currentTab === tab.id;
                     return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.path)}
                            className={cn(
                                "flex h-full items-center border-0 bg-transparent gap-1.5 px-3 py-1 rounded-none text-[13px] font-bold transition-all whitespace-nowrap",
                                isActive 
                                    ? "bg-primary/10 text-primary" 
                                    : "text-text-muted hover:text-text-main hover:bg-white/5"
                            )}
                        >
                            <tab.icon size={14} className={cn(isActive ? "text-primary" : "opacity-70")} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
                <Outlet />
            </div>
        </div>
    );
}
