import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { Loader2, Search, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/useAppStore';

export default function ServerVariables() {
    const [searchTerm, setSearchTerm] = useState('');
    const { currentServer } = useAppStore();

    const { data: variables, isLoading } = useQuery({
        queryKey: ['serverVariables', currentServer?.id],
        queryFn: () => dbApi.getServerVariables(),
    });

    const filteredList = useMemo(() => {
        if (!variables) return [];
        if (!searchTerm) return variables;
        return variables.filter(v => 
            v.variable_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            v.value.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [variables, searchTerm]);

    if (isLoading) return <div className="p-12 text-center text-white/50"><Loader2 className="animate-spin inline mr-2"/> Loading variables...</div>;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-border bg-surface/50 backdrop-blur flex justify-between items-center flex-none">
                <div className="flex items-center gap-2">
                        <Settings className="text-primary" size={18} />
                        <h1 className="font-bold text-lg">System Variables</h1>
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
                            <tr key={v.variable_name} className="hover:bg-white/5 transition-colors group">
                                <td className="p-3 font-mono text-primary text-xs">{v.variable_name}</td>
                                <td className="p-3 font-mono text-xs opacity-80 break-all group-hover:bg-white/5 rounded transition-colors cursor-default" title={v.value}>
                                    {v.value.length > 200 ? v.value.substring(0, 200) + '...' : v.value}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
