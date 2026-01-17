import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/utils/ui';

export function CreateTableModal() {
    const { currentDb, setShowCreateTableModal } = useAppStore();
    const queryClient = useQueryClient();
    const [tableName, setTableName] = useState('');

    const createTableMutation = useMutation({
        mutationFn: async () => {
             // Create with a default ID column for now
             const sql = `CREATE TABLE \`${tableName}\` (id INT AUTO_INCREMENT PRIMARY KEY)`;
             return dbApi.executeQuery(currentDb!, sql);
        },
        onSuccess: () => {
            showToast(`Table '${tableName}' created successfully`, 'success');
            queryClient.invalidateQueries({ queryKey: ['tables', currentDb] });
            setShowCreateTableModal(false);
            setTableName('');
        },
        onError: (err) => {
            showToast('Failed to create table: ' + err, 'error');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tableName.trim()) return;
        createTableMutation.mutate();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold">Create New Table</h2>
                    <button onClick={() => setShowCreateTableModal(false)} className="text-text-muted hover:text-text-main transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted">Table Name</label>
                        <input 
                            type="text"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g., users"
                            autoFocus
                        />
                        <p className="text-[10px] text-text-muted opacity-60">Creates a table with a default 'id' primary key column.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowCreateTableModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!tableName.trim() || createTableMutation.isPending}>
                            {createTableMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                            Create Table
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
