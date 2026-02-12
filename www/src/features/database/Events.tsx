import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, CalendarClock, Check } from 'lucide-react';
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

export function Events() {
    const { currentDb } = useAppStore();
    const queryClient = useQueryClient();
    const [editorOpen, setEditorOpen] = useState(false);
    
    // Editor State
    const [eventName, setEventName] = useState('');
    const [scheduleType, setScheduleType] = useState('EVERY'); // EVERY or AT (Simplifying to recurring for now)
    const [scheduleValue, setScheduleValue] = useState('1 DAY');
    const [status, setStatus] = useState('ENABLE');
    const [sqlBody, setSqlBody] = useState('UPDATE `mytable` SET `col` = 1');

    const { data: events, isLoading } = useQuery({
        queryKey: ['events', currentDb],
        queryFn: () => dbApi.getEvents(currentDb!),
        enabled: !!currentDb
    });

    const createMutation = useMutation({
        mutationFn: async () => {
             // Basic validation
             if(!eventName.trim()) throw new Error("Name is required");
             if(!sqlBody.trim()) throw new Error("SQL cannot be empty");
             
             let schedule = '';
             if (scheduleType === 'EVERY') {
                 schedule = `EVERY ${scheduleValue}`;
             } else {
                 throw new Error("Only recurring events supported in this UI for now");
             }

             return dbApi.createEvent(currentDb!, eventName, schedule, status, sqlBody);
        },
        onSuccess: () => {
            showToast(`Event created`, 'success');
            setEditorOpen(false);
            queryClient.invalidateQueries({ queryKey: ['events', currentDb] });
        },
        onError: (e) => showToast(String(e), 'error')
    });

    const dropMutation = useMutation({
        mutationFn: async (name: string) => {
            return dbApi.dropEvent(currentDb!, name);
        },
        onSuccess: () => {
            showToast('Event dropped', 'success');
            queryClient.invalidateQueries({ queryKey: ['events', currentDb] });
        },
        onError: (e) => showToast(String(e), 'error')
    });

    const handleCreate = () => {
        setEventName('');
        setScheduleType('EVERY');
        setScheduleValue('1 DAY');
        setStatus('ENABLE');
        setSqlBody('UPDATE `table` SET ...');
        setEditorOpen(true);
    };

    if (!currentDb) return null;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-4 border-b border-border bg-surface/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <CalendarClock className="text-orange-400" />
                    <h2 className="text-lg font-bold">Events</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-border/50 text-text-muted">{events?.length || 0}</span>
                </div>
                <Button size="sm" onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Create Event
                </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="text-center p-8 opacity-50">Loading events...</div>
                ) : events?.length === 0 ? (
                    <div className="text-center p-12 border border-dashed border-border rounded-lg text-text-muted">
                        No scheduled events found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events?.map((e: any) => (
                            <div key={e.name} className="glass-panel p-4 flex flex-col gap-3 group relative hover:border-orange-400/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            e.status === 'ENABLED' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500 opacity-50"
                                        )} />
                                        <h3 className="font-bold text-primary truncate" title={e.name}>{e.name}</h3>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" 
                                            onClick={() => {
                                                if(confirm(`Drop event '${e.name}'?`)) dropMutation.mutate(e.name);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-xs text-text-muted opacity-80 flex flex-col gap-1 mt-auto font-mono bg-black/20 p-2 rounded">
                                    {e.schedule}
                                </div>
                                <div className="flex justify-between text-[10px] text-text-muted">
                                    <span>Last: {e.starts || '-'}</span>
                                    <span className="opacity-50">{e.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold text-text-muted">Name</label>
                            <input 
                                className="col-span-3 h-8 rounded border border-border bg-background px-3 text-xs outline-none focus:border-primary/50"
                                value={eventName}
                                onChange={e => setEventName(e.target.value)}
                                placeholder="my_daily_cleanup"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold text-text-muted">Schedule</label>
                            <div className="col-span-3 flex gap-2">
                                <div className="bg-border/30 px-3 flex items-center text-xs font-bold rounded">EVERY</div>
                                <input 
                                    className="flex-1 h-8 rounded border border-border bg-background px-3 text-xs outline-none focus:border-primary/50"
                                    value={scheduleValue}
                                    onChange={e => setScheduleValue(e.target.value)}
                                    placeholder="1 DAY"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold text-text-muted">Status</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="col-span-3 h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ENABLE">ENABLE</SelectItem>
                                    <SelectItem value="DISABLE">DISABLE</SelectItem>
                                    <SelectItem value="DISABLE ON SLAVE">DISABLE ON SLAVE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <label className="text-right text-xs font-bold text-text-muted pt-2">DO</label>
                            <div className="col-span-3 h-32 border border-border rounded overflow-hidden">
                                <textarea 
                                    className="w-full h-full p-2 bg-transparent outline-none resize-none text-xs font-mono custom-scrollbar"
                                    value={sqlBody}
                                    onChange={e => setSqlBody(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
                        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                            {createMutation.isPending && <Check className="w-4 h-4 mr-2 animate-spin" />}
                            Create Event
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
