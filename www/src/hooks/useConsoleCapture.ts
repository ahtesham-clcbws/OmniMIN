import { useState, useEffect, useRef } from 'react';

interface ConsoleLog {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: number;
}

export function useConsoleCapture(maxLogs: number = 50) {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const originalConsole = useRef<{
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
  } | null>(null);

  useEffect(() => {
    // Store original console methods
    originalConsole.current = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    const addLog = (type: 'log' | 'error' | 'warn' | 'info', args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      // Prevent infinite loops by ignoring React Flow internal warnings
      if (message.includes('[React Flow]')) return;
      
      // Defer state update to avoid "update during render" errors
      setTimeout(() => {
        setLogs(prev => [...prev.slice(-(maxLogs - 1)), {
          type,
          message,
          timestamp: Date.now(),
        }]);
      }, 0);
    };

    // Intercept console.log
    console.log = (...args: any[]) => {
      addLog('log', args);
      originalConsole.current!.log(...args);
    };

    // Intercept console.error
    console.error = (...args: any[]) => {
      addLog('error', args);
      originalConsole.current!.error(...args);
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      addLog('warn', args);
      originalConsole.current!.warn(...args);
    };

    // Intercept console.info
    console.info = (...args: any[]) => {
      addLog('info', args);
      originalConsole.current!.info(...args);
    };

    // Cleanup: restore original console methods
    return () => {
      if (originalConsole.current) {
        console.log = originalConsole.current.log;
        console.error = originalConsole.current.error;
        console.warn = originalConsole.current.warn;
        console.info = originalConsole.current.info;
      }
    };
  }, [maxLogs]);

  const getFormattedLogs = (): string[] => {
    return logs.map(log => `[${log.type.toUpperCase()}] ${log.message}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return { logs, getFormattedLogs, clearLogs };
}
