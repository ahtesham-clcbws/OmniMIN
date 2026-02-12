import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { Loader2, Search, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';

export default function StatusVariables() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const { currentServer } = useAppStore();

    const { data: variables, isLoading } = useQuery({
        queryKey: ['statusVariables', currentServer?.id],
        queryFn: () => dbApi.getStatusVariables(),
    });

    const groupedVariables = useMemo(() => {
        if (!variables) return {};
        
        const groups: Record<string, {name: string, value: string}[]> = { 'All': [] };
        
        variables.forEach(v => {
            const parts = v.variable_name.split('_');
            let category = parts[0];
            if (category === 'Com') category = 'Com'; // Commands
            else if (category.startsWith('Innodb')) category = 'InnoDB';
            else if (category.startsWith('Ssl')) category = 'SSL';
            else if (category.startsWith('Tc')) category = 'TC';
            else if (['Bytes', 'Aborted', 'Created', 'Handler', 'Key', 'Open', 'Qcache', 'Select', 'Sort', 'Table', 'Threads'].includes(category)) {
                // Keep as is
            } else {
                category = 'Other';
            }

            if (!groups[category]) groups[category] = [];
            groups[category].push({ name: v.variable_name, value: v.value });
            groups['All'].push({ name: v.variable_name, value: v.value });
        });

        // Sort categories
        return groups;
    }, [variables]);

    const categories = useMemo(() => {
        return Object.keys(groupedVariables).sort();
    }, [groupedVariables]);

    const filteredList = useMemo(() => {
        const list = groupedVariables[activeCategory] || [];
        if (!searchTerm) return list;
        return list.filter(v => 
            v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            v.value.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [groupedVariables, activeCategory, searchTerm]);

    if (isLoading) return <div className="p-12 text-center text-white/50"><Loader2 className="animate-spin inline mr-2"/> Loading status...</div>;

    return (
        <div className="flex h-full">
            {/* Sidebar Categories */}
            <div className="w-48 border-r border-border bg-black/10 overflow-y-auto p-2 space-y-1">
                <div className="text-xs font-bold text-text-muted uppercase px-2 mb-2">Categories</div>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                            "w-full text-left px-3 py-1.5 rounded text-xs transition-colors truncate flex justify-between",
                            activeCategory === cat ? "bg-primary/20 text-primary font-bold" : "hover:bg-white/5 text-text-muted"
                        )}
                    >
                        <span>{cat}</span>
                         {cat !== 'All' && <span className="opacity-50 text-[10px]">{groupedVariables[cat].length}</span>}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border bg-surface/50 backdrop-blur flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <Activity className="text-primary" size={18} />
                         <h1 className="font-bold text-lg">Server Status</h1>
                         <span className="text-xs px-2 py-0.5 rounded-full bg-border/50 text-text-muted">{filteredList.length} vars</span>
                    </div>
                    <div className="relative w-64">
                         <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted w-3 h-3" />
                         <Input 
                            className="h-8 pl-8 text-xs" 
                            placeholder="Filter variables..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                         />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-surface z-10 text-xs font-bold text-text-muted uppercase border-b border-border">
                            <tr>
                                <th className="p-3 w-1/3">Variable Name</th>
                                <th className="p-3">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20 text-sm">
                            {filteredList.map((v) => (
                                <tr key={v.name} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-3 font-mono text-primary text-xs">{v.name.replace(/_/g, ' ')}</td>
                                    <td className="p-3 font-mono text-xs opacity-80 break-all">{v.value}</td>
                                </tr>
                            ))}
                            {filteredList.length === 0 && (
                                <tr><td colSpan={2} className="p-8 text-center opacity-50">No variables found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
