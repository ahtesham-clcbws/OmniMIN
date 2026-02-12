import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Key, Loader2 } from 'lucide-react';
import { showToast } from '@/utils/ui';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppStore } from '@/stores/useAppStore';

interface IndexesProps {
    table: string;
}

export function Indexes({ table }: IndexesProps) {
    const { currentDb } = useAppStore();
    const queryClient = useQueryClient();
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Create State
    const [newIndexName, setNewIndexName] = useState('');
    const [indexType, setIndexType] = useState('INDEX'); // INDEX, UNIQUE, FULLTEXT, SPATIAL
    const [selectedCols, setSelectedCols] = useState<string[]>([]);

    // Fetch Indexes
    const { data: indexes, isLoading } = useQuery({
        queryKey: ['indexes', currentDb, table],
        queryFn: () => dbApi.getIndexes(currentDb!, table),
        enabled: !!currentDb && !!table
    });

    // Fetch Columns for Selector
    const { data: columns } = useQuery({
        queryKey: ['tableColumns', currentDb, table],
        queryFn: async () => {
             const res = await dbApi.getColumns(currentDb!, table);
             return res;
        }
    });

    const dropMutation = useMutation({
        mutationFn: async (name: string) => {
            return dbApi.dropIndex(currentDb!, table, name);
        },
        onSuccess: () => {
            showToast('Index dropped', 'success');
            queryClient.invalidateQueries({ queryKey: ['indexes', currentDb, table] });
        },
        onError: (e) => showToast(String(e), 'error')
    });

    const addMutation = useMutation({
        mutationFn: async () => {
             if (!newIndexName && indexType !== 'PRIMARY') throw new Error("Index name required");
             if (selectedCols.length === 0) throw new Error("Select at least one column");

             return dbApi.addIndex(currentDb!, table, newIndexName, selectedCols, indexType === 'INDEX' ? '' : indexType);
        },
        onSuccess: () => {
            showToast('Index added', 'success');
            setCreateModalOpen(false);
            setNewIndexName('');
            setSelectedCols([]);
            queryClient.invalidateQueries({ queryKey: ['indexes', currentDb, table] });
        },
        onError: (e) => showToast(String(e), 'error')
    });

    const toggleColumn = (col: string) => {
        if (selectedCols.includes(col)) {
            setSelectedCols(selectedCols.filter(c => c !== col));
        } else {
            setSelectedCols([...selectedCols, col]);
        }
    };

    if (isLoading) return <div className="p-4 text-xs opacity-50"><Loader2 className="animate-spin inline w-3 h-3 mr-1"/> Loading indexes...</div>;

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-md border-border bg-black/10">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <Key size={14} className="text-yellow-500" /> Indexes
                </h3>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setCreateModalOpen(true)}>
                    <Plus size={12} className="mr-1" /> Add Index
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-border/50 text-text-muted opacity-70">
                            <th className="p-2 w-32">Key Name</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Columns</th>
                            <th className="p-2 w-20">Unique</th>
                            <th className="p-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {indexes?.map((idx: any) => (
                            <tr key={`${idx.name}-${idx.column}`} className="group hover:bg-white/5">
                                <td className="p-2 font-mono text-primary font-bold">{idx.name}</td>
                                <td className="p-2 opacity-70">{idx.index_type}</td>
                                <td className="p-2 font-mono text-xm">{idx.column}</td>
                                <td className="p-2">
                                    {!idx.non_unique ? (
                                        <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded uppercase">Unique</span>
                                    ) : <span className="opacity-30">-</span>}
                                </td>
                                <td className="p-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                        onClick={() => {
                                            if (confirm(`Drop index '${idx.name}'?`)) dropMutation.mutate(idx.name);
                                        }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {indexes?.length === 0 && (
                             <tr><td colSpan={5} className="p-4 text-center opacity-50 italic">No indexes defined</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Index to {table}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Type</Label>
                            <Select value={indexType} onValueChange={setIndexType}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INDEX">INDEX (Standard)</SelectItem>
                                    <SelectItem value="UNIQUE">UNIQUE</SelectItem>
                                    <SelectItem value="FULLTEXT">FULLTEXT</SelectItem>
                                    <SelectItem value="SPATIAL">SPATIAL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Name</Label>
                            <Input 
                                className="col-span-3" 
                                value={newIndexName} 
                                onChange={e => setNewIndexName(e.target.value)}
                                placeholder="idx_column_name"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <Label className="text-right pt-2">Columns</Label>
                            <div className="col-span-3 h-40 overflow-y-auto border border-border rounded p-2 bg-black/20">
                                {columns?.map((col: any) => (
                                    <div 
                                        key={col.field} 
                                        className={cn(
                                            "flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-white/5 mb-1",
                                            selectedCols.includes(col.field) && "bg-primary/20 text-primary"
                                        )}
                                        onClick={() => toggleColumn(col.field)}
                                    >
                                        <div className={cn(
                                            "w-3 h-3 border rounded border-border flex items-center justify-center",
                                            selectedCols.includes(col.field) && "bg-primary border-primary"
                                        )}>
                                            {selectedCols.includes(col.field) && <div className="w-1.5 h-1.5 bg-white rounded-full"/>}
                                        </div>
                                        <span className="text-xs font-mono">{col.field}</span>
                                        <span className="text-[10px] opacity-40 ml-auto">{col.data_type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-[10px] opacity-50 text-right">Click columns in order (Composite supported)</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
                            {addMutation.isPending ? <Loader2 className="animate-spin w-4 h-4"/> : "Add Index"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
