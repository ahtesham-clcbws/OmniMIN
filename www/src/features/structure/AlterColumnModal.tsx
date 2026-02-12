import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Loader2, Info } from 'lucide-react';
import { dbApi } from '@/api/db';
import { showToast } from '@/utils/ui';
import { useAppStore } from '@/stores/useAppStore';
import { invoke } from '@tauri-apps/api/core';

interface ColumnDefinition {
    name: string;
    original_name?: string;
    data_type: string;
    length?: string;
    default?: string;
    is_nullable: boolean;
    auto_increment: boolean;
    is_primary: boolean;
    is_unique: boolean;
    comment?: string;
    after?: string;
}

interface AlterColumnModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'ADD' | 'MODIFY';
    columnData?: any; // Existing column data if MODIFY
    table: string;
    onSuccess?: () => void;
}

export function AlterColumnModal({ isOpen, onClose, mode, columnData, table, onSuccess }: AlterColumnModalProps) {
    const { currentDb } = useAppStore();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<ColumnDefinition>({
        name: '',
        data_type: 'VARCHAR',
        length: '255',
        default: '',
        is_nullable: true,
        auto_increment: false,
        is_primary: false,
        is_unique: false,
        comment: '',
        after: ''
    });

    useEffect(() => {
        if (isOpen && mode === 'MODIFY' && columnData) {
            // Map existing data (ColumnInfo from backend) to form
            // Backend keys: field, data_type, collation, null, key, default, extra
            
            // Extract type and length from data_type string "varchar(255)"
            const typeMatch = columnData.data_type.match(/^([a-z]+)(?:\((.+)\))?/i);
            const type = typeMatch ? typeMatch[1].toUpperCase() : 'VARCHAR';
            const len = typeMatch ? typeMatch[2] : '';

            setFormData({
                name: columnData.field,
                original_name: columnData.field,
                data_type: type,
                length: len,
                default: columnData.default || '',
                is_nullable: columnData.null === 'YES',
                auto_increment: columnData.extra.includes('auto_increment'),
                is_primary: columnData.key === 'PRI',
                is_unique: columnData.key === 'UNI',
                comment: '', // Comment field missing in get_columns return struct, might need update later
                after: '' // Default to no position change
            });
        } else if (isOpen && mode === 'ADD') {
            setFormData({
                name: '',
                data_type: 'VARCHAR',
                length: '255',
                default: '',
                is_nullable: true,
                auto_increment: false,
                is_primary: false,
                is_unique: false,
                comment: '',
                after: ''
            });
        }
    }, [isOpen, mode, columnData]);

    const mutation = useMutation({
        mutationFn: async (data: ColumnDefinition) => {
            if (mode === 'ADD') {
                return invoke('add_column', { db: currentDb, table, col: data });
            } else {
                return invoke('modify_column', { db: currentDb, table, col: data });
            }
        },
        onSuccess: () => {
            showToast(`Column ${mode === 'ADD' ? 'added' : 'modified'} successfully`, 'success');
            queryClient.invalidateQueries({ queryKey: ['structure', currentDb, table] });
            if (onSuccess) onSuccess();
            onClose();
        },
        onError: (err) => {
            showToast(String(err), 'error');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const handleChange = (field: keyof ColumnDefinition, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-surface/50">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        {mode === 'ADD' ? 'Add Column' : 'Modify Column'}
                        <span className="text-xs font-mono opacity-50 bg-white/5 py-0.5 px-2 rounded">{table}</span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted">Column Name</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name}
                                onChange={e => handleChange('name', e.target.value)}
                                className="w-full bg-black/20 border border-border rounded p-2 text-sm outline-none focus:border-primary"
                                placeholder="column_name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted">Key</label>
                             <div className="flex items-center gap-4 h-9">
                                <label className="flex items-center gap-2 cursor-pointer text-sm hover:text-primary">
                                    <input 
                                        type="checkbox"
                                        checked={formData.is_primary}
                                        onChange={e => handleChange('is_primary', e.target.checked)}
                                        className="rounded border-border"
                                    />
                                    Primary
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm hover:text-primary">
                                    <input 
                                        type="checkbox"
                                        checked={formData.is_unique}
                                        onChange={e => handleChange('is_unique', e.target.checked)}
                                        className="rounded border-border"
                                    />
                                    Unique
                                </label>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted">Type</label>
                            <select 
                                value={formData.data_type}
                                onChange={e => handleChange('data_type', e.target.value)}
                                className="w-full bg-black/20 border border-border rounded p-2 text-sm outline-none focus:border-primary"
                            >
                                <option value="INT">INT</option>
                                <option value="VARCHAR">VARCHAR</option>
                                <option value="TEXT">TEXT</option>
                                <option value="DATE">DATE</option>
                                <option value="DATETIME">DATETIME</option>
                                <option value="BOOLEAN">BOOLEAN</option>
                                <option value="DECIMAL">DECIMAL</option>
                                <option value="JSON">JSON</option>
                                <option value="BIGINT">BIGINT</option>
                                <option value="TINYINT">TINYINT</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted">Length / Values</label>
                            <input 
                                type="text" 
                                value={formData.length || ''}
                                onChange={e => handleChange('length', e.target.value)}
                                className="w-full bg-black/20 border border-border rounded p-2 text-sm outline-none focus:border-primary"
                                placeholder="255"
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted">Default</label>
                            <input 
                                type="text" 
                                value={formData.default || ''}
                                onChange={e => handleChange('default', e.target.value)}
                                className="w-full bg-black/20 border border-border rounded p-2 text-sm outline-none focus:border-primary"
                                placeholder="NULL or value"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-2">
                            <label className="text-xs font-bold uppercase text-text-muted">Attributes</label>
                            <div className="flex items-center gap-6 h-9">
                                <label className="flex items-center gap-2 cursor-pointer text-sm hover:text-primary">
                                    <input 
                                        type="checkbox"
                                        checked={formData.is_nullable}
                                        onChange={e => handleChange('is_nullable', e.target.checked)}
                                        className="rounded border-border"
                                    />
                                    Nullable (NULL)
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm hover:text-primary">
                                    <input 
                                        type="checkbox"
                                        checked={formData.auto_increment}
                                        onChange={e => handleChange('auto_increment', e.target.checked)}
                                        className="rounded border-border"
                                    />
                                    Auto Increment (AI)
                                </label>
                            </div>
                        </div>
                         <div className="space-y-2">
                            {/* Positioning could go here later */}
                        </div>
                    </div>

                    <div className="space-y-2">
                         <label className="text-xs font-bold uppercase text-text-muted">Comments</label>
                         <input 
                            type="text" 
                            value={formData.comment || ''}
                            onChange={e => handleChange('comment', e.target.value)}
                            className="w-full bg-black/20 border border-border rounded p-2 text-sm outline-none focus:border-primary"
                            placeholder="Column description..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                         <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 rounded text-text-muted hover:bg-white/5 transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={mutation.isPending}
                            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded shadow-lg shadow-primary/20 transition-all flex items-center gap-2 text-sm font-bold"
                        >
                            {mutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                            Save Column
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
