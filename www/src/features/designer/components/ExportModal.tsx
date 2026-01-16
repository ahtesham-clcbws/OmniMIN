import React from 'react';
import { Download, Copy, X } from 'lucide-react';
import { showToast } from '@/utils/ui';

interface ExportModalProps {
    exportResult: string | null;
    exportFormat: 'sql' | 'laravel' | 'prisma' | 'typescript';
    onClose: () => void;
    onFormatChange: (format: 'sql' | 'laravel' | 'prisma' | 'typescript') => void;
    onRegenerate: () => void;
}

export function ExportModal({ exportResult, exportFormat, onClose, onFormatChange, onRegenerate }: ExportModalProps) {
    if (!exportResult) return null;

    return (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Download size={18} className="text-blue-400" /> Export Schema
                    </h3>
                    <div className="flex gap-2">
                        <select 
                            className="bg-black/20 border border-white/10 rounded px-3 py-1 text-sm outline-none focus:border-blue-500"
                            value={exportFormat}
                            onChange={(e) => onFormatChange(e.target.value as any)}
                        >
                            <option value="sql">SQL (Create Table)</option>
                            <option value="laravel">Laravel (Migration & Model)</option>
                            <option value="typescript">TypeScript (Interfaces)</option>
                            <option value="prisma">Prisma (Schema)</option>
                        </select>
                        <button 
                            onClick={onRegenerate}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs uppercase font-bold tracking-wider"
                        >
                            Regenerate
                        </button>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X size={20} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-[#020617]">
                    <pre className="font-mono text-xs text-blue-100 whitespace-pre-wrap selection:bg-blue-500/30">{exportResult}</pre>
                </div>
                <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-white/5">
                        <button 
                        onClick={() => {
                            navigator.clipboard.writeText(exportResult!);
                            showToast("Copied to clipboard");
                        }}
                        className="btn-secondary flex items-center gap-2"
                        >
                        <Copy size={16} /> Copy to Clipboard
                        </button>
                        <button onClick={onClose} className="btn-secondary">Close</button>
                </div>
            </div>
        </div>
    );
}
