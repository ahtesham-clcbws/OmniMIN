import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDropModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (disableFkChecks: boolean) => void;
    tables: string[];
    type: 'DROP' | 'TRUNCATE';
    isPending: boolean;
}

export function ConfirmDropModal({ isOpen, onClose, onConfirm, tables, type, isPending }: ConfirmDropModalProps) {
    const [disableFk, setDisableFk] = React.useState(false);

    if (!isOpen) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={type === 'DROP' ? 'Confirm Drop' : 'Confirm Truncate'} 
            size="md"
        >
            <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200">
                    <AlertTriangle className="shrink-0 text-red-500" size={20} />
                    <div className="text-sm">
                        <p className="font-bold">This action cannot be undone.</p>
                        <p className="opacity-80 mt-1">
                            You are about to <span className="font-bold">{type}</span> the following {tables.length} table(s):
                        </p>
                        <ul className="list-disc list-inside mt-2 font-mono text-xs opacity-70 max-h-32 overflow-y-auto">
                            {tables.map(t => (
                                <li key={t}>{t}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-stone-900/40">
                    <input 
                        type="checkbox" 
                        id="disable-fk" 
                        className="rounded border-border bg-black/20"
                        checked={disableFk}
                        onChange={(e) => setDisableFk(e.target.checked)}
                    />
                    <label htmlFor="disable-fk" className="text-sm select-none cursor-pointer text-text-muted hover:text-text-main transition-colors">
                        Disable Foreign Key Checks
                        <span className="block text-[10px] opacity-50">Useful iftables have relationships preventing deletion.</span>
                    </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
                    <Button 
                        variant="destructive" 
                        onClick={() => onConfirm(disableFk)}
                        disabled={isPending}
                        className="gap-2"
                    >
                        {isPending ? 'Processing...' : `Yes, ${type === 'DROP' ? 'Drop' : 'Truncate'}`}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
