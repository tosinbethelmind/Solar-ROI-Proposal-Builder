'use client';

import * as React from 'react';
import { 
  Settings2, 
  Save, 
  Info, 
  UserCheck, 
  HelpCircle,
  Percent,
  Flame,
  Zap,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BUSINESS_PRESETS } from '@/lib/businessPresets';
import { Badge } from '@/components/ui/badge';

interface PlatformSettings {
  dieselPrice: number;
  petrolPrice: number;
  gridTariff: number;
  vatTaxRate: number;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = React.useState<PlatformSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  // Form values
  const [dieselPrice, setDieselPrice] = React.useState('');
  const [petrolPrice, setPetrolPrice] = React.useState('');
  const [gridTariff, setGridTariff] = React.useState('');
  const [vatTaxRate, setVatTaxRate] = React.useState('');
  const [adminEmail, setAdminEmail] = React.useState('admin@solarquotepro.com');

  const fetchSettings = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.data) {
        setSettings(data.data);
        setDieselPrice(data.data.dieselPrice.toString());
        setPetrolPrice(data.data.petrolPrice.toString());
        setGridTariff(data.data.gridTariff.toString());
        setVatTaxRate(data.data.vatTaxRate.toString());
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Failed to load global platform settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dieselPrice: parseFloat(dieselPrice),
          petrolPrice: parseFloat(petrolPrice),
          gridTariff: parseFloat(gridTariff),
          vatTaxRate: parseFloat(vatTaxRate),
          updatedBy: adminEmail
        })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('Global platform constants updated successfully.');
        fetchSettings();
      }
    } catch (err) {
      toast.error('Failed to update platform constants.');
    }
  };

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
        <p className="text-xs font-semibold text-slate-500 animate-pulse">Retrieving default platform specifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* ═══ Header Title ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-655 dark:text-teal-400 uppercase tracking-widest">
            <Settings2 className="h-4 w-4 shrink-0" />
            <span>Global Operations Configuration</span>
          </div>
          <h1 className="text-3xl font-black text-slate-850 dark:text-slate-50 tracking-tight mt-1">Platform Settings</h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 font-bold mt-1">
            Configure global solar default constants, generator parameters, utility tariffs, and taxation variables.
          </p>
        </div>
      </div>

      {/* ═══ Main Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form: Pricing Specifications */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl">
            <CardContent className="p-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4.5 border-b border-slate-200/60 dark:border-slate-805 mb-6 gap-3">
                <h3 className="font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Settings2 className="h-4.5 w-4.5 text-teal-600" />
                  <span>Global Constants Override</span>
                </h3>
                {settings && (
                  <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 leading-none">
                    <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Modified by <strong className="text-slate-700 dark:text-slate-350">{settings.lastUpdatedBy}</strong> at <strong className="text-slate-700 dark:text-slate-350">{formatShortDate(settings.lastUpdatedAt)}</strong></span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Diesel Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>Diesel Price (₦/Liter)</span>
                    </label>
                    <Input
                      type="number"
                      value={dieselPrice}
                      onChange={(e) => setDieselPrice(e.target.value)}
                      placeholder="e.g. 1400"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-slate-50 dark:bg-slate-950 font-bold dark:text-slate-100"
                    />
                  </div>

                  {/* Petrol Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>Petrol Price (₦/Liter)</span>
                    </label>
                    <Input
                      type="number"
                      value={petrolPrice}
                      onChange={(e) => setPetrolPrice(e.target.value)}
                      placeholder="e.g. 1100"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-slate-50 dark:bg-slate-950 font-bold dark:text-slate-100"
                    />
                  </div>

                  {/* Grid electricity Band A tariff */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
                      <span>Grid Tariff (₦/kWh)</span>
                    </label>
                    <Input
                      type="number"
                      value={gridTariff}
                      onChange={(e) => setGridTariff(e.target.value)}
                      placeholder="e.g. 209.5"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-slate-50 dark:bg-slate-950 font-bold dark:text-slate-100"
                    />
                  </div>

                  {/* Value Added Tax */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
                      <Percent className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>Standard VAT rate (%)</span>
                    </label>
                    <Input
                      type="number"
                      value={vatTaxRate}
                      onChange={(e) => setVatTaxRate(e.target.value)}
                      placeholder="e.g. 7.5"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-slate-50 dark:bg-slate-950 font-bold dark:text-slate-100"
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Safety Warning Alert */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-amber-850 dark:text-amber-400 uppercase tracking-wide">Global Parameter Cascade</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold leading-normal">
                      Adjustments to standard grid tariffs, taxation percent, or commercial fuel indexes will immediately propagate system-wide. All active sizing calculations and savings projections in the proposal pipelines will adapt automatically.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <Button 
                    type="submit"
                    className="h-10 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Platform Constants</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Info: Preset Guidelines */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl p-6 flex flex-col justify-center gap-5">
            <h3 className="font-extrabold text-xs text-slate-855 dark:text-slate-105 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
              <span>Nigerian Utility Benchmarks</span>
            </h3>

            <div className="space-y-4 text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed">
              <p>
                Default pricing factors are automatically queried by solar installation members when creating new client proposals.
              </p>
              <div className="space-y-3.5 pt-2 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-450">Standard Band A Tariff:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">₦209.5 / kWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450">Commercial Diesel Avg:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">₦1,350 - ₦1,450 / L</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450">Retail Petrol Avg:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">₦1,050 - ₦1,150 / L</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450">Federal VAT Rate:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">7.5%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl p-6">
            <h3 className="font-extrabold text-xs text-slate-855 dark:text-slate-105 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <ShieldCheck className="h-4.5 w-4.5 text-teal-650 shrink-0" />
              <span>Active Sizing Templates ({BUSINESS_PRESETS.length})</span>
            </h3>

            <div className="space-y-3">
              {BUSINESS_PRESETS.map((bp) => (
                <div key={bp.id} className="p-3 bg-slate-50 dark:bg-slate-950/45 border border-slate-200/60 dark:border-slate-850 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[11px] text-slate-800 dark:text-slate-105">{bp.label}</span>
                    <Badge className="bg-teal-100 dark:bg-teal-950 text-teal-850 dark:text-teal-400 border-none font-bold text-[8px] px-1.5 py-0 shadow-none uppercase">
                      {bp.confidence}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{bp.description}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold pt-1.5 border-t border-slate-200/40 dark:border-slate-800/40">
                    <span>{bp.appliances.length} Load items</span>
                    <span>{bp.suggestedBackupHours}h target</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
