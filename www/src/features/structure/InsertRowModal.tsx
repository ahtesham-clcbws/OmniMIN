import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { InsertRowForm } from './InsertRowForm';

interface Column {
    Field: string;
    Type: string;
    Null: string;
    Key: string;
    Default: string | null;
    Extra: string;
}

interface InsertRowModalProps {
    isOpen: boolean;
    onClose: () => void;
    db: string;
    table: string;
    columns: Column[]; 
    onSuccess: () => void;
}

export function InsertRowModal({ isOpen, onClose, db, table, columns, onSuccess }: InsertRowModalProps) {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Insert into ${table}`}
            size="xl"
        >
            <div className="h-[70vh]">
                <InsertRowForm 
                    db={db}
                    table={table}
                    columns={columns}
                    onSuccess={() => { onSuccess(); onClose(); }}
                    onCancel={onClose}
                />
            </div>
        </Modal>
    );
}
