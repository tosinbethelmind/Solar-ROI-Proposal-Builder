'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useHomeownerSubscriptionStore } from '@/store/homeownerSubscriptionStore';
import { REGION_PROFILES, formatCurrency, convertCost, type RegionCode, type RegionProfile } from '@/lib/regionConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Lightbulb,
  Zap,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Printer,
  ChevronLeft,
  Info,
  Globe
} from 'lucide-react';

/* ─── Presets for Non-Installers ───────────────────────────────── */
interface AppliancePreset {
  id: string;
  name: string;
  wattage: number;
  defaultQty: number;
  icon: string;
  category: 'lighting' | 'cooling' | 'entertainment' | 'office' | 'heavy' | 'ac';
  peakSurge?: number;
  description: string;
}

const APPLIANCE_PRESETS: AppliancePreset[] = [
  { id: 'led_lights', name: 'LED Bulbs / Lights', wattage: 15, defaultQty: 6, icon: '💡', category: 'lighting', description: 'Energy-saving lighting' },
  { id: 'standing_fans', name: 'Standing or Ceiling Fans', wattage: 75, defaultQty: 3, icon: '🌀', category: 'cooling', description: 'Standard cooling fans' },
  { id: 'led_tv', name: 'Smart TV & Sound System', wattage: 150, defaultQty: 1, icon: '📺', category: 'entertainment', description: 'Television + decoder/speaker' },
  { id: 'laptops', name: 'Laptops & Phone Chargers', wattage: 65, defaultQty: 2, icon: '💻', category: 'office', description: 'Computers and charge bricks' },
  { id: 'standard_fridge', name: 'Standard Refrigerator', wattage: 250, defaultQty: 1, icon: '❄️', category: 'heavy', peakSurge: 700, description: 'Single or double-door fridge' },
  { id: 'deep_freezer', name: 'Deep Freezer', wattage: 350, defaultQty: 1, icon: '🧊', category: 'heavy', peakSurge: 1000, description: 'Chest freezer for food storage' },
  { id: 'inverter_ac', name: '1.5HP Inverter AC', wattage: 900, defaultQty: 0, icon: '🍃', category: 'ac', peakSurge: 1800, description: 'Power-efficient AC' },
  { id: 'standard_ac', name: '1.5HP Non-Inverter AC', wattage: 1300, defaultQty: 0, icon: '💨', category: 'ac', peakSurge: 3500, description: 'Standard high-surge AC' },
  { id: 'water_pump', name: '0.75HP Water Pump', wattage: 750, defaultQty: 0, icon: '🚰', category: 'heavy', peakSurge: 2200, description: 'Sumo or borehole pump' },
  { id: 'microwave', name: 'Microwave Oven', wattage: 1200, defaultQty: 0, icon: '🍲', category: 'heavy', peakSurge: 1600, description: 'Used briefly for heating' },
];

