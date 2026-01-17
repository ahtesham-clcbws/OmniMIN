
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/useAppStore';
import { invoke } from '@tauri-apps/api/core';
import { showToast } from '@/utils/ui';
import { Layers, CalendarClock, Trash2, Plus, RefreshCw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';

interface EventInfo {
    name: string;
    schedule: string;
    status: string; // ENABLED, DISABLED, SLAVESIDE_DISABLED
    starts: string | null;
    ends: string | null;
}

export default function Events() {
    const { currentDb } = useAppStore();
    const queryClient = useQueryClient();

    const { data: events, isLoading } = useQuery({
        queryKey: ['events', currentDb],
        queryFn: async () => {
            if (!currentDb) return [];
            return await invoke<EventInfo[]>('get_events', { db: currentDb });
        },
        enabled: !!currentDb
    });

    const dropMutation = useMutation({
        mutationFn: async (name: string) => {
            return await invoke('drop_event', { db: currentDb, name });
        },
        onSuccess: () => {
            showToast('Event dropped successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
        onError: (err: any) => {
            showToast(`Failed to drop event: ${err}`, 'error');
        }
    });

    if (isLoading) {
        return <div className="p-8 text-center opacity-50">Loading events...</div>;
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
             {/* Toolbar */}
             <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <CalendarClock size={16} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold text-white/90">Events Scheduler</h1>
                        <span className="text-[10px] text-white/50 uppercase tracking-wider font-mono">
                            {events?.length || 0} Events
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['events'] })}>
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                    <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-500 text-white border-0">
                        <Plus size={14} /> Create Event
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-6">
                {(!events || events.length === 0) ? (
                    <div className="text-center opacity-40 py-20">
                        <CalendarClock size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No events found in this database.</p>
                    </div>
                ) : (
                    <div className="border border-white/10 rounded-lg overflow-hidden bg-black/20">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-xs uppercase font-medium text-white/50">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Schedule</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Starts</th>
                                <th className="p-3">Ends</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {events.map((e) => (
                                <tr key={e.name} className="group hover:bg-white/5 transition-colors">
                                    <td className="p-3 font-medium text-purple-300">
                                        {e.name}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1.5 opacity-80 font-mono text-xs">
                                            {e.schedule}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`
                                            px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
                                            ${e.status === 'ENABLED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                                            ${e.status === 'DISABLED' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : ''}
                                            ${e.status === 'SLAVESIDE_DISABLED' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''}
                                        `}>
                                            {e.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs opacity-60 font-mono">{e.starts || '-'}</td>
                                    <td className="p-3 text-xs opacity-60 font-mono">{e.ends || '-'}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    if (confirm(`Drop event "${e.name}"?`)) {
                                                        dropMutation.mutate(e.name);
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
