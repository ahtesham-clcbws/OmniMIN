import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Activity } from 'lucide-react';

interface PerformanceMetrics {
    fps: number;
    memory: number;
    queries: number;
    lastRender: number;
}

export function PerformanceOverlay() {
    const { showPerformanceOverlay, theme } = useAppStore();
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        fps: 0,
        memory: 0,
        queries: 0,
        lastRender: 0,
    });

    useEffect(() => {
        if (!showPerformanceOverlay) return;

        let frameCount = 0;
        let lastTime = performance.now();
        let animationFrameId: number;

        const updateMetrics = () => {
            const currentTime = performance.now();
            frameCount++;

            // Update FPS every second
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // Get memory usage (if available)
                const memory = (performance as any).memory
                    ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
                    : 0;

                setMetrics({
                    fps,
                    memory,
                    queries: 0, // TODO: Track via React Query
                    lastRender: Math.round(currentTime - lastTime),
                });

                frameCount = 0;
                lastTime = currentTime;
            }

            animationFrameId = requestAnimationFrame(updateMetrics);
        };

        animationFrameId = requestAnimationFrame(updateMetrics);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [showPerformanceOverlay]);

    if (!showPerformanceOverlay) return null;

    return (
        <div
            className="fixed bottom-4 right-4 w-[250px] h-[200px] rounded-lg border shadow-2xl font-mono text-xs z-50"
            style={{
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(12px)',
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                <Activity size={14} className="text-primary" />
                <span className="font-bold text-primary">Performance</span>
            </div>

            {/* Metrics */}
            <div className="p-3 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="opacity-60">FPS:</span>
                    <span className={`font-bold ${metrics.fps >= 55 ? 'text-green-400' : metrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {metrics.fps}
                    </span>
                </div>

                {metrics.memory > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="opacity-60">Memory:</span>
                        <span className="font-bold">{metrics.memory} MB</span>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <span className="opacity-60">Queries:</span>
                    <span className="font-bold">{metrics.queries}</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="opacity-60">Frame:</span>
                    <span className="font-bold">{metrics.lastRender}ms</span>
                </div>
            </div>

            {/* Footer hint */}
            <div className="absolute bottom-2 left-0 right-0 text-center opacity-30 text-[9px]">
                Toggle in Settings
            </div>
        </div>
    );
}
