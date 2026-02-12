import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ArrowRight, Loader2, Link as LinkIcon } from 'lucide-react';
import { showToast } from '@/utils/ui';
import { cn } from '@/lib/utils';
import { invoke } from '@tauri-apps/api/core';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface RelationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    db: string;
    table: string;
}

const ACTION_OPTIONS = ["RESTRICT", "CASCADE", "SET NULL", "NO ACTION"];

export function RelationsModal({ isOpen, onClose, db, table }: RelationsModalProps) {
    const queryClient = useQueryClient();
    const [view, setView] = useState<'LIST' | 'ADD'>('LIST');

    // Form State
    const [constraintName, setConstraintName] = useState('');
    const [column, setColumn] = useState('');
    const [refDb, setRefDb] = useState(db);
    const [refTable, setRefTable] = useState('');
    const [refColumn, setRefColumn] = useState('');
    const [onDelete, setOnDelete] = useState('RESTRICT');
    const [onUpdate, setOnUpdate] = useState('RESTRICT');

    // Queries
    const { data: foreignKeys, isLoading: rLoading } = useQuery({
        queryKey: ['foreign_keys', db, table],
        queryFn: () => dbApi.getForeignKeys(db, table),
        enabled: isOpen && view === 'LIST'
    });

    const { data: columns } = useQuery({
        queryKey: ['columns', db, table],
        queryFn: () => dbApi.getColumns(db, table),
        enabled: isOpen
    });

    const { data: databases } = useQuery({
        queryKey: ['databases'],
        queryFn: () => dbApi.getDatabases(),
        enabled: isOpen && view === 'ADD'
    });

    const { data: refTables } = useQuery({
        queryKey: ['tables', refDb],
        queryFn: () => dbApi.getTables(refDb),
        enabled: isOpen && view === 'ADD' && !!refDb
    });

    const { data: refColumns } = useQuery({
        queryKey: ['columns', refDb, refTable],
        queryFn: () => dbApi.getColumns(refDb, refTable),
        enabled: isOpen && view === 'ADD' && !!refDb && !!refTable
    });

    // Mutations
    const addMutation = useMutation({
        mutationFn: async () => {
           await invoke('add_foreign_key', {
                db, 
                table,
                name: constraintName || undefined, // Allow empty for database auto-name
                column,
                ref_db: refDb,
                ref_table: refTable,
                ref_column: refColumn,
                on_delete: onDelete,
                on_update: onUpdate
           });
        },
        onSuccess: () => {
            showToast('Constraint added successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['foreign_keys', db, table] });
            queryClient.invalidateQueries({ queryKey: ['structure', db, table] }); // To update key icons
            setView('LIST');
            resetForm();
        },
        onError: (e) => showToast(String(e), 'error')
    });

    const dropMutation = useMutation({
        mutationFn: async (name: string) => {
            await invoke('drop_foreign_key', { db, table, name });
        },
        onSuccess: () => {
            showToast('Constraint dropped', 'success');
            queryClient.invalidateQueries({ queryKey: ['foreign_keys', db, table] });
            queryClient.invalidateQueries({ queryKey: ['structure', db, table] });
        },
         onError: (e) => showToast(String(e), 'error')
    });

    const resetForm = () => {
        setConstraintName('');
        setColumn('');
        setRefDb(db);
        setRefTable('');
        setRefColumn('');
        setOnDelete('RESTRICT');
        setOnUpdate('RESTRICT');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-primary" /> 
                        Relation View: <span className="text-muted-foreground">{db}.{table}</span>
                    </DialogTitle>
                </DialogHeader>

                {view === 'LIST' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold opacity-70">Foreign Key Constraints</h3>
                            <Button size="sm" onClick={() => setView('ADD')}>
                                <Plus className="w-4 h-4 mr-2" /> Add Constraint
                            </Button>
                        </div>

                        {rLoading ? (
                            <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
                        ) : foreignKeys?.length === 0 ? (
                            <div className="p-12 text-center border border-dashed border-white/10 rounded-lg text-muted-foreground">
                                No foreign keys defined for this table.
                            </div>
                        ) : (
                            <div className="glass-panel overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-black/20 text-xs uppercase font-bold text-white/50">
                                        <tr>
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Column</th>
                                            <th className="p-3">Reference (Table.Col)</th>
                                            <th className="p-3">On Delete</th>
                                            <th className="p-3">On Update</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {foreignKeys?.map((fk, i) => (
                                            <tr key={i} className="hover:bg-white/5">
                                                <td className="p-3 font-mono text-xs opacity-70">{fk.name}</td>
                                                <td className="p-3 font-bold text-primary">{fk.column}</td>
                                                <td className="p-3 flex items-center gap-2">
                                                    <span className="text-blue-400">{fk.ref_table}</span>
                                                    <span className="opacity-30">.</span>
                                                    <span className="text-yellow-400">{fk.ref_column}</span>
                                                    {fk.ref_db !== db && <span className="text-[10px] opacity-40 ml-2">({fk.ref_db})</span>}
                                                </td>
                                                <td className="p-3 text-xs opacity-60 font-mono">{fk.on_delete}</td>
                                                <td className="p-3 text-xs opacity-60 font-mono">{fk.on_update}</td>
                                                <td className="p-3 text-right">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                                        onClick={() => {
                                                            if (confirm(`Drop constraint ${fk.name}?`)) dropMutation.mutate(fk.name);
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                             {/* Source */}
                             <div className="space-y-4 p-4 border border-white/10 rounded-lg bg-white/5">
                                <h4 className="font-bold text-primary mb-4 border-b border-white/5 pb-2">Local Table</h4>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase opacity-70">Constraint Name (Optional)</label>
                                    <input 
                                        className="w-full p-2 bg-black/20 border border-white/10 rounded text-sm" 
                                        placeholder="fk_name (auto-generated)"
                                        value={constraintName}
                                        onChange={e => setConstraintName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase opacity-70">Column</label>
                                    <Select value={column} onValueChange={setColumn}>
                                        <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                                        <SelectContent>
                                            {columns?.map(c => (
                                                <SelectItem key={c.field} value={c.field}>{c.field} <span className="opacity-50 text-[10px] ml-2">{c.data_type}</span></SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>

                             {/* Target */}
                             <div className="space-y-4 p-4 border border-white/10 rounded-lg bg-white/5 relative">
                                <div className="absolute top-1/2 -left-4 -translate-y-1/2 z-10 bg-surface rounded-full p-1 border border-white/10">
                                    <ArrowRight className="w-4 h-4 opacity-50" />
                                </div>
                                <h4 className="font-bold text-blue-400 mb-4 border-b border-white/5 pb-2">Foreign Reference</h4>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase opacity-70">Database</label>
                                    <Select value={refDb} onValueChange={setRefDb}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {databases?.map(d => (
                                                <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase opacity-70">Table</label>
                                    <Select value={refTable} onValueChange={setRefTable} disabled={!refDb}>
                                        <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
                                        <SelectContent>
                                            {refTables?.map(t => (
                                                <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase opacity-70">Column</label>
                                    <Select value={refColumn} onValueChange={setRefColumn} disabled={!refTable}>
                                        <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                                        <SelectContent>
                                            {refColumns?.map(c => (
                                                <SelectItem key={c.field} value={c.field}>{c.field} <span className="opacity-50 text-[10px] ml-2">{c.data_type}</span></SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>
                        </div>

                        {/* Rules */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase opacity-70">On Delete</label>
                                <Select value={onDelete} onValueChange={setOnDelete}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ACTION_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase opacity-70">On Update</label>
                                <Select value={onUpdate} onValueChange={setOnUpdate}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ACTION_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                            <Button variant="ghost" onClick={() => setView('LIST')}>Cancel</Button>
                            <Button 
                                onClick={() => addMutation.mutate()} 
                                disabled={!column || !refTable || !refColumn || addMutation.isPending}
                            >
                                {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Add Constraint
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
