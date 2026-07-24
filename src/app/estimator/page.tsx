'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Switch } from '@/components/ui/switch';
import { useHomeownerSubscriptionStore } from '@/store/homeownerSubscriptionStore';
import { CopyrightYear } from '@/components/ui/CopyrightYear';
import { LegalNotice } from '@/components/ui/LegalNotice';
import { REGION_PROFILES, formatCurrency, convertCost, type RegionCode, type RegionProfile } from '@/lib/regionConfig';
import { NIGERIAN_CITIES, getCityById, type NigerianCity } from '@/lib/nigerianCities';
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
import { toast } from 'sonner';
import { BUSINESS_PRESETS, mapTemplateToEstimator, type BusinessLoadTemplate } from '@/lib/businessPresets';
import { fetchUSDNGNRate } from '@/utils/exchangeRate';
import { useMarketplaceStore } from '@/store/marketplaceStore';

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
  { id: 'deep_freezer', name: 'Deep Freezer', wattage: 350, defaultQty: 0, icon: '🧊', category: 'heavy', peakSurge: 1000, description: 'Chest freezer for food storage' },
  { id: 'inverter_ac', name: '1.5HP Inverter AC', wattage: 900, defaultQty: 0, icon: '🍃', category: 'ac', peakSurge: 1800, description: 'Power-efficient AC' },
  { id: 'standard_ac', name: '1.5HP Non-Inverter AC', wattage: 1300, defaultQty: 0, icon: '💨', category: 'ac', peakSurge: 3500, description: 'Standard high-surge AC' },
  { id: 'water_pump', name: '0.75HP Water Pump', wattage: 750, defaultQty: 0, icon: '🚰', category: 'heavy', peakSurge: 2200, description: 'Sumo or borehole pump' },
  { id: 'microwave', name: 'Microwave Oven', wattage: 1200, defaultQty: 0, icon: '🍲', category: 'heavy', peakSurge: 1600, description: 'Used briefly for heating' },
];

const TEMPLATE_ICONS: Record<string, string> = {
  residential: '🏠',
  office: '🏢',
  restaurant: '☕',
  retail: '🛍️',
  salon: '💈',
  clinic: '🏥'
};

