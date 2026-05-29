'use client';

import * as React from 'react';
import { 
  Terminal, 
  RefreshCw, 
  User, 
  CreditCard, 
  Settings2, 
  FileText, 
  Clock, 
  Info,
  SlidersHorizontal,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  event: string;
  details: string;
  user: string;
  type: 'user' | 'billing' | 'system' | 'proposal';
  timestamp: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState<string>('all');

  const fetchLogs = React.useCallback(async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/logs');
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else if (data.data) {
        setLogs(data.data);
        if (showToast) toast.success('Telemetry logs synchronized.');
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      toast.error('Failed to contact audit services.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="h-4.5 w-4.5 text-blue-500" />;
      case 'billing':
        return <CreditCard className="h-4.5 w-4.5 text-emerald-500" />;
      case 'proposal':
        return <FileText className="h-4.5 w-4.5 text-cyan-500" />;
      default:
        return <Settings2 className="h-4.5 w-4.5 text-indigo-500" />;
    }
  };

  const getLogTypeBadge = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      case 'billing':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
      case 'proposal':
        return 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50';
      default:
        return 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50';
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-NG', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    } catch {
      return dateStr;
    }
  };

  // Filter logs based on type
  const filteredLogs = logs.filter(log => typeFilter === 'all' || log.type === typeFilter);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Audit Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time trace of commercial, authentication, and platform events.</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs(true)}
          disabled={isRefreshing}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync Audit Trail</span>
        </Button>
      </div>

      {/* Main Container */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm rounded-2xl overflow-hidden">
        {/* Controls / Filter Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/10">
          <div className="flex items-center gap-2">
            <Terminal className="h-4.5 w-4.5 text-teal-655" />
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100 uppercase tracking-wider">Operational Audit Trail</h3>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-450" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Events</option>
              <option value="user">Access & Teams</option>
              <option value="billing">Paystack & Billing</option>
              <option value="proposal">Proposals Generated</option>
              <option value="system">Settings & Rates</option>
            </select>
          </div>
        </div>

        {/* Audit Logs Trail Feed */}
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-semibold text-slate-505 animate-pulse">Decompiling audit timelines...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-xs font-semibold text-slate-450">
              No audit logs captured matching query specifications.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-850/20 border border-slate-100/50 dark:border-slate-800/40 bg-white dark:bg-slate-900/10 transition-colors"
                >
                  {/* Icon badge */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-xl shadow-xs shrink-0 self-start">
                    {getLogIcon(log.type)}
                  </div>

                  {/* Log description */}
                  <div className="flex-1 space-y-1 text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white">{log.event}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase font-bold border ${getLogTypeBadge(log.type)}`}>
                          {log.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatShortDate(log.timestamp)}</span>
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 font-medium text-xs leading-relaxed">
                      {log.details}
                    </p>

                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1 pt-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-teal-600/80" />
                      <span>Authorized Operator: <strong className="text-slate-655 dark:text-slate-350">{log.user}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
