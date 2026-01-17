
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/useAppStore';
import { invoke } from '@tauri-apps/api/core';
import { showToast } from '@/utils/ui';
import { Zap, Trash2, Plus, RefreshCw, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TriggerInfo {
    name: string;
    event: string;   // INSERT, UPDATE, DELETE
    table: string;
    timing: string;  // BEFORE, AFTER
    created: string | null;
}

export default function Triggers() {
    const { currentDb } = useAppStore();
    const queryClient = useQueryClient();

    const { data: triggers, isLoading } = useQuery({
        queryKey: ['triggers', currentDb],
        queryFn: async () => {
            if (!currentDb) return [];
            return await invoke<TriggerInfo[]>('get_triggers', { db: currentDb });
        },
        enabled: !!currentDb
    });

    const dropMutation = useMutation({
        mutationFn: async (name: string) => {
            return await invoke('drop_trigger', { db: currentDb, name });
        },
        onSuccess: () => {
            showToast('Trigger dropped successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['triggers'] });
        },
        onError: (err: any) => {
            showToast(`Failed to drop trigger: ${err}`, 'error');
        }
    });

    if (isLoading) {
        return <div className="p-8 text-center opacity-50">Loading triggers...</div>;
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
             {/* Toolbar */}
             <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <Zap size={16} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold text-white/90">Triggers Manager</h1>
                        <span className="text-[10px] text-white/50 uppercase tracking-wider font-mono">
                            {triggers?.length || 0} Triggers
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['triggers'] })}>
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                    <Button size="sm" className="gap-2 bg-orange-600 hover:bg-orange-500 text-white border-0">
                        <Plus size={14} /> Create Trigger
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-6">
                {(!triggers || triggers.length === 0) ? (
                    <div className="text-center opacity-40 py-20">
                         <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mb-6">
                            <Zap size={32} />
                        </div>
                        <p>No triggers found in this database.</p>
                    </div>
                ) : (
                    <div className="border border-white/10 rounded-lg overflow-hidden bg-black/20">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-xs uppercase font-medium text-white/50">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Table</th>
                                <th className="p-3">Timing</th>
                                <th className="p-3">Event</th>
                                <th className="p-3">Created</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {triggers.map((t) => (
                                <tr key={t.name} className="group hover:bg-white/5 transition-colors">
                                    <td className="p-3 font-medium text-orange-300">
                                        {t.name}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1.5 opacity-80">
                                            <Table2 size={12} className="opacity-50" />
                                            {t.table}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`
                                            px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
                                            ${t.timing === 'BEFORE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}
                                        `}>
                                            {t.timing}
                                        </span>
                                    </td>
                                     <td className="p-3">
                                        <span className={`
                                            px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
                                            ${t.event === 'INSERT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                                            ${t.event === 'UPDATE' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : ''}
                                            ${t.event === 'DELETE' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                                        `}>
                                            {t.event}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs opacity-60 font-mono">{t.created ? new Date(t.created).toLocaleDateString() : '-'}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    if (confirm(`Drop trigger "${t.name}"?`)) {
                                                        dropMutation.mutate(t.name);
                                                    }
                                                }}
                                                className="p-1.5 hover:bg-red-500/10 text-red-400 rounded hover:text-red-300 transition-colors"
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
                )}
            </div>
        </div>
    );
}
