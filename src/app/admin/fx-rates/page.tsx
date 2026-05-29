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
  UserCheck
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
  const [adminEmail, setAdminEmail] = React.useState('admin@solarpro.com');

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
        if (showToast) toast.success('FX tickers refreshed.');
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
        toast.success('FX Rate configurations saved.');
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
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Retrieving FX rate engines...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">FX Rate Manager</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Control global USD exchange rate coefficients used for equipment costing.</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchFXData(true)}
          disabled={isRefreshing}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Tickers</span>
        </Button>
      </div>

      {/* Main Grid: Inputs vs Comparison Tickers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Config Overview */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between gap-6">
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-205 flex items-center gap-2">
                <Coins className="h-5 w-5 text-teal-655" />
                <span>Active Conversion Rate</span>
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                fxData?.isOverrideActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200'
                  : 'bg-slate-50 dark:bg-slate-900/20 text-slate-500 border-slate-200'
              }`}>
                {fxData?.isOverrideActive ? 'Override Active' : 'Automatic Tickers'}
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">LOCKED CONVERSION VALUE</span>
                <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatNaira(fxData?.customRate ?? 1600)}
                </div>
                <div className="text-[10.5px] text-slate-500 font-semibold flex items-center gap-1 mt-1 leading-relaxed">
                  <UserCheck className="h-3.5 w-3.5 text-teal-655" />
                  <span>Modified by <strong className="text-slate-700 dark:text-slate-350">{fxData?.lastUpdatedBy}</strong> at <strong className="text-slate-700 dark:text-slate-350">{formatShortDate(fxData?.lastUpdatedAt ?? '')}</strong></span>
                </div>
              </div>

              {/* Informative advice */}
              <div className="max-w-[320px] bg-slate-50 dark:bg-slate-950/45 p-4 rounded-xl text-xs font-semibold leading-relaxed border border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400">
                <Info className="h-4.5 w-4.5 text-indigo-500 mb-1.5" />
                <span>Nigerian solar hardware distributors price components in USD. Installers require parallel market exchange indexes to calculate exact Naira retail proposals.</span>
              </div>
            </div>
          </Card>

          {/* Form to update Rate */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Save className="h-4.5 w-4.5 text-indigo-500" />
                <span>Adjust Global Exchange Factors</span>
              </h3>

              <form onSubmit={handleSaveRate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Exchange rate input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Custom Exchange Rate (₦/$)</label>
                    <Input
                      type="number"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder="e.g. 1650"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-white dark:bg-slate-950 font-bold"
                      min="1"
                    />
                  </div>

                  {/* Override selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Conversion Policy</label>
                    <select
                      value={overrideActive ? 'true' : 'false'}
                      onChange={(e) => setOverrideActive(e.target.value === 'true')}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-white dark:bg-slate-950 font-semibold"
                  />
                </div>

                <div className="pt-3 border-t dark:border-slate-800 flex justify-end">
                  <Button 
                    type="submit"
                    className="h-10 px-6 bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>Apply Adjustments</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Comparison tickers & Timeline */}
        <div className="space-y-6">
          {/* Live comparison Rates */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Live Comparison Indices</h3>
            </div>
            <CardContent className="p-6 divide-y divide-slate-150 dark:divide-slate-800 space-y-4">
              {/* CBN official rate */}
              <div className="flex justify-between items-center py-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">CBN Official Rate</span>
                  <p className="text-[10px] text-slate-550 dark:text-slate-500 font-semibold">Official banking transaction index</p>
                </div>
                <span className="text-sm font-extrabold text-slate-655 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-3 py-1.5 rounded-xl font-mono">
                  {formatNaira(fxData?.cbnOfficialRate ?? 1530)}
                </span>
              </div>

              {/* Parallel market estimate */}
              <div className="flex justify-between items-center py-4 gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Parallel Market Est.</span>
                  <p className="text-[10px] text-slate-550 dark:text-slate-500 font-semibold">Weighted black market estimates (+7%)</p>
                </div>
                <span className="text-sm font-extrabold text-slate-655 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-3 py-1.5 rounded-xl font-mono">
                  {formatNaira(fxData?.parallelMarketRate ?? 1637)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline History logs */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-teal-655 animate-spin-slow" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Override History</h3>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-72 space-y-4">
              {fxData?.history && fxData.history.length > 0 ? (
                <div className="space-y-4 border-l border-slate-150 dark:border-slate-800 pl-4.5 relative text-xs">
                  {fxData.history.map((log, i) => (
                    <div key={i} className="space-y-1 relative">
                      <div className="absolute -left-[24.5px] top-1 rounded-full size-2 bg-teal-500 border border-white dark:border-slate-900" />
                      <div className="flex justify-between items-center gap-4">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-white font-mono">{formatNaira(log.rate)}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{formatShortDate(log.updatedAt)}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-bold">{log.note || 'Manual change log'}</p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">By {log.updatedBy}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-450 block text-center">No adjustment records logged yet.</span>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
