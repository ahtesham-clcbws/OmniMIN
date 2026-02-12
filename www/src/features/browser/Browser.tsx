import React from 'react';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { useAppStore } from '@/stores/useAppStore';
import { dbApi } from '@/api/db';
import { Loader2, Table2, Edit2, Check, X, Key, Trash2, ArrowUp, ArrowDown, ArrowUpDown, Filter as FilterIcon, PlusCircle, AlertTriangle, Copy, Layers, GripVertical } from 'lucide-react';
import type { Filter } from '@/api/commands';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { invoke } from '@tauri-apps/api/core';
import { showToast } from '@/utils/ui';

import { Modal } from '@/components/ui/Modal';
import { RowEditorModal } from './RowEditorModal';

// Helper to render editable cells
function EditableCell({ value, onSave }: { value: any, onSave: (val: any) => void }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value);
    
    // Image Preview State
    const [showPreview, setShowPreview] = React.useState(false);

    // Update local state if prop changes
    React.useEffect(() => {
        setEditValue(value);
    }, [value]);

    const handleSave = () => {
        setIsEditing(false);
        if (editValue !== value) {
            onSave(editValue);
        }
    };

    // Check for Binary Image
    const isBinary = typeof value === 'string' && value.startsWith('_binary_base64:');
    
    if (showPreview && isBinary) {
        const base64Data = value.split('_binary_base64:')[1];
        return (
            <Modal isOpen={true} onClose={() => setShowPreview(false)} title="Image Preview" size="lg">
                <div className="flex flex-col gap-4 items-center justify-center p-4">
                    <div className="border border-white/10 p-2 bg-[url('https://pma-native.com/grid.png')] bg-repeat rounded">
                        <img src={`data:image/png;base64,${base64Data}`} className="max-w-full max-h-[70vh] object-contain shadow-2xl" />
                    </div>
                    <div className="text-xs font-mono opacity-50">
                        Size: {Math.round(base64Data.length * 0.75 / 1024)} KB
                    </div>
                </div>
            </Modal>
        );
    }

    // Check for JSON
    const isJson = React.useMemo(() => {
        if (typeof value !== 'string') return false;
        const trimmed = value.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
             try {
                 JSON.parse(trimmed);
                 return true;
             } catch { return false; }
        }
        return false;
    }, [value]);

    // JSON Edit State
    const [showJsonEditor, setShowJsonEditor] = React.useState(false);
    const [jsonError, setJsonError] = React.useState<string | null>(null);

    // ... (Binary check is below)

    if (showJsonEditor) {
        // Pretty print for editor
        const formatted = (() => {
             try {
                 return JSON.stringify(JSON.parse(editValue), null, 2);
             } catch { return editValue; }
        })();

        return (
            <Modal isOpen={true} onClose={() => setShowJsonEditor(false)} title="JSON Editor" size="lg">
                 <div className="flex flex-col gap-4 p-1 h-[60vh]">
                     <textarea 
                        className={cn(
                            "flex-1 bg-black/30 border p-4 rounded-lg font-mono text-xs leading-relaxed outline-none resize-none",
                            jsonError ? "border-red-500/50" : "border-white/10"
                        )}
                        defaultValue={formatted}
                        spellCheck={false}
                        onChange={(e) => {
                             try {
                                 const minified = JSON.stringify(JSON.parse(e.target.value)); // Validate & Minify
                                 setEditValue(minified);
                                 setJsonError(null);
                             } catch (err: any) {
                                 setJsonError(err.message);
                             }
                        }}
                     />
                     {jsonError && <div className="text-red-400 text-xs px-2 font-mono bg-red-500/10 py-1 rounded">Error: {jsonError}</div>}
                     <div className="flex justify-end gap-2">
                        <button onClick={() => setShowJsonEditor(false)} className="btn-secondary">Cancel</button>
                        <button 
                            onClick={() => {
                                if (!jsonError) {
                                    handleSave(); 
                                    setShowJsonEditor(false);
                                }
                            }} 
                            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded text-xs font-bold disabled:opacity-50"
                            disabled={!!jsonError}
                        >
                            Save Changes
                        </button>
                     </div>
                 </div>
            </Modal>
        );
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 w-full min-w-[120px]">
                <input 
                    autoFocus
                    className="bg-black/40 border border-primary/50 w-full px-2 py-1 text-sm outline-none rounded font-mono"
                    value={isBinary ? '(Binary Data)' : (editValue ?? '')}
                    onChange={e => !isBinary && setEditValue(e.target.value)}
                    disabled={isBinary}
                    onBlur={(e) => setTimeout(() => handleSave(), 200)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                />
            </div>
        );
    }

    // Render Badge for JSON
    if (isJson && !isEditing) {
         return (
             <div 
                className="group relative truncate max-w-[300px] cursor-pointer min-h-[1.5em] px-2 py-1 rounded hover:bg-white/5 transition-colors flex items-center gap-2"
                onClick={() => setShowJsonEditor(true)}
                title="Click to view/edit JSON"
             >
                 <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 text-[9px] font-mono px-1 rounded font-bold opacity-70 group-hover:opacity-100">{`{ }`}</span>
                 <span className="truncate opacity-80 text-xs font-mono">{String(value)}</span>
             </div>
         );
    }

    if (isBinary) {
        const base64Data = value.split('_binary_base64:')[1];
        return (
            <div className="group relative px-2 py-1">
                 <div 
                    onClick={() => setShowPreview(true)}
                    className="cursor-pointer hover:scale-110 transition-transform origin-left inline-block border border-white/20 rounded overflow-hidden"
                 >
                    <img 
                        src={`data:image/png;base64,${base64Data}`} 
                        className="h-8 w-auto min-w-[20px] object-cover bg-white/5" 
                        alt="BLOB"
                    />
                 </div>
                 <div className="text-[10px] opacity-40 inline-ml-2 font-mono align-middle ml-2">BLOB</div>
                 
                 {/* Still show edit icon but it will be disabled or just for replacing upload later */}
                 {/* For now, we don't support uploading new BLOBs via inline edit easily */}
            </div>
        );
    }

    return (
        <div 
            onClick={() => setIsEditing(true)}
            className={cn(
                "group relative w-full h-full flex items-center px-2 py-1 cursor-text hover:bg-white/5 transition-colors",
                value === null && "text-white/20 italic"
            )}
            title="Click to edit"
        >
            <span className="truncate w-full">{value === null ? 'NULL' : String(value)}</span>
            <Edit2 size={10} className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 pointer-events-none" />
        </div>
    );
}

