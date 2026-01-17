import React from 'react';
import { Outlet, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { 
    Activity, Search, Plus, Settings, MoreHorizontal, 
    LayoutGrid, List as ListIcon, RefreshCcw, Zap, Terminal, Info, User, Key, ChevronRight,
    Database as DBIcon
} from 'lucide-react';
import { Breadcrumbs } from '@/components/Navigation/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { CreateDatabaseModal } from './CreateDatabaseModal';
import { CreateTableModal } from '../database/CreateTableModal';
import { AddServerModal } from '../dashboard/AddServerModal';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Modal } from '@/components/ui/Modal';
import { UsersManagementModal } from './UsersManagementModal';
import { PasswordRotationModal } from './PasswordRotationModal';

// --- Extra Modals (copied/refined from ServerOverview) ---

function ProcessListModal({ onClose }: { onClose: () => void }) {
    const { data: processes, isLoading, refetch } = useQuery({
        queryKey: ['processList'],
        queryFn: () => dbApi.getProcessList(),
        refetchInterval: 5000
    });

    const killMutation = useMutation({
        mutationFn: (id: number) => dbApi.executeQuery('', `KILL ${id}`),
        onSuccess: () => {
            refetch();
        }
    });

    return (
        <Modal isOpen={true} onClose={onClose} title="Server Processes" size="lg">
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-text-muted">Live view of active connections and queries.</p>
                    <Button size="xs" variant="outline" onClick={() => refetch()} className="gap-2">
                        <RefreshCcw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh
                    </Button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden bg-canvas">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-surface border-b border-border">
                            <tr>
                                <th className="px-4 py-2 font-bold opacity-50 uppercase">ID</th>
                                <th className="px-4 py-2 font-bold opacity-50 uppercase">User</th>
                                <th className="px-4 py-2 font-bold opacity-50 uppercase">Host</th>
                                <th className="px-4 py-2 font-bold opacity-50 uppercase">DB</th>
                                <th className="px-4 py-2 font-bold opacity-50 uppercase">Command</th>
                                <th className="px-4 py-2 font-bold opacity-50 uppercase">Time</th>
                                <th className="px-4 py-2 font-bold opacity-50 uppercase">State</th>
                                <th className="px-4 py-2 font-bold opacity-50 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {processes?.map((p: any) => (
                                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2 font-mono">{p.id}</td>
                                    <td className="px-4 py-2">{p.user}</td>
                                    <td className="px-4 py-2 truncate max-w-[100px]" title={p.host}>{p.host}</td>
                                    <td className="px-4 py-2">{p.db || '-'}</td>
                                    <td className="px-4 py-2 font-semibold text-primary">{p.command}</td>
                                    <td className="px-4 py-2">{p.time}s</td>
                                    <td className="px-4 py-2 italic text-text-muted/60">{p.state || '-'}</td>
                                    <td className="px-4 py-2">
                                        <button 
                                            onClick={() => killMutation.mutate(p.id)}
                                            className="text-error hover:underline font-bold disabled:opacity-30"
                                            disabled={killMutation.isPending}
                                        >
                                            Kill
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Modal>
    );
}

