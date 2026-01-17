import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { ChevronRight, Home, Database, Table2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Breadcrumbs() {
    const { currentServer, currentTable, setCurrentTable } = useAppStore();
    const { serverId, dbName } = useParams();

    return (
        <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted px-4 py-2 border-b border-border/50 bg-main/50 backdrop-blur-sm">
            {/* Home / Server List */}
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home size={12} />
            </Link>
            
            <ChevronRight size={10} className="opacity-40" />
            
            {/* Server */}
            <Link to={`/server/${serverId}`} className={cn(
                "hover:text-primary transition-colors flex items-center gap-1",
                !dbName && "text-text-main font-bold"
            )}>
                 {currentServer?.name || serverId}
            </Link>

            {/* Database */}
            {dbName && (
                <>
                     <ChevronRight size={10} className="opacity-40" />
                     <Link to={`/server/${serverId}/${dbName}`} 
                        onClick={() => setCurrentTable(null)}
                        className={cn(
                            "hover:text-primary transition-colors flex items-center gap-1",
                            !currentTable && "text-text-main font-bold"
                        )}
                    >
                        <Database size={10} className="opacity-70" />
                        {dbName}
                     </Link>
                </>
            )}

            {/* Table */}
            {dbName && currentTable && (
                 <>
                     <ChevronRight size={10} className="opacity-40" />
                     <span className="text-text-main font-bold flex items-center gap-1">
                        <Table2 size={10} className="opacity-70" />
                        {currentTable}
                     </span>
                </>
            )}
        </div>
    );
}
