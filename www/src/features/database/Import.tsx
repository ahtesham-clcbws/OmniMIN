import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { dbApi } from '@/api/db';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { showToast } from '@/utils/ui';

export function Import() {
    const { currentDb } = useAppStore();
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [log, setLog] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
        }
    };

    const handleImport = async () => {
        if (!file || !currentDb) return;

        setImporting(true);
        setStatus('idle');
        setLog([]);

        try {
            const text = await file.text();
            setLog(prev => [...prev, `Read file ${file.name} (${(file.size / 1024).toFixed(2)} KB)`]);
            
            // Execute Import
            // TODO: chunking for large files if needed
            setLog(prev => [...prev, 'Executing SQL...']);
            
            await dbApi.importSql(currentDb, text);
            
            setLog(prev => [...prev, 'Import completed successfully.']);
            setStatus('success');
            showToast('Database imported successfully', 'success');
        } catch (error: any) {
            setLog(prev => [...prev, `Error: ${error.message || error}`]);
            setStatus('error');
            showToast('Import failed', 'error');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Upload className="text-primary" />
                Import into database <span className="text-primary font-mono">{currentDb}</span>
            </h1>

            <div className="grid gap-6">
                {/* File Selection */}
                <div className="bg-surface border border-border rounded-xl p-6">
                    <h2 className="font-bold mb-4">File to import</h2>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors hover:border-primary/50 relative">
                        <input 
                            type="file" 
                            accept=".sql,.txt" 
                            onChange={handleFileChange}
                            className="block w-full text-sm text-text-muted
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary file:text-primary-foreground
                                hover:file:bg-primary/90 cursor-pointer"
                        />
                        {file && (
                            <div className="flex flex-col items-center gap-2 text-primary mt-4">
                                <FileText size={32} />
                                <span className="font-bold">{file.name}</span>
                                <span className="text-xs text-text-muted">{(file.size / 1024).toFixed(2)} KB</span>
                            </div>
                        )}
                        {!file && (
                            <div className="text-xs opacity-60 mt-2">Max size depends on browser memory (approx 100MB safely).</div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                    <Button 
                        onClick={handleImport} 
                        disabled={!file || importing}
                        className="w-32"
                    >
                        {importing ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                        Import
                    </Button>
                </div>

                {/* Logs / Status */}
                {(log.length > 0 || status !== 'idle') && (
                    <div className={`bg-surface border rounded-xl p-6 ${status === 'error' ? 'border-red-500/50' : status === 'success' ? 'border-green-500/50' : 'border-border'}`}>
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            {status === 'success' && <CheckCircle className="text-green-500" size={18} />}
                            {status === 'error' && <AlertCircle className="text-red-500" size={18} />}
                            Import Status
                        </h3>
                        <div className="font-mono text-xs space-y-1 text-text-muted max-h-40 overflow-y-auto p-2 bg-black/20 rounded">
                            {log.map((l, i) => (
                                <div key={i}>{l}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
