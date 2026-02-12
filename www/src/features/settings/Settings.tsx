import React, { useState, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Moon, Sun, Monitor, Type, LayoutTemplate, LayoutGrid, LayoutDashboard, List, Palette, Plus, Rows, Upload, Search, X, Check, SunDim, Activity, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { AISettings } from './AISettings';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Settings Component
export function Settings() {
    const { 
        theme, setTheme, 
        accentColor, setAccentColor,
        density, setDensity,
        fontFamily, setFontFamily,
        dashboardViewMode, setDashboardViewMode,
        customFonts, addCustomFont, removeCustomFont,
        customColors, addCustomColor, removeCustomColor,
        showSettings, setShowSettings,
        // Performance settings
        debugMode, setDebugMode,
        performanceMonitoring, setPerformanceMonitoring,
        showPerformanceOverlay, setShowPerformanceOverlay,
    } = useAppStore();

    const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'dev'>('general');
    const [showFontModal, setShowFontModal] = useState(false);
    const [fontSearch, setFontSearch] = useState('');
    
    // Color Modal State
    const [showColorModal, setShowColorModal] = useState(false);
    const [newColorHex, setNewColorHex] = useState('#000000');
    const [newColorLabel, setNewColorLabel] = useState('');

    const defaultColors = [
        { id: 'blue', hex: '#3b82f6', label: 'Blue' },
        { id: 'purple', hex: '#8b5cf6', label: 'Purple' },
        { id: 'green', hex: '#10b981', label: 'Green' },
        { id: 'orange', hex: '#f97316', label: 'Orange' },
        { id: 'red', hex: '#ef4444', label: 'Red' },
    ];

    const colors = [...defaultColors, ...customColors];

    const addColor = () => {
        if (!newColorLabel) return;
        addCustomColor({
            id: `custom-color-${Date.now()}`,
            hex: newColorHex,
            label: newColorLabel
        });
        setNewColorHex('#000000');
        setNewColorLabel('');
        setShowColorModal(false);
    };

    const densities = [
        { id: 'compact', label: 'Compact', desc: 'Dense, for power users' },
        { id: 'default', label: 'Default', desc: 'Balanced spacing' },
        { id: 'comfortable', label: 'Comfortable', desc: 'More whitespace' },
    ];

    const defaultFonts = [
        { id: 'sans', label: 'Inter (Sans)', family: 'Inter, system-ui, sans-serif' },
        { id: 'mono', label: 'JetBrains Mono', family: '"JetBrains Mono", monospace' },
        { id: 'serif', label: 'Serif', family: 'serif' },
    ];

    const allFonts = [...defaultFonts, ...customFonts];

    const systemFonts = [
        "Arial", "Verdana", "Helvetica", "Tahoma", "Trebuchet MS", "Times New Roman", 
        "Georgia", "Garamond", "Courier New", "Brush Script MT", "Segoe UI", "Roboto", "Ubuntu", 
        "Fira Code", "Source Code Pro", "Open Sans", "Lato", "Montserrat"
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const fontName = file.name.split('.')[0];
            addCustomFont({
                id: `custom-${Date.now()}`,
                label: fontName,
                family: fontName,
                type: 'custom',
                src: event.target?.result as string
            });
        };
        reader.readAsDataURL(file);
    };

    const addSystemFont = (font: string) => {
        // Check if exists
        if (allFonts.find(f => f.family.includes(font))) return;
        
        addCustomFont({
            id: `sys-${font.toLowerCase().replace(/\s+/g, '-')}`,
            label: font,
            family: font,
            type: 'system'
        });
        setShowFontModal(false);
    };

    if (!showSettings) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="h-16 shrink-0 border-b border-white/10 flex items-center justify-between px-6 bg-surface-alt">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 text-primary p-2 rounded-lg">
                            <SettingsIcon size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">App Settings</h2>
                            <p className="text-xs text-text-muted">Preferences & Configuration</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowSettings(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Navigation */}
                    <div className="w-64 bg-surface border-r border-white/10 p-4 space-y-2 overflow-y-auto">
                        <div className="mb-2 px-2 text-xs font-bold text-text-muted uppercase tracking-wider">Groups</div>
                        {[
                            { id: 'general', label: 'General', icon: LayoutTemplate },
                            { id: 'ai', label: 'AI Assistant', icon: Sparkles },
                            { id: 'dev', label: 'Developers', icon: Activity },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                                    activeTab === tab.id 
                                        ? "bg-primary/20 text-primary border border-primary/20 shadow-sm" 
                                        : "text-text-muted hover:bg-white/5 hover:text-white border border-transparent"
                                )}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-canvas/30">
                        {activeTab === 'general' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    {/* Theme Mode */}
                                <section>
                                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                                        <Monitor className="text-primary" size={18} /> Appearance
                                    </h2>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => setTheme('light')}
                                            className={`flex items-center gap-2 px-6 py-4 rounded-xl border transition-all ${theme === 'light' ? 'bg-primary/20 text-text-main border-primary shadow-xl scale-105' : 'bg-transparent text-text-muted border-border hover:bg-hover-bg hover:text-text-main'}`}
                                        >
                                            <SunDim size={20} className={theme === 'light' ? 'text-orange-500' : ''} /> 
                                            <span className={`font-bold ${theme === 'light' ? 'text-primary' : ''}`}>Soft Light</span>
                                        </button>
                                        <button 
                                            onClick={() => setTheme('ultra-light')}
                                            className={`flex items-center gap-2 px-6 py-4 rounded-xl border transition-all ${theme === 'ultra-light' ? 'bg-primary/20 text-text-main border-primary shadow-xl scale-105' : 'bg-transparent text-text-muted border-border hover:bg-hover-bg hover:text-text-main'}`}
                                        >
                                            <Sun size={20} className={theme === 'ultra-light' ? 'text-yellow-400 fill-yellow-400' : ''} /> 
                                            <span className={`font-bold ${theme === 'ultra-light' ? 'text-primary' : ''}`}>Ultra Light</span>
                                        </button>
                                        <button 
                                            onClick={() => setTheme('dark')}
                                            className={`flex items-center gap-2 px-6 py-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-primary/25 text-text-main border-primary shadow-xl scale-105 ring-2 ring-primary/40' : 'bg-transparent text-text-muted border-border hover:bg-hover-bg hover:text-text-main'}`}
                                        >
                                            <Moon size={20} className={theme === 'dark' ? 'text-blue-400 fill-blue-400' : 'text-slate-700 fill-slate-700'} />
                                                <span className={`font-bold ${theme === 'dark' ? 'text-primary' : ''}`}>Dark Mode</span>
                                        </button>
                                        <button 
                                            onClick={() => setTheme('neo')}
                                            className={`flex items-center gap-2 px-6 py-4 rounded-xl border transition-all ${theme === 'neo' ? 'bg-primary/25 text-text-main border-primary shadow-xl scale-105 ring-2 ring-primary/40' : 'bg-transparent text-text-muted border-border hover:bg-hover-bg hover:text-text-main'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${theme === 'neo' ? 'text-primary' : 'text-slate-700'}`}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                            </div>
                                                <span className={`font-bold ${theme === 'neo' ? 'text-primary' : ''}`}>Neon</span>
                                        </button>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Accent Color */}
                                    <section>
                                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                                                <Palette className="text-primary" size={18} /> Accent Color
                                        </h2>
                                        <div className="flex gap-4 flex-wrap">
                                            {colors.map(color => (
                                                <div key={color.id} className="relative group flex justify-center">
                                                    <button
                                                        onClick={() => setAccentColor(color.id as any)}
                                                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${accentColor === color.id ? 'ring-4 ring-primary/30 scale-110' : 'hover:scale-105'}`}
                                                        style={{ background: color.hex }}
                                                        title={color.label}
                                                    >
                                                        {accentColor === color.id && <div className="w-2.5 h-2.5 min-w-[10px] min-h-[10px] bg-white rounded-full shadow-sm" />}
                                                    </button>
                                                    {!defaultColors.find(c => c.id === color.id) && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); removeCustomColor(color.id); }}
                                                            className="absolute p-2! top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-surface border border-border text-red-500 rounded-full shadow-md opacity-0 scale-50 transition-all duration-300 group-hover:translate-y-[32px] group-hover:opacity-100 group-hover:scale-100 z-0 hover:bg-red-50"
                                                            title="Remove Color"
                                                        >
                                                            <X size={14} strokeWidth={3} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                className="w-10 h-10 p-1! rounded-full flex items-center justify-center transition-all bg-surface border border-dashed border-border hover:border-primary text-text-muted hover:text-primary"
                                                title="Add Custom Color"
                                                onClick={() => setShowColorModal(true)}
                                            >
                                                <Plus size={18} className="text-current" />
                                            </button>
                                        </div>
                                    </section>
                                    
                                    {/* Density */}
                                    <section>
                                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                                                <Rows className="text-primary" size={18} /> Density
                                        </h2>
                                        <div className="flex gap-2">
                                            {densities.map(d => (
                                                <button
                                                    key={d.id}
                                                    onClick={() => setDensity(d.id as any)}
                                                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${density === d.id ? 'glass-panel bg-primary/20 text-text-main border-primary shadow-xl scale-105' : 'glass-panel bg-transparent text-text-muted border-border hover:bg-hover-bg hover:text-text-main'}`}
                                                >
                                                    <div className={`font-bold mb-1 ${density === d.id ? 'text-primary' : ''}`}>{d.label}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* Typography & Dashboard View */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <section>
                                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                                            <Type className="text-primary" size={18} /> Typography
                                        </h2>
                                        <div className="flex flex-col gap-2">
                                            {allFonts.map(f => (
                                                <div key={f.id} className="relative group w-full">
                                                    <button 
                                                        onClick={() => setFontFamily(f.id as any)}
                                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${fontFamily === f.id ? 'bg-primary/20 text-text-main border-primary shadow-lg' : 'bg-transparent text-text-muted border-border hover:bg-hover-bg hover:text-text-main'}`}
                                                    >
                                                        <span className={`font-bold whitespace-nowrap ${fontFamily === f.id ? 'text-primary' : ''}`} style={{ fontFamily: f.family }}>{f.label}</span>
                                                        <span className="text-xs opacity-50" style={{ fontFamily: f.family }}>Abc 123</span>
                                                    </button>
                                                    {(f as any).type && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); removeCustomFont(f.id); }}
                                                            className="absolute top-1/2 -right-2 -translate-y-1/2 bg-error text-white rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-sm transition-all hover:scale-110"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <div className="flex gap-2 mt-2">
                                                    <Button variant="outline" onClick={() => setShowFontModal(true)} className="flex-1 text-xs h-8">
                                                        <Plus size={12} className="mr-1"/> Add System
                                                    </Button>
                                                    <div className="relative flex-1">
                                                    <input 
                                                        type="file" 
                                                        accept=".ttf,.otf,.woff,.woff2" 
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={handleFileUpload}
                                                    />
                                                    <Button variant="outline" className="w-full text-xs h-8">
                                                        <Upload size={12} className="mr-1"/> Upload
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                                                <LayoutDashboard className="text-primary" size={18} /> Dashboard
                                        </h2>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => setDashboardViewMode('grid')}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${dashboardViewMode === 'grid' ? 'bg-primary/20 text-text-main border-primary shadow-xl' : 'bg-transparent text-text-muted border-border hover:bg-hover-bg hover:text-text-main'}`}
                                            >
                                                <LayoutGrid size={18} className={dashboardViewMode === 'grid' ? 'text-primary' : ''} />
                                                <span className={`font-bold ${dashboardViewMode === 'grid' ? 'text-primary' : ''}`}>Grid View</span>
                                            </button>
                                            <button
                                                onClick={() => setDashboardViewMode('list')}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${dashboardViewMode === 'list' ? 'bg-primary/20 text-text-main border-primary shadow-xl' : 'bg-transparent text-text-muted border-border hover:bg-hover-bg hover:text-text-main'}`}
                                            >
                                                <List size={18} className={dashboardViewMode === 'list' ? 'text-primary' : ''} />
                                                <span className={`font-bold ${dashboardViewMode === 'list' ? 'text-primary' : ''}`}>List View</span>
                                            </button>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <AISettings />
                            </div>
                        )}

                        {activeTab === 'dev' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg flex items-start gap-3">
                                    <Activity className="text-orange-400 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <h3 className="font-bold text-orange-400">Developer Options</h3>
                                        <p className="text-sm text-text-muted mt-1">These settings are for debugging purposes and may affect application performance.</p>
                                    </div>
                                </div>

                                {/* Debug Mode Toggle */}
                                <div className="flex items-center justify-between p-4 glass-panel rounded-xl bg-surface border border-white/10">
                                    <div>
                                        <div className="font-bold text-white">Debug Mode</div>
                                        <div className="text-xs opacity-50">Enable advanced logs and error tracking</div>
                                    </div>
                                    <button
                                        onClick={() => setDebugMode(!debugMode)}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${
                                            debugMode ? 'bg-primary' : 'bg-white/10'
                                        }`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${debugMode ? 'translate-x-5' : ''}`}/>
                                    </button>
                                </div>

                                {/* Performance Monitoring Toggle */}
                                <div className="flex items-center justify-between p-4 glass-panel rounded-xl bg-surface border border-white/10">
                                    <div>
                                        <div className="font-bold text-white">Performance Monitoring</div>
                                        <div className="text-xs opacity-50">Track FPS, Memory, and Query times</div>
                                    </div>
                                    <button
                                        onClick={() => setPerformanceMonitoring(!performanceMonitoring)}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${
                                            performanceMonitoring ? 'bg-primary' : 'bg-white/10'
                                        }`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${performanceMonitoring ? 'translate-x-5' : ''}`}/>
                                    </button>
                                </div>

                                {/* Performance Overlay Toggle */}
                                <div className="flex items-center justify-between p-4 glass-panel rounded-xl bg-surface border border-white/10">
                                    <div>
                                        <div className="font-bold text-white">Show Performance Overlay</div>
                                        <div className="text-xs opacity-50">Display real-time metrics on screen</div>
                                    </div>
                                    <button
                                        onClick={() => setShowPerformanceOverlay(!showPerformanceOverlay)}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${
                                            showPerformanceOverlay ? 'bg-primary' : 'bg-white/10'
                                        }`}
                                        disabled={!performanceMonitoring}
                                    >
                                        <div
                                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                                showPerformanceOverlay ? 'translate-x-5' : ''
                                            } ${!performanceMonitoring ? 'opacity-50' : ''}`}
                                        />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            {/* System Font Modal */}
            {showFontModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-white">Select System Font</h3>
                            <button onClick={() => setShowFontModal(false)}><X size={20}/></button>
                        </div>
                        <div className="p-4 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                                <input 
                                    className="w-full bg-canvas border border-border rounded-lg pl-9 pr-4 py-2 outline-none focus:border-primary text-sm" 
                                    placeholder="Search fonts..."
                                    value={fontSearch}
                                    onChange={e => setFontSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {systemFonts.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase())).map(font => {
                                const isAdded = allFonts.find(af => af.family === font);
                                return (
                                    <button 
                                        key={font}
                                        onClick={() => !isAdded && addSystemFont(font)}
                                        disabled={!!isAdded}
                                        className={`w-full text-left p-3 rounded-lg flex justify-between items-center ${isAdded ? 'opacity-50 cursor-default' : 'hover:bg-white/5'}`}
                                    >
                                        <span style={{ fontFamily: font }} className="text-white">{font}</span>
                                        {isAdded && <Check size={16} className="text-green-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            {/* Add Color Modal */}
            {showColorModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg text-white">Add Custom Color</h3>
                            <button onClick={() => setShowColorModal(false)}><X size={20} className="text-text-muted hover:text-white" /></button>
                        </div>
                        
                        <div className="flex gap-4 items-center">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-border shadow-inner" style={{ background: newColorHex }}>
                                <input 
                                    type="color" 
                                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
                                    value={newColorHex}
                                    onChange={(e) => setNewColorHex(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold uppercase text-text-muted mb-1 block">Color Label</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Neon Pink"
                                    className="w-full bg-canvas border border-border rounded-lg px-3 py-2 outline-none focus:border-primary text-white"
                                    value={newColorLabel}
                                    onChange={(e) => setNewColorLabel(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && addColor()}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-2">
                            <Button variant="ghost" onClick={() => setShowColorModal(false)}>Cancel</Button>
                            <Button disabled={!newColorLabel} onClick={addColor}>Add Color</Button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
