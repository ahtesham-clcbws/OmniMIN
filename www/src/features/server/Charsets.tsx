import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { Loader2, Search, Type } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';

type TabType = 'charsets' | 'collations';

interface Charset {
    charset: string;
    description: string;
    default_collation: string;
    maxlen: number;
}

interface Collation {
    collation: string;
    charset: string;
    id: number;
    is_default: string;
    is_compiled: string;
    sortlen: number;
}

export default function Charsets() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('charsets');
    const { currentServer } = useAppStore();

    const { data: charsets, isLoading: charsetsLoading } = useQuery({
        queryKey: ['charsets', currentServer?.id],
        queryFn: () => dbApi.getCharsets(),
    });

    const { data: collations, isLoading: collationsLoading } = useQuery({
        queryKey: ['collations', currentServer?.id],
        queryFn: () => dbApi.getCollationsFull(),
    });

    const filteredCharsets = useMemo(() => {
        if (!charsets) return [];
        if (!searchTerm) return charsets;
        return charsets.filter((c: Charset) =>
            c.charset.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.default_collation.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [charsets, searchTerm]);

    const filteredCollations = useMemo(() => {
        if (!collations) return [];
        if (!searchTerm) return collations;
        return collations.filter((c: Collation) =>
            c.collation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.charset.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [collations, searchTerm]);

    const isLoading = activeTab === 'charsets' ? charsetsLoading : collationsLoading;
    const currentList = activeTab === 'charsets' ? filteredCharsets : filteredCollations;

    if (isLoading) return <div className="p-12 text-center text-white/50"><Loader2 className="animate-spin inline mr-2"/> Loading {activeTab}...</div>;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border bg-surface/50 backdrop-blur">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <Type className="text-primary" size={18} />
                        <h1 className="font-bold text-lg">Character Sets & Collations</h1>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-border/50 text-text-muted">{currentList.length} items</span>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted w-3 h-3" />
                        <Input 
                            className="h-8 pl-8 text-xs" 
                            placeholder={`Search ${activeTab}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => { setActiveTab('charsets'); setSearchTerm(''); }}
                        className={cn(
                            "px-4 py-1.5 rounded text-xs font-medium transition-all",
                            activeTab === 'charsets' 
                                ? "bg-primary/20 text-primary border border-primary/30" 
                                : "bg-white/5 text-text-muted hover:bg-white/10"
                        )}
                    >
                        Character Sets ({charsets?.length || 0})
                    </button>
                    <button
                        onClick={() => { setActiveTab('collations'); setSearchTerm(''); }}
                        className={cn(
                            "px-4 py-1.5 rounded text-xs font-medium transition-all",
                            activeTab === 'collations' 
                                ? "bg-primary/20 text-primary border border-primary/30" 
                                : "bg-white/5 text-text-muted hover:bg-white/10"
                        )}
                    >
                        Collations ({collations?.length || 0})
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-0">
                {activeTab === 'charsets' ? (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-surface z-10 text-xs font-bold text-text-muted uppercase border-b border-border">
                            <tr>
                                <th className="p-3 w-1/6">Charset</th>
                                <th className="p-3 w-2/5">Description</th>
                                <th className="p-3 w-1/4">Default Collation</th>
                                <th className="p-3 w-1/12 text-center">Max Length</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20 text-sm">
                            {filteredCharsets.map((c: Charset) => (
                                <tr key={c.charset} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-3 font-mono text-primary text-xs font-bold">{c.charset}</td>
                                    <td className="p-3 text-xs opacity-80">{c.description}</td>
                                    <td className="p-3 font-mono text-xs opacity-70">{c.default_collation}</td>
                                    <td className="p-3 text-xs text-center opacity-70">{c.maxlen}</td>
                                </tr>
                            ))}
                            {filteredCharsets.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center opacity-50">No charsets found</td></tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-surface z-10 text-xs font-bold text-text-muted uppercase border-b border-border">
                            <tr>
                                <th className="p-3 w-1/4">Collation</th>
                                <th className="p-3 w-1/6">Charset</th>
                                <th className="p-3 w-1/12 text-center">ID</th>
                                <th className="p-3 w-1/12 text-center">Default</th>
                                <th className="p-3 w-1/12 text-center">Compiled</th>
                                <th className="p-3 w-1/12 text-center">Sort Length</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20 text-sm">
                            {filteredCollations.map((c: Collation) => (
                                <tr key={c.collation} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-3 font-mono text-primary text-xs font-bold">{c.collation}</td>
                                    <td className="p-3 font-mono text-xs opacity-70">{c.charset}</td>
                                    <td className="p-3 text-xs text-center opacity-70">{c.id}</td>
                                    <td className="p-3 text-xs text-center">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                                            c.is_default === 'Yes' ? "bg-green-500/20 text-green-400" : "bg-white/5 text-text-muted"
                                        )}>
                                            {c.is_default}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs text-center">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                                            c.is_compiled === 'Yes' ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-text-muted"
                                        )}>
                                            {c.is_compiled}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs text-center opacity-70">{c.sortlen}</td>
                                </tr>
                            ))}
                            {filteredCollations.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center opacity-50">No collations found</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
