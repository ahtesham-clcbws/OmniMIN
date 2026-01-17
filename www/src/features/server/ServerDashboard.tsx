import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { useNavigate } from 'react-router-dom';
import { 
    Database as DBIcon, LayoutGrid, List, Trash2
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { cn } from '@/lib/utils';

export function ServerDashboard() {
    const { 
        currentServer, dashboardViewMode, showSystemDbs,
        dashboardSearchTerm
    } = useAppStore();
    const { show: showNotification } = useNotificationStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Helper: Format Bytes
    const formatBytes = (bytes?: number) => {
        if (bytes === undefined || bytes === null) return '0 B';
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Fetch Databases
    const { data: databases, isLoading: loadingDbs } = useQuery({
        queryKey: ['databases', currentServer?.id],
        queryFn: () => dbApi.getDatabases(),
        enabled: !!currentServer
    });

    const sortedDbs = React.useMemo(() => {
        if (!databases) return [];
        const systemDbs = ['information_schema', 'mysql', 'performance_schema', 'sys'];
        
        let filtered = [...databases];
        
        // Filter system databases if not enabled
        if (!showSystemDbs) {
            filtered = filtered.filter(db => !systemDbs.includes(db.name.toLowerCase()));
        }

        // Sort alphabetically (A-Z)
        return filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }, [databases, showSystemDbs]);

    // TODO: Connect search from Layout (Store or Context?)
    // For now, let's assume global search is not wired yet or use a local one if we moved search Input here? 
    // The requirement says "Search Database" input is in the Header (Layout).
    // So we need a search term in the store?
    // Let's add `dashboardSearchTerm` to store later, or just verify if `term` in searchStore can be used.
    // For now, showing all sorted DBs.

    // Filter by Search Term
    const filteredDbs = React.useMemo(() => {
        if (!sortedDbs) return [];
        if (!dashboardSearchTerm) return sortedDbs;
        return sortedDbs.filter(db => db.name.toLowerCase().includes(dashboardSearchTerm.toLowerCase()));
    }, [sortedDbs, dashboardSearchTerm]);

    const handleDbClick = (dbName: string) => {
        if (currentServer) {
            navigate(`/server/${currentServer.id}/${dbName}`);
        }
    };

    const handleDropDb = async (e: React.MouseEvent, dbName: string) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to DROP the database '${dbName}'? This cannot be undone.`)) {
            try {
                await dbApi.dropDatabase(dbName);
                queryClient.invalidateQueries({ queryKey: ['databases'] });
            } catch (err) {
                console.error("Failed to drop database", err);
                showNotification("Failed to drop database: " + err, 'error');
            }
        }
    };

    const DatabaseSkeleton = () => (
        <div className="glass-panel p-4 flex flex-col gap-3 relative animate-pulse">
            <div className="flex justify-between items-start">
                <div className="w-8 h-8 rounded bg-white/5" />
            </div>
            <div className="space-y-2">
                <div className="h-5 w-3/4 bg-white/5 rounded" />
                <div className="h-3 w-1/2 bg-white/5 rounded" />
                <div className="h-3 w-1/3 bg-white/5 rounded" />
            </div>
        </div>
    );

    return (
        <div className="p-8 h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
             {loadingDbs ? (
                /* SKELETON LOADING STATE */
                <div className={cn(
                    "flex-1 overflow-y-auto pr-2 custom-scrollbar",
                    dashboardViewMode === 'grid' 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6"
                        : "flex flex-col gap-2"
                )}>
                    {[...Array(8)].map((_, i) => (
                        dashboardViewMode === 'grid' ? (
                            <DatabaseSkeleton key={i} />
                        ) : (
                            <div key={i} className="glass-panel p-4 flex items-center justify-between animate-pulse">
                                <div className="flex items-center gap-3 w-1/3">
                                    <div className="w-4 h-4 bg-white/5 rounded" />
                                    <div className="h-4 bg-white/5 rounded w-full" />
                                </div>
                                <div className="h-4 bg-white/5 rounded w-16" />
                                <div className="h-4 bg-white/5 rounded w-20" />
                            </div>
                        )
                    ))}
                </div>
            ) : dashboardViewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                    {filteredDbs.map(db => (
                        <button 
                            key={db.name}
                            onClick={() => handleDbClick(db.name)}
                            className="glass-panel p-3! text-left hover:border-primary group transition-all hover:bg-white/5 flex flex-col gap-2 relative"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 truncate pr-6 w-full">
                                    <DBIcon className="text-primary flex-shrink-0" size={18} />
                                    <div className="font-bold text-lg truncate group-hover:text-primary transition-colors w-full" title={db.name}>
                                        {db.name}
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 flex items-center gap-2">
                                    <div 
                                        className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        onClick={(e) => handleDropDb(e, db.name)}
                                        title="Drop Database"
                                    >
                                        <Trash2 size={14} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-end justify-between mt-1.5 w-full">
                                <div className="text-[10px] font-mono opacity-50 flex items-center gap-1.5">
                                    <span className="font-bold text-text-main/70">{db.tables_count || 0} Tables</span>
                                    <span className="opacity-30">•</span>
                                    <span>{formatBytes(db.size)}</span>
                                </div>
                                <div className="text-[10px] opacity-40 font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                    {db.collation}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                /* LIST VIEW */
                <div className="glass-panel border border-border/10 flex flex-col flex-1 min-h-0 overflow-hidden mb-6">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md">
                                <tr className="border-b border-border bg-black/20 text-[10px] uppercase font-bold text-text-muted tracking-wide">
                                    <th className="px-5 py-3">Database Name</th>
                                    <th className="px-5 py-3">Collation</th>
                                    <th className="px-5 py-3 text-right">Tables</th>
                                    <th className="px-5 py-3 text-right">Size</th>
                                    <th className="px-5 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {filteredDbs.map(db => (
                                    <tr 
                                        key={db.name} 
                                        onClick={() => handleDbClick(db.name)}
                                        className="hover:bg-white/5 cursor-pointer group transition-colors"
                                    >
                                        <td className="px-5 py-3 font-semibold text-text-main group-hover:text-primary transition-colors flex items-center gap-3">
                                            <DBIcon size={16} className="text-text-muted/50" />
                                            {db.name}
                                        </td>
                                        <td className="px-5 py-3 text-xs opacity-40 font-mono text-nowrap">{db.collation}</td> 
                                        <td className="px-5 py-3 text-right font-mono text-xs opacity-60">{db.tables_count || 0}</td>
                                        <td className="px-5 py-3 text-right font-mono text-xs opacity-60 text-nowrap">{formatBytes(db.size)}</td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                    onClick={(e) => handleDropDb(e, db.name)}
                                                    title="Drop Database"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
