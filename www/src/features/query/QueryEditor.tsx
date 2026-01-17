import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Play, Loader2, Clock, Trash2, Database, AlertTriangle, Download, FileJson, Terminal, History as HistoryIcon, Code2, Sparkles, Eraser, Save, Info } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { dbApi } from '@/api/db';
import { cn } from '@/lib/utils';
import { VisualExplain } from './VisualExplain';
import { Microscope } from 'lucide-react';
import { SnippetLibrary } from './SnippetLibrary';
import { AIAssistant } from '../ai/AIAssistant';
import { AIExplanationModal } from '../ai/AIExplanationModal';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';


export function QueryEditor() {
    const { currentDb, currentTable, queryHistory, addHistory } = useAppStore();
    const [mode, setMode] = useState<'editor' | 'explain'>('editor'); // Removed 'builder'
    const [sql, setSql] = useState('SELECT * FROM ');
    const [lastResult, setLastResult] = useState<any>(null);
    const [delimiter, setDelimiter] = useState(';');

    const [showSnippets, setShowSnippets] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [snippetName, setSnippetName] = useState('');

    // AI State
    const [showAI, setShowAI] = useState(false);
    const [showExplainAI, setShowExplainAI] = useState(false);

    // Mutation for executing SQL
    const { mutate: runQuery, isPending } = useMutation({
        mutationFn: async (sqlCmd: string) => {
            if (!currentDb) throw new Error("No database selected");
            return dbApi.executeQuery(currentDb, sqlCmd);
        },
        onSuccess: (data, variables) => {
            setLastResult({ data, sql: variables, error: null });
            addHistory(variables);
        },
        onError: (error) => {
             setLastResult({ data: null, error: error, sql: null });
        }
    });

    const handleRunQuery = (sqlToRun?: string) => {
        const query = sqlToRun || sql;
        if (!query.trim()) return;
        runQuery(query);
    };

    const handleExplain = () => {
        if (!sql.trim()) return;
        setMode('explain');
    };

    const handleFormat = () => {
        // Placeholder for formatting logic
        console.log("Formatting SQL:", sql);
        // In a real app, you'd send 'sql' to a formatter service/library
        // and update setSql(formattedSql)
    };

    const handleClear = () => {
        setSql('');
    };

    if (!currentDb) {
        return <div className="p-12 text-center opacity-50 flex flex-col items-center gap-4">
            <Database className="w-12 h-12 opacity-20" />
            <div>Select a database to run queries</div>
        </div>
    }

    const results = lastResult?.data;
    const error = lastResult?.error;
    const isExecuting = isPending; // Renamed for clarity with new toolbar

    return (
        <div className="flex h-full">
            {/* L: Editor & Results */}
            <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
                {/* Mode Toggle Header */}
                <div className="flex items-center gap-1 p-1 bg-surface border-b border-border">
                    <button 
                        onClick={() => setMode('editor')}
                        className={cn(
                            "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2",
                            mode === 'editor' ? "bg-surface-alt text-primary" : "text-text-muted hover:text-text-main"
                        )}
                    >
                        <Code2 size={14} /> SQL Editor
                    </button>
                    <div className="w-px h-3 bg-border mx-1" />
                    {/* Removed Visual Builder button */}
                    <button 
                        onClick={() => mode === 'explain' ? setMode('editor') : handleExplain()}
                        className={cn(
                            "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2",
                            mode === 'explain' ? "bg-surface-alt text-primary" : "text-text-muted hover:text-text-main"
                        )}
                        title="Visualize Query execution plan"
                    >
                        <Microscope size={14} /> Explain
                    </button>
                </div>

                {/* Editor Area */}
                <div className="h-1/3 flex flex-col bg-surface border-b border-border relative">
                   {mode === 'editor' ? (
                       <div className="flex-1 flex flex-col min-h-0 bg-black/20">
                           {/* Editor Toolbar */}
                           <div className="h-10 border-b border-white/5 flex items-center px-4 justify-between bg-surface/30">
                               <div className="flex items-center gap-3">
                                   <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Editor</span>
                                   
                                   <div className="h-4 w-px bg-white/10 mx-2" />
                                   
                                   <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={handleFormat}>
                                       <Sparkles size={12} className="mr-1.5 text-blue-400" /> Format
                                   </Button>
                                   
                                   <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={handleClear}>
                                       <Eraser size={12} className="mr-1.5 text-red-400" /> Clear
                                   </Button>

                                    {/* Templates */}
                                    <div className="h-4 w-px bg-white/10 mx-2" />
                                    <div className="flex bg-black/20 rounded p-0.5 gap-0.5">
                                        <button 
                                            onClick={() => setSql(`SELECT * FROM \`${currentTable || 'table'}\` WHERE 1;`)}
                                            className="px-2 py-0.5 text-[10px] font-bold text-text-muted hover:text-primary hover:bg-white/10 rounded transition-colors"
                                            title="SELECT *"
                                        >
                                            SELECT *
                                        </button>
                                        <button 
                                            onClick={() => setSql(`INSERT INTO \`${currentTable || 'table'}\` (\`id\`) VALUES ('val');`)}
                                            className="px-2 py-0.5 text-[10px] font-bold text-text-muted hover:text-primary hover:bg-white/10 rounded transition-colors"
                                            title="INSERT"
                                        >
                                            INSERT
                                        </button>
                                        <button 
                                            onClick={() => setSql(`UPDATE \`${currentTable || 'table'}\` SET \`id\`='val' WHERE 1;`)}
                                            className="px-2 py-0.5 text-[10px] font-bold text-text-muted hover:text-primary hover:bg-white/10 rounded transition-colors"
                                            title="UPDATE"
                                        >
                                            UPDATE
                                        </button>
                                        <button 
                                            onClick={() => setSql(`DELETE FROM \`${currentTable || 'table'}\` WHERE 0;`)}
                                            className="px-2 py-0.5 text-[10px] font-bold text-text-muted hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                                            title="DELETE"
                                        >
                                            DELETE
                                        </button>
                                    </div>
                               </div>
                               
                               <div className="flex items-center gap-3">
                                   <div className="flex items-center gap-2">
                                       <span className="text-[10px] text-text-muted uppercase font-bold">Delimiter</span>
                                       <input 
                                           className="w-12 h-6 bg-black/20 border border-white/10 rounded text-center text-xs font-mono outline-none focus:border-primary/50"
                                           value={delimiter}
                                           onChange={(e) => setDelimiter(e.target.value)}
                                       />
                                   </div>

                                   <div className="h-4 w-px bg-white/10 mx-2" />

                                   <Button 
                                       variant="secondary" 
                                       size="sm" 
                                       className="h-7 px-3 text-[10px]"
                                       onClick={handleExplain}
                                   >
                                       <Info size={12} className="mr-1.5" /> Explain
                                   </Button>

                                   <Button 
                                       size="sm" 
                                       className="h-7 px-4 text-[11px] font-bold bg-primary hover:bg-primary/90"
                                       onClick={() => handleRunQuery()}
                                       disabled={!sql.trim() || isExecuting}
                                   >
                                       {isExecuting ? <Loader2 className="animate-spin mr-1.5" size={12}/> : <Play size={12} className="mr-1.5 fill-current" />}
                                       Run
                                   </Button>
                               </div>
                           </div>

                           <div className="flex-1 relative group">
                               <textarea
                                   value={sql}
                                   onChange={(e) => setSql(e.target.value)}
                                   className="absolute inset-0 w-full h-full bg-transparent p-4 font-mono text-sm outline-none resize-none text-blue-300 placeholder-white/10"
                                   placeholder="SELECT * FROM table WHERE..."
                                   spellCheck={false}
                               />
                           </div>
                       </div>
                   ) : ( // Removed 'builder' mode condition
                        <div className="absolute inset-0 z-10 bg-canvas">
                            {/* @ts-ignore */}
                            <VisualExplain sql={sql} db={currentDb} />
                        </div>
                   )}
                </div>

                {/* Results Pane */}
                <div className="flex-1 overflow-auto bg-canvas relative">
                    {error ? (
                        <div className="p-8 text-center text-error">
                            <div className="bg-error/10 border border-error/20 inline-block p-4 rounded-lg">
                                <h3 className="font-bold mb-2 flex items-center gap-2 justify-center"><AlertTriangle size={16} /> Error Executing Query</h3>
                                <div className="font-mono text-xs opacity-80">{String(error)}</div>
                            </div>
                        </div>
                    ) : results ? (
                        <div className="min-w-full inline-block align-middle">
                             {results.rows ? (
                                <>
                                    <div className="sticky top-0 bg-surface shadow-sm z-10 px-4 py-2 text-xs text-text-muted border-b border-border flex justify-between items-center">
                                        <span>{results.rows.length} rows in set ({results.duration}ms)</span>
                                        <div className="flex gap-2">
                                            <button className="hover:text-text-main flex items-center gap-1"><Download size={12}/> CSV</button>
                                            <button className="hover:text-text-main flex items-center gap-1"><FileJson size={12}/> JSON</button>
                                        </div>
                                    </div>
                                    <table className="w-full text-left border-collapse">
                                         <thead className="sticky top-[33px] bg-surface shadow-sm z-10">
                                             <tr>
                                                 {results.columns.map((col: string, i: number) => (
                                                     <th key={i} className="p-2 border-b border-border font-mono text-primary font-normal">{col}</th>
                                                 ))}
                                             </tr>
                                         </thead>
                                         <tbody className="font-mono text-xs">
                                             {results.rows.map((row: any[], i: number) => (
                                                 <tr key={i} className="hover:bg-hover-bg border-b border-border">
                                                     {row.map((val: any, j: number) => (
                                                         <td key={j} className="p-2 border-r border-border max-w-[300px] truncate opacity-80 text-text-main">
                                                             {val === null ? <span className="text-text-muted italic">NULL</span> : String(val)}
                                                         </td>
                                                     ))}
                                                 </tr>
                                             ))}
                                         </tbody>
                                    </table>
                                </>
                             ) : (
                                 <div className="p-8 text-center text-green-400">
                                     <div className="font-bold mb-2">Query Executed Successfully</div>
                                     <div className="text-xs opacity-70">Affected Rows: {results.affected_rows}</div>
                                 </div>
                             )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-50 gap-4">
                            <Terminal size={48} strokeWidth={1} />
                            <p>Write a query and hit Run</p>
                        </div>
                    )}
                     {/* Snippet Library Overlay/Sidebar */}
                 <SnippetLibrary 
                    isOpen={showSnippets} 
                    onClose={() => setShowSnippets(false)}
                    onSelect={(s) => setSql(s)}
                    onRun={(s) => { setSql(s); handleRunQuery(s); }}
                />

                {/* AI Assistant Overlay */}
                <AIAssistant 
                    isOpen={showAI}
                    onClose={() => setShowAI(false)}
                    onInsertSql={(s) => setSql(s)}
                />

                {showExplainAI && (
                    <AIExplanationModal 
                        sql={sql} 
                        onClose={() => setShowExplainAI(false)} 
                    />
                )}
            </div>
            </div>

            {/* R: History Sidebar */}
            <div className="w-[240px] bg-canvas flex flex-col border-l border-border h-full">
                 <div className="p-3 border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-muted opacity-50 flex items-center gap-2">
                     <HistoryIcon size={12} /> Query History
                 </div>
                 <div className="flex-1 overflow-y-auto">
                     {queryHistory.map((item, i) => (
                         <div 
                            key={i} 
                            className="p-3 border-b border-border hover:bg-hover-bg cursor-pointer group"
                            onClick={() => {
                                setSql(item.sql);
                                setMode('editor');
                            }}
                         >
                             <div className="font-mono text-[10px] line-clamp-3 text-text-muted group-hover:text-primary transition-colors mb-1">
                                 {item.sql}
                             </div>
                             <div className="text-[9px] opacity-30">
                                 {item.timestamp.toLocaleTimeString()}
                             </div>
                         </div>
                     ))}
                     {queryHistory.length === 0 && (
                         <div className="p-4 text-center opacity-20 text-[10px] italic">No history yet</div>
                     )}
                 </div>
            </div>
        </div>
    );
}
