import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/useAppStore';
import { dbApi } from '@/api/db';
import { showToast } from '@/utils/ui';
import { 
    Save, Copy, Trash2, AlertTriangle, Type, Settings2, Table2, ArrowRightLeft, Database
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoke } from '@tauri-apps/api/core';
import { MaintenanceResultsModal } from './MaintenanceResultsModal';

export default function TableOperations() {
    const { serverId, dbName, tableName } = useParams();
    const { currentDb } = useAppStore();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [newName, setNewName] = useState(tableName || '');
    const [targetDb, setTargetDb] = useState(dbName || '');
    const [copyName, setCopyName] = useState(`${tableName}_copy`);
    const [copyDb, setCopyDb] = useState(dbName || '');
    const [copyType, setCopyType] = useState<'structure' | 'data'>('data');
    
    // Maintenance Results State
    const [maintenanceResults, setMaintenanceResults] = useState<{ op: string, data: any[][] } | null>(null);

    const { data: databases } = useQuery({
        queryKey: ['databases'],
        queryFn: () => dbApi.getDatabases(),
    });

    const { data: tableInfo } = useQuery({
        queryKey: ['tableStatus', dbName, tableName],
        queryFn: async () => {
             const tables = await dbApi.getTables(dbName!);
             return tables.find(t => t.name === tableName);
        },
        enabled: !!dbName && !!tableName
    });

    useEffect(() => {
        if (tableName) {
            setNewName(tableName);
            setCopyName(`${tableName}_copy`);
        }
        if (dbName) {
            setTargetDb(dbName);
            setCopyDb(dbName);
        }
    }, [dbName, tableName]);

    // Mutations
    const renameMutation = useMutation({
        mutationFn: async () => {
             return invoke('rename_table', { db: dbName, table: tableName, newName, newDb: targetDb });
        },
        onSuccess: () => {
            showToast(`Table renamed to ${newName}`, 'success');
            queryClient.invalidateQueries({ queryKey: ['tables', dbName] });
            if (targetDb !== dbName) {
                navigate(`/server/${serverId}/${targetDb}/structure`);
            } else {
                navigate(`/server/${serverId}/${dbName}/table/${newName}/operations`);
            }
        },
        onError: (err) => showToast(String(err), 'error')
    });

    const copyMutation = useMutation({
        mutationFn: async () => {
             return invoke('copy_table', { 
                db: dbName, 
                table: tableName, 
                newDb: copyDb, 
                newTable: copyName, 
                withData: copyType === 'data' 
             });
        },
        onSuccess: () => {
            showToast(`Table copied to ${copyName}`, 'success');
            queryClient.invalidateQueries({ queryKey: ['tables', copyDb] });
        },
        onError: (err) => showToast(String(err), 'error')
    });

    const maintenanceMutation = useMutation({
        mutationFn: async (op: string) => {
             const res = await dbApi.runMaintenance(dbName!, [tableName!], op as any);
             return { op, data: res.rows };
        },
        onSuccess: (res) => {
            setMaintenanceResults(res);
        },
        onError: (err) => showToast(String(err), 'error')
    });

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto custom-scrollbar h-full pb-20">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings2 className="text-primary" />
                Table Operations: <span className="text-primary/70">{tableName}</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rename / Move */}
                <div className="glass-panel p-6 space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold border-b border-border pb-2 mb-2">
                        <ArrowRightLeft size={18} className="text-primary" /> Rename / Move Table
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-1">
                            <Label>Target Database</Label>
                            <Select value={targetDb} onValueChange={setTargetDb}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select DB" />
                                </SelectTrigger>
                                <SelectContent>
                                    {databases?.map(db => (
                                        <SelectItem key={db.name} value={db.name}>{db.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 col-span-1">
                            <Label>New Name</Label>
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </div>
                    </div>
                    <Button 
                        onClick={() => renameMutation.mutate()} 
                        disabled={renameMutation.isPending || (newName === tableName && targetDb === dbName)}
                        className="w-full"
                    >
                        {renameMutation.isPending ? 'Renaming...' : 'Rename / Move'}
                    </Button>
                </div>

                {/* Copy Table */}
                <div className="glass-panel p-6 space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold border-b border-border pb-2 mb-2">
                        <Copy size={18} className="text-primary" /> Copy Table
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-1">
                            <Label>Target Database</Label>
                            <Select value={copyDb} onValueChange={setCopyDb}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select DB" />
                                </SelectTrigger>
                                <SelectContent>
                                    {databases?.map(db => (
                                        <SelectItem key={db.name} value={db.name}>{db.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 col-span-1">
                            <Label>Target Name</Label>
                            <Input value={copyName} onChange={(e) => setCopyName(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex gap-4">
                         <div className="flex items-center gap-2">
                            <input type="radio" id="s1" checked={copyType === 'structure'} onChange={() => setCopyType('structure')} />
                            <Label htmlFor="s1" className="text-xs cursor-pointer">Structure only</Label>
                         </div>
                         <div className="flex items-center gap-2">
                            <input type="radio" id="s2" checked={copyType === 'data'} onChange={() => setCopyType('data')} />
                            <Label htmlFor="s2" className="text-xs cursor-pointer">Structure and data</Label>
                         </div>
                    </div>
                    <Button 
                        onClick={() => copyMutation.mutate()} 
                        disabled={copyMutation.isPending || !copyName}
                        variant="secondary"
                        className="w-full"
                    >
                        {copyMutation.isPending ? 'Copying...' : 'Copy Table'}
                    </Button>
                </div>

                {/* Table Options (Engine/Collation) */}
                <div className="glass-panel p-6 space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold border-b border-border pb-2 mb-2">
                        <Table2 size={18} className="text-primary" /> Table Options
                    </div>
                    <div className="grid grid-cols-2 gap-4 opacity-50 pointer-events-none">
                         <div className="space-y-2">
                            <Label>Storage Engine</Label>
                            <Input value={tableInfo?.engine || 'InnoDB'} disabled />
                         </div>
                         <div className="space-y-2">
                            <Label>Collation</Label>
                            <Input value={tableInfo?.collation || ''} disabled />
                         </div>
                    </div>
                    <p className="text-[10px] italic opacity-50 text-center">Engine/Collation modifications coming in v0.2</p>
                </div>

                {/* Maintenance */}
                <div className="glass-panel p-6 space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold border-b border-border pb-2 mb-2">
                        <Settings2 size={18} className="text-primary" /> Maintenance
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => maintenanceMutation.mutate('CHECK')}>Check Table</Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => maintenanceMutation.mutate('ANALYZE')}>Analyze Table</Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => maintenanceMutation.mutate('REPAIR')}>Repair Table</Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => maintenanceMutation.mutate('OPTIMIZE')}>Optimize Table</Button>
                    </div>
                </div>

                {/* Truncate / Drop */}
                <div className="glass-panel p-6 space-y-4 border-red-500/20 bg-red-500/5 col-span-full">
                    <div className="flex items-center gap-2 text-lg font-semibold border-b border-red-500/10 pb-2 mb-2 text-red-500">
                        <Trash2 size={18} /> Danger Zone
                    </div>
                    <div className="flex gap-4">
                        <Button 
                            variant="destructive" 
                            className="flex-1 gap-2"
                            onClick={() => {
                                if (confirm(`Are you sure you want to EMPTY "${tableName}"?`)) {
                                    invoke('truncate_table', { db: dbName, table: tableName })
                                        .then(() => showToast('Table truncated', 'success'))
                                        .catch(e => showToast(String(e), 'error'));
                                }
                            }}
                        >
                            <Trash2 size={16} /> Empty Table (TRUNCATE)
                        </Button>
                        <Button 
                            variant="destructive" 
                            className="flex-1 gap-2"
                            onClick={() => {
                                if (confirm(`Are you sure you want to DROP "${tableName}"? THIS IS PERMANENT.`)) {
                                    invoke('execute_query', { db: dbName, sql: `DROP TABLE \`${tableName}\`` })
                                        .then(() => {
                                            showToast('Table dropped', 'success');
                                            navigate(`/server/${serverId}/${dbName}/structure`);
                                        })
                                        .catch(e => showToast(String(e), 'error'));
                                }
                            }}
                        >
                            <AlertTriangle size={16} /> Drop Table (DROP)
                        </Button>
                    </div>
                </div>
            </div>

            {maintenanceResults && (
                <MaintenanceResultsModal 
                    isOpen={!!maintenanceResults}
                    onClose={() => setMaintenanceResults(null)}
                    op={maintenanceResults.op}
                    results={maintenanceResults.data}
                />
            )}
        </div>
    );
}
