import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { invoke } from '@tauri-apps/api/core';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Plus, Trash2, Copy, Save, Loader2, Key } from 'lucide-react';

interface Column {
    Field: string;
    Type: string;
    Null: string;
    Key: string;
    Default: string | null;
    Extra: string;
}

interface InsertRowFormProps {
    db: string;
    table: string;
    columns: Column[];
    onSuccess: () => void;
    onCancel?: () => void;
}

export function InsertRowForm({ db, table, columns, onSuccess, onCancel }: InsertRowFormProps) {
    const { show } = useNotificationStore();
    const [rows, setRows] = useState<Record<string, string>[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [rowsToAdd, setRowsToAdd] = useState(1);

    // Initialize with two empty rows by default for better UX
    useEffect(() => {
        if (rows.length === 0) {
            addNewRow();
            addNewRow();
        }
    }, [columns]);

    const addNewRow = (count = 1) => {
        const newRows: Record<string, string>[] = [];
        for (let i = 0; i < count; i++) {
            const newRow: Record<string, string> = {};
            columns.forEach(col => {
                if (col.Default !== null) {
                    newRow[col.Field] = col.Default;
                } else if (col.Extra.includes('auto_increment')) {
                    newRow[col.Field] = ''; 
                } else {
                     newRow[col.Field] = '';
                }
            });
            newRows.push(newRow);
        }
        setRows(prev => [...prev, ...newRows]);
    };

    const duplicateRow = (index: number) => {
        const rowToCopy = { ...rows[index] };
        columns.forEach(col => {
            if (col.Extra.includes('auto_increment')) {
                rowToCopy[col.Field] = ''; 
            }
        });
        setRows(prev => [...prev, rowToCopy]);
    };

    const removeRow = (index: number) => {
        if (rows.length <= 1) return;
        setRows(prev => prev.filter((_, i) => i !== index));
    };

    const updateValue = (rowIndex: number, field: string, value: string) => {
        setRows(prev => {
            const newRows = [...prev];
            newRows[rowIndex] = { ...newRows[rowIndex], [field]: value };
            return newRows;
        });
    };

    const getInputType = (sqlType: string) => {
        const lower = sqlType.toLowerCase();
        if (lower.includes('int') || lower.includes('decimal') || lower.includes('float') || lower.includes('double')) return 'number';
        if (lower.includes('date') || lower.includes('time')) return 'text';
        return 'text';
    };

    const isLongText = (sqlType: string) => {
         const lower = sqlType.toLowerCase();
         return lower.includes('text') || lower.includes('blob') || lower.includes('json');
    }

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await invoke('insert_rows', {
                db,
                table,
                rows
            });
            
            show(`Successfully inserted ${rows.length} row(s) into ${table}`, 'success');
            onSuccess();
        } catch (error) {
            show(`Failed to insert rows: ${error}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-main rounded-lg border border-border">
             <div className="p-4 border-b border-border bg-black/10 flex justify-between items-center">
                <h2 className="font-bold text-lg">Insert Rows into `{table}`</h2>
                <div className="text-xs opacity-50">Inserting {rows.length} rows</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="border border-border rounded-lg overflow-hidden bg-surface/50 shadow-sm transition-all hover:bg-surface/80">
                        <div className="bg-surface border-b border-border p-3 flex justify-between items-center">
                            <span className="font-bold text-sm text-text-muted">Row #{rowIndex + 1}</span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => duplicateRow(rowIndex)}
                                    className="p-1.5 hover:bg-white/10 rounded-md text-text-muted hover:text-primary transition-colors"
                                    title="Copy Row"
                                >
                                    <Copy size={14} />
                                </button>
                                {rows.length > 1 && (
                                    <button 
                                        onClick={() => removeRow(rowIndex)}
                                        className="p-1.5 hover:bg-white/10 rounded-md text-text-muted hover:text-red-500 transition-colors"
                                        title="Remove Row"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {columns.map(col => (
                                <div key={col.Field} className="space-y-1">
                                    <label className="text-[11px] font-bold text-text-muted flex justify-between items-center uppercase tracking-wider">
                                        <span title={col.Field} className="truncate max-w-[150px]">{col.Field}</span>
                                        <span className="opacity-40 font-normal lowercase ml-2 text-[9px] border border-white/5 px-1 rounded">{col.Type}</span>
                                    </label>
                                    
                                    {isLongText(col.Type) ? (
                                        <textarea
                                            className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-primary min-h-[80px] font-mono focus:bg-black/40 transition-colors"
                                            value={row[col.Field] || ''}
                                            onChange={(e) => updateValue(rowIndex, col.Field, e.target.value)}
                                            placeholder={col.Null === 'YES' ? 'NULL' : ''}
                                        />
                                    ) : (
                                        <input
                                            type={getInputType(col.Type)}
                                            className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-primary font-mono focus:bg-black/40 transition-colors"
                                            value={row[col.Field] || ''}
                                            onChange={(e) => updateValue(rowIndex, col.Field, e.target.value)}
                                            placeholder={col.Null === 'YES' ? 'NULL' : ''}
                                        />
                                    )}
                                    <div className="flex justify-between text-[9px] opacity-40">
                                        <span>{col.Extra}</span>
                                        {col.Key && <Key size={10} className="text-yellow-500" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-border bg-surface flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        min="1" 
                        max="100" 
                        value={rowsToAdd} 
                        onChange={(e) => setRowsToAdd(parseInt(e.target.value) || 1)}
                        className="w-16 bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-center outline-none focus:border-primary"
                    />
                    <Button variant="ghost" onClick={() => addNewRow(rowsToAdd)} className="gap-2 text-primary hover:bg-primary/10">
                        <Plus size={16} /> Add {rowsToAdd} Row(s)
                    </Button>
                </div>
                <div className="flex gap-2">
                     {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
                     <Button onClick={handleSubmit} disabled={isLoading} className="gap-2 font-bold px-6">
                         {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                         Insert Rows
                     </Button>
                </div>
            </div>
        </div>
    );
}
