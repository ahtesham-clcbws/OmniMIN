import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Table2, Plus, Eye, Trash2, Eraser, Key, ArrowLeft, Search } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { dbApi } from '@/api/db';
import { showToast } from '@/utils/ui';
import { cn } from '@/lib/utils';
import { 
    Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDropModal } from './ConfirmDropModal';

export function Structure() {
    const { 
        currentServer, currentDb, setView, 
        tableViewMode, // Use global toggle state
        currentTable, setCurrentTable // Use global currentTable
    } = useAppStore();
    const queryClient = useQueryClient();
    // const [currentTable, setCurrentTable] = React.useState<string | null>(null); // Removed local state
    const [selectedTables, setSelectedTables] = React.useState<string[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');

    // FETCH: List Tables
    const { data: allTables, isLoading: loadingTables } = useQuery({
        queryKey: ['tables', currentDb],
        queryFn: async () => {
             const res = await dbApi.getTables(currentDb!);
             return res;
        },
        enabled: !!currentDb
    });

    // Filter tables
    const tables = React.useMemo(() => {
        if (!allTables) return [];
        if (!searchTerm) return allTables;
        return allTables.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allTables, searchTerm]);

    // FETCH: Table Structure (Columns)
    const { data: columns, isLoading: loadingStructure } = useQuery({
        queryKey: ['structure', currentDb, currentTable],
        queryFn: async () => {
            const res = await dbApi.executeQuery(currentDb!, `DESCRIBE \`${currentTable}\``);
            return res.rows;
        },
        enabled: !!currentDb && !!currentTable
    });

    // ... (Mutations)
    const dropTableMutation = useMutation({
        mutationFn: async ({ table, disableFk }: { table: string, disableFk: boolean }) => {
            return dbApi.executeQuery(currentDb!, `DROP TABLE \`${table}\``, { disable_fk_checks: disableFk });
        },
        onSuccess: () => {
             showToast('Table dropped successfully', 'success');
             queryClient.invalidateQueries({ queryKey: ['tables', currentDb] });
             setDropModal(prev => ({ ...prev, isOpen: false }));
        }
    });

    const truncateTableMutation = useMutation({
        mutationFn: async ({ table, disableFk }: { table: string, disableFk: boolean }) => {
            return dbApi.executeQuery(currentDb!, `TRUNCATE TABLE \`${table}\``, { disable_fk_checks: disableFk });
        },
        onSuccess: () => {
            showToast('Table truncated successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['tables', currentDb] });
            setDropModal(prev => ({ ...prev, isOpen: false }));
        }
    });

    const bulkActionMutation = useMutation({
        mutationFn: async ({ tables, type, disableFk }: { tables: string[], type: 'DROP' | 'TRUNCATE', disableFk: boolean }) => {
            const sqlTemplate = type === 'DROP' ? 'DROP TABLE' : 'TRUNCATE TABLE';
            // Sequential to avoid pool saturation on large drops, or Promise.all for speed. Promise.all is usually fine for < 50 tables.
            await Promise.all(tables.map(t => 
                dbApi.executeQuery(currentDb!, `${sqlTemplate} \`${t}\``, { disable_fk_checks: disableFk })
            ));
        },
        onSuccess: (_, variables) => {
            showToast(`${variables.tables.length} tables ${variables.type === 'DROP' ? 'dropped' : 'truncated'}`, 'success');
            setSelectedTables([]);
            setDropModal(prev => ({ ...prev, isOpen: false }));
            queryClient.invalidateQueries({ queryKey: ['tables', currentDb] });
        },
        onError: () => showToast("Operation failed", "error")
    });

    const handleConfirmAction = (disableFk: boolean) => {
        const { tables, type } = dropModal;
        if (tables.length === 1) {
            if (type === 'DROP') dropTableMutation.mutate({ table: tables[0], disableFk });
            else truncateTableMutation.mutate({ table: tables[0], disableFk });
        } else {
            bulkActionMutation.mutate({ tables, type, disableFk });
        }
    };

    const maintenanceResultsInit = null;
    const [maintenanceResults, setMaintenanceResults] = React.useState<{ op: string, data: any[][] } | null>(maintenanceResultsInit);

    // --- Modal State ---
    const [dropModal, setDropModal] = React.useState<{ isOpen: boolean, tables: string[], type: 'DROP' | 'TRUNCATE' }>({ 
        isOpen: false, tables: [], type: 'DROP' 
    });

    const runMaintenance = useMutation({
        mutationFn: async (op: 'CHECK' | 'ANALYZE' | 'REPAIR' | 'OPTIMIZE') => {
            if (!currentDb) throw new Error("No DB");
            return dbApi.runMaintenance(currentDb, selectedTables, op);
        },
        onSuccess: (data, variables) => {
            setMaintenanceResults({ op: variables, data: (data as any).rows });
            showToast(`${variables} operation completed`, 'success');
            setSelectedTables([]);
            queryClient.invalidateQueries({ queryKey: ['tables', currentDb] });
        },
        onError: () => showToast('Operation failed', 'error')
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked && tables) {
            setSelectedTables(tables.map(t => t.name));
        } else {
            setSelectedTables([]);
        }
    };

    const handleSelectOne = (table: string, checked: boolean) => {
        setSelectedTables(prev =>
            checked ? [...prev, table] : prev.filter(t => t !== table)
        );
    };
    
    // Calculate totals
    const totalSize = React.useMemo(() => {
        return tables?.reduce((acc, t) => acc + (t.size || 0), 0) || 0;
    }, [tables]);
    
    const totalRows = React.useMemo(() => {
        return tables?.reduce((acc, t) => acc + (t.rows || 0), 0) || 0;
    }, [tables]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!currentDb) return <div className="p-8 text-center opacity-50">Select a database</div>;

    // RENDER: Maintenance Results
    if (maintenanceResults) {
        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="h-14 border-b border-border bg-surface/50 flex items-center px-4 gap-4 flex-shrink-0">
                    <button onClick={() => setMaintenanceResults(null)} className="p-2 hover:bg-white/10 rounded-md text-text-muted hover:text-text-main transition-colors">
                        <ArrowLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Table2 className="text-primary" size={18} />
                        <h1 className="font-bold text-lg">Maintenance: {maintenanceResults.op}</h1>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-0">
                     <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-surface border-b border-border">
                            <tr className="text-xs uppercase font-bold text-text-muted tracking-wide">
                                <th className="p-4">Table</th>
                                <th className="p-4">Op</th>
                                <th className="p-4">Msg Type</th>
                                <th className="p-4">Msg Text</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {maintenanceResults.data.map((row, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono font-bold text-primary">{row[0]}</td>
                                    <td className="p-4 text-sm opacity-80">{row[1]}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                                            row[2] === 'status' ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                                        )}>{row[2]}</span>
                                    </td>
                                    <td className="p-4 text-sm opacity-60">{row[3]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // RENDER: TABLE STRUCTURE (Columns Detail View)
    if (currentTable) {
        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="h-14 border-b border-border bg-surface/50 flex items-center px-4 gap-4 flex-shrink-0">
                    <button onClick={() => setCurrentTable(null)} className="p-2 hover:bg-white/10 rounded-md text-text-muted hover:text-text-main transition-colors">
                        <ArrowLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Table2 className="text-primary" size={18} />
                        <h1 className="font-bold text-lg">{currentTable}</h1>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-border/50 text-text-muted">Columns</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-surface border-b border-border">
                            <tr className="text-xs uppercase font-bold text-text-muted tracking-wide">
                                <th className="p-4 w-48">Name</th>
                                <th className="p-4 w-32">Type</th>
                                <th className="p-4 w-32">Collation</th>
                                <th className="p-4 w-24">Null</th>
                                <th className="p-4 w-24">Key</th>
                                <th className="p-4 w-32">Default</th>
                                <th className="p-4">Extra</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {loadingStructure ? (
                                <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading structure...</td></tr>
                            ) : columns?.map((col: any[], i: number) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono font-bold text-primary">{col[0]}</td>
                                    <td className="p-4 font-mono text-sm text-yellow-400/80">{col[1]}</td>
                                    <td className="p-4 text-xs opacity-50">{col[2] || '-'}</td>
                                    <td className="p-4 text-xs opacity-50">{col[3]}</td>
                                    <td className="p-4 text-xs font-bold text-blue-400">{col[4]}</td>
                                    <td className="p-4 text-xs opacity-50 font-mono">{col[5] || 'NULL'}</td>
                                    <td className="p-4 text-xs opacity-50 italic">{col[6]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // RENDER: DATABASE STRUCTURE (List Tables)
    if (loadingTables) return <div className="p-12 text-center text-white/50"><Loader2 className="animate-spin inline mr-2" />Loading tables...</div>;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Toolbar / Search */}
            <div className="flex-none px-4 py-2 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between gap-4">
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted opacity-50 w-3.5 h-3.5" />
                    <input 
                        type="text" 
                        placeholder="Filter tables..." 
                        className="bg-background border border-border rounded-md pl-9 pr-4 h-8 w-full text-xs outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-text-muted/40"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider opacity-60">
                     {tables?.length} tables found
                 </div>
                 <button className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 rounded px-3 py-1.5 transition-all text-xs font-bold shadow-sm">
                    <Plus size={14} />
                    <span>Create Table</span>
                 </button>
            </div>

            {/* Table Header (Fixed) */}
            <div className="flex-none border-b border-border bg-surface/90 backdrop-blur-md z-10 w-full pr-2">
                    <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                        <tr className="text-[10px] uppercase font-bold text-text-muted tracking-wide text-left">
                            <th className="p-3 w-10 text-center">
                                <input
                                    type="checkbox"
                                    className="rounded border-border bg-canvas checked:bg-primary cursor-pointer"
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    checked={tables?.length === selectedTables.length && (tables?.length || 0) > 0}
                                />
                            </th>
                            <th className="p-3 w-1/4">Name</th>
                            <th className="p-3 w-24 text-right">Rows</th>
                            <th className="p-3 w-24 text-right">Size</th>
                            <th className="p-3 w-24">Engine</th>
                            <th className="p-3 w-32">Collation</th>
                            <th className="p-3 w-24 text-right">Overhead</th>
                            <th className="p-3 text-right">Action</th>
                        </tr>
                    </thead>
                    </table>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
                    {tableViewMode === 'list' ? (
                    <table className="w-full text-left border-collapse table-fixed">
                        <tbody className="divide-y divide-border/30">
                            {tables?.map((t) => (
                                <tr key={t.name} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-3 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-border bg-canvas checked:bg-primary cursor-pointer"
                                            checked={selectedTables.includes(t.name)}
                                            onChange={(e) => handleSelectOne(t.name, e.target.checked)}
                                        />
                                    </td>
                                    <td className="p-3 w-1/4 font-mono font-bold text-primary truncate">
                                        <div 
                                            onClick={() => { setCurrentTable(t.name); }} 
                                            className="hover:underline flex items-center gap-2 truncate w-full cursor-pointer select-none"
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <Table2 size={14} className="opacity-50 flex-shrink-0" />
                                            <span className="truncate" title={t.name}>{t.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 w-24 text-right font-mono text-xs opacity-70">{t.rows?.toLocaleString() ?? 0}</td>
                                    <td className="p-3 w-24 text-right font-mono text-xs opacity-70">{formatBytes(t.size)}</td>
                                    <td className="p-3 w-24 text-xs opacity-50 truncate">{t.engine}</td>
                                    <td className="p-3 w-32 text-xs opacity-50 truncate font-mono">{t.collation}</td>
                                    <td className="p-3 w-24 text-right font-mono text-xs opacity-50 text-orange-400">{(t.overhead && t.overhead > 0) ? formatBytes(t.overhead) : '-'}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            className="p-1.5 hover:bg-white/10 rounded text-primary"
                                                            onClick={() => setCurrentTable(t.name)}
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Structure</TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            className="p-1.5 hover:bg-white/10 rounded text-green-400"
                                                            onClick={() => {
                                                                setCurrentTable(t.name);
                                                                window.location.hash = `/server/${currentServer?.id}/${currentDb}/table/${t.name}`;
                                                            }}
                                                        >
                                                            <Table2 size={14} />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Browse</TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            className="p-1.5 hover:bg-white/10 rounded text-blue-400"
                                                            onClick={() => {/* TODO: Search */}}
                                                        >
                                                            <Search size={14} />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Search</TooltipContent>
                                                </Tooltip>

                                                 <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            className="p-1.5 hover:bg-white/10 rounded text-yellow-500"
                                                            onClick={() => setDropModal({ isOpen: true, tables: [t.name], type: 'TRUNCATE' })}
                                                        >
                                                            <Eraser size={14} />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Empty (Truncate)</TooltipContent>
                                                </Tooltip>

                                                 <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button 
                                                            className="p-1.5 hover:bg-white/10 rounded text-red-500" 
                                                            onClick={() => setDropModal({ isOpen: true, tables: [t.name], type: 'DROP' })}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Drop</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 pb-20">
                            {tables?.map((t) => (
                                <div 
                                    key={t.name}
                                    onClick={() => setCurrentTable(t.name)}
                                    className="glass-panel p-4 hover:border-primary/50 cursor-pointer group transition-all hover:bg-white/5 flex flex-col gap-3 relative"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 text-primary font-bold truncate">
                                            <Table2 size={16} className="opacity-70" />
                                            <span className="truncate" title={t.name}>{t.name}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-xs opacity-70 mt-2">
                                         <div className="flex flex-col">
                                            <span className="opacity-50 text-[10px] uppercase">Rows</span>
                                            <span className="font-mono">{t.rows?.toLocaleString() ?? 0}</span>
                                         </div>
                                         <div className="flex flex-col text-right">
                                            <span className="opacity-50 text-[10px] uppercase">Size</span>
                                            <span className="font-mono">{formatBytes(t.size)}</span>
                                         </div>
                                    </div>
                                     <div className="flex items-center justify-between mt-1 text-[10px] opacity-40 uppercase tracking-wider">
                                         <span>{t.engine}</span>
                                         <span>{t.collation}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>

            {/* Footer (Fixed) */}
            <div className="flex-none p-3 border-t border-border bg-surface/50 text-xs text-text-muted flex items-center justify-between gap-4">
                 
                 <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <button onClick={() => handleSelectAll(true)} className="hover:text-primary hover:underline italic">Check all</button>
                        <span>/</span>
                        <button onClick={() => handleSelectAll(false)} className="hover:text-primary hover:underline italic">Uncheck all</button>
                     </div>
                     <div className="h-4 w-px bg-border"></div>
                     <span className="opacity-70">Summary:</span>
                     <span>{tables?.length} tables</span>
                     <span>{totalRows.toLocaleString()} rows</span>
                     <span>{formatBytes(totalSize)}</span>
                 </div>

                {/* Bulk Actions (Contextual) */}
                <div className={cn(
                    "flex items-center gap-2 transition-all duration-300 transform",
                    selectedTables.length > 0 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
                )}>
                    <span className="font-bold text-primary">{selectedTables.length} selected</span>
                    
                    <Select onValueChange={(action) => {
                         if (!action) return;
                            if (action === 'DROP') {
                                setDropModal({ isOpen: true, tables: selectedTables, type: 'DROP' });
                            } else if (action === 'TRUNCATE') {
                                setDropModal({ isOpen: true, tables: selectedTables, type: 'TRUNCATE' });
                            } else {
                                runMaintenance.mutate(action as any);
                            }
                    }}>
                        <SelectTrigger className="w-40 h-8 text-xs">
                            <SelectValue placeholder="With selected:" />
                        </SelectTrigger>
                        <SelectContent side="top" align="end" className="max-h-80">
                            <SelectGroup>
                                <SelectLabel>Data</SelectLabel>
                                <SelectItem value="DROP">Drop</SelectItem>
                                <SelectItem value="TRUNCATE">Empty (Truncate)</SelectItem>
                                <SelectItem value="COPY" disabled>Copy table</SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel>Structure</SelectLabel>
                                <SelectItem value="CHECK">Check table</SelectItem>
                                <SelectItem value="ANALYZE">Analyze table</SelectItem>
                                <SelectItem value="REPAIR">Repair table</SelectItem>
                                <SelectItem value="OPTIMIZE">Optimize table</SelectItem>
                                <SelectItem value="CHECKSUM" disabled>Checksum table</SelectItem>
                            </SelectGroup>
                             <SelectGroup>
                                <SelectLabel>Prefix</SelectLabel>
                                <SelectItem value="ADD_PREFIX" disabled>Add prefix to table</SelectItem>
                                <SelectItem value="REPLACE_PREFIX" disabled>Replace table prefix</SelectItem>
                                <SelectItem value="COPY_PREFIX" disabled>Copy table with prefix</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <ConfirmDropModal 
                isOpen={dropModal.isOpen} 
                onClose={() => setDropModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                tables={dropModal.tables}
                type={dropModal.type}
                isPending={dropTableMutation.isPending || truncateTableMutation.isPending || bulkActionMutation.isPending}
            />
        </div>
    );
}
