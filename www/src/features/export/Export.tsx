import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
    Download, Loader2, Database, Settings, CheckSquare, Square, 
    FileCode, Check, Trash2, Copy as CopyIcon, FileText, Code2, Globe
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { dbApi } from '@/api/db';
import { showToast } from '@/utils/ui';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { cn } from '@/lib/utils';
import { ExportOptions } from '@/api/commands';
import { Button } from '@/components/ui/button';
import * as Generators from '@/generators';

type ExportFormat = 'sql' | 'laravel_model' | 'laravel_migration' | 'prisma' | 'typescript' | 'go' | 'zod' | 'json' | 'mermaid';

export function Export() {
    const { currentDb, exportTemplates, addExportTemplate, removeExportTemplate } = useAppStore();
    const { tableName } = useParams();
    const [mode, setMode] = useState<'quick' | 'custom'>('quick');
    const [format, setFormat] = useState<ExportFormat>('sql');
    const [generating, setGenerating] = useState(false);
    const [previewCode, setPreviewCode] = useState('');
    
    // Custom Options State
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [options, setOptions] = useState<Omit<ExportOptions, 'tables'>>({
        export_structure: true,
        export_data: true,
        add_drop_table: true,
        add_create_table: true,
        add_if_not_exists: false,
        data_insertion_mode: 'INSERT'
    });

    const { data: tables } = useQuery({
        queryKey: ['tables', currentDb],
        queryFn: () => dbApi.getTables(currentDb!),
        enabled: !!currentDb
    });

    // Initialize selected tables when loaded
    useEffect(() => {
        if (tables) {
            if (tableName) {
                setSelectedTables([tableName]);
                setFormat('sql'); // Default to SQL when coming from table context
            } else {
                setSelectedTables(tables.map(t => t.name));
            }
        }
    }, [tables, tableName]);

    // Handle Generation for non-SQL formats
    useEffect(() => {
        if (format !== 'sql' && selectedTables.length > 0) {
            generateCodePreview();
        } else {
            setPreviewCode('');
        }
    }, [format, selectedTables]);

    const generateCodePreview = async () => {
        if (!currentDb || selectedTables.length === 0) return;
        
        setGenerating(true);
        try {
            const schemaTables: Generators.SchemaTable[] = [];
            const relations = await dbApi.getRelations(currentDb!);

            for (const tName of selectedTables) {
                const columns = await dbApi.getColumns(currentDb!, tName);
                const tableRelations = relations?.rows
                    ?.filter((r: any) => r[0] === tName)
                    .map((r: any) => ({
                        column: r[1],
                        referencedTable: r[2],
                        referencedColumn: r[3]
                    })) || [];

                schemaTables.push({
                    name: tName,
                    columns: (columns as any[]).map((c: any) => ({
                        name: c.field,
                        type: c.data_type,
                        nullable: c.null === 'YES',
                        key: c.key as any,
                        default: c.default,
                        extra: c.extra
                    })),
                    relations: tableRelations
                });
            }

            let code = '';
            if (format === 'laravel_model') {
                code = schemaTables.map(t => Generators.LaravelGenerator.generateModel(t)).join('\n\n');
            } else if (format === 'laravel_migration') {
                code = schemaTables.map(t => Generators.LaravelGenerator.generateMigration(t)).join('\n\n');
            } else if (format === 'prisma') {
                code = schemaTables.map(t => Generators.PrismaGenerator.generateModel(t)).join('\n\n');
            } else if (format === 'typescript') {
                code = schemaTables.map(t => Generators.TypescriptGenerator.generateInterface(t)).join('\n\n');
            } else if (format === 'go') {
                code = schemaTables.map(t => Generators.GoGenerator.generateStruct(t)).join('\n\n');
            } else if (format === 'zod') {
                code = schemaTables.map(t => Generators.ZodGenerator.generateSchema(t)).join('\n\n');
            } else if (format === 'mermaid') {
                code = Generators.MermaidGenerator.generateERD(schemaTables);
            } else if (format === 'json') {
                code = Generators.JsonGenerator.generateSchema(schemaTables as any);
            }

            setPreviewCode(code);
        } catch (e) {
            console.error(e);
            showToast('Generation failed', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!previewCode) return;
        await writeText(previewCode);
        showToast('Copied to clipboard', 'success');
    };

    const handleSelectAll = (select: boolean) => {
        if (tables) {
            setSelectedTables(select ? tables.map(t => t.name) : []);
        }
    };

    const toggleTable = (name: string) => {
        setSelectedTables(prev => 
            prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
        );
    };

    const handleExport = async () => {
        if (!currentDb) return;

        if (format !== 'sql') {
            const extMap: Record<string, string> = {
                laravel_model: 'php',
                laravel_migration: 'php',
                prisma: 'prisma',
                typescript: 'ts',
                go: 'go',
                zod: 'ts',
                mermaid: 'mmd',
                json: 'json'
            };
            const ext = extMap[format];
            const { save: tauriSave } = await import('@tauri-apps/plugin-dialog');
            const filePath = await tauriSave({
                defaultPath: `${currentDb}_export.${ext}`,
                filters: [{ name: format, extensions: [ext] }]
            });
            if (filePath) {
                const { writeTextFile } = await import('@tauri-apps/plugin-fs');
                await writeTextFile(filePath, previewCode);
                showToast('File saved', 'success');
            }
            return;
        }

        try {
            const { save: tauriSave } = await import('@tauri-apps/plugin-dialog');
            const filePath = await tauriSave({
                defaultPath: `${currentDb}_dump_${new Date().toISOString().split('T')[0]}.sql`,
                filters: [{
                    name: 'SQL File',
                    extensions: ['sql']
                }]
            });

            if (!filePath) return;

            setGenerating(true);

            const exportOps: ExportOptions = mode === 'quick' ? {
                tables: tableName ? [tableName] : undefined,
                export_structure: true,
                export_data: true,
                add_drop_table: true,
                add_create_table: true,
                add_if_not_exists: false,
                data_insertion_mode: 'INSERT'
            } : {
                ...options,
                tables: selectedTables.length === tables?.length ? undefined : selectedTables
            };

            await dbApi.exportDatabase(currentDb, filePath, exportOps);
            showToast('Export completed successfully', 'success');
        } catch (e) {
            console.error(e);
            showToast('Export failed: ' + e, 'error');
        } finally {
            setGenerating(false);
        }
    };

    const formats: { id: ExportFormat; label: string; icon: any }[] = [
        { id: 'sql', label: 'SQL', icon: FileCode },
        { id: 'laravel_model', label: 'Laravel Model', icon: Code2 },
        { id: 'laravel_migration', label: 'Laravel Migration', icon: FileText },
        { id: 'prisma', label: 'Prisma', icon: Globe },
        { id: 'typescript', label: 'TypeScript', icon: FileCode },
        { id: 'go', label: 'Go Struct', icon: Code2 },
        { id: 'zod', label: 'Zod Schema', icon: Check },
        { id: 'mermaid', label: 'Mermaid ERD', icon: Globe },
        { id: 'json', label: 'JSON Metadata', icon: FileCode },
    ];

    if (!currentDb) return <div className="p-12 text-center opacity-50">Select a database</div>;

    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-canvas/30">
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                 <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tighter text-text-main flex items-center gap-3">
                        <Download size={28} className="text-primary" /> Export & Generators
                    </h1>
                    <p className="text-sm text-text-muted opacity-60">
                        Export {tableName ? <span>table <span className="text-primary font-mono font-bold">{tableName}</span></span> : <span>your database <span className="text-primary font-mono font-bold">{currentDb}</span></span>} to SQL or Code
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Side: Configuration (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Format Selection */}
                        <div className="glass-panel p-4 space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Export Format</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {formats.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFormat(f.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold transition-all border",
                                            format === f.id 
                                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                                                : "bg-surface border-border text-text-muted hover:border-primary/30"
                                        )}
                                    >
                                        <f.icon size={14} />
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Export Mode / Tables (SQL only) */}
                        {format === 'sql' && (
                            <div className="glass-panel p-1.5 flex bg-black/20">
                                <button 
                                    onClick={() => setMode('quick')}
                                    className={cn(
                                        "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                                        mode === 'quick' ? "bg-primary text-white" : "text-text-muted hover:text-white"
                                    )}
                                >
                                    Quick
                                </button>
                                <button 
                                    onClick={() => setMode('custom')}
                                    className={cn(
                                        "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                                        mode === 'custom' ? "bg-primary text-white" : "text-text-muted hover:text-white"
                                    )}
                                >
                                    Custom
                                </button>
                            </div>
                        )}

                        {/* Custom SQL Options */}
                        {format === 'sql' && mode === 'custom' && (
                            <div className="glass-panel p-4 space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Settings size={12} /> SQL Options
                                </h3>
                                <div className="space-y-2 text-[11px]">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span>Structure</span>
                                        <input type="checkbox" checked={options.export_structure} onChange={e => setOptions({...options, export_structure: e.target.checked})} className="accent-primary" />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span>Data</span>
                                        <input type="checkbox" checked={options.export_data} onChange={e => setOptions({...options, export_data: e.target.checked})} className="accent-primary" />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span>Drop Tables</span>
                                        <input type="checkbox" checked={options.add_drop_table} onChange={e => setOptions({...options, add_drop_table: e.target.checked})} className="accent-primary" />
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {format !== 'sql' && (
                                <Button 
                                    onClick={handleCopy}
                                    disabled={!previewCode || generating}
                                    className="w-full bg-white/5 border border-white/10 text-white"
                                >
                                    <CopyIcon size={16} className="mr-2" /> Copy to Clipboard
                                </Button>
                            )}
                            <Button 
                                onClick={handleExport}
                                disabled={generating || !currentDb || (format === 'sql' && mode === 'custom' && selectedTables.length === 0)}
                                className="w-full h-11 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                            >
                                {generating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} className="mr-2" />}
                                {generating ? 'Processing...' : (format === 'sql' ? 'Export SQL File' : 'Save as File')}
                            </Button>
                        </div>
                    </div>

                    {/* Right Side: Table Selection or Preview (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {/* Table Selection Pane (Visible if format is NOT SQL Quick) */}
                        {!(format === 'sql' && mode === 'quick') && (
                            <div className="glass-panel flex flex-col max-h-[300px]">
                                <div className="p-3 border-b border-border flex justify-between items-center bg-white/5">
                                    <div className="flex items-center gap-2">
                                        <Database size={14} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Select Tables ({selectedTables.length}/{tables?.length})</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSelectAll(true)} className="text-[9px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded">Select All</button>
                                        <button onClick={() => handleSelectAll(false)} className="text-[9px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded">Clear</button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 scrollbar-none">
                                    {tables ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {tables.map(t => (
                                                <div 
                                                    key={t.name}
                                                    onClick={() => toggleTable(t.name)}
                                                    className={cn(
                                                        "flex items-center gap-2 p-2 rounded border cursor-pointer transition-all",
                                                        selectedTables.includes(t.name) 
                                                            ? "bg-primary/10 border-primary/30" 
                                                            : "bg-surface border-transparent hover:bg-hover-bg"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-3 h-3 rounded-sm border flex items-center justify-center",
                                                        selectedTables.includes(t.name) ? "bg-primary border-primary" : "border-white/20"
                                                    )}>
                                                        {selectedTables.includes(t.name) && <Check size={8} className="text-white" />}
                                                    </div>
                                                    <span className="text-[11px] font-mono truncate">{t.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <Loader2 size={24} className="mx-auto my-8 animate-spin opacity-20" />}
                                </div>
                            </div>
                        )}

                        {/* Preview Pane or Quick Mode Static View */}
                        <div className="glass-panel flex-1 flex flex-col min-h-[400px]">
                            <div className="p-3 border-b border-border flex justify-between items-center bg-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    {format === 'sql' ? 'Output Information' : 'Code Preview'}
                                </span>
                                {format !== 'sql' && generating && <Loader2 size={12} className="animate-spin text-primary" />}
                            </div>
                            <div className="flex-1 p-0 relative overflow-hidden">
                                {format === 'sql' && mode === 'quick' ? (
                                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-center p-8">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                            <Download size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-lg">Quick SQL Export</h3>
                                            <p className="text-xs text-text-muted max-w-xs mx-auto">
                                                All tables including structure and data will be exported as a .sql dump.
                                            </p>
                                        </div>
                                    </div>
                                ) : format === 'sql' ? (
                                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-center p-8 text-text-muted opacity-40">
                                        <FileCode size={48} />
                                        <p className="text-sm">Configure options and click Export to generate SQL</p>
                                    </div>
                                ) : (
                                    <pre className="absolute inset-0 m-0 p-4 text-[11px] font-mono overflow-auto custom-scrollbar bg-black/40 text-blue-300">
                                        {previewCode || (generating ? '// Generating code...' : '// Select tables to generate preview')}
                                    </pre>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Support other generators if we want to keep them later as sub-options