export default function HomeownerEstimatorPage() {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const homeownerSub = useHomeownerSubscriptionStore();
  const [mounted, setMounted] = React.useState(false);
  const [regionCode, setRegionCode] = React.useState<RegionCode>('NG');
  const region: RegionProfile = REGION_PROFILES[regionCode];

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  /* ── State variables ── */
  const [quantities, setQuantities] = React.useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    APPLIANCE_PRESETS.forEach((p) => {
      init[p.id] = p.defaultQty;
    });
    return init;
  });

  const [nepaHours, setNepaHours] = React.useState<number>(8);
  const [backupHours, setBackupHours] = React.useState<number>(10);
  const [fuelType, setFuelType] = React.useState<'petrol' | 'diesel' | 'none'>('petrol');
  const [monthlySpend, setMonthlySpend] = React.useState<string>(region.context.defaultMonthlySpend);
  const [activeTab, setActiveTab] = React.useState<'system' | 'financials' | 'guide'>('system');

  /* ── Sizing Calculations ── */
  const runningLoad = React.useMemo(() => {
    return APPLIANCE_PRESETS.reduce((sum, p) => {
      return sum + p.wattage * (quantities[p.id] || 0);
    }, 0);
  }, [quantities]);

  const peakSurge = React.useMemo(() => {
    return APPLIANCE_PRESETS.reduce((sum, p) => {
      const qty = quantities[p.id] || 0;
      if (qty === 0) return sum;
      const itemSurge = p.peakSurge ? p.peakSurge : p.wattage * 1.5;
      // Surge is experienced mostly when turning on. Assume only one high-surge starts at once + others are running
      return Math.max(sum, runningLoad - p.wattage + itemSurge);
    }, runningLoad);
  }, [quantities, runningLoad]);

  // Sizing standard recommendations
  const recommendation = React.useMemo(() => {
    if (runningLoad === 0) {
      return {
        title: 'Light System Sizing',
        kva: '0.8kVA',
        battery: '1x 100Ah Gel Battery',
        panels: '2x 200W Panels',
        costMin: 450000,
        costMax: 650000,
        slug: 'nano',
        description: 'Perfect for lights, fans, phones, and laptops only. Ideal for student or single room apartments.',
      };
    }

    if (runningLoad <= 800 && peakSurge <= 1800) {
      return {
        title: '1.2kVA Starter System',
        kva: '1.2kVA',
        battery: '1x 2.5kWh Lithium or 2x 200Ah Gel Batteries',
        panels: '2x 450W Panels',
        costMin: 900000,
        costMax: 1400000,
        slug: 'starter',
        description: 'Ideal for 1-2 bedroom flats. Comfortably powers LED lighting, standing fans, 1x TV setup, decoder, laptops, and a highly efficient small fridge.',
      };
    }

    if (runningLoad <= 2000 && peakSurge <= 4000) {
      return {
        title: '3kVA Standard System',
        kva: '3kVA / 24V',
        battery: '1x 5kWh Lithium or 4x 200Ah Gel Batteries',
        panels: '4x 450W Panels',
        costMin: 2200000,
        costMax: 3000000,
        slug: 'standard',
        description: 'Best for typical 3-bedroom family houses. Easily powers a standard double-door fridge, chest freezer, all lighting, 4 standing fans, multiple TVs, home office, and brief water pumping.',
      };
    }

    if (runningLoad <= 4500 && peakSurge <= 8500) {
      return {
        title: '5kVA Premium System',
        kva: '5kVA / 48V',
        battery: '2x 5kWh Lithium Batteries (10kWh total)',
        panels: '8x 450W Panels',
        costMin: 4200000,
        costMax: 5500000,
        slug: 'premium',
        description: 'Highly recommended for modern homes and offices. Powers 1x Inverter AC, large refrigerators, freezer, microwave, water pump, lighting, and heavy desktop setups 24/7.',
      };
    }

    return {
      title: '8kVA - 10kVA Luxury Commercial System',
      kva: '8.0kVA - 10.0kVA',
      battery: '3x 5kWh Lithium Batteries (15kWh total)',
      panels: '12x 550W Panel Array',
      costMin: 7000000,
      costMax: 9500000,
      slug: 'luxury',
      description: 'Built for high load demands, larger offices, or luxury villas. Supports 2-3 inverter ACs simultaneously, large electric pumps, gate motors, washing machines, and comprehensive daily operations.',
    };
  }, [runningLoad, peakSurge]);

  /* ── Daily consumption and sizing metrics ── */
  const dailyConsumptionWh = React.useMemo(() => {
    // Estimating daily backup Wh: running load * hours requested
    return runningLoad * backupHours;
  }, [runningLoad, backupHours]);

  const panelPeakWpNeeded = React.useMemo(() => {
    // Region-specific average peak sun hours and panel efficiency
    if (dailyConsumptionWh === 0) return 0;
    return Math.ceil(dailyConsumptionWh / (region.solar.peakSunHours * region.solar.panelEfficiency));
  }, [dailyConsumptionWh, region.solar.peakSunHours, region.solar.panelEfficiency]);

  const recommendedPanelsQty = React.useMemo(() => {
    if (panelPeakWpNeeded === 0) return 0;
    return Math.ceil(panelPeakWpNeeded / 450); // Using standard 450W panels
  }, [panelPeakWpNeeded]);

  /* ── Financial ROI Calculations ── */
  const currentFuelSpendNaira = React.useMemo(() => {
    const num = parseFloat(monthlySpend.replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  }, [monthlySpend]);

  const annualFuelSpend = currentFuelSpendNaira * 12;

  const solarReplacedSavings = React.useMemo(() => {
    // A robust solar system replaces ~80-95% of generator runs if properly sized
    if (fuelType === 'none') return 0;
    return currentFuelSpendNaira * 0.90;
  }, [fuelType, currentFuelSpendNaira]);

  const annualSolarSavings = solarReplacedSavings * 12;

  const targetCostMin = React.useMemo(() => convertCost(recommendation.costMin, region), [recommendation.costMin, region]);
  const targetCostMax = React.useMemo(() => convertCost(recommendation.costMax, region), [recommendation.costMax, region]);
  const targetMidpointCost = (targetCostMin + targetCostMax) / 2;

  const paybackPeriodYears = React.useMemo(() => {
    if (annualSolarSavings <= 0) return 0;
    return targetMidpointCost / annualSolarSavings;
  }, [targetMidpointCost, annualSolarSavings]);

  /* ── Event handlers ── */
  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => {
      const val = (prev[id] || 0) + delta;
      return { ...prev, [id]: Math.max(0, val) };
    });
  };

  const handleWhatsAppShare = () => {
    const text = `Hello! I just used the *SolarPro Sizing Estimator* to calculate my solar needs:
    
- *Running Load:* ${runningLoad} W
- *Sized Recommendation:* ${recommendation.title} (${recommendation.kva})
- *Sized Batteries:* ${recommendation.battery}
- *Solar Panels:* ${recommendedPanelsQty}x 450W Panels
- *Estimated Cost:* ${formatCurrency(targetCostMin, region)} - ${formatCurrency(targetCostMax, region)}
- *My Current Fuel Cost:* ${formatCurrency(currentFuelSpendNaira, region)}/month
- *Estimated Fuel Savings:* ${formatCurrency(solarReplacedSavings, region)}/month (${formatCurrency(annualSolarSavings, region)}/year)
- *Calculated Payback Period:* ${paybackPeriodYears.toFixed(1)} years

Could we connect to discuss a formal quote and installation assessment?`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* ═══ Navigation ═══ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-850 dark:text-slate-50">SolarPro</span>
            <Badge className="bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/20 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold shrink-0">Client Mode</Badge>
          </Link>

          <div className="flex items-center gap-3">
            {mounted && homeownerSub.tier === 'free' && (
              <Badge 
                onClick={homeownerSub.openUpgradeModal} 
                className="cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold py-1"
              >
                ⚡ {homeownerSub.estimationsUsedThisMonth >= 1 ? '0 Free Left (Upgrade)' : '1 Free Estimation Left'}
              </Badge>
            )}

            {mounted && homeownerSub.tier === 'pay_per_use' && (
              <Badge 
                onClick={homeownerSub.openUpgradeModal} 
                className="cursor-pointer bg-teal-500/10 hover:bg-teal-500/20 text-teal-650 dark:text-teal-400 border border-teal-500/20 text-[10px] font-bold py-1"
              >
                💎 {homeownerSub.tokens} Token(s) Left
              </Badge>
            )}

            {mounted && homeownerSub.tier === 'monthly' && (
              <Badge className="bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold py-1">
                🏡 Unlimited Sizing Active
              </Badge>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs font-bold border-teal-500/20 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-xl"
              onClick={homeownerSub.openUpgradeModal}
            >
              Plans
            </Button>

            <Link href="/">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                Go to Installer Workspace
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ═══ Main Container ═══ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* ═══ Hero Title ═══ */}
        <section className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/10 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> 100% Free &amp; Transparent Sizer
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-850 dark:text-slate-50">
            Estimate Your Solar Power &amp; Savings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto leading-relaxed font-medium">
            No technical knowledge required. Tell us what appliances you use and what you currently spend on fuel, and get an immediate, transparent estimate tailored for {region.context.marketName}.
          </p>

          {/* ═══ Region Selector ═══ */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <select
              title="Select your region"
              value={regionCode}
              onChange={(e) => {
                const code = e.target.value as RegionCode;
                setRegionCode(code);
                setNepaHours(REGION_PROFILES[code].grid.avgHoursDefault);
                setMonthlySpend(REGION_PROFILES[code].context.defaultMonthlySpend);
              }}
              className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 cursor-pointer hover:border-teal-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {Object.values(REGION_PROFILES).map((r) => (
                <option key={r.code} value={r.code}>
                  {r.flag} {r.name} ({r.currency.code})
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ═══ Progress Indicators ═══ */}
        <section className="flex items-center justify-between max-w-md mx-auto mb-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-250 dark:bg-slate-800 -translate-y-1/2 z-0" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-teal-500 -translate-y-1/2 z-0 transition-all duration-300" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />

          {[
            { num: 1, label: 'Appliances' },
            { num: 2, label: 'Fuel/Usage' },
            { num: 3, label: 'Sizing Sizer' },
          ].map((s) => (
            <div key={s.num} className="relative z-10 flex flex-col items-center">
              <button
                onClick={() => {
                  if (s.num < step || (s.num === 2 && runningLoad > 0) || s.num === 3) {
                    setStep(s.num as 1 | 2 | 3);
                  }
                }}
                disabled={s.num === 3 && runningLoad === 0}
                className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border transition-all duration-300 ${
                  step === s.num
                    ? 'bg-teal-600 text-white border-teal-600 ring-4 ring-teal-500/20'
                    : step > s.num
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </button>
              <span className={`text-[10px] font-bold mt-1.5 uppercase tracking-wider ${step === s.num ? 'text-teal-650 dark:text-teal-400' : 'text-slate-450 dark:text-slate-650'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </section>

        {/* ═══ Step 1: Appliances Selector ═══ */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="border-slate-200 dark:border-slate-850 shadow-md">
              <CardHeader className="bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200/60 dark:border-slate-850 py-5">
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Step 1: What do you want your solar system to power?
                </CardTitle>
                <CardDescription className="text-xs">
                  Set the quantities of each appliance you want to run. Leave at 0 for things you do not need to power with solar.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {APPLIANCE_PRESETS.map((p) => {
                    const qty = quantities[p.id] || 0;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                          qty > 0
                            ? 'bg-teal-500/5 border-teal-500/30 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-750'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-2xl shrink-0 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">{p.icon}</span>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-850 dark:text-slate-100 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{p.description}</p>
                            <p className="text-[10px] font-semibold text-teal-650 dark:text-teal-400 mt-1">
                              {p.wattage}W {p.peakSurge ? `(Surge: ${p.peakSurge}W)` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQty(p.id, -1)}
                            disabled={qty === 0}
                            className="size-7 rounded-xl flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-black tabular-nums text-slate-800 dark:text-slate-250">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(p.id, 1)}
                            className="size-7 rounded-xl flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 active:scale-95 transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimated Total Load</p>
                <p className="text-base font-black text-slate-850 dark:text-slate-100">
                  {runningLoad} W <span className="text-xs text-slate-450 font-medium">/ Peak Surge: {peakSurge} W</span>
                </p>
              </div>

              <Button
                disabled={runningLoad === 0}
                className="bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1 text-xs px-5 h-9"
                onClick={() => setStep(2)}
              >
                Next Step <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══ Step 2: Sizing preferences ═══ */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="border-slate-200 dark:border-slate-850 shadow-md">
              <CardHeader className="bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200/60 dark:border-slate-850 py-5">
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-650" />
                  Step 2: Utility Sizing & Fuel Expenses
                </CardTitle>
                <CardDescription className="text-xs">
                  We use these details to calculate how many batteries you require and map your precise fuel ROI payback period.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                
                {/* NEPA Hours */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                      {region.grid.label}
                    </label>
                    <span className="text-xs font-black text-teal-650 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
                      {nepaHours} hours/day
                    </span>
                  </div>
                  <Slider
                    value={[nepaHours]}
                    min={0}
                    max={24}
                    step={1}
                    onValueChange={(val) => {
                      if (Array.isArray(val)) {
                        setNepaHours(val[0]);
                      } else if (typeof val === 'number') {
                        setNepaHours(val);
                      }
                    }}
                    className="py-2 text-teal-600"
                  />
                  <p className="text-[10px] text-slate-450">
                    {region.grid.lowGridNote}
                  </p>
                </div>

                {/* Backup Hours */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                      How many hours of battery backup do you need when {region.grid.name} fails?
                    </label>
                    <span className="text-xs font-black text-teal-650 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
                      {backupHours} hours/day
                    </span>
                  </div>
                  <Slider
                    value={[backupHours]}
                    min={2}
                    max={24}
                    step={1}
                    onValueChange={(val) => {
                      if (Array.isArray(val)) {
                        setBackupHours(val[0]);
                      } else if (typeof val === 'number') {
                        setBackupHours(val);
                      }
                    }}
                    className="py-2"
                  />
                  <p className="text-[10px] text-slate-450">
                    More backup hours require a larger battery capacity to sustain your appliance load.
                  </p>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-4" />

                {/* Generator details */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-250 block">
                    Alternative Power Expenses (Generator)
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'petrol', label: region.fuel.petrolLabel, desc: 'Standard small/medium gen' },
                      { id: 'diesel', label: region.fuel.dieselLabel, desc: 'Large high kVA gen' },
                      { id: 'none', label: 'No Gen / Grid only 🔌', desc: 'No fuel costs to replace' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setFuelType(g.id as 'petrol' | 'diesel' | 'none')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 ${
                          fuelType === g.id
                            ? 'bg-teal-500/5 border-teal-500/35 ring-2 ring-teal-500/10'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold block">{g.label}</span>
                        <span className="text-[9px] text-slate-500 mt-1 leading-normal">{g.desc}</span>
                      </button>
                    ))}
                  </div>

                  {fuelType !== 'none' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        How much do you spend on average on fuel (petrol/diesel) monthly?
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-450">{region.currency.symbol}</span>
                        <Input
                          type="text"
                          value={monthlySpend}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setMonthlySpend(val ? parseInt(val).toLocaleString() : '');
                          }}
                          className="pl-7 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold font-mono py-5"
                          placeholder="e.g. 60,000"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                        <Info className="w-3 h-3 text-teal-650" /> {region.fuel.priceNote}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                className="font-bold flex items-center gap-1 text-xs rounded-xl"
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="w-4 h-4" /> Edit Appliances
              </Button>

              <Button
                className="bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1 text-xs px-5 h-9"
                onClick={() => {
                  const access = homeownerSub.checkAccess();
                  if (access.allowed) {
                    homeownerSub.consumeEstimation();
                    setStep(3);
                  } else {
                    homeownerSub.openUpgradeModal();
                  }
                }}
              >
                Calculate Recommendations <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══ Step 3: Recommendations ═══ */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Sizing result hero card */}
            <Card className="relative overflow-hidden border-teal-500/25 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 text-white shadow-xl rounded-3xl p-6 sm:p-8">
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" /> Calculated Sizing Recommendation
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{recommendation.title}</h2>
                  <p className="text-teal-400 font-extrabold text-lg tabular-nums">
                    {formatCurrency(convertCost(recommendation.costMin, region), region)} - {formatCurrency(convertCost(recommendation.costMax, region), region)}
                  </p>
                </div>

                <p className="text-slate-350 text-xs leading-relaxed max-w-xl">
                  {recommendation.description}
                </p>

                <div className="h-px bg-white/10 my-4" />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-2">
                    <span className="text-xl">🛠️</span>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Inverter Size</p>
                      <p className="font-extrabold text-xs text-white mt-0.5">{recommendation.kva}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-2">
                    <span className="text-xl">🔋</span>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Battery Spec</p>
                      <p className="font-extrabold text-xs text-white mt-0.5 truncate">{recommendation.battery}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-2">
                    <span className="text-xl">☀️</span>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Solar Array</p>
                      <p className="font-extrabold text-xs text-white mt-0.5">{recommendation.panels}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Sizing details and analysis tabs */}
            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-150 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('system')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'system'
                      ? 'bg-white dark:bg-slate-850 text-teal-650 dark:text-teal-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-350'
                  }`}
                >
                  ⚡ System Sizing
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('financials')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'financials'
                      ? 'bg-white dark:bg-slate-850 text-teal-650 dark:text-teal-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-350'
                  }`}
                >
                  📈 ROI & Savings
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guide')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'guide'
                      ? 'bg-white dark:bg-slate-850 text-teal-650 dark:text-teal-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-350'
                  }`}
                >
                  🎓 Sizing Guide
                </button>
              </div>

              {/* Tab 1: System Sizing Details */}
              {activeTab === 'system' && (
                <Card className="border-slate-200 dark:border-slate-850 shadow-md animate-in fade-in duration-250">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-teal-650" /> Sizing Verification
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Your Running Load</p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{runningLoad} Watts</p>
                        <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                          This is the electrical power required if all selected appliances run simultaneously.
                        </p>
                      </div>

                      <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Calculated Surge Load</p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{peakSurge} Watts</p>
                        <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                          Inductive motors (fridge, pump, freezer compressor, AC) require higher start-up power than standard runtime.
                        </p>
                      </div>

                      <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Daily Wh Sized</p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{dailyConsumptionWh.toLocaleString()} Wh</p>
                        <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                          Your running load × {backupHours} backup hours daily. This determines battery size.
                        </p>
                      </div>

                      <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recommended Panels Size</p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{recommendedPanelsQty}x 450W Panels</p>
                        <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                          Provides ~{(recommendedPanelsQty * 450).toLocaleString()}W peak power, enough to recharge batteries and power daytime loads.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Note on high-power loads:</strong> Air Conditioners, Water Pumps, and Microwaves consume large amounts of power. Ensure they are run strictly when there is high sun or backup batteries are full, or consider isolating them to grid power.
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tab 2: ROI & Savings Details */}
              {activeTab === 'financials' && (
                <Card className="border-slate-200 dark:border-slate-850 shadow-md animate-in fade-in duration-250">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-650" /> {region.currency.code} ROI &amp; Savings Analysis
                    </h3>

                    {fuelType === 'none' ? (
                      <div className="py-8 text-center space-y-2">
                        <p className="text-slate-500 text-sm font-semibold">
                          You indicated that you do not run a generator.
                        </p>
                        <p className="text-xs text-slate-450 max-w-sm mx-auto">
                          Your main solar benefit will be providing 100% stable, uninterrupted 24/7 power during {region.grid.name} grid blackouts.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Fuel Bill</p>
                            <p className="text-lg font-black text-rose-650 dark:text-rose-450 mt-1">{formatCurrency(currentFuelSpendNaira, region)} / mo</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-semibold">{formatCurrency(annualFuelSpend, region)} / year</p>
                          </div>

                          <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Replaced by Solar</p>
                            <p className="text-lg font-black text-emerald-650 dark:text-emerald-400 mt-1">{formatCurrency(solarReplacedSavings, region)} / mo</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-semibold">{formatCurrency(annualSolarSavings, region)} / year</p>
                          </div>

                          <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payback Period</p>
                            <p className="text-lg font-black text-teal-650 dark:text-teal-400 mt-1">{paybackPeriodYears.toFixed(1)} Years</p>
                            <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                              After {paybackPeriodYears.toFixed(1)} years, your solar power is 100% free!
                            </p>
                          </div>
                        </div>

                        {/* Payback chart mock representation */}
                        <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30">
                          <p className="text-xs font-extrabold text-slate-850 dark:text-slate-100 mb-2">5-Year Financial Projection</p>
                          <div className="space-y-3 pt-2">
                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                <span>Accumulated Fuel Expense (Gen)</span>
                                <span className="text-rose-500">{formatCurrency(annualFuelSpend * 5, region)}</span>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                <span>Solar System Cost + Maintenance</span>
                                <span className="text-teal-500">{formatCurrency(targetMidpointCost * 1.1, region)}</span>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(targetMidpointCost * 1.1 / (annualFuelSpend * 5) * 100).toFixed(0)}%` }} />
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-450 mt-3 leading-relaxed">
                            💡 <strong>Informed Decision:</strong> {region.context.fuelLiabilityNote}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tab 3: Buyer Guide */}
              {activeTab === 'guide' && (
                <Card className="border-slate-200 dark:border-slate-850 shadow-md animate-in fade-in duration-250">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-500" /> 4 Questions to Ask Any Installer Before Buying
                    </h3>

                    <div className="space-y-3.5">
                      {[
                        {
                          q: "1. What battery chemistry are you quoting?",
                          a: "Always insist on Lithium Iron Phosphate (LiFePO4). Gel batteries are cheaper upfront but need replacement in 1-2 years. Lithium batteries last 8-10 years and are far more cost-effective over time."
                        },
                        {
                          q: "2. Can this inverter handle the simultaneous startup of my heavy appliances?",
                          a: "Inductive loads like pump motors and refrigerators require up to 3x their normal power to start. Your installer should size an inverter with adequate peak surge capacity."
                        },
                        {
                          q: "3. What is the efficiency rating of the solar panels?",
                          a: `Monocrystalline panels (efficiency > 20%) perform much better in ${region.solar.weatherNote}, especially during the cloudier rainy season, compared to older Polycrystalline panels.`
                        },
                        {
                          q: "4. What post-installation warranties do you offer?",
                          a: "A premium installer should offer at least 1-2 years warranty on installation workmanship, 5 years on Lithium batteries, and 10+ years warranty on solar panel power output."
                        }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <p className="text-xs font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            {item.q}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 leading-normal">
                            {item.a}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Actions for customer */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <Button
                type="button"
                className="flex-1 bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-black py-6 text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                onClick={handleWhatsAppShare}
              >
                Send Sizing Report to Installer on WhatsApp 📱
              </Button>

              <Button
                type="button"
                variant="outline"
                className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold py-6 text-xs flex items-center justify-center gap-1.5"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" /> Save as Sizing PDF
              </Button>
            </div>

            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                className="font-bold flex items-center gap-1 text-xs rounded-xl"
                onClick={() => setStep(2)}
              >
                <ChevronLeft className="w-4 h-4" /> Back to Usage Details
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} SolarPro — Transparent Sizing Sizer for Clients</p>
          <Link href="/" className="text-teal-600 hover:underline font-bold">
            Installer Workspace
          </Link>
        </div>
      </footer>

      {/* ═══ Homeowner Upgrade Modal ═══ */}
      <Dialog open={homeownerSub.upgradeModalOpen} onOpenChange={(open) => !open && homeownerSub.closeUpgradeModal()}>
        <DialogContent className="sm:max-w-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-slate-850 dark:text-white flex items-center gap-2">
              💎 Unlock Solar ROI Calculator
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You have used your free estimation for this month. Upgrade to get instant access to system recommendations, generator fuel payback projections, and installer-ready reports.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-3">
            {/* Pay Per Use Option */}
            <div className="border border-slate-200 dark:border-slate-800 hover:border-teal-500/30 dark:hover:border-teal-500/30 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 transition-all flex flex-col justify-between gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">Single Report Token</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Pay only for this specific estimation. No recurring billing.</p>
                </div>
                <span className="text-xs font-black text-teal-650 dark:text-teal-400">{region.subscription.singleTokenPrice}</span>
              </div>
              <Button 
                onClick={() => homeownerSub.purchaseTokens(1)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-850 dark:hover:bg-slate-750 text-[11px] font-bold py-1.5 rounded-xl h-8"
              >
                Purchase 1 Token
              </Button>
            </div>

            {/* Monthly Option */}
            <div className="border-2 border-teal-500/30 rounded-2xl p-4 bg-teal-500/[0.02] dark:bg-teal-500/[0.01] transition-all flex flex-col justify-between gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-teal-600 text-white text-[8px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-bl-xl">
                Best Value
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    Monthly Unlimited 🌟
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Perfect if you are sizing multiple properties or comparing configurations.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-teal-650 dark:text-teal-400 block">{region.subscription.monthlyPrice}</span>
                  <span className="text-[9px] text-slate-450 block mt-0.5">per month</span>
                </div>
              </div>
              <Button 
                onClick={() => homeownerSub.subscribeMonthly()}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold py-1.5 rounded-xl h-8 shadow-sm shadow-teal-650/10"
              >
                Subscribe Monthly
              </Button>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between items-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] font-bold text-slate-500 hover:text-slate-800"
              onClick={homeownerSub.closeUpgradeModal}
            >
              Cancel
            </Button>
            {homeownerSub.tier !== 'free' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] font-bold text-rose-500 hover:text-rose-650 hover:bg-rose-50/50"
                onClick={() => homeownerSub.cancelSubscription()}
              >
                Reset Account to Free
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
