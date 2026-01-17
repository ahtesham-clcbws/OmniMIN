
import React from 'react';
import { Shield, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/useAppStore';

export default function Privileges() {
    const { setIsUsersModalOpen } = useAppStore();

    return (
        <div className="p-12 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                <Shield size={32} />
            </div>
            <h1 className="text-2xl font-bold">Database Privileges</h1>
            <p className="text-text-muted max-w-md mx-auto">
                Manage user access and grants specific to this database. You can assign database-specific permissions in the Global User Manager.
            </p>
            
            <Button onClick={() => setIsUsersModalOpen(true)} className="gap-2">
                <UserCog size={16} />
                Open User Manager
            </Button>
        </div>
    );
}
