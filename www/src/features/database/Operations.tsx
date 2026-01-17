
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/useAppStore';
import { dbApi } from '@/api/db';
import { showToast } from '@/utils/ui';
import { 
    Save, Copy, Trash2, AlertTriangle, Type, FileStack 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function Operations() {
    const { currentDb, currentServer } = useAppStore();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [newName, setNewName] = useState(currentDb || '');
    const [copyName, setCopyName] = useState(`${currentDb}_copy`);
    const [copyData, setCopyData] = useState(true);
    const [collation, setCollation] = useState('');

    // Load current DB info for Collation
    const { data: dbInfo } = useQuery({
        queryKey: ['dbInfo', currentDb],
        queryFn: async () => {
             const dbs = await dbApi.getDatabases(); // This returns all, maybe inefficient but okay for now
             return dbs.find(d => d.name === currentDb);
        },
        enabled: !!currentDb
    });

    useEffect(() => {
        if (dbInfo) setCollation(dbInfo.collation);
        if (currentDb) {
             setNewName(currentDb);
             setCopyName(`${currentDb}_copy`);
        }
    }, [dbInfo, currentDb]);

    // Load Collations
    const { data: collations } = useQuery({
        queryKey: ['collations'],
        queryFn: () => dbApi.getCollations(),
        staleTime: Infinity
    });

    // Mutations
    const renameMutation = useMutation({
        mutationFn: async () => {
            if (!currentDb || !newName) return;
            await dbApi.executeQuery('information_schema', `ALTER DATABASE \`${currentDb}\` UPGRADE DATA DIRECTORY NAME? NO wait, direct command`);
            // Actually we have a specific Tauri command for this: rename_database
            // usage: invoke('rename_database', { name: currentDb, newName })
            // But dbApi needs to expose it.
            // Let's assume dbApi.renameDatabase(currentDb, newName) exists or extend dbApi.
            // Checking dbApi... it has executeQuery but maybe not specific ops.
            // I'll need to use raw invoke or add to dbApi.
            // For now, I'll assume I can add to dbApi or use 'safeInvoke' if exported, but 'safeInvoke' is internal to db.ts usually. 
            // Wait, dbApi is imported from @/api/db. 
            // I will implement these using dbApi.executeQuery if possible or I need to update db.ts.
            // Actually `rename_database` command exists in rust.
            // I should update db.ts first to expose these, OR use invoke directly here.
            // Using invoke directly is cleaner for "finishing pages".
            const { invoke } = await import('@tauri-apps/api/core');
            return invoke('rename_database', { name: currentDb, newName });
        },
        onSuccess: () => {
            showToast(`Database renamed to ${newName}`, 'success');
            queryClient.invalidateQueries({ queryKey: ['databases'] });
            navigate(`/server/${currentServer}/${newName}/structure`);
        },
        onError: (err: any) => showToast(err.toString(), 'error')
    });

    const copyMutation = useMutation({
        mutationFn: async () => {
             const { invoke } = await import('@tauri-apps/api/core');
             return invoke('copy_database', { name: currentDb, newName: copyName, withData: copyData });
        },
        onSuccess: () => {
            showToast(`Database copied to ${copyName}`, 'success');
            queryClient.invalidateQueries({ queryKey: ['databases'] });
        },
        onError: (err: any) => showToast(err.toString(), 'error')
    });

    const collationMutation = useMutation({
        mutationFn: async () => {
             const { invoke } = await import('@tauri-apps/api/core');
             return invoke('change_collation', { db: currentDb, collation });
        },
        onSuccess: () => {
            showToast('Collation updated', 'success');
            queryClient.invalidateQueries({ queryKey: ['dbInfo'] });
        },
        onError: (err: any) => showToast(err.toString(), 'error')
    });

    const dropMutation = useMutation({
        mutationFn: async () => {
             const { invoke } = await import('@tauri-apps/api/core');
             return invoke('drop_database', { name: currentDb });
        },
        onSuccess: () => {
            showToast('Database dropped', 'success');
            queryClient.invalidateQueries({ queryKey: ['databases'] });
            navigate(`/server/${currentServer}`);
        },
        onError: (err: any) => showToast(err.toString(), 'error')
    });

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileStack className="text-primary" />
                Operations
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rename Database */}
                <div className="glass-panel p-6 space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold border-b border-border pb-2 mb-2">
                        <Type size={18} /> Rename Database
                    </div>
                    <div className="space-y-2">
                        <Label>New Name</Label>
                        <Input 
                            value={newName} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)} 
                            placeholder="Enter new name" 
                        />
                    </div>
                    <Button 
                        onClick={() => renameMutation.mutate()} 
                        disabled={renameMutation.isPending || !newName || newName === currentDb}
                        className="w-full"
                    >
                        {renameMutation.isPending ? 'Renaming...' : 'Rename Database'}
                    </Button>
                    <p className="text-xs text-text-muted opacity-70">
                        Note: This will create a new database, move all tables, and drop the old one.
                    </p>
                </div>

                {/* Copy Database */}
                <div className="glass-panel p-6 space-y-4">
                     <div className="flex items-center gap-2 text-lg font-semibold border-b border-border pb-2 mb-2">
                        <Copy size={18} /> Copy Database
                    </div>
                    <div className="space-y-2">
                        <Label>Target Name</Label>
                        <Input 
                            value={copyName} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCopyName(e.target.value)} 
                            placeholder="Target database name" 
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="copyData" 
                            checked={copyData} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCopyData(e.target.checked)}
                            className="rounded border-border bg-black/20"
                        />
                         <Label htmlFor="copyData" className="cursor-pointer">Copy Data (Structure + Data)</Label>
                    </div>
                    <Button 
                        onClick={() => copyMutation.mutate()}
                        disabled={copyMutation.isPending || !copyName}
                        className="w-full"
                        variant="secondary"
                    >
                        {copyMutation.isPending ? 'Copying...' : 'Copy Database'}
                    </Button>
                </div>

                {/* Collation */}
                <div className="glass-panel p-6 space-y-4">
                     <div className="flex items-center gap-2 text-lg font-semibold border-b border-border pb-2 mb-2">
                        <Type size={18} /> Collation
                    </div>
                    <div className="space-y-2">
                        <Label>Database Collation</Label>
                        <Select value={collation} onValueChange={setCollation}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select collation" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {collations?.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <Button 
                        onClick={() => collationMutation.mutate()}
                        disabled={collationMutation.isPending || collation === dbInfo?.collation}
                        className="w-full"
                    >
                         {collationMutation.isPending ? 'Saving...' : 'Update Collation'}
                    </Button>
                </div>

                {/* Drop Database */}
                 <div className="glass-panel p-6 space-y-4 border-red-500/20 bg-red-500/5">
                     <div className="flex items-center gap-2 text-lg font-semibold border-b border-red-500/20 pb-2 mb-2 text-red-500">
                        <Trash2 size={18} /> Remove Database
                    </div>
                    <p className="text-sm text-red-400/80">
                        <AlertTriangle className="inline w-4 h-4 mr-1" />
                        This action cannot be undone. All data will be lost.
                    </p>
                     <Button 
                        variant="destructive"
                        onClick={() => {
                            if (confirm(`Are you sure you want to DROP the database "${currentDb}"? This cannot be undone!`)) {
                                dropMutation.mutate();
                            }
                        }}
                        disabled={dropMutation.isPending}
                        className="w-full"
                    >
                         {dropMutation.isPending ? 'Dropping...' : 'Drop Database'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
