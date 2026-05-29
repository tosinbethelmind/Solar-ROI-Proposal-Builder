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
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
  const [adminEmail, setAdminEmail] = React.useState('admin@solarpro.com');

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
        toast.success('Global platform constants updated.');
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
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Retrieving default platform specifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Platform Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Configure global solar default constants, generator parameters, and pricing components.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Pricing Specifications */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm backdrop-blur-md rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between pb-4 border-b dark:border-slate-850 mb-6">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-teal-655" />
                  <span>Global Constants override</span>
                </h3>
                {settings && (
                  <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 leading-none">
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                    <span>Modified by <strong className="text-slate-700 dark:text-slate-350">{settings.lastUpdatedBy}</strong> at <strong className="text-slate-700 dark:text-slate-350">{formatShortDate(settings.lastUpdatedAt)}</strong></span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Diesel Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>Diesel Price (₦/Liter)</span>
                    </label>
                    <Input
                      type="number"
                      value={dieselPrice}
                      onChange={(e) => setDieselPrice(e.target.value)}
                      placeholder="e.g. 1400"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-white dark:bg-slate-950 font-bold"
                    />
                  </div>

                  {/* Petrol Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 flex items-center gap-1">
                      <Flame className="h-4 w-4 text-amber-550" />
                      <span>Petrol Price (₦/Liter)</span>
                    </label>
                    <Input
                      type="number"
                      value={petrolPrice}
                      onChange={(e) => setPetrolPrice(e.target.value)}
                      placeholder="e.g. 1100"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-white dark:bg-slate-950 font-bold"
                    />
                  </div>

                  {/* Grid electricity Band A tariff */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 flex items-center gap-1">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span>Grid Tariff (₦/kWh)</span>
                    </label>
                    <Input
                      type="number"
                      value={gridTariff}
                      onChange={(e) => setGridTariff(e.target.value)}
                      placeholder="e.g. 209.5"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-white dark:bg-slate-950 font-bold"
                    />
                  </div>

                  {/* Value Added Tax */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 flex items-center gap-1">
                      <Percent className="h-4 w-4 text-blue-500" />
                      <span>Standard VAT rate (%)</span>
                    </label>
                    <Input
                      type="number"
                      value={vatTaxRate}
                      onChange={(e) => setVatTaxRate(e.target.value)}
                      placeholder="e.g. 7.5"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-teal-500 bg-white dark:bg-slate-950 font-bold"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t dark:border-slate-800 flex justify-end">
                  <Button 
                    type="submit"
                    className="h-10 px-6 bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5"
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
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm rounded-2xl overflow-hidden p-6 flex flex-col justify-center gap-5">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-indigo-500" />
              <span>Nigerian Utility Benchmarks</span>
            </h3>

            <div className="space-y-3.5 text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed">
              <p>
                Default pricing factors are automatically queried by solar installation members when creating new client proposals.
              </p>
              <div className="space-y-2 pt-2 border-t dark:border-slate-800 text-[11px]">
                <div className="flex justify-between">
                  <span>Standard Band A Tariff:</span>
                  <span className="text-slate-800 dark:text-slate-200">₦209.5 / kWh</span>
                </div>
                <div className="flex justify-between">
                  <span>Commercial Diesel Avg:</span>
                  <span className="text-slate-800 dark:text-slate-200">₦1,350 - ₦1,450 / L</span>
                </div>
                <div className="flex justify-between">
                  <span>Retail Petrol Avg:</span>
                  <span className="text-slate-800 dark:text-slate-200">₦1,050 - ₦1,150 / L</span>
                </div>
                <div className="flex justify-between">
                  <span>Federal VAT Rate:</span>
                  <span className="text-slate-800 dark:text-slate-200">7.5%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
