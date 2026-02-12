import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bug, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConsoleCapture } from '@/hooks/useConsoleCapture';
import { debugApi } from '@/api/debug';
import { useNotificationStore } from '@/stores/useNotificationStore';

const ISSUE_TYPES = [
  { value: 'bug', label: '🐛 Bug' },
  { value: 'ui-issue', label: '🎨 UI Issue' },
  { value: 'performance', label: '⚡ Performance' },
  { value: 'feature-request', label: '💡 Feature Request' },
  { value: 'other', label: '📝 Other' },
];

export function DebugOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const location = useLocation();
  const { getFormattedLogs } = useConsoleCapture();
  const { show: showNotification } = useNotificationStore();

  const handleSubmit = async () => {
    if (!issueType || message.trim().length < 10) {
      showNotification('Please select an issue type and provide a detailed message (min 10 characters)', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const consoleLogs = getFormattedLogs();
      
      await debugApi.saveLog({
        issue_type: issueType,
        message: message.trim(),
        page_route: location.pathname,
        console_logs: consoleLogs,
        metadata: {
          app_version: '0.3.1', // TODO: Get from package.json or env
          platform: navigator.platform,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
        },
      });

      showNotification('Debug log saved successfully! 🎉', 'success');
      
      // Reset form and close
      setIssueType('');
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      showNotification(`Failed to save debug log: ${error}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIssueType('');
    setMessage('');
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 z-[9999] flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all",
          "bg-orange-500 hover:bg-orange-600 text-white font-medium",
          "border border-orange-400/30",
          isOpen && "bg-orange-600"
        )}
        title="Manual Debug Reporter"
      >
        <Bug size={18} />
        <span className="text-xs font-bold">Debug</span>
      </button>

      {/* Overlay Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-[350px] z-[9998] transition-transform duration-300 ease-in-out",
          "bg-surface/95 backdrop-blur-xl border-l border-border shadow-2xl",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Bug className="text-orange-500" size={20} />
              <h2 className="text-lg font-bold">Manual Debug Report</h2>
            </div>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
            {/* Issue Type */}
            <div>
              <label className="block text-xs font-bold text-text-muted mb-2">
                Issue Type <span className="text-error">*</span>
              </label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select issue type..." />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {ISSUE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-text-muted mb-2">
                Description <span className="text-error">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue in detail..."
                className={cn(
                  "w-full h-32 px-3 py-2 rounded-lg border border-border bg-canvas",
                  "text-sm resize-none outline-none",
                  "focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
                  "placeholder:text-text-muted/30"
                )}
                minLength={10}
                required
              />
              <p className="text-xs text-text-muted/50 mt-1">
                {message.length} / 10 minimum characters
              </p>
            </div>

            {/* Auto-captured Info */}
            <div className="space-y-2 p-3 rounded-lg bg-black/10 border border-border/30">
              <p className="text-xs font-bold text-text-muted uppercase">Auto-captured</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-2">
                  <span className="opacity-50">📍 Page:</span>
                  <span className="font-mono text-primary flex-1 break-all">{location.pathname}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="opacity-50">📊 Console:</span>
                  <span className="font-mono">{getFormattedLogs().length} entries</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="opacity-50">⏰ Time:</span>
                  <span className="font-mono">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !issueType || message.trim().length < 10}
              className="flex-1 gap-2"
            >
              <Send size={14} />
              {isSubmitting ? 'Saving...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[9997] backdrop-blur-sm"
          onClick={handleCancel}
        />
      )}
    </>
  );
}
