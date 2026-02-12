import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { dbApi } from '@/api/db';
import { useAppStore } from '@/stores/useAppStore';
import { showToast } from '@/utils/ui';

interface RowEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'edit' | 'insert';
    initialData?: Record<string, any>; // For edit or copy
    pkCol?: string; // Needed for edit to identify row
    pkVal?: any; // Needed for edit
    columns: string[]; // List of all columns
    onSuccess: () => void;
}

export function RowEditorModal({ isOpen, onClose, mode, initialData, pkCol, pkVal, columns, onSuccess }: RowEditorModalProps) {
    const { currentDb, currentTable } = useAppStore();
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);

    // Initialize form data
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setFormData({ ...initialData });
            } else if (mode === 'insert') {
                 // If Insert (Copy), we use initialData but we might want to clear auto-inc PK
                 // For now, just pre-fill. User can edit.
                 if (initialData) {
                     const copy = { ...initialData };
                     if (pkCol) {
                         // Suggest clearing PK for copy? usually handled by users or auto-inc logic. 
                         // We'll leave it populated as "Copy", user typically changes it.
                     }
                     setFormData(copy);
                 } else {
                     // Empty insert
                     const empty: Record<string, any> = {};
                     columns.forEach(c => empty[c] = null);
                     setFormData(empty);
                 }
            }
        }
    }, [isOpen, mode, initialData, columns]);

    const handleSave = async () => {
        if (!currentDb || !currentTable) return;
        setLoading(true);
        try {
            if (mode === 'edit') {
                if (!pkCol) throw new Error("Primary Key required for editing");
                // For edit, we only send changed fields? Or all? sending all is safer for "Row Edit".
                // But efficient web apps might send diff. However, native 'update_row' expects map.
                await dbApi.updateRow(currentDb, currentTable, formData, pkCol, pkVal);
                showToast('Row updated successfully', 'success');
            } else {
                // Insert
                // Need to filter out null PK if auto-increment? 
                // We send what's in the form.
                // We pass array of rows (single row here)
                // Filter undefined values to NULL or handle logic
                
                // For "Copy", usually we want to OMIT the Primary Key if it's auto-increment so DB generates a new one.
                // But we don't know Schema here easily (unless we fetch it). 
                // For MVP, we send all. If user didn't change PK, it might error "Duplicate Entry". 
                await dbApi.insertRows(currentDb, currentTable, [formData]);
                showToast('Row inserted successfully', 'success');
            }
            onSuccess();
            onClose();
        } catch (e: any) {
            console.error(e);
            showToast(e.message || 'Error saving row', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (col: string, val: string) => {
        setFormData(prev => ({ ...prev, [col]: val }));
    };

    const handleNullToggle = (col: string, isNull: boolean) => {
        setFormData(prev => ({ ...prev, [col]: isNull ? null : '' }));
    };

    if (!isOpen) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={mode === 'edit' ? "Edit Row" : "Insert Row"} 
            size="lg"
        >
            <div className="flex flex-col gap-4 max-h-[70vh]">
                <div className="overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                    {columns.map(col => {
                        const val = formData[col];
                        const isNull = val === null;
                        const isPk = col === pkCol;

                        return (
                            <div key={col} className="flex flex-col gap-1 p-3 border border-white/5 rounded bg-black/20">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-primary">{col} {isPk && <span className="text-yellow-500 ml-1 text-[9px] uppercase border border-yellow-500/30 px-1 rounded">PK</span>}</label>
                                    <label className="flex items-center gap-1 text-[10px] cursor-pointer opacity-70 hover:opacity-100">
                                        <input 
                                            type="checkbox" 
                                            checked={isNull} 
                                            onChange={(e) => handleNullToggle(col, e.target.checked)}
                                            className="rounded border-white/20 bg-black/40"
                                        />
                                        NULL
                                    </label>
                                </div>
                                {!isNull ? (
                                    <textarea 
                                        className="bg-black/40 border border-white/10 rounded p-2 text-sm font-mono min-h-[60px] outline-none focus:border-primary/50"
                                        value={String(val ?? '')}
                                        onChange={e => handleChange(col, e.target.value)}
                                        placeholder={`Value for ${col}`}
                                    />
                                ) : (
                                    <div className="h-[60px] bg-black/10 border border-white/5 rounded flex items-center justify-center text-xs text-white/20 italic">
                                        NULL
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded hover:bg-white/5 text-sm">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin w-4 h-4" />}
                        {mode === 'edit' ? 'Save Changes' : 'Insert Row'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