function VariablesModal({ type, onClose }: { type: 'status' | 'variables', onClose: () => void }) {
    const [filter, setFilter] = React.useState('');
    const { data: variables, isLoading } = useQuery({
        queryKey: [type, filter],
        queryFn: () => type === 'status' ? dbApi.getStatusVariables(filter) : dbApi.getServerVariables(filter),
        refetchInterval: type === 'status' ? 10000 : false 
    });

    const title = type === 'status' ? 'Global Status Variables' : 'System Variables';
    const description = type === 'status' 
        ? 'Real-time throughput and performance counters.' 
        : 'Server-level system configuration settings.';

    return (
        <Modal isOpen={true} onClose={onClose} title={title} size="lg">
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-text-muted">{description}</p>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted opacity-40 w-3 h-3 pointer-events-none" />
                        <input 
                            type="text" 
                            placeholder="Filter..." 
                            className="bg-canvas border border-border rounded-lg pl-8 pr-4 h-7 w-40 text-xs outline-none focus:border-primary/50" 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div className="border border-border rounded-lg overflow-hidden bg-canvas max-h-[50vh] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-surface border-b border-border sticky top-0">
                            <tr>
                                <th className="px-4 py-2 font-bold opacity-50 uppercase">Variable Name</th>
                                <th className="px-4 py-2 font-bold opacity-50 uppercase">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoading ? (
                                <tr><td colSpan={2} className="px-4 py-4 text-center opacity-40">Loading...</td></tr>
                            ) : variables?.length === 0 ? (
                                <tr><td colSpan={2} className="px-4 py-4 text-center opacity-40">No variables found.</td></tr>
                            ) : (
                                variables?.map((v: any) => (
                                    <tr key={v.variable_name} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-2 font-mono text-primary/80">{v.variable_name}</td>
                                        <td className="px-4 py-2 font-mono break-all">{v.value}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Modal>
    );
}

// --- Subcomponents for Menu (copied from ServerOverview) ---
function ServerActionMenu({ onClose, onAction }: { onClose: () => void, onAction: (action: string) => void }) {
    const { showSystemDbs, setShowSystemDbs } = useAppStore();

    const actions = [
        { id: 'flush', label: 'Flush Privileges', icon: Zap, color: 'text-orange-400' },
        { id: 'flush_logs', label: 'Flush Logs/Cache', icon: RefreshCcw, color: 'text-blue-400' },
        { id: 'processes', label: 'Show Processes', icon: Terminal, color: 'text-primary' },
        { id: 'variables', label: 'System Variables', icon: Info, color: 'text-purple-400' },
        { id: 'status', label: 'Global Status', icon: Activity, color: 'text-green-400' },
        { id: 'users', label: 'User Accounts', icon: User, color: 'text-amber-400' },
        { id: 'rotate_pass', label: 'Rotate My Password', icon: Key, color: 'text-rose-400' },
        { id: 'refresh', label: 'Force Refresh Stats', icon: RefreshCcw, color: 'text-green-400' },
        { id: 'toggle_system', label: showSystemDbs ? 'Hide System Databases' : 'Show System Databases', icon: Info, color: 'text-blue-400' },
    ];

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-border/50 bg-black/5">
                    <p className="text-[12px] font-bold uppercase opacity-40 tracking-wider">Administrative Actions</p>
                </div>
                <div className="flex flex-col divide-y">
                    {actions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => { onAction(action.id); onClose(); }}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-hover-bg transition-colors flex items-center gap-3 group border-0! rounded-none! focus:outline-none!"
                        >
                            <action.icon size={16} className={`${action.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                            <span className="flex-1 font-medium whitespace-nowrap">{action.label}</span>
                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-20 transition-all -translate-x-1 group-hover:translate-x-0" />
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

export function ServerLayout() {
    const { serverId, dbName } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { show: showNotification } = useNotificationStore();
    const { 
        currentServer, 
        setShowCreateDbModal, showCreateDbModal, 
        showEditServerModal, setShowEditServerModal,
        dashboardViewMode, setDashboardViewMode,
        tableViewMode, setTableViewMode,
        dashboardSearchTerm, setDashboardSearchTerm,
        showSystemDbs, setShowSystemDbs,
        showCreateTableModal, setShowCreateTableModal
    } = useAppStore();

    const isDashboard = !dbName;

    // --- Modal States ---
    const [showProcessList, setShowProcessList] = React.useState(false);
    const [showVariablesModal, setShowVariablesModal] = React.useState<'status' | 'variables' | null>(null);
    const [showUsersModal, setShowUsersModal] = React.useState(false);
    const [showRotationModal, setShowRotationModal] = React.useState(false);

    // --- Data Fetching (Redundant but needed for header stats) ---
    const { data: statsData } = useQuery({
        queryKey: ['serverStats', currentServer?.id],
        queryFn: () => dbApi.getServerStats(),
        enabled: !!currentServer
    });
    
    const { data: databases } = useQuery({
        queryKey: ['databases', serverId],
        queryFn: () => dbApi.getDatabases(),
        enabled: !!serverId
    });

    // --- Stats Parsing ---
    const stats = statsData?.rows?.[0] || [];
    const version = stats[0] || 'Unknown';
    const uptimeValue = stats[1]; 
    const uptimeSeconds = typeof uptimeValue === 'number' ? uptimeValue : parseInt(uptimeValue || '0');
    const uptimeHours = Math.floor(uptimeSeconds / 3600);
    const uptime = uptimeHours > 0 ? `${uptimeHours}h` : `${Math.floor(uptimeSeconds / 60)}m`;
    const user = stats[2] || 'Unknown';

    // --- Actions ---
    const [showActionMenu, setShowActionMenu] = React.useState(false);

    const flushMutation = useMutation({
        mutationFn: () => dbApi.executeQuery('FLUSH PRIVILEGES'),
        onSuccess: () => showNotification('Privileges flushed successfully!', 'success'),
        onError: (err) => showNotification('Failed to flush privileges: ' + err, 'error')
    });

    const handleDbChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDb = e.target.value;
        if (newDb && newDb !== dbName) {
            navigate(`/server/${serverId}/${newDb}`);
        }
    };

    return (
        <div className="h-full flex flex-col bg-main text-text-main overflow-hidden">
            
            {/* --- PERSISTENT BIG HEADER (Original Design) --- */}
            <header className="p-8 pb-4 flex-shrink-0 flex items-end justify-between border-b border-border/40 bg-main">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="text-primary" size={32} />
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {currentServer?.name || 'Server Overview'}
                            </h1>
                            <div className="flex items-baseline gap-1 bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 shadow-sm shadow-primary/5">
                                <span className="text-sm font-bold text-primary">{uptime}</span>
                                <span className="text-[10px] uppercase font-bold opacity-60 text-primary">uptime</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-text-muted text-xs opacity-70 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-text-main">
                            {version.includes('MariaDB') ? 'MariaDB Engine' : 'MySQL Community'} ({version.split('-')[0]})
                        </span>
                        <span className="opacity-30">&bull;</span>
                        <span>{user.split('@')[0]}@{currentServer?.host}</span>
                        <span className="opacity-30">&bull;</span>
                        <span>
                            {databases?.length || 0} Databases, {databases?.reduce((acc, db) => acc + (db.tables_count || 0), 0) || 0} Tables
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Create Button */}
                    <div className="flex items-center gap-2 pr-3 border-r border-border/20">
                        <Button 
                            size="sm" 
                            className="h-10 gap-2 px-4 text-xs font-bold shadow-sm"
                            onClick={() => isDashboard ? setShowCreateDbModal(true) : setShowCreateTableModal(true)}
                        >
                            <Plus size={16} /> 
                            {isDashboard ? 'Create Database' : 'Create Table'}
                        </Button>
                    </div>

                    {/* Context Switcher: Search (Dashboard) OR Dropdown (DB View) */}
                    <div className="flex items-center gap-3">
                        {isDashboard ? (
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted opacity-40 group-focus-within:opacity-70 group-focus-within:text-primary w-4 h-4 transition-all pointer-events-none" />
                                <input 
                                    type="text" 
                                    placeholder="Search databases..." 
                                    className="bg-surface/50 border border-border rounded-lg pl-10 pr-4 h-10 w-64 text-xs outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-text-muted/30 hover:border-border/60" 
                                    value={dashboardSearchTerm}
                                    onChange={(e) => setDashboardSearchTerm(e.target.value)}
                                />
                            </div>
                        ) : (
                            <div className="relative">
                                <Select value={dbName || ''} onValueChange={(val) => {
                                    if (val && val !== dbName) {
                                        navigate(`/server/${serverId}/${val}`);
                                    }
                                }}>
                                    <SelectTrigger className="w-64 h-10 bg-surface/50 border-border text-xs font-bold">
                                        <div className="pl-5 truncate text-left">
                                            <SelectValue placeholder="Select Database" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[450px]">
                                        {databases?.map(db => (
                                            <SelectItem key={db.name} value={db.name} className="text-xs font-medium cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <DBIcon className="w-3.5 h-3.5 opacity-50" />
                                                    {db.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* View Toggles (Only meaningful in Dashboard, maybe reuse for Tables later) */}
                        <div className="flex bg-surface/50 border border-border rounded-lg p-1 h-10 gap-1 shadow-inner shadow-black/20">
                            <button 
                                onClick={() => isDashboard ? setDashboardViewMode('grid') : setTableViewMode('grid')}
                                className={cn(
                                    "px-3 flex items-center justify-center rounded transition-all",
                                    (isDashboard ? dashboardViewMode : tableViewMode) === 'grid' 
                                        ? "bg-primary! text-white shadow-sm" 
                                        : "text-text-muted hover:text-text-main hover:bg-white/5"
                                )}
                                title="Grid View"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button 
                                onClick={() => isDashboard ? setDashboardViewMode('list') : setTableViewMode('list')}
                                className={cn(
                                    "px-3 flex items-center justify-center rounded transition-all",
                                    (isDashboard ? dashboardViewMode : tableViewMode) === 'list' 
                                        ? "bg-primary! text-white shadow-sm" 
                                        : "text-text-muted hover:text-text-main hover:bg-white/5"
                                )}
                                title="List View"
                            >
                                <ListIcon size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Settings & More Actions */}
                    <div className="flex items-center gap-2 pl-1">
                        {isDashboard && (
                             <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowEditServerModal(true)}
                                className="h-10 shrink-0 p-1!"
                                title="Server Settings"
                            >
                                <Settings size={18} />
                            </Button>
                        )}
                       
                        <div className="relative">
                            <Button 
                                variant="outline"
                                size="icon"
                                onClick={() => setShowActionMenu(!showActionMenu)}
                                className={cn(
                                    "h-10 shrink-0 p-1!",
                                    showActionMenu && "bg-primary/20! border-primary/40! text-primary hover:bg-primary/30!"
                                )} 
                                title="More Options"
                            >
                                <MoreHorizontal size={18} />
                            </Button>
                            {showActionMenu && (
                                <ServerActionMenu 
                                    onClose={() => setShowActionMenu(false)} 
                                    onAction={(action) => {
                                        if (action === 'refresh') {
                                            queryClient.invalidateQueries({ queryKey: ['serverStats'] });
                                            queryClient.invalidateQueries({ queryKey: ['databases'] });
                                        }
                                        if (action === 'flush') flushMutation.mutate();
                                        if (action === 'toggle_system') setShowSystemDbs(!showSystemDbs);
                                        if (action === 'flush_logs') {
                                             dbApi.executeQuery('', 'FLUSH LOGS')
                                                .then(() => showNotification('Logs & Cache flushed successfully', 'success'))
                                                .catch(err => showNotification('Failed: ' + err, 'error'));
                                             dbApi.executeQuery('', 'FLUSH HOSTS').catch(() => {});
                                        }
                                        if (action === 'processes') setShowProcessList(true);
                                        if (action === 'variables') setShowVariablesModal('variables');
                                        if (action === 'status') setShowVariablesModal('status');
                                        if (action === 'users') setShowUsersModal(true);
                                        if (action === 'rotate_pass') setShowRotationModal(true);
                                    }} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* CONTENT AREA */}
            <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
                <Breadcrumbs />
                <div className="flex-1 overflow-hidden relative">
                     <Outlet />
                </div>
            </div>

            {/* Global Modals */}
            {showCreateDbModal && (
                <CreateDatabaseModal 
                    onClose={() => setShowCreateDbModal(false)}
                    onCreated={() => {
                        queryClient.invalidateQueries({ queryKey: ['databases'] });
                    }}
                />
            )}
             {showEditServerModal && currentServer && (
                <AddServerModal 
                    editingServer={currentServer}
                    onClose={() => setShowEditServerModal(false)}
                    onAdd={() => {
                        setShowEditServerModal(false);
                        queryClient.invalidateQueries({ queryKey: ['savedServers'] });
                    }}
                />
            )}
            {showCreateTableModal && <CreateTableModal />}

            {/* Admin Modals */}
            {showProcessList && (
                <ProcessListModal onClose={() => setShowProcessList(false)} />
            )}
            {showVariablesModal && (
                <VariablesModal
                    type={showVariablesModal}
                    onClose={() => setShowVariablesModal(null)}
                />
            )}
            <UsersManagementModal
                isOpen={showUsersModal}
                onClose={() => setShowUsersModal(false)}
            />
            <PasswordRotationModal
                isOpen={showRotationModal}
                onClose={() => setShowRotationModal(false)}
            />
        </div>
    );
}