export default function HomeownerEstimatorPage() {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const homeownerSub = useHomeownerSubscriptionStore();
  const [mounted, setMounted] = React.useState(false);
  
  // Permanent lock to Nigeria region
  const regionCode: RegionCode = 'NG';
  const region: RegionProfile = REGION_PROFILES[regionCode];

  // Nigerian City state
  const [cityId, setCityId] = React.useState<string>('lagos');
  const activeCity = React.useMemo(() => getCityById(cityId), [cityId]);

  // Live FX Rate States
  const [usdToNgnRate, setUsdToNgnRate] = React.useState<number>(1500);
  const [fxFetchedTime, setFxFetchedTime] = React.useState<string>('');
  const [fxSource, setFxSource] = React.useState<string>('Live Interbank Rate • open.er-api.com');
  const [fxLoading, setFxLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const [gateFullName, setGateFullName] = React.useState('');
  const [gateWhatsApp, setGateWhatsApp] = React.useState('');
  const [gateLoading, setGateLoading] = React.useState(false);
  const [leadCaptured, setLeadCaptured] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const captured = localStorage.getItem('solar_lead_captured') === 'true';
      setLeadCaptured(captured);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const city = params.get('city');
      const nepa = params.get('nepa');
      const backup = params.get('backup');
      const fuel = params.get('fuel');
      const spend = params.get('spend');
      const qStr = params.get('quantities');

      if (city) setCityId(city);
      if (nepa) setNepaHours(parseInt(nepa, 10));
      if (backup) setBackupHours(parseInt(backup, 10));
      if (fuel) setFuelType(fuel as 'petrol' | 'diesel' | 'none');
      if (spend) setMonthlySpend(spend);
      if (qStr) {
        try {
          const parsed = JSON.parse(qStr);
          setQuantities(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse quantities from query parameters', e);
        }
      }
    }
  }, []);

  // Fetch FX Rate and Cache — non-blocking; renders skeleton pill until resolved
  React.useEffect(() => {
    let cancelled = false;
    const fetchFxRate = async () => {
      try {
        const rate = await fetchUSDNGNRate();
        if (cancelled) return;
        setUsdToNgnRate(rate);
        
        if (typeof window !== 'undefined') {
          const cachedTime = localStorage.getItem('solarquotepro_fx_rate_timestamp');
          const source = localStorage.getItem('solarquotepro_fx_source') || 'Live Interbank Rate • open.er-api.com';
          setFxSource(source);
          if (cachedTime) {
            setFxFetchedTime(new Date(parseInt(cachedTime, 10)).toLocaleTimeString());
          } else {
            setFxFetchedTime(new Date().toLocaleTimeString());
          }
        }
      } catch (e) {
        console.error('Failed to fetch live FX rate:', e);
      } finally {
        if (!cancelled) setFxLoading(false);
      }
    };
    fetchFxRate();
    return () => { cancelled = true; };
  }, []);

  /* ── State variables ── */
  const [quantities, setQuantities] = React.useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    APPLIANCE_PRESETS.forEach((p) => {
      init[p.id] = p.defaultQty;
    });
    return init;
  });

  const [showHeavyLoads, setShowHeavyLoads] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<string>('');
  const [appliedTemplateId, setAppliedTemplateId] = React.useState<string | null>(null);
  const [isCustomized, setIsCustomized] = React.useState<boolean>(false);
  const [pendingTemplate, setPendingTemplate] = React.useState<BusinessLoadTemplate | null>(null);
  const [hideBadge, setHideBadge] = React.useState<boolean>(false);

  // Auto-expand heavy loads if any have quantity > 0
  React.useEffect(() => {
    const hasHeavyLoad = ['deep_freezer', 'inverter_ac', 'standard_ac', 'water_pump', 'microwave'].some(
      (id) => (quantities[id] || 0) > 0
    );
    if (hasHeavyLoad) {
      setShowHeavyLoads(true);
    }
  }, [quantities]);

  const [nepaHours, setNepaHours] = React.useState<number>(8);
  const [backupHours, setBackupHours] = React.useState<number>(10);
  const [fuelType, setFuelType] = React.useState<'petrol' | 'diesel' | 'none'>('petrol');
  const [monthlySpend, setMonthlySpend] = React.useState<string>(region.context.defaultMonthlySpend);
  const [activeTab, setActiveTab] = React.useState<'system' | 'financials' | 'guide'>('system');

  /* ── Lead Capture Funnel State ── */
  const [leadModalOpen, setLeadModalOpen] = React.useState(false);
  const [leadEmail, setLeadEmail] = React.useState('');
  const [leadLoading, setLeadLoading] = React.useState(false);

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
    return runningLoad * backupHours;
  }, [runningLoad, backupHours]);

  const panelPeakWpNeeded = React.useMemo(() => {
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
    setSelectedPreset('');
    if (appliedTemplateId) {
      setIsCustomized(true);
    }
    setQuantities((prev) => {
      const val = (prev[id] || 0) + delta;
      return { ...prev, [id]: Math.max(0, val) };
    });
  };

  // Submit email lead only (B2)
  const handleLeadSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!leadEmail || !leadEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setLeadLoading(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadEmail,
          location: activeCity.name,
          running_load_w: runningLoad,
          kva_recommended: recommendation.kva,
          monthly_savings_ngn: solarReplacedSavings,
          monthly_fuel_spend: currentFuelSpendNaira
        })
      });
      
      if (response.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('solar_lead_captured', 'true');
        }
        setLeadModalOpen(false);
        setStep(3);
        setLeadCaptured(true);
        toast.success('Your report is ready! Let\'s proceed.');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Submission failed. Please try again.');
      }
    } catch (e) {
      console.error('Error submitting homeowner lead:', e);
      toast.error('Connection error. Please try again.');
    } finally {
      setGateLoading(false);
    }
  };

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateFullName.trim() || !gateWhatsApp.trim()) {
      toast.error('Please enter your name and WhatsApp number.');
      return;
    }
    setGateLoading(true);
    try {
      const response = await fetch('/api/leads/homeowner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: gateFullName,
          whatsapp: gateWhatsApp,
          city_disco: `${activeCity.name} (${activeCity.disco})`,
          estimated_system_size: recommendation.kva,
          monthly_fuel_spend: currentFuelSpendNaira,
          estimated_monthly_savings: solarReplacedSavings,
          running_load_w: runningLoad,
          kva_recommended: recommendation.kva,
          location: activeCity.name
        })
      });

      if (response.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('solar_lead_captured', 'true');
        }

        // ── Installer Routing: Sync lead into marketplace store ──
        // Normalise city ID to a state + city string pair so it matches
        // the mock service-area index in marketplaceStore.
        const cityNormalisationMap: Record<string, { state: string; city: string }> = {
          'lagos':         { state: 'Lagos', city: 'Lekki' },
          'lagos-ikeja':   { state: 'Lagos', city: 'Ikeja' },
          'abuja':         { state: 'Abuja', city: 'Maitama' },
          'port-harcourt': { state: 'Rivers', city: 'Port Harcourt' },
          'kano':          { state: 'Kano',  city: 'Kano' },
          'ibadan':        { state: 'Oyo',   city: 'Ibadan' },
          'enugu':         { state: 'Enugu', city: 'Enugu' },
          'benin':         { state: 'Edo',   city: 'Benin City' },
          'jos':           { state: 'Plateau', city: 'Jos' },
          'kaduna':        { state: 'Kaduna', city: 'Kaduna' },
          'yola':          { state: 'Adamawa', city: 'Yola' },
        };
        const normalised = cityNormalisationMap[cityId] ?? { state: activeCity.state, city: activeCity.name };

        useMarketplaceStore.getState().submitLead({
          name:              gateFullName,
          phone:             gateWhatsApp,
          email:             '',
          state:             normalised.state,
          city:              normalised.city,
          property_type:     'residential',
          monthly_spend:     currentFuelSpendNaira,
          power_source:      fuelType === 'none' ? 'grid' : fuelType === 'diesel' ? 'generator' : 'mixed',
          interest_type:     'backup_power',
          budget_range:      `₦${(recommendation.costMin / 1_000_000).toFixed(1)}M – ₦${(recommendation.costMax / 1_000_000).toFixed(1)}M`,
          preferred_contact: 'WhatsApp',
          timeline:          'Immediate',
          note:              `System: ${recommendation.title} (${recommendation.kva}). Payback: ${paybackPeriodYears.toFixed(1)} yrs. Fuel savings: ₦${solarReplacedSavings.toLocaleString()}/mo.`,
          request_source:    'estimator',
        });

        setLeadCaptured(true);
        toast.success('Your report is ready! Matched installers are shown below.');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to submit. Please try again.');
      }
    } catch (err) {
      console.error('[Estimator Gate Submit] Error:', err);
      toast.error('Connection error. Please try again.');
    } finally {
      setGateLoading(false);
    }
  };

  const handleGateSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('solar_lead_captured', 'true');
    }
    setLeadCaptured(true);
    toast.success('Viewing report preview.');
  };

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams();
    params.set('city', cityId);
    params.set('nepa', nepaHours.toString());
    params.set('backup', backupHours.toString());
    params.set('fuel', fuelType);
    params.set('spend', monthlySpend);
    params.set('quantities', JSON.stringify(quantities));
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const handleShareToInstaller = async () => {
    const shareUrl = getShareUrl();
    const minUSD = targetCostMin / usdToNgnRate;
    const maxUSD = targetCostMax / usdToNgnRate;
    const savingsMoUSD = solarReplacedSavings / usdToNgnRate;

    const textMessage = `Hello! I just used the *SolarQuotePro Sizing Estimator* to calculate my solar needs for my property in ${activeCity.name}:
    
- *Running Load:* ${runningLoad} W
- *Sized Recommendation:* ${recommendation.title} (${recommendation.kva})
- *Sized Batteries:* ${recommendation.battery}
- *Solar Panels:* ${recommendedPanelsQty}x 450W Panels
- *Estimated Cost:* ${formatCurrency(targetCostMin, region)} - ${formatCurrency(targetCostMax, region)} (~$${minUSD.toFixed(0)} - $${maxUSD.toFixed(0)} USD)
- *Local grid:* ${activeCity.disco} (${activeCity.tariffBand} @ ₦${activeCity.tariffRateNGN}/kWh)
- *My Current Fuel Cost:* ${formatCurrency(currentFuelSpendNaira, region)}/month
- *Estimated Fuel Savings:* ${formatCurrency(solarReplacedSavings, region)}/month (~$${savingsMoUSD.toFixed(0)} USD/mo)
- *Payback Period:* ${paybackPeriodYears.toFixed(1)} years

View my configuration and calculate sizing details here: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SolarQuotePro Sizing Report',
          text: textMessage,
          url: shareUrl
        });
        toast.success('Report shared successfully!');
      } catch (err) {
        console.log('navigator.share failed or cancelled, falling back to WhatsApp', err);
        window.open(`https://wa.me/?text=${encodeURIComponent(textMessage)}`, '_blank');
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(textMessage)}`, '_blank');
    }
  };

  const handleWhatsAppShare = handleShareToInstaller;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* ═══ Navigation ═══ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-850 dark:text-slate-50">SolarQuotePro</span>
            <Badge className="bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/20 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold shrink-0">Client Mode</Badge>
          </Link>

          <div className="flex items-center gap-3">
            {mounted && homeownerSub.tier === 'free' && (
              <Badge 
                onClick={homeownerSub.openUpgradeModal} 
                className="cursor-pointer bg-teal-500/10 hover:bg-teal-500/20 text-teal-650 dark:text-teal-400 border border-teal-500/20 text-[10px] font-bold py-1"
              >
                🏡 Unlimited Free Estimations
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
            No technical knowledge required. Tell us what appliances you use and what you currently spend on fuel, and get an immediate, transparent estimate tailored for the Nigerian market.
          </p>

          {/* ═══ Nigerian City Selector (B3) ═══ */}
          <div className="flex flex-col items-center justify-center gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">City / DISCO Territory:</span>
              <select
                title="Select your Nigerian City"
                value={cityId}
                onChange={(e) => {
                  const cid = e.target.value;
                  setCityId(cid);
                  const city = getCityById(cid);
                  if (city.gridReliability === 'good') {
                    setNepaHours(16);
                  } else if (city.gridReliability === 'moderate') {
                    setNepaHours(10);
                  } else {
                    setNepaHours(5);
                  }
                }}
                className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 cursor-pointer hover:border-teal-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {NIGERIAN_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    🇳🇬 {c.name} ({c.disco})
                  </option>
                ))}
              </select>
            </div>

            {/* Live FX Rate Ticker Pill (B4) — skeleton shown while fetching */}
            {fxLoading ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/40 dark:border-slate-700/40 rounded-full text-[10px] font-bold shadow-sm animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                </span>
                <span className="text-slate-500 dark:text-slate-400">Fetching rate…</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 rounded-full text-[10px] font-bold shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <span>USD/NGN Rate: ₦{usdToNgnRate.toFixed(2)}</span>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className="text-[9px] text-slate-500">{fxSource} {fxFetchedTime ? `(Updated ${fxFetchedTime})` : ''}</span>
              </div>
            )}
          </div>
        </section>

        {/* ═══ Progress Indicators ═══ */}
        <section className="flex items-center justify-between max-w-md mx-auto mb-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-250 dark:bg-slate-800 -translate-y-1/2 z-0" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-teal-500 -translate-y-1/2 z-0 transition-all duration-300" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />

          {[
            { num: 1, label: 'Appliances' },
            { num: 2, label: 'Fuel/Usage' },
            { num: 3, label: 'Sizing Report' },
          ].map((s) => (
            <div key={s.num} className="relative z-10 flex flex-col items-center">
              <button
                onClick={() => {
                  if (s.num === 3) {
                    const isLeadCaptured = typeof window !== 'undefined' && localStorage.getItem('solar_lead_captured') === 'true';
                    const isPaid = homeownerSub.tier !== 'free';
                    if (isPaid || isLeadCaptured) {
                      setStep(3);
                    } else {
                      setLeadModalOpen(true);
                    }
                  } else if (s.num < step || (s.num === 2 && runningLoad > 0)) {
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
              <span className={`text-[10px] font-bold mt-1.5 uppercase tracking-wider ${step === s.num ? 'text-teal-650 dark:text-teal-400' : 'text-slate-450 dark:text-slate-655'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </section>

        {/* ═══ Step 1: Appliances Selector ═══ */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Business Load Templates Selector */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-650 dark:text-teal-400" />
                Select Property or Business Type (Smart Starting Templates)
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal max-w-2xl">
                Choose a template below to pre-populate typical appliance loads and recommended backup hours. You can customize any item afterwards.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {BUSINESS_PRESETS.map((bp) => {
                  const isCurrent = appliedTemplateId === bp.id;
                  const icon = TEMPLATE_ICONS[bp.id] || '🏠';
                  return (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => setPendingTemplate(bp)}
                      className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer hover:shadow-md ${
                        isCurrent
                          ? 'bg-teal-500/[0.04] dark:bg-teal-950/20 border-teal-550 dark:border-teal-500 shadow-sm ring-1 ring-teal-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-2.5 w-full">
                        <span className="text-2xl shrink-0">{icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-xs text-slate-850 dark:text-slate-100 truncate">{bp.label}</p>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block uppercase">
                            {bp.segment} • {bp.confidence} Confidence
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-3 min-h-[30px] line-clamp-2">
                        {bp.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {bp.summaryBadges.map((badge, bidx) => (
                          <Badge key={bidx} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border-none font-semibold text-[8px] px-1.5 py-0.5">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inline Template State Badge Banner */}
            {appliedTemplateId && !hideBadge && (() => {
              const activeTemplate = BUSINESS_PRESETS.find(t => t.id === appliedTemplateId);
              if (!activeTemplate) return null;
              return (
                <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200 ${
                  isCustomized
                    ? 'bg-amber-500/[0.03] border-amber-500/25 dark:bg-amber-950/[0.03] dark:border-amber-500/15'
                    : 'bg-teal-500/[0.03] border-teal-500/25 dark:bg-teal-950/[0.03] dark:border-teal-500/15'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-xl ${
                      isCustomized ? 'bg-amber-500/10 text-amber-600' : 'bg-teal-500/10 text-teal-600'
                    }`}>
                      {isCustomized ? <Info className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isCustomized ? (
                          <>Customized from <strong className="text-amber-600 dark:text-amber-400 font-extrabold">{activeTemplate.label}</strong></>
                        ) : (
                          <>Template applied: <strong className="text-teal-650 dark:text-teal-400 font-extrabold">{activeTemplate.label}</strong></>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-0.5">
                        {isCustomized 
                          ? 'You have modified the default values of this template.'
                          : 'Recommended starting values are applied. You can customize them below.'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const mappedQty = mapTemplateToEstimator(activeTemplate);
                        setQuantities(mappedQty);
                        setBackupHours(activeTemplate.suggestedBackupHours);
                        setIsCustomized(false);
                        toast.success(`Reset loads to "${activeTemplate.label}" defaults!`);
                      }}
                      className="px-2.5 py-1.5 text-[10px] font-black text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 rounded-xl transition-all cursor-pointer border border-teal-500/20 dark:border-teal-500/10 bg-white dark:bg-slate-900"
                    >
                      Reset to Template
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const clearedQty: Record<string, number> = {};
                        APPLIANCE_PRESETS.forEach(p => {
                          clearedQty[p.id] = 0;
                        });
                        setQuantities(clearedQty);
                        setAppliedTemplateId(null);
                        setIsCustomized(false);
                        toast.info('Template cleared.');
                      }}
                      className="px-2.5 py-1.5 text-[10px] font-black text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer border border-rose-500/20 dark:border-rose-500/10 bg-white dark:bg-slate-900"
                    >
                      Clear Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setHideBadge(true)}
                      className="px-2.5 py-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer bg-transparent border-0"
                    >
                      Keep editing
                    </button>
                  </div>
                </div>
              );
            })()}

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
              <CardContent className="p-4 sm:p-6 space-y-5">

                {/* Essentials Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    🏠 Essential Home Appliances
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {APPLIANCE_PRESETS.filter(p => !['deep_freezer', 'inverter_ac', 'standard_ac', 'water_pump', 'microwave'].includes(p.id)).map((p) => {
                      const qty = quantities[p.id] || 0;
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                            qty > 0
                              ? 'bg-teal-500/5 border-teal-500/30 dark:border-teal-500/20 shadow-sm'
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
                </div>

                {/* Heavy Loads Toggle Switch Banner */}
                <div className="border border-slate-250 dark:border-slate-850 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                      ⚡ Power heavy or high-power appliances?
                    </h4>
                    <p className="text-[10px] text-slate-500 max-w-md leading-normal">
                      Include deep freezers, air conditioners (ACs), water pumps, or microwave ovens in your solar sizing.
                    </p>
                  </div>
                  <Switch
                    checked={showHeavyLoads}
                    onCheckedChange={(checked) => {
                      setShowHeavyLoads(checked);
                      setSelectedPreset('');
                      if (!checked) {
                        setQuantities((prev) => {
                          const next = { ...prev };
                          ['deep_freezer', 'inverter_ac', 'standard_ac', 'water_pump', 'microwave'].forEach(id => {
                            next[id] = 0;
                          });
                          return next;
                        });
                      }
                    }}
                  />
                </div>

                {/* Heavy Loads Grid */}
                {showHeavyLoads && (
                  <div className="space-y-3 pt-3 animate-in fade-in slide-in-from-top-3 duration-300">
                    <h3 className="text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1">
                      ⚠️ Heavy / Surge Load Appliances
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {APPLIANCE_PRESETS.filter(p => ['deep_freezer', 'inverter_ac', 'standard_ac', 'water_pump', 'microwave'].includes(p.id)).map((p) => {
                        const qty = quantities[p.id] || 0;
                        return (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                              qty > 0
                                ? 'bg-amber-500/5 border-amber-500/30 shadow-sm'
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
                  </div>
                )}
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
                className="bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1 text-xs px-5 h-9 border-none cursor-pointer"
                onClick={() => setStep(2)}
              >
                Next Step <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
            {/* Why Use the SolarQuotePro Sizer? info section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-200">Independent Sizing</h4>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Installers often oversize solar systems to charge you more, or undersize systems resulting in quick battery degradation. We calculate your exact, unbiased capacity requirements.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-200">Real ROI &amp; Payback</h4>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  We use live parallel-market USD/NGN exchange rates and local NERC tariff bands for DISCOs (Lagos, Abuja, PH) to map out your real fuel replacement ROI.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-650 dark:text-indigo-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-200">Lagos Anti-Scam Guide</h4>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Get our premium Lagos Solar Buyer protection guide showing how to identify counterfeit batteries, check panel capacity, and screen certified installers.
                </p>
              </div>
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
                  Step 2: Utility Sizing &amp; Fuel Expenses
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
                      How many hours of grid ({activeCity.disco}) power do you get daily?
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
                    className="py-2 text-teal-650"
                  />
                  <p className="text-[10px] text-slate-450">
                    High DISCO hours mean you can recharge batteries mostly with grid, potentially needing fewer solar panels.
                  </p>
                </div>

                {/* Backup Hours */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                      How many hours of battery backup do you need when {activeCity.disco} fails?
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
                      const nextVal = Array.isArray(val) ? val[0] : val;
                      setBackupHours(nextVal);
                      if (appliedTemplateId) {
                        setIsCustomized(true);
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
                      { id: 'petrol', label: 'Petrol Gen ⛽', desc: 'Standard small/medium gen' },
                      { id: 'diesel', label: 'Diesel Gen 🚜', desc: 'Large high kVA gen' },
                      { id: 'none', label: 'No Gen / Grid only 🔌', desc: 'No fuel costs to replace' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setFuelType(g.id as 'petrol' | 'diesel' | 'none')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
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
                        <Info className="w-3 h-3 text-teal-650" /> Fuel costs are based on current Nigerian rates (Petrol ₦1,250/L, Diesel ₦1,750/L as of 2026).
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                className="font-bold flex items-center gap-1 text-xs rounded-xl cursor-pointer"
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="w-4 h-4" /> Edit Appliances
              </Button>

              <Button
                className="bg-teal-650 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1 text-xs px-5 h-9 border-none cursor-pointer"
                onClick={() => {
                  const isLC = typeof window !== 'undefined' && localStorage.getItem('solar_lead_captured') === 'true';
                  const isPaid = homeownerSub.tier !== 'free';
                  if (isPaid || isLC || leadCaptured) {
                    setStep(3);
                  } else {
                    setLeadModalOpen(true);
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
            {homeownerSub.tier === 'free' && !leadCaptured ? (
              <div className="max-w-md mx-auto py-8">
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <div className="space-y-2 text-center">
                    <Badge className="bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/10 text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2">
                      ⚡ REPORT READY
                    </Badge>
                    <h2 className="text-xl font-black text-slate-850 dark:text-white leading-tight">
                      Your Free Solar Sizing Report is Ready
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Drop your WhatsApp number — we'll send your full report and connect you to verified Lagos installers.
                    </p>
                  </div>

                  <form onSubmit={handleGateSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Full Name</label>
                      <Input
                        type="text"
                        required
                        placeholder="e.g. Alhaji Musa Bello"
                        value={gateFullName}
                        onChange={(e) => setGateFullName(e.target.value)}
                        className="rounded-xl border-slate-250 dark:border-slate-800 dark:bg-slate-950 font-medium text-xs focus-visible:ring-teal-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">WhatsApp Number</label>
                      <Input
                        type="tel"
                        required
                        placeholder="+234 801 234 5678"
                        value={gateWhatsApp}
                        onChange={(e) => setGateWhatsApp(e.target.value)}
                        className="rounded-xl border-slate-250 dark:border-slate-800 dark:bg-slate-950 font-medium text-xs focus-visible:ring-teal-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={gateLoading}
                      className="w-full bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md h-10 border-none transition-all cursor-pointer"
                    >
                      {gateLoading ? 'Preparing Report...' : 'Get My Free Report on WhatsApp →'}
                    </Button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleGateSkip}
                      className="text-xs font-bold text-slate-455 hover:text-slate-655 dark:hover:text-slate-350 underline transition-all cursor-pointer"
                    >
                      Skip — show the report without saving
                    </button>
                  </div>
                </Card>
              </div>
            ) : (
              <>
                {/* Sizing result hero card */}
                <Card className="relative overflow-hidden border-teal-500/25 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 text-white shadow-xl rounded-3xl p-6 sm:p-8">
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" /> Calculated Sizing Recommendation
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{recommendation.title}</h2>
                  <div className="text-right">
                    <p className="text-teal-450 font-extrabold text-lg tabular-nums">
                      {formatCurrency(convertCost(recommendation.costMin, region), region)} - {formatCurrency(convertCost(recommendation.costMax, region), region)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      (${(convertCost(recommendation.costMin, region) / usdToNgnRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} - ${(convertCost(recommendation.costMax, region) / usdToNgnRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD)*
                    </p>
                  </div>
                </div>

                <p className="text-slate-355 text-xs leading-relaxed max-w-xl">
                  {recommendation.description}
                </p>
                
                <p className="text-[9px] text-slate-500 italic mt-1">
                  *Converted in real-time at the {fxSource} of ₦{usdToNgnRate.toFixed(2)}/USD.
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

            {/* Nigerian city compliance card (B3) */}
            <Card className="border-amber-500/20 dark:border-amber-500/10 bg-amber-500/[0.02] dark:bg-amber-955/[0.05] shadow-md rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="text-base">📍</span> {activeCity.name} Grid &amp; Compliance Registry
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Local DISCO: <strong className="text-slate-700 dark:text-slate-350">{activeCity.discoFull} ({activeCity.disco})</strong> • Tariff Band: <strong className="text-slate-700 dark:text-slate-350">{activeCity.tariffBand}</strong>
                  </p>
                </div>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full shrink-0 border border-amber-500/20">
                  ₦{activeCity.tariffRateNGN}/kWh NERC Rate
                </span>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-850" />

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                  📋 Local Compliance Requirements
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeCity.complianceNotes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                      <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Sizing details and analysis tabs */}
            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-150 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('system')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
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
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'financials'
                      ? 'bg-white dark:bg-slate-850 text-teal-650 dark:text-teal-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-355'
                  }`}
                >
                  📈 ROI &amp; Savings
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guide')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
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
                        <p className="text-[10px] text-slate-455 mt-1 leading-normal">
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
                      <TrendingUp className="w-4 h-4 text-emerald-650" /> ROI &amp; Savings Analysis (USD equivalents at ₦{usdToNgnRate.toFixed(1)}/$)
                    </h3>

                    {fuelType === 'none' ? (
                      <div className="py-8 text-center space-y-2">
                        <p className="text-slate-500 text-sm font-semibold">
                          You indicated that you do not run a generator.
                        </p>
                        <p className="text-xs text-slate-450 max-w-sm mx-auto">
                          Your main solar benefit will be providing 100% stable, uninterrupted 24/7 power during {activeCity.disco} grid blackouts.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Fuel Bill</p>
                            <p className="text-lg font-black text-rose-650 dark:text-rose-450 mt-1">
                              {formatCurrency(currentFuelSpendNaira, region)} / mo
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                              {formatCurrency(annualFuelSpend, region)} / yr (${(annualFuelSpend / usdToNgnRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD)
                            </p>
                          </div>

                          <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Replaced by Solar</p>
                            <p className="text-lg font-black text-emerald-650 dark:text-emerald-400 mt-1">
                              {formatCurrency(solarReplacedSavings, region)} / mo
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                              {formatCurrency(annualSolarSavings, region)} / yr (${(annualSolarSavings / usdToNgnRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD)
                            </p>
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
                          <p className="text-xs font-extrabold text-slate-855 dark:text-slate-100 mb-2">5-Year Financial Projection</p>
                          <div className="space-y-3 pt-2">
                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                <span>Accumulated Fuel Expense (Gen)</span>
                                <span className="text-rose-500">
                                  {formatCurrency(annualFuelSpend * 5, region)} (${((annualFuelSpend * 5) / usdToNgnRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD)
                                </span>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                <span>Solar System Cost + Maintenance</span>
                                <span className="text-teal-500">
                                  {formatCurrency(targetMidpointCost * 1.1, region)} (${((targetMidpointCost * 1.1) / usdToNgnRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD)
                                </span>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(100, parseFloat((targetMidpointCost * 1.1 / (annualFuelSpend * 5) * 100).toFixed(0)))}%` }} />
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-450 mt-3 leading-relaxed">
                            💡 <strong>Informed Decision:</strong> In Nigeria, generator fuel is a continuous, burning liability. Solar is an asset that pays for itself and provides quiet, pollution-free power for 20+ years.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tab 3: Buyer Guide */}
              {activeTab === 'guide' && (
                <Card className="border-slate-200 dark:border-slate-855 shadow-md animate-in fade-in duration-250">
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
                          a: "Monocrystalline panels (efficiency > 20%) perform much better in Nigerian weather, especially during the cloudier rainy season, compared to older Polycrystalline panels."
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

            {/* ── City Compliance Notes Card ── */}
            <LocalComplianceCard city={activeCity} />

            {/* ── Dynamic Matched Installers Card ── */}
            <MatchedInstallersCard cityId={cityId} activeCity={activeCity} onShare={handleShareToInstaller} />

            {/* Keep the plain WhatsApp share CTA as a fallback */}
            <Card className="border border-teal-500/20 bg-teal-500/[0.03] dark:bg-teal-500/[0.01] rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-850 dark:text-white flex items-center gap-2">
                    📱 Share Report via WhatsApp
                  </h3>
                  <p className="text-xs text-slate-555 dark:text-slate-400 font-medium">
                    Send this sizing report directly to any installer or to a friend who needs solar quotes.
                  </p>
                </div>
                <Button
                  onClick={handleShareToInstaller}
                  className="bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-black px-6 h-10 border-none shadow-md shrink-0 cursor-pointer"
                >
                  Share / Send to Installer 📱
                </Button>
              </div>
            </Card>

              </>
            )}

            {/* Actions for customer */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <Button
                type="button"
                className="flex-1 bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-black py-6 text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all border-none cursor-pointer"
                onClick={handleShareToInstaller}
              >
                Share Sizing Report 📱
              </Button>

              <Button
                type="button"
                variant="outline"
                className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold py-6 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" /> Save as Sizing PDF
              </Button>
            </div>

            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                className="font-bold flex items-center gap-1 text-xs rounded-xl cursor-pointer"
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
          <div>
            <p>© <CopyrightYear /> SolarQuotePro — Transparent Sizing Sizer for Clients</p>
            <LegalNotice />
          </div>
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
              Upgrade to get instant access to system recommendations, generator fuel payback projections, and installer-ready reports.
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
                className="w-full bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-850 dark:hover:bg-slate-750 text-[11px] font-bold py-1.5 rounded-xl h-8 border-none cursor-pointer"
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
                  <span className="text-[9px] text-slate-455 block mt-0.5">per month</span>
                </div>
              </div>
              <Button 
                onClick={() => homeownerSub.subscribeMonthly()}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold py-1.5 rounded-xl h-8 shadow-sm shadow-teal-650/10 border-none cursor-pointer"
              >
                Subscribe Monthly
              </Button>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between items-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              onClick={homeownerSub.closeUpgradeModal}
            >
              Cancel
            </Button>
            {homeownerSub.tier !== 'free' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] font-bold text-rose-500 hover:text-rose-650 hover:bg-rose-50/50 cursor-pointer"
                onClick={() => homeownerSub.cancelSubscription()}
              >
                Reset Account to Free
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ B2C Email-only Lead Capture Gate (B2) ═══ */}
      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <DialogContent className="sm:max-w-md border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="space-y-2">
            <div className="flex justify-center mb-1">
              <div className="p-2.5 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <DialogTitle className="text-xl font-black text-center text-slate-850 dark:text-white leading-snug">
              Stop the Power Bleed! 💡
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              {fuelType !== 'none' ? (
                <>
                  You are currently losing up to <strong className="text-rose-500 font-black">{formatCurrency(solarReplacedSavings, region)} ({ (solarReplacedSavings / usdToNgnRate).toLocaleString(undefined, {maximumFractionDigits:0}) } USD)/month</strong> on generator runs.
                </>
              ) : (
                <>
                  Get your customized sizer roadmap, sizing configuration, and tariff shield guide.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Value Prop Cards Grid */}
          <div className="grid grid-cols-2 gap-2 my-4">
            <div className="p-3 bg-teal-500/[0.03] dark:bg-teal-500/[0.01] border border-teal-500/10 rounded-2xl space-y-1">
              <span className="text-base">📋</span>
              <h5 className="font-extrabold text-[10px] text-slate-850 dark:text-slate-200 leading-tight">Solar Sizing Roadmap</h5>
              <p className="text-[9px] text-slate-450 leading-snug">Custom KVA, panel array, and battery calculations.</p>
            </div>
            <div className="p-3 bg-amber-500/[0.03] dark:bg-amber-500/[0.01] border border-amber-500/10 rounded-2xl space-y-1">
              <span className="text-base">🛡️</span>
              <h5 className="font-extrabold text-[10px] text-slate-850 dark:text-slate-200 leading-tight">Band A Tariff Shield</h5>
              <p className="text-[9px] text-slate-455 leading-snug">How to program inverters to cut off-peak NEPA costs.</p>
            </div>
            <div className="p-3 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.01] border border-indigo-500/10 rounded-2xl space-y-1">
              <span className="text-base">🔍</span>
              <h5 className="font-extrabold text-[10px] text-slate-855 dark:text-slate-200 leading-tight">Lagos Anti-Scam Guide</h5>
              <p className="text-[9px] text-slate-450 leading-snug">Identify fake lithium batteries and cowboy installers.</p>
            </div>
            <div className="p-3 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] border border-emerald-500/10 rounded-2xl space-y-1">
              <span className="text-base">🎟️</span>
              <h5 className="font-extrabold text-[10px] text-slate-850 dark:text-slate-200 leading-tight">₦50,000 Install Voucher</h5>
              <p className="text-[9px] text-slate-450 leading-snug">Redeemable with vetted directory EPC partners.</p>
            </div>
          </div>

          {/* Form */}
          <form 
            onSubmit={handleLeadSubmit} 
            className="space-y-3.5"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-extrabold mb-1 uppercase tracking-wider">Email Address</label>
                <Input 
                  type="email" 
                  required 
                  value={leadEmail} 
                  onChange={(e) => setLeadEmail(e.target.value)} 
                  placeholder="e.g. name@company.com" 
                  className="w-full text-xs p-3 rounded-xl border border-slate-250 bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none py-5 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button 
                type="submit" 
                disabled={leadLoading}
                className="w-full bg-gradient-to-r from-teal-650 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold rounded-2xl h-12 text-xs shadow-md border-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {leadLoading ? 'Securing Roadmap...' : 'Get Sizing & ₦120k Bundle via Email 📩'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('solar_lead_captured', 'true');
                  }
                  setLeadModalOpen(false);
                  setStep(3);
                  toast.success('Test preview unlocked! (No email captured)');
                }}
                className="w-full py-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-[10px] font-extrabold transition-all border border-dashed border-slate-300 dark:border-slate-850 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/30 cursor-pointer"
              >
                Just Testing? Skip &amp; Preview Sizing Report →
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Confirmation Dialog */}
      <Dialog open={!!pendingTemplate} onOpenChange={(open) => !open && setPendingTemplate(null)}>
        <DialogContent className="max-w-md border-none rounded-3xl p-6 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
          <DialogHeader className="space-y-3">
            <div className="flex justify-center mb-1">
              <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 text-teal-600 dark:text-teal-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <DialogTitle className="text-lg font-black text-center text-slate-850 dark:text-white leading-snug">
              Apply Template: {pendingTemplate?.label}?
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              This will replace your current Step 1 appliances and hours with recommended defaults for a typical {pendingTemplate?.label.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>

          {pendingTemplate && (
            <div className="my-4 space-y-4">
              {/* Recommended Backup Hours */}
              <div className="p-3.5 bg-teal-500/[0.03] dark:bg-teal-500/[0.01] border border-teal-500/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Recommended Backup</p>
                    <p className="text-[10px] text-slate-400">Suggested runtime expectation</p>
                  </div>
                </div>
                <Badge className="bg-teal-100 dark:bg-teal-950 text-teal-850 dark:text-teal-400 border-none font-bold text-xs">
                  {pendingTemplate.suggestedBackupHours} Hours
                </Badge>
              </div>

              {/* Typical Runtime Pattern */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 rounded-2xl space-y-2">
                <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Typical Runtime Pattern
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-slate-700 dark:text-slate-350">
                  {pendingTemplate.appliances.map((app, idx) => {
                    const preset = APPLIANCE_PRESETS.find(p => p.id === app.applianceKey);
                    if (!preset) return null;
                    return (
                      <div key={idx} className="flex justify-between items-center text-[11px] font-semibold border-b border-slate-100 dark:border-slate-800/40 pb-1.5 last:border-0 last:pb-0">
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{preset.icon}</span>
                          <span className="truncate">{preset.name}</span>
                        </span>
                        <span className="font-extrabold shrink-0 text-slate-650 dark:text-slate-300">
                          Qty: {app.quantity} ({app.runtimeHours}h)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Warning/Caution */}
              {pendingTemplate.warning && (
                <div className="p-3.5 bg-amber-500/[0.04] dark:bg-amber-500/[0.01] border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-550 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">Caution Note</p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-450 leading-relaxed font-semibold mt-0.5">
                      {pendingTemplate.warning}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
}

interface LocalComplianceCardProps {
  city: NigerianCity;
}

function LocalComplianceCard({ city }: LocalComplianceCardProps) {
  const [copied, setCopied] = React.useState(false);

  const landlordTemplate = `LANDLORD SOLAR INSTALLATION CONSENT ADDENDUM

This Addendum is made this _____ day of ____________, 20___, between ________________________ (Landlord) and ________________________ (Tenant) for the property at __________________________________________________.

The Landlord hereby consents to the installation of a removable solar power system by the Tenant on the designated roof/balcony structural areas, subject to:
1. Inverter/battery components remain the personal property of the Tenant and are fully removable upon lease expiration.
2. Installation must be performed by a verified, licensed solar partner.
3. Tenant is responsible for any structural waterproofing/roof penetrations.

Signed: ____________ (Landlord)   ____________ (Tenant)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(landlordTemplate);
    setCopied(true);
    toast.success('Consent Addendum template copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
      <div className="space-y-2">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-850 dark:text-white flex items-center gap-2">
          📋 Local Regulatory & Legal Assets
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ensure your installation is fully compliant with regional regulations and tenure contracts.
        </p>
      </div>

      <div className="space-y-4">
        {/* Compliance Guidelines */}
        <div className="space-y-2.5">
          <p className="text-xs font-black text-slate-800 dark:text-slate-200">
            {city.name} Compliance Checklist:
          </p>
          <ul className="space-y-2 pl-4 list-disc text-xs text-slate-600 dark:text-slate-400">
            {city.complianceNotes.map((note, index) => (
              <li key={index} className="leading-relaxed">
                {note}
              </li>
            ))}
          </ul>
        </div>

        {/* Landlord Consent Template */}
        <div className="border border-teal-500/20 bg-teal-500/[0.02] dark:bg-teal-500/[0.01] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-850 dark:text-teal-400 flex items-center gap-1.5">
              📜 Landlord Consent Addendum Template
            </span>
            <div className="flex gap-1.5">
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="text-[10px] h-7 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-teal-500/20 text-teal-700 dark:text-teal-400 font-bold rounded-lg cursor-pointer"
              >
                {copied ? 'Copied!' : 'Copy 📋'}
              </Button>
              <Button
                onClick={() => window.open(`/estimator/landlord-consent?city=${city.id}`, '_blank')}
                variant="default"
                size="sm"
                className="text-[10px] h-7 px-2.5 bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Download PDF ⬇️
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Essential for tenants to secure authorization before installing removable roof-mounted panel frames.
          </p>
          <pre className="text-[9px] font-mono bg-slate-55 dark:bg-slate-950 p-2.5 rounded-lg overflow-x-auto text-slate-600 dark:text-slate-400 max-h-32 border border-slate-200 dark:border-slate-800">
            {landlordTemplate}
          </pre>
        </div>
      </div>
    </Card>
  );
}

interface MatchedInstallersCardProps {
  cityId: string;
  activeCity: NigerianCity;
  onShare: () => void;
}

function MatchedInstallersCard({ cityId, activeCity, onShare }: MatchedInstallersCardProps) {
  const allAreas = useMarketplaceStore(state => state.serviceAreas);
  const installers = useMarketplaceStore(state => state.installers);
  const subscriptions = useMarketplaceStore(state => state.subscriptions);

  const cityNormalisationMap: Record<string, { state: string; city: string }> = {
    'lagos':         { state: 'Lagos', city: 'Lekki' },
    'lagos-ikeja':   { state: 'Lagos', city: 'Ikeja' },
    'abuja':         { state: 'Abuja', city: 'Maitama' },
    'port-harcourt': { state: 'Rivers', city: 'Port Harcourt' },
    'kano':          { state: 'Kano',  city: 'Kano' },
    'ibadan':        { state: 'Oyo',   city: 'Ibadan' },
    'enugu':         { state: 'Enugu', city: 'Enugu' },
    'benin':         { state: 'Edo',   city: 'Benin City' },
    'jos':           { state: 'Plateau', city: 'Jos' },
    'kaduna':        { state: 'Kaduna', city: 'Kaduna' },
    'yola':          { state: 'Adamawa', city: 'Yola' },
  };

  const normalised = cityNormalisationMap[cityId] ?? { state: activeCity.state, city: activeCity.name };

  const matched = React.useMemo(() => {
    // Phase 1: Search for exact State and City matches
    let matchingIds = Array.from(
      new Set(
        allAreas
          .filter(
            (sa) =>
              sa.state.toLowerCase() === normalised.state.toLowerCase() &&
              sa.city.toLowerCase() === normalised.city.toLowerCase()
          )
          .map((sa) => sa.installer_id)
      )
    );

    // Phase 2: Fall back to State-only match if zero exact matches found
    if (matchingIds.length === 0) {
      matchingIds = Array.from(
        new Set(
          allAreas
            .filter(
              (sa) =>
                sa.state.toLowerCase() === normalised.state.toLowerCase()
            )
            .map((sa) => sa.installer_id)
        )
      );
    }

    // Sort matching installers based on verified listing subscription tiers
    const sorted = matchingIds.sort((a, b) => {
      const subA = subscriptions.find(s => s.installer_id === a);
      const subB = subscriptions.find(s => s.installer_id === b);
      
      const scoreA = subA?.tier === 'verified_partner_plus' ? 1000 : subA?.tier === 'verified_partner' ? 500 : 0;
      const scoreB = subB?.tier === 'verified_partner_plus' ? 1000 : subB?.tier === 'verified_partner' ? 500 : 0;
      
      return scoreB - scoreA;
    });

    return sorted
      .map(id => {
        const inst = installers.find(i => i.id === id);
        const sub = subscriptions.find(s => s.installer_id === id);
        return inst ? { ...inst, tier: sub?.tier || 'basic' } : null;
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);
  }, [allAreas, installers, subscriptions, normalised.state, normalised.city]);

  if (matched.length === 0) {
    return (
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-855 dark:text-white flex items-center gap-2">
          🛡️ Verified Installer Partners
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No direct installer matches found for your specific area. Share your report with a general consultant to be matched.
        </p>
        <Button onClick={onShare} className="w-full bg-teal-650 hover:bg-teal-700 text-white font-extrabold rounded-2xl h-11 text-xs">
          Match Me with an Installer 📱
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
      <div className="space-y-1">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-855 dark:text-white flex items-center gap-2">
          🛡️ Match with Verified {normalised.state} Installers
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          These verified partners service {normalised.city} and can provide NERC/LSEB compliant installations.
        </p>
      </div>

      <div className="space-y-4">
        {matched.slice(0, 3).map((inst) => (
          <div
            key={inst.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-slate-100 dark:border-slate-800 hover:border-teal-500/20 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 transition-all gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs text-slate-850 dark:text-white">
                  {inst.business_name}
                </span>
                {inst.is_verified && (
                  <Badge className="bg-teal-500/10 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-500/20 text-[9px] px-1.5 py-0 rounded-full font-bold">
                    ✓ Verified Partner
                  </Badge>
                )}
                {inst.tier === 'verified_partner_plus' && (
                  <Badge className="bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0 rounded-full font-bold animate-pulse">
                    ★ Top Match
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {inst.description}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {inst.specialty_tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-650 dark:text-slate-400 px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
              <Button
                onClick={() => {
                  toast.success(`Request sent to ${inst.business_name}! They will contact you shortly.`);
                }}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial text-[10px] h-8 px-3 font-bold rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Inquire ✉
              </Button>
              <Button
                onClick={onShare}
                size="sm"
                className="flex-1 sm:flex-initial text-[10px] h-8 px-3 font-black rounded-xl bg-teal-600 hover:bg-teal-700 text-white border-none cursor-pointer"
              >
                WhatsApp 📱
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
