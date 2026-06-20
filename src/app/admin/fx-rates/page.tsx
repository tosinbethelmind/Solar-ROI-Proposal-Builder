'use client';

import * as React from 'react';
import { 
  TrendingUp, 
  RefreshCw, 
  HelpCircle, 
  Coins, 
  AlertCircle, 
  CheckCircle2, 
  History, 
  Save,
  Info,
  Calendar,
  UserCheck,
  Zap,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface FXState {
  customRate: number;
  isOverrideActive: boolean;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  cbnOfficialRate: number;
  parallelMarketRate: number;
  history: Array<{
    rate: number;
    updatedBy: string;
    updatedAt: string;
    note?: string;
  }>;
}

export default function AdminFXRates() {
  const [fxData, setFxData] = React.useState<FXState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  // Form input states
  const [newRate, setNewRate] = React.useState('');
  const [overrideActive, setOverrideActive] = React.useState(true);
  const [note, setNote] = React.useState('');
  const [adminEmail, setAdminEmail] = React.useState('admin@solarquotepro.com');

  const fetchFXData = React.useCallback(async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/fx-rates');
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else if (data.data) {
        setFxData(data.data);
        setNewRate(data.data.customRate.toString());
        setOverrideActive(data.data.isOverrideActive);
        if (showToast) toast.success('FX tickers refreshed successfully.');
      }
    } catch (err) {
      console.error('Failed to load FX rate configuration:', err);
      toast.error('Failed to contact FX rate services.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFXData();
  }, [fetchFXData]);

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRate || parseFloat(newRate) <= 0) {
      toast.error('Please enter a valid exchange rate.');
      return;
    }

    try {
      const res = await fetch('/api/admin/fx-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rate: parseFloat(newRate),
          isOverrideActive: overrideActive,
          updatedBy: adminEmail,
          note: note || 'Manual exchange rate adjustment'
        })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('FX Rate configurations overridden.');
        setNote('');
        fetchFXData();
      }
    } catch (err) {
      toast.error('Rate update request rejected.');
    }
  };

  const formatNaira = (value: number) =>
    `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}/$1`;

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500 animate-pulse">Retrieving FX rate engines...</p>
      </div>
    );
  }

  // Calculate deviation from CBN Official rate
  const cbnVal = fxData?.cbnOfficialRate ?? 1530;
  const customVal = fxData?.customRate ?? 1600;
  const deviationPercent = (((customVal - cbnVal) / cbnVal) * 100).toFixed(1);

  return (
    <div className="space-y-8">
      
      {/* ═══ Header Title ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-650 dark:text-teal-400 uppercase tracking-widest">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>Exchange Index & Telemetry Controller</span>
          </div>
          <h1 className="text-3xl font-black text-slate-850 dark:text-slate-50 tracking-tight mt-1">FX Override Manager</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
            Lock absolute conversion coefficients for USD/NGN custom hardware equipment costing.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchFXData(true)}
          disabled={isRefreshing}
          className="h-9 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 cursor-pointer flex items-center gap-1.5 font-bold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Indicators</span>
        </Button>
      </div>

      {/* ═══ Main Operations Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Section: Override form and info panels */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Conversion Telemetry */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 size-24 bg-teal-500/5 rounded-bl-full pointer-events-none" />
            
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <h3 className="font-extrabold text-slate-855 dark:text-slate-100 flex items-center gap-2">
                <Coins className="h-5 w-5 text-teal-600" />
                <span>Conversion Telemetry</span>
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                fxData?.isOverrideActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250'
                  : 'bg-slate-50 dark:bg-slate-900/20 text-slate-500 border-slate-250'
              }`}>
                {fxData?.isOverrideActive ? 'Override Active' : 'Automatic Tickers'}
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-550 tracking-wider">LOCKED EXCHANGE MULTIPLIER</span>
                <div className="text-4xl font-black text-slate-850 dark:text-slate-50 tracking-tight flex items-baseline gap-1">
                  <span>{formatNaira(fxData?.customRate ?? 1600)}</span>
                  <span className="text-xs font-bold text-slate-450">NGN / USD</span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mt-2 leading-relaxed">
                  <UserCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span>Modified by <strong className="text-slate-700 dark:text-slate-350">{fxData?.lastUpdatedBy}</strong> at <strong className="text-slate-700 dark:text-slate-350">{formatShortDate(fxData?.lastUpdatedAt ?? '')}</strong></span>
                </div>
              </div>

              {/* Informative advice */}
              <div className="max-w-[320px] bg-slate-50 dark:bg-slate-950/45 p-4.5 rounded-2xl text-[11px] font-semibold leading-relaxed border border-slate-200/50 dark:border-slate-850 text-slate-500 dark:text-slate-400 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center gap-1.5 text-teal-650 dark:text-teal-400 font-bold uppercase text-[9px] tracking-wider">
                  <Info className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Market Context</span>
                </div>
                <span>Nigerian solar hardware distributors price components in USD. Installers require custom parallel market exchange indices to produce accurate Naira retail proposals.</span>
              </div>
            </div>
          </Card>

          {/* Form to update Rate */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl">
            <CardContent className="p-6">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-50 mb-6 flex items-center gap-2">
                <Save className="h-4.5 w-4.5 text-indigo-500" />
                <span>Adjust Global Exchange Factors</span>
              </h3>

              <form onSubmit={handleSaveRate} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Exchange rate input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Custom Exchange Rate (₦/$)</label>
                    <Input
                      type="number"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder="e.g. 1650"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-slate-50 dark:bg-slate-950 font-bold dark:text-slate-100"
                      min="1"
                    />
                  </div>

                  {/* Override selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Conversion Policy</label>
                    <select
                      value={overrideActive ? 'true' : 'false'}
                      onChange={(e) => setOverrideActive(e.target.value === 'true')}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-slate-200"
                    >
                      <option value="true">Lock rate as custom Override (Recommended)</option>
                      <option value="false">Synchronize automatically with official CBN tickers</option>
                    </select>
                  </div>
                </div>

                {/* Log Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Change Log Note</label>
                  <Input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Describe adjustment reason (e.g. Parallel market fluctuation adjustments)"
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-slate-50 dark:bg-slate-950 font-bold dark:text-slate-100"
                  />
                </div>

                {/* System Impact Warning Alert */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-amber-850 dark:text-amber-400 uppercase tracking-wide">Dynamic System-wide Pricing Impact</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold leading-normal">
                      Saving this exchange rate coefficient will instantly update cost calculations for all open proposal drafts, components databases, and ROI forecasts across active installer companies.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <Button 
                    type="submit"
                    className="h-10 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>Apply Custom Override</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Live Indexes and History log trail */}
        <div className="space-y-6">
          
          {/* Live Exchange comparison panel */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-extrabold text-xs text-slate-855 dark:text-slate-550 uppercase tracking-widest">Market Comparison Indexes</h3>
            </div>
            <CardContent className="p-6 divide-y divide-slate-150 dark:divide-slate-800/60 space-y-4">
              
              {/* CBN official rate */}
              <div className="flex justify-between items-center py-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-850 dark:text-slate-205">CBN Official Rate</span>
                  <p className="text-[10px] text-slate-500 font-semibold">Official banking tier baseline</p>
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-1.5 rounded-xl font-mono tabular-nums">
                  {formatNaira(fxData?.cbnOfficialRate ?? 1530)}
                </span>
              </div>

              {/* Parallel market estimate */}
              <div className="flex justify-between items-center py-4 gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-850 dark:text-slate-205">Parallel Market Estimate</span>
                  <p className="text-[10px] text-slate-500 font-semibold">Distributor purchasing standard (+7%)</p>
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-1.5 rounded-xl font-mono tabular-nums">
                  {formatNaira(fxData?.parallelMarketRate ?? 1637)}
                </span>
              </div>

              {/* Current Deviation Alert */}
              <div className="pt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>Override Spread Ratio</span>
                <span className="text-teal-650 dark:text-teal-400 flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +{deviationPercent}% above official
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Override change history logs */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
              <History className="h-4.5 w-4.5 text-teal-600" />
              <h3 className="font-extrabold text-xs text-slate-855 dark:text-slate-550 uppercase tracking-widest">Override Ledger</h3>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-72 space-y-4">
              {fxData?.history && fxData.history.length > 0 ? (
                <div className="space-y-4.5 border-l border-slate-200 dark:border-slate-800 pl-4.5 relative text-xs">
                  {fxData.history.map((log, i) => (
                    <div key={i} className="space-y-1 relative">
                      <div className="absolute -left-[24.5px] top-1.5 rounded-full size-2 bg-teal-500 border-2 border-white dark:border-slate-900" />
                      <div className="flex justify-between items-center gap-4">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-white font-mono">{formatNaira(log.rate)}</span>
                        <span className="text-[9px] text-slate-500 font-bold">{formatShortDate(log.updatedAt)}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-bold">{log.note || 'Manual change log override'}</p>
                      <p className="text-[9px] text-slate-550 font-bold uppercase">Operator: {log.updatedBy}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-450 block text-center py-4">No adjustment records logged yet.</span>
              )}
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