export function Browser() {
    const { currentDb, currentTable } = useAppStore();

    // 1. Fetch Tables List (Background)
    const { data: tables, isLoading: loadingTables } = useQuery({
        queryKey: ['tables', currentDb],
        queryFn: () => dbApi.getTables(currentDb!),
        enabled: !!currentDb
    });

    const sortedTables = React.useMemo(() => {
        if (!tables) return [];
        return [...tables].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }, [tables]);

    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(25);
    const limitOptions = [10, 15, 25, 50, 100, 200, 300, 500, 700, 1000];
    
    // Selection state
    const [selectedRows, setSelectedRows] = React.useState<string[]>([]);

    // Filter state
    const [filters, setFilters] = React.useState<Filter[]>([]);
    const [showFilters, setShowFilters] = React.useState(false);
    const [newFilter, setNewFilter] = React.useState<Filter>({ col: '', op: '=', val: '' });

    // Handle adding a filter
    const addFilter = () => {
        if (!newFilter.col || !newFilter.val) return;
        setFilters([...filters, { ...newFilter }]);
        setNewFilter({ col: '', op: '=', val: '' });
        setPage(1);
    };

    const removeFilter = (index: number) => {
        setFilters(filters.filter((_, i) => i !== index));
        setPage(1);
    };

    // Sorting state
    const [sortColumn, setSortColumn] = React.useState<string | null>(null);
    const [sortDirection, setSortDirection] = React.useState<'ASC' | 'DESC' | null>(null);

    // Confirm Modal State
    const [confirmState, setConfirmState] = React.useState<{
        isOpen: boolean;
        title: React.ReactNode;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    // Row Editor State
    const [rowEditorState, setRowEditorState] = React.useState<{
        isOpen: boolean;
        mode: 'edit' | 'insert';
        initialData?: Record<string, any>;
        pkCol?: string;
        pkVal?: any;
        columns?: string[];
    }>({
        isOpen: false,
        mode: 'edit'
    });

    // Column Management (State Only)
    const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
    const [visibleColumns, setVisibleColumns] = React.useState<string[]>([]); 
    const [showColMenu, setShowColMenu] = React.useState(false);

    // Reset page, selection, sort, and filters when table changes
    React.useEffect(() => {
        setPage(1);
        setSelectedRows([]);
        setSortColumn(null);
        setSortDirection(null);
        setFilters([]);
        setNewFilter({ col: '', op: '=', val: '' });
    }, [currentDb, currentTable]);

    // 2. Fetch Table Data (RAW JSON)
    const { data: browseData, isLoading: loadingData, refetch } = useQuery({
        queryKey: ['browseRaw', currentDb, currentTable, page, limit, sortColumn, sortDirection, filters],
        queryFn: () => dbApi.browseTableRaw(currentDb!, currentTable!, page, limit, sortColumn || undefined, sortDirection || undefined, filters),
        enabled: !!currentDb && !!currentTable,
        placeholderData: keepPreviousData
    });

    // Init visible columns and smart widths on data load
    React.useEffect(() => {
        if (browseData?.columns) {
            // Only set if empty (first load)
            if (visibleColumns.length === 0) {
                setVisibleColumns(browseData.columns);
            }
            
            // Smart Width Init
            // If we haven't set widths yet, try to guess
            if (Object.keys(columnWidths).length === 0) {
                const newWidths: Record<string, number> = {};
                browseData.columns.forEach(col => {
                    // Start with name length
                    let len = col.length * 9; 
                    // Check first few rows for data length if available
                    if (browseData.rows.length > 0) {
                         const colIdx = browseData.columns.indexOf(col);
                         for (let i = 0; i < Math.min(browseData.rows.length, 5); i++) {
                             const val = String(browseData.rows[i][colIdx]);
                             len = Math.max(len, Math.min(val.length * 7, 300)); // Cap at 300px equivalent char width approx
                         }
                    }
                    newWidths[col] = Math.max(120, Math.min(len + 40, 300)); // Min 120, Max 300
                });
                setColumnWidths(newWidths);
            }
        }
    }, [browseData]);

    const handleCopyHeader = (col: string) => {
        navigator.clipboard.writeText(col);
        showToast(`Column name "${col}" copied!`, 'success');
    };

    const handleColumnResize = (col: string, width: number) => {
        setColumnWidths(prev => ({ ...prev, [col]: Math.max(50, Math.min(width, 600)) }));
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            // Cycle: ASC -> DESC -> None
            if (sortDirection === 'ASC') {
                setSortDirection('DESC');
            } else if (sortDirection === 'DESC') {
                setSortColumn(null);
                setSortDirection(null);
            }
        } else {
            setSortColumn(column);
            setSortDirection('ASC');
        }
        setPage(1); // Reset to first page on sort change
    };

    // 3. Update Cell Mutation
    const updateMutation = useMutation({
        mutationFn: (args: { column: string, value: any, pkVal: any }) => 
            dbApi.updateCell(currentDb!, currentTable!, args.column, args.value, browseData?.primary_key!, args.pkVal),
        onSuccess: () => {
            refetch();
        }
    });

    // 4. Delete Rows Mutation
    const deleteRowsMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            if (!browseData?.primary_key) throw new Error("No primary key found");
            return invoke('delete_rows', { 
                db: currentDb, 
                table: currentTable, 
                primary_key: browseData.primary_key, 
                ids 
            });
        },
        onSuccess: () => {
            setSelectedRows([]);
            refetch();
        }
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked && browseData?.rows && browseData.primary_key) {
             // Find PK index
             const pkIndex = browseData.columns.indexOf(browseData.primary_key);
             if (pkIndex === -1) return;
             
             const allIds = browseData.rows.map(r => String(r[pkIndex]));
             setSelectedRows(allIds);
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        setSelectedRows(prev => 
            checked ? [...prev, id] : prev.filter(x => x !== id)
        );
    };

    const handleDeleteSelected = () => {
        if (confirm(`Are you sure you want to delete ${selectedRows.length} rows?`)) {
            deleteRowsMutation.mutate(selectedRows);
        }
    };

    // Virtualization setup
    const tableContainerRef = React.useRef<HTMLDivElement>(null);
    
    const rowVirtualizer = useVirtualizer({
        count: browseData?.rows.length || 0,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 42, // Estimated row height
        overscan: 5,
    });

    if (!currentDb) {
        return <div className="p-8 text-center text-white/30">Select a database to browse</div>;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header / Toolbar */}
            <div className="h-14 border-b border-white/5 flex items-center px-4 justify-between bg-black/20 shrink-0">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Table2 className="text-primary" /> Browsing: 
                        <span className="opacity-50 font-normal ml-2 text-xs">SELECT * FROM</span>
                        <span className="font-bold text-primary font-mono">{currentTable}</span>
                    </h1>
                     <div className="h-4 w-px bg-white/10 mx-2"></div>
                    <button
                        onClick={() => setRowEditorState({
                            isOpen: true,
                            mode: 'insert',
                            initialData: undefined,
                            pkCol: browseData?.primary_key,
                            columns: browseData?.columns || []
                        })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md border text-text-muted border-transparent hover:bg-white/5 transition-colors"
                    >
                        <PlusCircle size={14} />
                        Insert
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md border transition-colors",
                            showFilters || filters.length > 0
                                ? "bg-primary/20 text-text-main border-primary/30"
                                : "text-text-muted border-transparent hover:bg-white/5"
                        )}
                    >
                        <FilterIcon size={14} className={filters.length > 0 ? "text-primary" : ""} />
                        Filters
                        {filters.length > 0 && (
                            <span className="bg-primary text-white text-[10px] px-1.5 rounded-full">{filters.length}</span>
                        )}
                    </button>
                    
                    {/* Columns Button & Menu */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowColMenu(!showColMenu)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md border transition-colors",
                                showColMenu
                                    ? "bg-primary/20 text-text-main border-primary/30"
                                    : "text-text-muted border-transparent hover:bg-white/5"
                            )}
                        >
                            <Layers size={14} className={showColMenu ? "text-primary" : ""} />
                            Cols
                        </button>

                        {/* Dropdown Menu (Anchored) */}
                        {showColMenu && (
                            <div className="absolute top-full right-0 mt-2 z-50 w-64 bg-surface border border-border rounded-lg shadow-2xl flex flex-col max-h-[400px] animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="p-3 border-b border-border font-bold text-xs flex justify-between items-center bg-black/10">
                                    <span>Toggle Columns</span>
                                    <button onClick={() => setShowColMenu(false)} className="hover:text-white"><X size={14} /></button>
                                </div>
                                <div className="overflow-y-auto p-2 custom-scrollbar flex flex-col gap-1">
                                        {browseData?.columns.map(col => (
                                            <label key={col} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded cursor-pointer text-xs select-none transition-colors">
                                                <input 
                                                type="checkbox" 
                                                checked={visibleColumns.includes(col)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setVisibleColumns(prev => [...prev, col]);
                                                    } else {
                                                        if (visibleColumns.length > 1) {
                                                            setVisibleColumns(prev => prev.filter(c => c !== col));
                                                        } else {
                                                            showToast("Cannot hide all columns", "error");
                                                        }
                                                    }
                                                }}
                                                className="rounded border-white/20 bg-black/20 accent-primary"
                                                />
                                                <span className={visibleColumns.includes(col) ? "text-text-main" : "text-text-muted"}>{col}</span>
                                            </label>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Pagination Controls */}
                {currentTable && (
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-white/40 font-mono">
                            {browseData?.total_rows ? (
                                <>
                                    Showing <span className="text-white/70">{Math.min((page - 1) * limit + 1, browseData.total_rows)}-{Math.min(page * limit, browseData.total_rows)}</span> of {browseData.total_rows.toLocaleString()}
                                </>
                            ) : '0 rows'}
                        </span>
                        <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-lg border border-white/5">
                            <button 
                                disabled={page === 1 || loadingData}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1 text-xs font-bold hover:bg-white/5 rounded-md disabled:opacity-20 transition-colors"
                            >Prev</button>
                            <div className="h-4 w-px bg-white/10 mx-1"></div>
                            <span className="text-xs font-bold min-w-[60px] text-center">
                                Page {page} {browseData?.total_rows ? `of ${Math.ceil(browseData.total_rows / limit)}` : ''}
                            </span>
                            <div className="h-4 w-px bg-white/10 mx-1"></div>
                            <select 
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                            >
                                {limitOptions.map(opt => <option key={opt} value={opt} className="bg-surface text-text-main">{opt}</option>)}
                            </select>
                            <div className="h-4 w-px bg-white/10 mx-1"></div>
                            <button 
                                disabled={!browseData || (page * limit >= browseData.total_rows) || loadingData}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 text-xs font-bold hover:bg-white/5 rounded-md disabled:opacity-20 transition-colors"
                            >Next</button>
                        </div>
                        {/* Show All Button */}
                        <button
                            onClick={() => {
                                setConfirmState({
                                    isOpen: true,
                                    title: <span className="flex items-center gap-2 text-yellow-500"><AlertTriangle size={20} /> Warning</span>,
                                    message: "Warning: Showing all records may cause the application to hang if there are too many rows.\n\nYou might need to restart the application if it becomes unresponsive.\n\nAre you sure you want to proceed?",
                                    onConfirm: () => {
                                        if (browseData?.total_rows) {
                                            setLimit(browseData.total_rows);
                                            setPage(1);
                                            setConfirmState(prev => ({ ...prev, isOpen: false }));
                                        }
                                    }
                                });
                            }}
                            disabled={!browseData || loadingData || limit === browseData.total_rows}
                            className="text-[10px] uppercase font-bold text-primary opacity-60 hover:opacity-100 hover:underline disabled:opacity-20 disabled:no-underline"
                        >
                            Show All
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Panel */}
            {(showFilters || filters.length > 0) && currentTable && (
                <div className="border-b border-white/5 bg-black/10 px-4 py-3 shrink-0 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-wrap gap-2 items-center mb-3">
                         {filters.length === 0 && <span className="text-xs text-text-muted italic">No active filters</span>}
                         {filters.map((f, i) => (
                             <div key={i} className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 text-text-main text-xs px-2 py-1 rounded-md">
                                 <span className="font-bold opacity-70">{f.col}</span>
                                 <span className="text-primary">{f.op}</span>
                                 <span className="font-mono bg-black/20 px-1 rounded">{f.val}</span>
                                 <button onClick={() => removeFilter(i)} className="hover:text-red-400 p-0.5"><X size={12} /></button>
                             </div>
                         ))}
                    </div>

                    {showFilters && (
                        <div className="flex items-center gap-2 max-w-2xl bg-black/20 p-2 rounded-lg border border-white/5">
                            <select 
                                className="bg-transparent text-sm border-none outline-none text-text-muted w-32 focus:text-primary font-mono"
                                value={newFilter.col}
                                onChange={e => setNewFilter({ ...newFilter, col: e.target.value })}
                            >
                                <option value="" disabled>Column</option>
                                {browseData?.columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="w-px h-4 bg-white/10"></div>
                            <select 
                                className="bg-transparent text-sm border-none outline-none text-text-muted w-20 focus:text-primary font-bold text-center"
                                value={newFilter.op}
                                onChange={e => setNewFilter({ ...newFilter, op: e.target.value })}
                            >
                                {['=', '!=', '>', '<', '>=', '<=', 'LIKE'].map(op => <option key={op} value={op}>{op}</option>)}
                            </select>
                             <div className="w-px h-4 bg-white/10"></div>
                            <input 
                                className="bg-transparent text-sm border-none outline-none text-text-main flex-1 min-w-[100px] placeholder:text-text-muted/50"
                                placeholder="Value"
                                value={newFilter.val}
                                onChange={e => setNewFilter({ ...newFilter, val: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && addFilter()}
                            />
                            <button 
                                onClick={addFilter}
                                disabled={!newFilter.col || !newFilter.val}
                                className="flex items-center gap-1 bg-primary text-white text-xs px-3 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors font-bold"
                            >
                                <PlusCircle size={14} /> Add
                            </button>
                        </div>
                    )}
                </div>
            )}



            {/* Content Area */}
            <div className="flex-1 overflow-auto">
                {/* STATE 1: Database Overview (List Tables) */}
                {!currentTable && (
                    <div className="p-8">
                         <div className="flex items-center gap-3 mb-8">
                            <h2 className="text-2xl font-bold">Tables in <span className="text-primary">{currentDb}</span></h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                        </div>
                        {loadingTables ? <Loader2 className="animate-spin text-primary" /> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {sortedTables?.map(t => (
                                    <div key={t.name} className="glass-panel p-4 flex justify-between items-center group cursor-pointer hover:border-primary/30 transition-all">
                                        <div>
                                            <div className="font-bold text-sm mb-1">{t.name}</div>
                                            <div className="text-[10px] uppercase tracking-wider opacity-40 font-bold">{t.rows?.toLocaleString()} rows • {t.size}</div>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 btn-secondary text-[10px] py-1 px-3 uppercase tracking-tighter transition-opacity">
                                            Open
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* STATE 2: Table Data (Interactive Grid) */}
                {currentTable && (
                     <div className="h-full flex flex-col">
                        {loadingData ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-4">
                                <Loader2 className="animate-spin w-10 h-10 text-primary" />
                                <span className="text-sm font-bold animate-pulse">Fetching records...</span>
                            </div>
                        ) : (
                            <div ref={tableContainerRef} className="flex-1 overflow-auto bg-canvas relative">
                                <div 
                                    style={{
                                        height: `${rowVirtualizer.getTotalSize()}px`,
                                        width: '100%',
                                        position: 'relative'
                                    }}
                                >
                                     {/* Header Sticky - needs to be separate if possible for sticky, but for virtualizer simplicity we might render it outside or absolute? 
                                         Virtualizer typical pattern is simple list.
                                         Let's put Header OUTSIDE the scroll container if we want it truly specific? 
                                         Actually, we put Header ABOVE the virtualizer map, but sticky.
                                     */}
                                     
                                     {/* Sticky Header Row */}
                                     {/* Note: In a pure virtualizer, stickiness can be tricky. We'll simplify: 
                                         Render header OUTSIDE the container in the parent, but sharing horizontal scroll is tough without a synced table.
                                         The "table-fixed" approach used previously was good but virtualizer wants divs usually. 
                                         Let's stick to the current DIV structure but make header fixed at top of view.
                                     */}
                                     
                                     {/* ACTUAL HEADER - Rendered once, sticky */}
                                     <div className="sticky top-0 z-20 flex bg-surface/95 backdrop-blur border-b border-border shadow-sm min-w-max">
                                         {browseData?.primary_key && (
                                             <>
                                                {/* Checkbox Header */}
                                                <div className="sticky left-0 z-30 flex-none w-10 p-3 flex items-center justify-center border-r border-border/50 bg-surface/95 backdrop-blur">
                                                    <input 
                                                        type="checkbox" 
                                                        className="cursor-pointer rounded border-border"
                                                        checked={browseData?.rows.length > 0 && selectedRows.length === browseData?.rows.length}
                                                        onChange={e => handleSelectAll(e.target.checked)}
                                                    />
                                                </div>
                                                {/* Actions Header */}
                                                <div className="sticky left-10 z-30 flex-none w-24 p-3 text-center text-[10px] font-bold text-text-muted border-r border-border/50 bg-surface/95 backdrop-blur uppercase tracking-wider">
                                                    Actions
                                                </div>
                                             </>
                                         )}
                                         <div className="p-3 w-12 text-center bg-black/10 text-[11px] font-bold text-text-muted border-r border-border/50">#</div>
                                         {browseData?.columns.filter(c => visibleColumns.length === 0 || visibleColumns.includes(c)).map(col => {
                                             const width = columnWidths[col] || 150;
                                             return (
                                                 <div 
                                                    key={col} 
                                                    className={cn(
                                                     "flex-none p-3 text-[11px] font-bold uppercase tracking-wider text-text-muted border-r border-border/50 truncate flex items-center gap-2 relative group select-none transition-colors",
                                                     col === browseData.primary_key && "text-primary",
                                                     sortColumn === col ? "bg-white/5 text-primary" : "hover:bg-white/5"
                                                 )}
                                                 style={{ width: `${width}px` }}
                                                 >
                                                     {/* Sort Click Area */}
                                                     <div className="flex-1 flex items-center gap-2 overflow-hidden cursor-pointer" onClick={() => handleSort(col)}>
                                                         <span className="truncate">{col}</span>
                                                         
                                                         {/* Sort Icons */}
                                                         {sortColumn === col ? (
                                                             sortDirection === 'ASC' ? <ArrowUp size={12} className="text-primary"/> : <ArrowDown size={12} className="text-primary"/> 
                                                         ) : (
                                                             <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-30 transition-opacity" />
                                                         )}
                                                     </div>

                                                     {/* Copy Icon */}
                                                     <div 
                                                        onClick={(e) => { e.stopPropagation(); handleCopyHeader(col); }} 
                                                        className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity cursor-pointer p-0.5"
                                                        title="Copy Column Name"
                                                     >
                                                         <Copy size={10} />
                                                     </div>

                                                     {col === browseData.primary_key && <Key size={10} className="text-yellow-500 shrink-0" />}
                                                     
                                                     {/* Resizer */}
                                                     <div 
                                                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            const startX = e.clientX;
                                                            const startWidth = width;
                                                            const onMove = (moveEvent: MouseEvent) => {
                                                                handleColumnResize(col, startWidth + (moveEvent.clientX - startX));
                                                            };
                                                            const onUp = () => {
                                                                document.removeEventListener('mousemove', onMove);
                                                                document.removeEventListener('mouseup', onUp);
                                                            };
                                                            document.addEventListener('mousemove', onMove);
                                                            document.addEventListener('mouseup', onUp);
                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                     />
                                                 </div>
                                             );
                                         })}
                                     </div>

                                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                        const row = browseData?.rows[virtualRow.index];
                                        if (!row) return null;

                                        const pkIndex = browseData!.primary_key ? browseData!.columns.indexOf(browseData!.primary_key) : -1;
                                        const pkVal = pkIndex >= 0 ? row[pkIndex] : null; 
                                        const rowId = pkVal ? String(pkVal) : null;
                                        const isSelected = rowId ? selectedRows.includes(rowId) : false;

                                        return (
                                            <div
                                                key={virtualRow.index}
                                                className={cn(
                                                    "absolute left-0 w-full flex text-sm hover:bg-white/5 transition-colors border-b border-border/30 min-w-max group",
                                                    isSelected && "bg-primary/10 hover:bg-primary/15"
                                                )}
                                                style={{
                                                    height: `${virtualRow.size}px`,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                    top: '40px' 
                                                }}
                                            >
                                                {/* Selection Checkbox (Sticky Left: 0) */}
                                                {browseData?.primary_key && (
                                                    <div className="sticky left-0 z-10 flex-none w-10 flex items-center justify-center border-r border-border/50">
                                                        <div className="absolute inset-0 bg-canvas" />
                                                        <div className={cn("absolute inset-0 transition-colors", isSelected ? "bg-primary/10" : "group-hover:bg-white/5")} />
                                                        <div className="relative z-10">
                                                            <input 
                                                                type="checkbox" 
                                                                className="cursor-pointer"
                                                                checked={isSelected}
                                                                onChange={e => rowId && handleSelectRow(rowId, e.target.checked)}
                                                                disabled={!rowId}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Row Actions (Sticky Left: 10 via w-10) */}
                                                {browseData?.primary_key && (
                                                    <div className="sticky left-10 z-10 flex-none w-24 flex items-center justify-center gap-1 border-r border-border/50">
                                                        <div className="absolute inset-0 bg-canvas" />
                                                        <div className={cn("absolute inset-0 transition-colors", isSelected ? "bg-primary/10" : "group-hover:bg-white/5")} />
                                                        <div className="relative z-10 flex items-center gap-1">
                                                            <button 
                                                                title="Edit" 
                                                                className="p-1 hover:text-blue-400 transition-colors"
                                                                onClick={() => {
                                                                    // Construct row object
                                                                    const rowData: Record<string, any> = {};
                                                                    browseData?.columns.forEach((c, i) => rowData[c] = row[i]);
                                                                    
                                                                    setRowEditorState({
                                                                        isOpen: true,
                                                                        mode: 'edit',
                                                                        initialData: rowData,
                                                                        pkCol: browseData?.primary_key,
                                                                        pkVal: pkVal
                                                                    });
                                                                }}
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button 
                                                                title="Insert as new row" 
                                                                className="p-1 hover:text-green-400 transition-colors"
                                                                onClick={() => {
                                                                    if (rowId) {
                                                                        const rowData: Record<string, any> = {};
                                                                        browseData?.columns.forEach((c, i) => rowData[c] = row[i]);
                                                                        
                                                                        setRowEditorState({
                                                                            isOpen: true,
                                                                            mode: 'insert',
                                                                            initialData: rowData,
                                                                            pkCol: browseData?.primary_key,
                                                                            columns: browseData?.columns || []
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    if (rowId) {
                                                                        setConfirmState({
                                                                            isOpen: true,
                                                                            title: 'Delete Row',
                                                                            message: 'Are you sure you want to permanently delete this row?',
                                                                            onConfirm: () => {
                                                                                deleteRowsMutation.mutate([rowId]);
                                                                                setConfirmState(prev => ({ ...prev, isOpen: false }));
                                                                            }
                                                                        });
                                                                    }
                                                                }} 
                                                                title="Delete" 
                                                                className="p-1 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Row Number */}
                                                <div className="flex-none w-12 p-3 text-center text-[10px] opacity-30 font-mono bg-black/5 border-r border-border/50">
                                                    {((page - 1) * limit) + virtualRow.index + 1}
                                                </div>

                                                {/* Data Cells */}
                                                {row.map((cell: any, cellIndex: number) => {
                                                    const col = browseData?.columns[cellIndex];
                                                    if (!col || (visibleColumns.length > 0 && !visibleColumns.includes(col))) return null;
                                                    
                                                    const width = columnWidths[col] || 150;
                                                    
                                                    return (
                                                        <div key={cellIndex} style={{ width: `${width}px` }} className="flex-none p-0 border-r border-border/50 truncate shrink-0 flex items-center">
                                                            <EditableCell 
                                                                value={cell} 
                                                                onSave={(val) => {
                                                                    if (pkVal !== null) {
                                                                        updateMutation.mutate({ 
                                                                            column: col, 
                                                                            value: val,
                                                                            pkVal: pkVal
                                                                        });
                                                                    }
                                                                }} 
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                                {browseData?.rows.length === 0 && (
                                    <div className="p-20 text-center text-white/10 italic">
                                        No results found in this table.
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Footer / Bulk Actions */}
                        <div className="h-12 border-t border-border bg-surface/50 flex items-center px-4 justify-between shrink-0">
                            <span className="text-xs text-text-muted">
                                {selectedRows.length > 0 ? `${selectedRows.length} rows selected` : 'No rows selected'}
                            </span>
                             {selectedRows.length > 0 && (
                                <button 
                                    onClick={() => {
                                        setConfirmState({
                                            isOpen: true,
                                            title: 'Delete Selected Rows',
                                            message: `Are you sure you want to delete ${selectedRows.length} rows?`,
                                            onConfirm: () => {
                                                deleteRowsMutation.mutate(selectedRows);
                                                setConfirmState(prev => ({ ...prev, isOpen: false }));
                                            }
                                        });
                                    }}
                                    className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-1.5 rounded transition-colors font-bold text-xs border border-red-500/20"
                                >
                                    <Trash2 size={14} />
                                    Delete Selected
                                </button>
                            )}
                        </div>
                     </div>
                )}
            </div>
            
            {/* Custom Confirm Modal */}
            {confirmState.isOpen && (
                <Modal 
                    isOpen={confirmState.isOpen} 
                    onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                    title={confirmState.title}
                    size="sm"
                >
                    <div className="p-4 flex flex-col gap-6">
                        <p className="text-sm text-text-muted">{confirmState.message}</p>
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => setConfirmState(prev => ({ ...prev, isOpen: false }))} 
                                className="px-4 py-2 rounded text-xs font-bold hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmState.onConfirm}
                                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded text-xs font-bold transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Row Editor Modal */}
            {rowEditorState.isOpen && browseData && (
                <RowEditorModal
                    isOpen={rowEditorState.isOpen}
                    onClose={() => setRowEditorState(prev => ({ ...prev, isOpen: false }))}
                    mode={rowEditorState.mode}
                    initialData={rowEditorState.initialData}
                    pkCol={rowEditorState.pkCol}
                    pkVal={rowEditorState.pkVal}
                    columns={browseData.columns}
                    onSuccess={() => refetch()}
                />
            )}
        </div>
    );
}
