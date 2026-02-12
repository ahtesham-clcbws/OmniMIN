import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Zap, Check } from 'lucide-react';
import { showToast } from '@/utils/ui';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppStore } from '@/stores/useAppStore';

export function Triggers() {
    const { currentDb } = useAppStore();
    const queryClient = useQueryClient();
    const [editorOpen, setEditorOpen] = useState(false);
    
    // Editor State
    const [triggerName, setTriggerName] = useState('');
    const [table, setTable] = useState('');
    const [timing, setTiming] = useState('BEFORE');
    const [event, setEvent] = useState('INSERT');
    const [sqlBody, setSqlBody] = useState('BEGIN\n    -- Your trigger logic\nEND');

    // Fetch Tables for Selector
    const { data: tables } = useQuery({
        queryKey: ['tables', currentDb],
        queryFn: () => dbApi.getTables(currentDb!),
        enabled: !!currentDb
    });

    const { data: triggers, isLoading } = useQuery({
        queryKey: ['triggers', currentDb],
        queryFn: () => dbApi.getTriggers(currentDb!),
        enabled: !!currentDb
    });

    const createMutation = useMutation({
        mutationFn: async () => {
             if(!triggerName.trim()) throw new Error("Name is required");
             if(!table) throw new Error("Table is required");
             if(!sqlBody.trim()) throw new Error("SQL cannot be empty");
             
             return dbApi.createTrigger(currentDb!, triggerName, table, timing, event, sqlBody);
        },
        onSuccess: () => {
            showToast(`Trigger created`, 'success');
            setEditorOpen(false);
            queryClient.invalidateQueries({ queryKey: ['triggers', currentDb] });
        },
        onError: (e) => showToast(String(e), 'error')
    });

    const dropMutation = useMutation({
        mutationFn: async (name: string) => {
            return dbApi.dropTrigger(currentDb!, name);
        },
        onSuccess: () => {
            showToast('Trigger dropped', 'success');
            queryClient.invalidateQueries({ queryKey: ['triggers', currentDb] });
        },
        onError: (e) => showToast(String(e), 'error')
    });

    const handleCreate = () => {
        setTriggerName('');
        setTable(tables?.[0]?.name || '');
        setTiming('BEFORE');
        setEvent('INSERT');
        setSqlBody('BEGIN\n    -- Trigger logic here\nEND');
        setEditorOpen(true);
    };

    if (!currentDb) return null;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-4 border-b border-border bg-surface/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Zap className="text-yellow-400" />
                    <h2 className="text-lg font-bold">Triggers</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-border/50 text-text-muted">{triggers?.length || 0}</span>
                </div>
                <Button size="sm" onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Create Trigger
                </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="text-center p-8 opacity-50">Loading triggers...</div>
                ) : triggers?.length === 0 ? (
                    <div className="text-center p-12 border border-dashed border-border rounded-lg text-text-muted">
                        No triggers found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {triggers?.map((t: any) => (
                            <div key={t.name} className="glass-panel p-4 flex flex-col gap-3 group relative hover:border-yellow-400/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                                            t.timing === 'BEFORE' ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                                        )}>
                                            {t.timing}
                                        </span>
                                        <h3 className="font-bold text-primary truncate" title={t.name}>{t.name}</h3>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" 
                                            onClick={() => {
                                                if(confirm(`Drop trigger '${t.name}'?`)) dropMutation.mutate(t.name);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-xs text-text-muted flex flex-col gap-0.5 mt-auto">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-text-main">{t.event}</span>
                                        <span className="opacity-50">ON</span>
                                        <span className="font-mono text-yellow-400">{t.table}</span>
                                    </div>
                                    <div className="opacity-40 text-[10px]">{t.created}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Create Trigger</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold text-text-muted">Name</label>
                            <input 
                                className="col-span-3 h-8 rounded border border-border bg-background px-3 text-xs outline-none focus:border-primary/50"
                                value={triggerName}
                                onChange={e => setTriggerName(e.target.value)}
                                placeholder="before_insert_users"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold text-text-muted">Table</label>
                            <Select value={table} onValueChange={setTable}>
                                <SelectTrigger className="col-span-3 h-8">
                                    <SelectValue placeholder="Select table" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tables?.map((t: any) => (
                                        <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold text-text-muted">Timing</label>
                            <div className="col-span-3 flex gap-2">
                                <Select value={timing} onValueChange={setTiming}>
                                    <SelectTrigger className="flex-1 h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BEFORE">BEFORE</SelectItem>
                                        <SelectItem value="AFTER">AFTER</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={event} onValueChange={setEvent}>
                                    <SelectTrigger className="flex-1 h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INSERT">INSERT</SelectItem>
                                        <SelectItem value="UPDATE">UPDATE</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <label className="text-right text-xs font-bold text-text-muted pt-2">Body</label>
                            <div className="col-span-3 h-32 border border-border rounded overflow-hidden">
                                <textarea 
                                    className="w-full h-full p-2 bg-transparent outline-none resize-none text-xs font-mono custom-scrollbar"
                                    value={sqlBody}
                                    onChange={e => setSqlBody(e.target.value)}
                                    spellCheck={false}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
                        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                            {createMutation.isPending && <Check className="w-4 h-4 mr-2 animate-spin" />}
                            Create Trigger
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
