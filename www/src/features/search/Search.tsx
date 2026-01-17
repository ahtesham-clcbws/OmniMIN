
import React from 'react';
import { Search as SearchIcon, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Search() {
    return (
        <div className="p-8 max-w-2xl mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <SearchIcon size={32} />
            </div>
            <h1 className="text-2xl font-bold">Search Database</h1>
            <p className="text-text-muted">
                Search for a specific string or value across all tables in this database.
            </p>
            
            <div className="flex gap-2 max-w-md mx-auto">
                <Input placeholder="Enter search term..." />
                <Button>Search</Button>
            </div>

            <div className="p-4 rounded border border-dashed border-border text-xs text-text-muted opacity-70">
                Detailed search filters and multi-table results view coming in v0.6.5
            </div>
        </div>
    );
}
