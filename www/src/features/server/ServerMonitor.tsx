import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dbApi } from '@/api/db';
import { ServerStatus } from '@/api/commands';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Wifi } from 'lucide-react';

interface MonitorPoint {
    time: string;
    connections: number;
    qps: number;
    trafficIn: number;
    trafficOut: number;
    raw: ServerStatus;
}

export default function ServerMonitor() {
    const [history, setHistory] = React.useState<MonitorPoint[]>([]);
    const lastDataRef = React.useRef<ServerStatus | null>(null);
    const lastTimeRef = React.useRef<number>(Date.now());

    useQuery({
        queryKey: ['server_monitor'],
        queryFn: async () => {
            const status = await dbApi.getServerStatus();
            const now = Date.now();
            const timeStr = new Date(now).toLocaleTimeString();
            
            if (lastDataRef.current) {
                const deltaSec = (now - lastTimeRef.current) / 1000;
                // Only update if at least ~1s passed to avoid spikes on rapid re-renders/fetches
                if (deltaSec > 0.5) { 
                    const qps = Math.max(0, (status.queries - lastDataRef.current.queries) / deltaSec);
                    const trafficIn = Math.max(0, (status.bytes_received - lastDataRef.current.bytes_received) / deltaSec);
                    const trafficOut = Math.max(0, (status.bytes_sent - lastDataRef.current.bytes_sent) / deltaSec);
    
                    const newPoint: MonitorPoint = {
                        time: timeStr,
                        connections: status.connections,
                        qps: Math.round(qps),
                        trafficIn: Math.round(trafficIn),     // Bytes/sec
                        trafficOut: Math.round(trafficOut),   // Bytes/sec
                        raw: status
                    };
    
                    setHistory(prev => {
                        const newHistory = [...prev, newPoint];
                        if (newHistory.length > 20) return newHistory.slice(1); // Keep last 20 points
                        return newHistory;
                    });
                     
                    // Update refs only after successful data point
                    lastDataRef.current = status;
                    lastTimeRef.current = now;
                }
            } else {
                // First run initialization
                lastDataRef.current = status;
                lastTimeRef.current = now;
            }
            return status;
        },
        refetchInterval: 5000, 
        refetchIntervalInBackground: true
    });

    const formatBytes = (bytes: number) => {
        if (!bytes && bytes !== 0) return '0 B';
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const sizes = ['B', 'KB', 'MB', 'GB'];
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}/s`;
    };

    if (history.length < 1) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground animate-pulse text-xs font-mono">
                Initializing Server Monitor (Poll: 5s)...
            </div>
        );
    }

    const latest = history[history.length - 1] || { qps: 0, connections: 0, trafficIn: 0, trafficOut: 0 };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 select-none">
             {/* QPS & Connections Chart */}
             <div className="glass-panel border-white/5 bg-black/20 col-span-2 flex flex-col p-0">
                <div className="px-4 py-3 flex flex-row items-center justify-between border-b border-white/5">
                    <div className="text-sm font-medium flex items-center gap-2 text-primary/80">
                        <Activity className="h-4 w-4" /> 
                        Load & Throughput
                    </div>
                    <div className="flex gap-4 text-xs font-mono">
                         <span className="text-blue-400 font-bold">QPS: {latest.qps}</span>
                         <span className="text-orange-400 font-bold">Conn: {latest.connections}</span>
                    </div>
                </div>
                <div className="h-[180px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorQps" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis yAxisId="left" stroke="#3b82f650" fontSize={10} width={30} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#f9731650" fontSize={10} width={30} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '6px' }}
                                itemStyle={{ fontSize: '12px', padding: 0 }}
                                labelStyle={{ color: '#888', fontSize: '10px', marginBottom: '4px' }}
                                cursor={{ stroke: '#ffffff20' }}
                            />
                            <Area yAxisId="left" type="monotone" dataKey="qps" stroke="#3b82f6" fillOpacity={1} fill="url(#colorQps)" strokeWidth={2} name="Queries/sec" animationDuration={500} isAnimationActive={false} />
                            <Line yAxisId="right" type="stepAfter" dataKey="connections" stroke="#f97316" strokeWidth={2} dot={false} name="Connections" animationDuration={500} isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Network Traffic */}
            <div className="glass-panel border-white/5 bg-black/20 flex flex-col p-0">
                <div className="px-4 py-3 flex flex-row items-center justify-between border-b border-white/5">
                    <div className="text-sm font-medium flex items-center gap-2 text-emerald-400/80">
                        <Wifi className="h-4 w-4" /> 
                        Network Traffic
                    </div>
                     <div className="text-xs font-mono text-emerald-400 font-bold">
                         {formatBytes(latest.trafficIn + latest.trafficOut)}
                    </div>
                </div>
                <div className="h-[180px] w-full mt-2">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis stroke="#10b98150" fontSize={10} width={40} tickFormatter={(val) => formatBytes(val).split(' ')[0]} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '6px' }}
                                labelStyle={{ display: 'none' }}
                                formatter={(val: number | undefined) => [formatBytes(val || 0), '']}
                                cursor={{ stroke: '#ffffff20' }}
                            />
                            <Line type="monotone" dataKey="trafficIn" stroke="#10b981" strokeWidth={2} dot={false} name="Inbound" isAnimationActive={false} />
                            <Line type="monotone" dataKey="trafficOut" stroke="#a855f7" strokeWidth={2} dot={false} name="Outbound" isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
