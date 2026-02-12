import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Bot, Cpu, Key, Globe, Sparkles, AlertTriangle, CheckCircle, RefreshCw, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { invoke } from '@tauri-apps/api/core';
import { showToast } from '@/utils/ui';

export function AISettings() {
    const { aiConfig, setAIConfig } = useAppStore();
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');
    const [availableModels, setAvailableModels] = useState<{ id: string, name: string }[]>([]);

    const handleChange = (field: keyof typeof aiConfig, value: any) => {
        setAIConfig({ ...aiConfig, [field]: value });
        setTestStatus('idle'); // Reset test status on change
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestStatus('idle');
        setTestMessage('');

        try {
            // Transform camelCase frontend config to snake_case backend config
            const backendConfig = {
                provider: aiConfig.provider,
                api_key: aiConfig.apiKey || null,
                model: aiConfig.model,
                endpoint: aiConfig.endpoint || null,
                temperature: aiConfig.temperature || 0.3,
                max_tokens: aiConfig.maxTokens || 2048
            };

            const models: any = await invoke('get_ai_models', { config: backendConfig });
            
            setAvailableModels(models);
            setTestStatus('success');
            setTestMessage(`Successfully connected to ${aiConfig.provider}. Available models: ${models.length}`);
            showToast(`Connected to ${aiConfig.provider}`, 'success');
        } catch (e) {
            setTestStatus('error');
            setTestMessage(String(e));
            showToast(`Connection failed: ${String(e)}`, 'error');
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    <Bot size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-text-main">AI Assistant Configuration</h2>
                    <p className="text-text-muted text-sm">Configure your AI provider for SQL generation and explanations</p>
                </div>
            </div>

            <div className="bg-canvas border border-border/50 rounded-xl p-6 space-y-6">
                {/* Provider Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-text-muted">AI Provider</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { id: 'ollama', name: 'Ollama (Local)', icon: Cpu },
                            { id: 'gemini', name: 'Google Gemini', icon: Sparkles },
                            { id: 'openai', name: 'OpenAI', icon: Globe },
                            { id: 'disabled', name: 'Disabled', icon: AlertTriangle },
                        ].map((provider) => (
                            <button
                                key={provider.id}
                                onClick={() => handleChange('provider', provider.id)}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
                                    aiConfig.provider === provider.id
                                        ? 'bg-primary/20 border-primary text-primary'
                                        : 'bg-surface border-border text-text-muted hover:border-primary/50 hover:bg-surface/80'
                                }`}
                            >
                                <provider.icon size={20} />
                                <span className="text-sm font-medium">{provider.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Configuration Fields */}
                {aiConfig.provider !== 'disabled' && (
                    <div className="space-y-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        
                        {/* Ollama Specifics */}
                        {aiConfig.provider === 'ollama' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                                        <Globe size={14} /> Host URL
                                    </label>
                                    <input
                                        type="text"
                                        value={aiConfig.endpoint || 'http://localhost:11434'}
                                        onChange={(e) => handleChange('endpoint', e.target.value)}
                                        className="w-full bg-surface border border-border rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors text-text-main"
                                        placeholder="http://localhost:11434"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Cloud Providers Specifics */}
                        {(aiConfig.provider === 'gemini' || aiConfig.provider === 'openai') && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                                    <Key size={14} /> API Key
                                </label>
                                <input
                                    type="password"
                                    value={aiConfig.apiKey || ''}
                                    onChange={(e) => handleChange('apiKey', e.target.value)}
                                    className="w-full bg-surface border border-border rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors text-text-main"
                                    placeholder={`Enter your ${aiConfig.provider === 'gemini' ? 'Gemini' : 'OpenAI'} API Key`}
                                />
                            </div>
                        )}

                        {/* Common Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted flex items-center justify-between">
                                    <span>Model Name</span>
                                    <button 
                                        onClick={async () => {
                                            setTestStatus('idle');
                                            try {
                                                // Also use current draft config for fetching models
                                                const backendConfig = {
                                                    provider: aiConfig.provider,
                                                    api_key: aiConfig.apiKey || null,
                                                    model: aiConfig.model,
                                                    endpoint: aiConfig.endpoint || null,
                                                    temperature: aiConfig.temperature || 0.3,
                                                    max_tokens: aiConfig.maxTokens || 2048
                                                };
                                                const models = await invoke('get_ai_models', { config: backendConfig });
                                                setAvailableModels(models as any[]);
                                                showToast(`Fetched ${(models as any[]).length} models`, 'success');
                                            } catch (e) {
                                                showToast(String(e), 'error');
                                            }
                                        }}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <RefreshCw size={10} /> Fetch Models
                                    </button>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={aiConfig.model}
                                        onChange={(e) => handleChange('model', e.target.value)}
                                        className="w-full bg-surface border border-border rounded-lg pl-4 pr-8 py-2 outline-none focus:border-primary transition-colors text-text-main"
                                        placeholder={aiConfig.provider === 'ollama' ? 'llama3' : 'gpt-4o'}
                                        list="ai-models-list"
                                    />
                                    {availableModels.length > 0 && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer opacity-50 hover:opacity-100">
                                             <List size={14} />
                                        </div>
                                    )}
                                    <datalist id="ai-models-list">
                                        {availableModels.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted">Temperature ({aiConfig.temperature})</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={aiConfig.temperature || 0.3}
                                    onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                                    className="w-full accent-primary h-2 bg-surface rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted">Max Tokens</label>
                                <input
                                    type="number"
                                    value={aiConfig.maxTokens || 2048}
                                    onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                                    className="w-full bg-surface border border-border rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors text-text-main"
                                />
                            </div>
                        </div>

                        {/* Test Connection (Mock Implementation Phase 1) */}
                        <div className="pt-4 flex items-center gap-4">
                           <Button 
                                onClick={handleTestConnection} 
                                disabled={isTesting}
                                variant={testStatus === 'error' ? 'destructive' : 'default'}
                                className="gap-2"
                            >
                                {isTesting ? <RefreshCw className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                {isTesting ? 'Testing...' : 'Test Connection'}
                           </Button>
                           
                           {testStatus !== 'idle' && (
                               <span className={`text-sm ${testStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                   {testMessage}
                               </span>
                           )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
