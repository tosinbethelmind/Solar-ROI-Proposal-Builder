'use client';

import * as React from 'react';
import { formatFXDisplay } from '@/utils/exchangeRate';
import { RefreshCw, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function FXRateBadge() {
  const [rate, setRate] = React.useState<number | null>(null);
  const [isEstimated, setIsEstimated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastFetched, setLastFetched] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<'cached' | 'live' | 'last_known' | 'fallback'>('cached');
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const fetchBackground = async (currentRate: number | null) => {
    setIsRefreshing(true);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error('Fetch failed');
      const data = await response.json();
      
      if (data && data.rates && data.rates.NGN) {
        const liveRate = data.rates.NGN;
        localStorage.setItem('solarquotepro_last_fx_rate', liveRate.toString());
        localStorage.setItem('solarquotepro_fx_rate_timestamp', Date.now().toString());
        
        setRate(liveRate);
        setIsEstimated(false);
        setStatus('live');
        setLastFetched(new Date().toLocaleString(undefined, {
          day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
        }));
      } else {
        throw new Error('Invalid NGN rate in response');
      }
    } catch (err) {
      console.warn('FX background fetch failed, using fallback/cached rate.', err);
      if (currentRate) {
        setStatus('last_known');
        setIsEstimated(true);
      } else {
        setRate(1600);
        setStatus('fallback');
        setIsEstimated(true);
      }
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Synchronously read local cache on mount
      const cachedRateStr = localStorage.getItem('solarquotepro_last_fx_rate');
      const cachedTimeStr = localStorage.getItem('solarquotepro_fx_rate_timestamp');
      
      let initialRate: number | null = null;
      let isCachedValid = false;
      let cachedTimeFormatted = '';
      
      if (cachedRateStr) {
        initialRate = parseFloat(cachedRateStr);
        if (cachedTimeStr) {
          const time = parseInt(cachedTimeStr, 10);
          const age = Date.now() - time;
          isCachedValid = age < 4 * 60 * 60 * 1000; // 4 hours
          cachedTimeFormatted = new Date(time).toLocaleString(undefined, {
            day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
          });
        }
      }
      
      if (initialRate !== null) {
        setRate(initialRate);
        setLastFetched(cachedTimeFormatted);
        setIsEstimated(!isCachedValid);
        setStatus(isCachedValid ? 'cached' : 'last_known');
        setLoading(false);
        
        // Fetch fresh in background
        fetchBackground(initialRate);
      } else {
        // No cache, fetch immediately (blocking display of fallback until resolved)
        fetchBackground(null);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleManualRefresh = () => {
    fetchBackground(rate);
  };

  if (loading && !rate) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold dark:bg-slate-800 dark:text-slate-400">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Fetching rate...</span>
      </div>
    );
  }

  // Label to show in the pill
  const getStatusLabel = () => {
    if (status === 'live') return 'Live';
    if (status === 'cached') return 'Cached';
    if (status === 'last_known') return 'Last Known';
    return 'Fallback';
  };

  const getBadgeColors = () => {
    if (status === 'live') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
    if (status === 'cached') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1">
        <button 
          onClick={() => setPopoverOpen(!popoverOpen)}
          className={`flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-semibold shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-850 ${getBadgeColors()}`}
          title="Click to view exchange rate details"
        >
          <span>Rate: {rate ? formatFXDisplay(rate) : '₦1,600/$1'}</span>
          <span className="flex items-center gap-1 text-[10px] bg-white/60 dark:bg-black/25 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {isEstimated ? (
              <AlertCircle className="w-3 h-3 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3 h-3 shrink-0" />
            )}
            {getStatusLabel()}
          </span>
        </button>

        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-full border bg-card text-muted-foreground hover:text-foreground shadow-sm transition-all hover:bg-muted"
          title="Refresh exchange rate"
          aria-label="Refresh rate"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {popoverOpen && (
        <>
          <div 
            className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border shadow-xl rounded-2xl p-4 z-50 text-sm text-left animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">USD/NGN Exchange Rate</h4>
              <Badge variant="outline" className="text-[10px] uppercase font-bold">
                {status}
              </Badge>
            </div>
            
            <div className="space-y-2 text-slate-650 dark:text-slate-350 text-xs">
              <div className="flex justify-between">
                <span>Current Rate:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{rate ? formatFXDisplay(rate) : '₦1,600/$1'}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-semibold">{lastFetched || 'Just now'}</span>
              </div>
              <div className="flex justify-between">
                <span>Source:</span>
                <span className="font-semibold">Open Exchange Rates</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              <HelpCircle className="w-3 h-3 inline mr-1 -mt-0.5" />
              This rate is locked in to price components accurately in Naira. Installed proposals are stored locally with their locked rates.
            </div>

            <button 
              onClick={() => {
                handleManualRefresh();
                setPopoverOpen(false);
              }}
              disabled={isRefreshing}
              className="mt-4 w-full flex justify-center items-center gap-2 py-2 bg-teal-650 hover:bg-teal-700 text-white rounded-xl transition-colors font-semibold text-xs shadow-sm shadow-teal-500/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Update FX Rate
            </button>
          </div>
          
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setPopoverOpen(false)} />
        </>
      )}
    </div>
  );
}
