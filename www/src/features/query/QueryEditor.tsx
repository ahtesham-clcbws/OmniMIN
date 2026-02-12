import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Play, Loader2, Clock, Trash2, Database, AlertTriangle, Download, FileJson, Terminal, History as HistoryIcon, Code2, Sparkles, Eraser, Save, Info, Activity } from 'lucide-react';
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
import CodeMirror from '@uiw/react-codemirror';
import { sql, StandardSQL } from '@codemirror/lang-sql';
import { QueryResult } from '@/api/commands';
import { EditorView } from '@codemirror/view';
import { format } from 'sql-formatter';

export function QueryEditor() {
    const { currentDb, currentTable, queryHistory, addHistory, theme } = useAppStore();
    const [mode, setMode] = useState<'editor' | 'explain'>('editor');
    const [sqlCode, setSqlCode] = useState('SELECT * FROM ');
    const [results, setResults] = useState<QueryResult[]>([]);
    const [lastResultIndex, setLastResultIndex] = useState(0);
    const [error, setError] = useState<any>(null);
    const [delimiter, setDelimiter] = useState(';');

    const [showSnippets, setShowSnippets] = useState(false);
    
    // AI State
    const [showAI, setShowAI] = useState(false);
    const [showExplainAI, setShowExplainAI] = useState(false);

    // Schema for Auto-complete
    const [schemaTables, setSchemaTables] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const fetchSchema = async () => {
            if (!currentDb) return;
            try {
                const tables = await dbApi.getTables(currentDb);
                const schema: Record<string, string[]> = {};
                
                // Initialize tables
                tables.forEach(t => schema[t.name] = []);

                // Fetch columns for current table if selected
                if (currentTable) {
                    const cols = await dbApi.getColumns(currentDb, currentTable);
                    if (Array.isArray(cols)) {
                         // @ts-ignore
                        schema[currentTable] = cols.map((c: any) => c.field);
                    }
                }
                setSchemaTables(schema);
            } catch (error) {
                console.error("Failed to fetch schema for autocomplete", error);
            }
        };
        fetchSchema();
    }, [currentDb, currentTable]);

    // Mutation for executing SQL
    const { mutate: runQuery, isPending } = useMutation({
        mutationFn: async (sqlCmd: string) => {
            if (!currentDb) throw new Error("No database selected");
            
            // SQL Cleanup: remove common trailing errors
            let cleanedSql = sqlCmd.trim();
            // 1. Remove trailing comma if it's right before a semicolon or at the very end
            cleanedSql = cleanedSql.replace(/,\s*;$/g, ';');
            cleanedSql = cleanedSql.replace(/,\s*$/g, '');
            // 2. Remove trailing comma before common keywords (simple regex)
            cleanedSql = cleanedSql.replace(/,\s+(WHERE|GROUP|ORDER|LIMIT)/gi, ' $1');

            return dbApi.executeQuery(currentDb, cleanedSql);
        },
        onSuccess: (data, variables) => {
            setResults(Array.isArray(data) ? data : [data]);
            setLastResultIndex(0);
            setError(null);
            addHistory(variables);
        },
        onError: (err) => {
             setError(err);
             setResults([]);
        }
    });

    const handleRunQuery = (sqlToRun?: string) => {
        const query = sqlToRun || sqlCode;
        if (!query.trim()) return;
        runQuery(query);
    };

    const handleExplain = () => {
        if (!sqlCode.trim()) return;
        setMode('explain');
    };

    const handleFormat = () => {
        if (!sqlCode.trim()) return;
        try {
            const formatted = format(sqlCode, { language: 'mysql', keywordCase: 'upper' });
            setSqlCode(formatted);
        } catch (e) {
            console.error("Formatting failed", e);
            // Optional: show toast error
        }
    };

    const handleClear = () => {
        setSqlCode('');
    };

    if (!currentDb) {
        return <div className="p-12 text-center opacity-50 flex flex-col items-center gap-4">
            <Database className="w-12 h-12 opacity-20" />
            <div>Select a database to run queries</div>
        </div>
    }

    const isExecuting = isPending;

    // Custom SQL Extension configuration
    const sqlExtension = sql({
        dialect: StandardSQL,
        schema: schemaTables
    });

    // Custom dark theme for CodeMirror to match app
    const customTheme = EditorView.theme({
        "&": {
            backgroundColor: "transparent !important",
            height: "100%",
            fontSize: "14px",
        },
        ".cm-content": {
            caretColor: "rgba(255, 255, 255, 0.8)",
            color: "rgba(255, 255, 255, 0.9)",
            fontFamily: "monospace"
        },
        ".cm-gutters": {
            backgroundColor: "transparent",
            color: "rgba(255, 255, 255, 0.3)",
            border: "none"
        },
        ".cm-activeLine": {
            backgroundColor: "rgba(255, 255, 255, 0.05)"
        },
        ".cm-activeLineGutter": {
            backgroundColor: "transparent",
            color: "rgba(255, 255, 255, 0.8)"
        },
        // Complete dropdown customization
        ".cm-tooltip": {
            backgroundColor: "#1e1e1e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px"
        },
        ".cm-tooltip-autocomplete": {
            "& > ul > li[aria-selected]": {
                backgroundColor: "#2d2d2d",
                color: "#fff"
            }
        }
    }, { dark: true });

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
                                            onClick={() => setSqlCode(`SELECT * FROM \`${currentTable || 'table'}\` WHERE 1;`)}
                                            className="px-2 py-0.5 text-[10px] font-bold text-text-muted hover:text-primary hover:bg-white/10 rounded transition-colors"
                                            title="SELECT *"
                                        >
                                            SELECT *
                                        </button>
                                        <button 
                                            onClick={() => setSqlCode(`INSERT INTO \`${currentTable || 'table'}\` (\`id\`) VALUES ('val');`)}
                                            className="px-2 py-0.5 text-[10px] font-bold text-text-muted hover:text-primary hover:bg-white/10 rounded transition-colors"
                                            title="INSERT"
                                        >
                                            INSERT
                                        </button>
                                        <button 
                                            onClick={() => setSqlCode(`UPDATE \`${currentTable || 'table'}\` SET \`id\`='val' WHERE 1;`)}
                                            className="px-2 py-0.5 text-[10px] font-bold text-text-muted hover:text-primary hover:bg-white/10 rounded transition-colors"
                                            title="UPDATE"
                                        >
                                            UPDATE
                                        </button>
                                        <button 
                                            onClick={() => setSqlCode(`DELETE FROM \`${currentTable || 'table'}\` WHERE 0;`)}
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
                                       disabled={!sqlCode.trim() || isExecuting}
                                   >
                                       {isExecuting ? <Loader2 className="animate-spin mr-1.5" size={12}/> : <Play size={12} className="mr-1.5 fill-current" />}
                                       Run
                                   </Button>
                               </div>
                           </div>

                           <div className="flex-1 relative group overflow-hidden">
                                <CodeMirror
                                    value={sqlCode}
                                    height="100%"
                                    extensions={[sqlExtension, customTheme]}
                                    onChange={(val) => setSqlCode(val)}
                                    className="h-full text-base"
                                    basicSetup={{
                                        lineNumbers: true,
                                        highlightActiveLineGutter: true,
                                        highlightSpecialChars: true,
                                        history: true,
                                        foldGutter: true,
                                        drawSelection: true,
                                        dropCursor: true,
                                        allowMultipleSelections: true,
                                        indentOnInput: true,
                                        syntaxHighlighting: true,
                                        bracketMatching: true,
                                        closeBrackets: true,
                                        autocompletion: true,
                                        
                                        crosshairCursor: true,
                                        highlightActiveLine: true,
                                        highlightSelectionMatches: true,
                                        closeBracketsKeymap: true,
                                        defaultKeymap: true,
                                        searchKeymap: true,
                                        historyKeymap: true,
                                        foldKeymap: true,
                                        completionKeymap: true,
                                        lintKeymap: true,
                                    }}
                                />
                           </div>
                       </div>
                   ) : (
                        <div className="absolute inset-0 z-10 bg-canvas">
                            {/* @ts-ignore */}
                            <VisualExplain sql={sqlCode} db={currentDb} />
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
                    ) : results.length > 0 ? (
                        <div className="h-full flex flex-col">
                            {/* Result Set Switcher */}
                            {results.length > 1 && (
                                <div className="flex-shrink-0 bg-surface border-b border-border p-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
                                    {results.map((r, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setLastResultIndex(idx)}
                                            className={cn(
                                                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all whitespace-nowrap border",
                                                lastResultIndex === idx 
                                                    ? "bg-primary/20 text-primary border-primary/40" 
                                                    : "text-text-muted border-transparent hover:bg-white/5"
                                            )}
                                        >
                                            Result #{idx + 1} ({r.columns.length > 0 ? r.rows.length : r.affected_rows})
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Metadata / Profiling Header */}
                            <div className="flex-shrink-0 sticky top-0 bg-surface shadow-sm z-10 px-4 py-2 text-[10px] text-text-muted border-b border-border flex justify-between items-center bg-canvas/80 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                     <span className="flex items-center gap-1 uppercase tracking-tighter">
                                        <Clock size={12} className="opacity-50" /> 
                                        {results[lastResultIndex].duration_ms.toFixed(2)}ms
                                     </span>
                                     <span className="flex items-center gap-1 uppercase tracking-tighter">
                                        <Activity size={12} className="opacity-50" /> 
                                        {results[lastResultIndex].columns.length > 0
                                            ? `${results[lastResultIndex].rows.length} rows` 
                                            : `${results[lastResultIndex].affected_rows} affected`}
                                     </span>
                                     {results[lastResultIndex].last_insert_id > 0 && (
                                         <span className="flex items-center gap-1 uppercase tracking-tighter text-secondary">
                                            ID: {results[lastResultIndex].last_insert_id}
                                         </span>
                                     )}
                                </div>
                                <div className="flex gap-2">
                                    <button className="hover:text-text-main flex items-center gap-1 transition-colors"><Download size={12}/> CSV</button>
                                    <button className="hover:text-text-main flex items-center gap-1 transition-colors"><FileJson size={12}/> JSON</button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto min-w-full inline-block align-middle">
                                {results[lastResultIndex].columns.length > 0 ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-surface shadow-sm z-10">
                                            <tr>
                                                {results[lastResultIndex].columns.map((col: string, i: number) => (
                                                    <th key={i} className="p-2 px-3 border-b border-border font-mono text-primary font-bold text-xs bg-canvas/40 backdrop-blur-sm whitespace-nowrap">{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="font-mono text-[11px]">
                                            {results[lastResultIndex].rows.map((row: any[], i: number) => (
                                                <tr key={i} className="hover:bg-white/5 border-b border-border/30 transition-colors">
                                                    {row.map((val: any, j: number) => (
                                                        <td key={j} className="p-2 px-3 border-r border-border/30 max-w-[400px] truncate opacity-80 text-text-main">
                                                            {val === null ? <span className="text-text-muted italic opacity-50">NULL</span> : String(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="bg-primary/5 border border-primary/20 inline-flex flex-col items-center p-6 rounded-2xl gap-3">
                                            <div className="p-3 bg-primary/20 rounded-xl text-primary">
                                                 <Activity size={32} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-text-main">Success</h3>
                                                <p className="text-xs text-text-muted opacity-80 mt-1">
                                                    Command executed successfully.
                                                    <br />
                                                    Affected rows: {results[lastResultIndex].affected_rows}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-50 gap-4">
                            <Terminal size={48} strokeWidth={1} />
                            <p>Write a query and hit Run</p>
                        </div>
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
                                setSqlCode(item.sql);
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

            {/* Snippet Library Overlay/Sidebar */}
            <SnippetLibrary 
                isOpen={showSnippets} 
                onClose={() => setShowSnippets(false)}
                onSelect={(s) => setSqlCode(s)}
                onRun={(s) => { setSqlCode(s); handleRunQuery(s); }}
            />

            {/* AI Assistant Overlay */}
            <AIAssistant 
                isOpen={showAI}
                onClose={() => setShowAI(false)}
                onInsertSql={(s) => setSqlCode(s)}
            />

            {showExplainAI && (
                <AIExplanationModal 
                    sql={sqlCode} 
                    onClose={() => setShowExplainAI(false)} 
                />
            )}
        </div>
    );
}
