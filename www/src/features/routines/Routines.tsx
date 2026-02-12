import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, FileCode, Check, Copy } from 'lucide-react';
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

interface RoutinesProps {
    db: string;
}

export function Routines() {
    const { currentDb } = useAppStore();
    const queryClient = useQueryClient();
    const [editorOpen, setEditorOpen] = useState(false);
    
    // Editor State
    const [editMode, setEditMode] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [originalName, setOriginalName] = useState('');
    const [routineType, setRoutineType] = useState<'PROCEDURE' | 'FUNCTION'>('PROCEDURE');
    const [editorSql, setEditorSql] = useState('');
    const [routineName, setRoutineName] = useState(''); // Only for CREATE display helpfulness, not strictly used in save if SQL is manual

    const { data: routines, isLoading } = useQuery({
        queryKey: ['routines', currentDb],
        queryFn: () => dbApi.getRoutines(currentDb!),
        enabled: !!currentDb
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
             // Basic validation
             if(!editorSql.trim()) throw new Error("SQL cannot be empty");
             return dbApi.saveRoutine(currentDb!, editMode === 'EDIT' ? originalName : '', routineType, editorSql);
        },
        onSuccess: () => {
            showToast(`Routine ${editMode === 'CREATE' ? 'created' : 'updated'}`, 'success');
            setEditorOpen(false);
            queryClient.invalidateQueries({ queryKey: ['routines', currentDb] });
        },
        onError: (e) => showToast(String(e), 'error')
    });

    const dropMutation = useMutation({
        mutationFn: async ({ name, type }: { name: string, type: string }) => {
            return dbApi.dropRoutine(currentDb!, name, type as any);
        },
        onSuccess: () => {
            showToast('Routine dropped', 'success');
            queryClient.invalidateQueries({ queryKey: ['routines', currentDb] });
        },
        onError: (e) => showToast(String(e), 'error')
    });

    const handleCreate = () => {
        setEditMode('CREATE');
        setOriginalName('');
        setRoutineType('PROCEDURE');
        setEditorSql(`CREATE PROCEDURE \`new_procedure\`()\nBEGIN\n    -- Your code here\n    SELECT 1;\nEND`);
        setEditorOpen(true);
    };

    const handleEdit = async (r: any) => {
        try {
            const def = await dbApi.getRoutineDefinition(currentDb!, r.name, r.routine_type);
            setEditMode('EDIT');
            setOriginalName(r.name);
            setRoutineType(r.routine_type);
            setEditorSql(def);
            setEditorOpen(true);
        } catch (e) {
            showToast("Failed to fetch definition", "error");
        }
    };

    if (!currentDb) return null;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-4 border-b border-border bg-surface/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FileCode className="text-purple-400" />
                    <h2 className="text-lg font-bold">Routines</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-border/50 text-text-muted">{routines?.length || 0}</span>
                </div>
                <Button size="sm" onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Create Routine
                </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="text-center p-8 opacity-50">Loading routines...</div>
                ) : routines?.length === 0 ? (
                    <div className="text-center p-12 border border-dashed border-border rounded-lg text-text-muted">
                        No routines found in this database.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {routines?.map((r: any) => (
                            <div key={r.name} className="glass-panel p-4 flex flex-col gap-3 group relative hover:border-purple-400/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                                            r.routine_type === 'PROCEDURE' ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                                        )}>
                                            {r.routine_type.substring(0, 4)}
                                        </span>
                                        <h3 className="font-bold text-primary truncate" title={r.name}>{r.name}</h3>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-purple-400" onClick={() => handleEdit(r)}>
                                            <Edit size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" 
                                            onClick={() => {
                                                if(confirm(`Drop ${r.routine_type} '${r.name}'?`)) dropMutation.mutate({ name: r.name, type: r.routine_type });
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-xs text-text-muted opacity-60 flex flex-col gap-1 mt-auto">
                                    {r.data_type && <div>Returns: <span className="text-yellow-400 font-mono">{r.data_type}</span></div>}
                                    <div className="flex justify-between">
                                        <span>Updated: {r.last_altered}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editMode === 'CREATE' ? 'Create New Routine' : `Edit ${originalName}`}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden pt-4">
                         {editMode === 'CREATE' && (
                             <div className="flex gap-4">
                                <Select value={routineType} onValueChange={(v: any) => {
                                    setRoutineType(v);
                                    // Update template if it looks like a template
                                    if (editorSql.includes('CREATE PROCEDURE') || editorSql.includes('CREATE FUNCTION')) {
                                         if (v === 'FUNCTION') {
                                             setEditorSql(`CREATE FUNCTION \`new_function\`() RETURNS INT\nBEGIN\n    RETURN 1;\nEND`);
                                         } else {
                                             setEditorSql(`CREATE PROCEDURE \`new_procedure\`()\nBEGIN\n    SELECT 1;\nEND`);
                                         }
                                    }
                                }}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PROCEDURE">PROCEDURE</SelectItem>
                                        <SelectItem value="FUNCTION">FUNCTION</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>
                         )}

                         <div className="flex-1 border border-border rounded-md overflow-hidden relative font-mono text-sm bg-black/20">
                            <textarea 
                                className="w-full h-full p-4 bg-transparent outline-none resize-none custom-scrollbar"
                                value={editorSql}
                                onChange={e => setEditorSql(e.target.value)}
                                spellCheck={false}
                            />
                         </div>
                         <p className="text-xs text-text-muted opacity-60">
                             Enter the full CREATE statement. If editing, modify the definition directly. 
                             The system will handle DROP IF EXISTS for updates.
                         </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
                        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                            {saveMutation.isPending && <Check className="w-4 h-4 mr-2 animate-spin" />}
                            Save Routine
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
