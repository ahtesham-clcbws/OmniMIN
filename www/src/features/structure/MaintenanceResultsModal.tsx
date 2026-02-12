import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaintenanceResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    op: string;
    results: any[][];
}

export function MaintenanceResultsModal({ isOpen, onClose, op, results }: MaintenanceResultsModalProps) {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`${op} Results`} 
            size="xl"
        >
            <div className="space-y-4">
                <p className="text-xs opacity-50 px-1">Operation completed successfully across selected tables.</p>

                <div className="glass-table-wrapper rounded-lg overflow-hidden border border-white/10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-black/40 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-xs uppercase opacity-50 border-b border-white/10">Table</th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase opacity-50 border-b border-white/10">Op</th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase opacity-50 border-b border-white/10">Msg Type</th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase opacity-50 border-b border-white/10 text-right">Message</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {results.map((row, i) => {
                                const status = String(row[2]).toLowerCase();
                                const isOk = status === 'status' && String(row[3]).toLowerCase() === 'ok';
                                const isWarning = (status === 'warning' || status === 'error');

                                return (
                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{row[0]}</td>
                                        <td className="px-4 py-3 text-xs opacity-70">{row[1]}</td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border",
                                                isOk ? "bg-green-500/20 text-green-400 border-green-500/30" : 
                                                isWarning ? "bg-red-500/20 text-red-400 border-red-500/30" : 
                                                "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                            )}>
                                                {row[2]}
                                            </span>
                                        </td>
                                        <td className={cn(
                                            "px-4 py-3 text-xs text-right font-medium",
                                            isOk ? "text-green-400/80" : isWarning ? "text-red-400" : "opacity-70"
                                        )}>
                                            {row[3] === 'OK' ? <span className="flex items-center justify-end gap-1"><CheckCircle size={10} /> OK</span> : row[3]}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={onClose} variant="secondary" className="px-8">
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
