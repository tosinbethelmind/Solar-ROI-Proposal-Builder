import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info, CheckCircle } from 'lucide-react';
import { useWizardStore } from '@/store/wizardStore';
import { calculateDailyLoad, calculateInverterSize, calculateBatteryBank, calculatePanelArray } from '@/utils/calculations';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NIGERIAN_CITIES, getCityById } from '@/lib/nigerianCities';

function getRegionIdFromCityId(cityId?: string): number | undefined {
  if (!cityId) return undefined;
  switch (cityId) {
    case 'lagos':
    case 'lagos-ikeja':
      return 1;
    case 'abuja':
      return 2;
    case 'kano':
      return 3;
    case 'port-harcourt':
      return 4;
    case 'enugu':
      return 5;
    case 'ibadan':
      return 6;
    case 'benin':
      return 7;
    case 'kaduna':
      return 8;
    case 'jos':
      return 9;
    default:
      return undefined;
  }
}

function getPshFromCityId(cityId?: string): number {
  switch (cityId) {
    case 'lagos':
    case 'lagos-ikeja':
      return 4.2;
    case 'abuja':
      return 5.0;
    case 'kano':
      return 5.8;
    case 'port-harcourt':
      return 4.0;
    case 'enugu':
      return 4.5;
    case 'ibadan':
      return 4.8;
    case 'benin':
      return 4.3;
    case 'kaduna':
      return 5.5;
    case 'jos':
      return 5.2;
    case 'yola':
      return 5.8;
    default:
      return 4.2;
  }
}

// ── Zod Schema ─────────────────────────────────────────────────────────────
const step2Schema = z.object({
  battery_chemistry: z.enum(['lead-acid', 'lithium']),
  backup_hours: z.number().min(4).max(48),
  nepa_daily_hours: z.number().min(0).max(23),
  nepa_tariff_per_kwh: z.number().min(10).max(1000),
  petrol_price: z.number().positive(),
  diesel_price: z.number().positive(),
  selected_tier: z.enum(['budget', 'standard', 'premium']),
  monthly_phcn_bill: z.number().nonnegative(),
  monthly_gen_fuel_cost: z.number().nonnegative(),
  monthly_gen_maintenance: z.number().nonnegative(),
  city_id: z.string().optional(),
  battery_sizing_method: z.enum(['backup-hours', 'flat-load']).optional(),
  panel_sizing_basis: z.enum(['total', 'essential']).optional(),
  annual_inflation_rate: z.number().min(0).max(100).optional(),
});

type Step2Form = z.infer<typeof step2Schema>;

// ── Tier config ────────────────────────────────────────────────────────────
const TIERS = [
  {
    id: 'budget' as const,
    label: 'Economy',
    desc: 'Budget inverter + Tubular batteries',
    range: '~₦450K – ₦700K',
    tag: 'Fastest payback',
    tagColor: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'standard' as const,
    label: 'Standard',
    desc: 'Hybrid inverter + LiFePO₄',
    range: '~₦850K – ₦1.4M',
    tag: 'Best value',
    tagColor: 'bg-teal-100 text-teal-800',
  },
  {
    id: 'premium' as const,
    label: 'Premium',
    desc: 'Deye/Victron + Premium LiFePO₄ + Mono panels',
    range: '~₦1.5M+',
    tag: 'Longest lifespan',
    tagColor: 'bg-purple-100 text-purple-800',
  },
];

const NEPA_OPTIONS = [
  { label: 'Off-Grid', sub: '0 hrs', hours: 0 },
  { label: 'Partial', sub: '1–6 hrs', hours: 4 },
  { label: 'Reliable', sub: '6–12 hrs', hours: 10 },
];

function backupLabel(h: number): string {
  if (h <= 8) return `${h} hours — covers overnight load`;
  if (h <= 16) return `${h} hours — extended autonomy`;
  if (h < 24) return `${h} hours — most of the day`;
  return `${h} hours — full-day autonomy`;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Step2Preferences({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { proposal, updateProposal, setCalculations, setStep } = useWizardStore();
  const [showAdvancedSizing, setShowAdvancedSizing] = React.useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      battery_chemistry: proposal.battery_chemistry,
      backup_hours: proposal.backup_hours,
      nepa_daily_hours: proposal.nepa_daily_hours,
      nepa_tariff_per_kwh: proposal.nepa_tariff_per_kwh,
      petrol_price: proposal.fuelPrices?.petrolPerLitre || 1250,
      diesel_price: proposal.fuelPrices?.dieselPerLitre || 1750,
      selected_tier: proposal.selected_tier,
      monthly_phcn_bill: proposal.monthly_phcn_bill ?? 8000,
      monthly_gen_fuel_cost: proposal.monthly_gen_fuel_cost ?? 85000,
      monthly_gen_maintenance: proposal.monthly_gen_maintenance ?? 12000,
      city_id: proposal.city_id || 'lagos',
      battery_sizing_method: proposal.battery_sizing_method || 'backup-hours',
      panel_sizing_basis: proposal.panel_sizing_basis || 'essential',
      annual_inflation_rate: proposal.annual_inflation_rate !== undefined ? Math.round(proposal.annual_inflation_rate * 100) : 20,
    },
  });

  const chemistry = watch('battery_chemistry');
  const backupHours = watch('backup_hours');
  const nepaDailyHours = watch('nepa_daily_hours');
  const selectedTier = watch('selected_tier');
  const cityId = watch('city_id') || 'lagos';

  const watchDieselPrice = watch('diesel_price');
  const watchPhcn = watch('monthly_phcn_bill') || 0;
  const watchGenFuel = watch('monthly_gen_fuel_cost') || 0;
  const watchGenMaint = watch('monthly_gen_maintenance') || 0;

  const totalLegacyEnergyCost = watchPhcn + watchGenFuel + watchGenMaint;

  React.useEffect(() => {
    if (watchDieselPrice) {
      const calculated = Math.round((watchDieselPrice / 1750) * 85000);
      setValue('monthly_gen_fuel_cost', calculated, { shouldValidate: true });
    }
  }, [watchDieselPrice, setValue]);

  React.useEffect(() => {
    if (cityId) {
      const city = getCityById(cityId);
      setValue('nepa_tariff_per_kwh', city.tariffRateNGN, { shouldValidate: true });
    }
  }, [cityId, setValue]);

  const onSubmit = (data: Step2Form) => {
    const selectedCity = getCityById(data.city_id || 'lagos');
    const psh = getPshFromCityId(data.city_id);
    const regionId = getRegionIdFromCityId(data.city_id);

    updateProposal({
      battery_chemistry: data.battery_chemistry,
      backup_hours: data.backup_hours,
      nepa_daily_hours: data.nepa_daily_hours,
      nepa_tariff_per_kwh: data.nepa_tariff_per_kwh,
      selected_tier: data.selected_tier,
      fuelPrices: {
        petrolPerLitre: data.petrol_price,
        dieselPerLitre: data.diesel_price,
      },
      monthly_phcn_bill: data.monthly_phcn_bill,
      monthly_gen_fuel_cost: data.monthly_gen_fuel_cost,
      monthly_gen_maintenance: data.monthly_gen_maintenance,
      city_id: data.city_id,
      region_id: regionId,
      peak_sun_hours: psh,
      battery_sizing_method: data.battery_sizing_method || 'backup-hours',
      panel_sizing_basis: data.panel_sizing_basis || 'essential',
      annual_inflation_rate: data.annual_inflation_rate !== undefined ? data.annual_inflation_rate / 100 : 0.20,
    });

    // Pre-compute sizing so Step 3 loads instantly
    const { totalDailyWh, essentialDailyWh, pContinuous } = calculateDailyLoad(proposal.appliances);
    const { kva, systemVoltage, peakSurgeWatts } = calculateInverterSize(proposal.appliances, pContinuous);
    const battery = calculateBatteryBank(
      essentialDailyWh, 
      data.backup_hours, 
      systemVoltage, 
      data.battery_chemistry, 
      data.battery_sizing_method || 'backup-hours',
      proposal.appliances
    );
    const panel = calculatePanelArray(
      totalDailyWh, 
      psh, 
      data.battery_chemistry, 
      450, 
      data.panel_sizing_basis || 'essential', 
      essentialDailyWh,
      data.city_id
    );

    setCalculations({
      totalDailyWh,
      essentialDailyWh,
      pContinuous,
      peakSurgeWatts,
      inverterKva: kva,
      systemVoltage,
      batteryConfigString: battery.configString,
      batteryTotalUnits: battery.totalBatteries,
      batteryUnitVoltage: battery.batteryUnitVoltage,
      batteryUnitAh: battery.batteryUnitAh,
      panelCount: panel.panelCount,
      panelUnitWp: panel.panelUnitWp,
      panelTotalWp: panel.totalWp,
      regulatory: {
        nerc_tariff_class: selectedCity.tariffBand,
        disco_region: selectedCity.disco,
        grid_availability_assumption: data.nepa_daily_hours / 24,
      }
    });

    setStep(3);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">

      {/* ── Section A: Battery Chemistry ── */}
      <section>
        <h3 className="font-semibold text-base mb-1">A. Battery Chemistry</h3>
        <p className="text-sm text-muted-foreground mb-4">Choose the battery technology for your system.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Lead-Acid */}
          {(['lead-acid', 'lithium'] as const).map((chem) => {
            const isLithium = chem === 'lithium';
            const selected = chemistry === chem;
            return (
              <button
                key={chem}
                type="button"
                onClick={() => setValue('battery_chemistry', chem, { shouldValidate: true })}
                className={`text-left rounded-2xl border-2 p-5 transition-all ${
                  selected ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30' : 'border-border hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{isLithium ? 'Lithium LiFePO₄' : 'Lead-Acid / Tubular'}</p>
                  <div className="flex items-center gap-1">
                    {isLithium && (
                      <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-medium">
                        Recommended ✓
                      </span>
                    )}
                    {selected && <CheckCircle className="w-4 h-4 text-teal-600" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {isLithium ? 'Standard / Premium systems' : 'Budget / Economy systems'}
                </p>
                <ul className="space-y-1 text-xs">
                  {isLithium ? (
                    <>
                      <li className="text-green-700">✓ 80% DoD — more usable energy</li>
                      <li className="text-green-700">✓ Lighter, compact form factor</li>
                      <li className="text-green-700">✓ 10+ year lifespan, no maintenance</li>
                      <li className="text-orange-600">✗ Higher upfront cost</li>
                    </>
                  ) : (
                    <>
                      <li className="text-green-700">✓ Lower upfront cost</li>
                      <li className="text-green-700">✓ Widely available in Nigeria</li>
                      <li className="text-green-700">✓ Easy to replace locally</li>
                      <li className="text-orange-600">✗ 50% DoD — less usable energy</li>
                      <li className="text-orange-600">✗ 3–5 year lifespan</li>
                    </>
                  )}
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  System voltage: {isLithium ? '48V' : chemistry === 'lead-acid' ? '24V – 48V' : '24V – 48V'}
                </p>
              </button>
            );
          })}
        </div>
        {errors.battery_chemistry && (
          <p className="text-red-500 text-xs mt-2">{errors.battery_chemistry.message}</p>
        )}
      </section>

      {/* ── Section B: Backup & Grid ── */}
      <section>
        <h3 className="font-semibold text-base mb-1">B. Backup Duration & Grid</h3>
        <p className="text-sm text-muted-foreground mb-4">Select your region, and choose how long the system must power essential loads.</p>

        {/* City/Region Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="city_id">City / Grid Region</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger type="button">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  <p>Selecting your city automatically sets the default NERC tariff rate and solar sun hours for that region.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <select
            id="city_id"
            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            {...register('city_id')}
          >
            {NIGERIAN_CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.disco})
              </option>
            ))}
          </select>
        </div>

        {/* Backup slider */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <Label>Backup Duration</Label>
            <span className="text-sm font-medium text-teal-700">{backupHours} hrs</span>
          </div>
          <Slider
            min={4}
            max={48}
            step={1}
            value={[backupHours]}
            onValueChange={(val) => setValue('backup_hours', Array.isArray(val) ? val[0] : val, { shouldValidate: true })}
          />
          <p className="text-xs text-muted-foreground mt-2 italic">{backupLabel(backupHours)}</p>
        </div>

        {/* NEPA Toggle */}
        <div className="mb-4">
          <Label className="mb-2 block">NEPA/Grid Availability</Label>
          <div className="grid grid-cols-3 gap-2">
            {NEPA_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setValue('nepa_daily_hours', opt.hours, { shouldValidate: true })}
                className={`rounded-xl border-2 py-3 px-2 text-center transition-all ${
                  nepaDailyHours === opt.hours
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                    : 'border-border hover:border-teal-300'
                }`}
              >
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.sub}</p>
              </button>
            ))}
          </div>
          {/* Manual override */}
          <div className="mt-3">
            <Label className="text-xs text-muted-foreground">Or enter exact hours/day</Label>
            <Input
              type="number"
              min={0}
              max={23}
              step={1}
              className="mt-1 w-32"
              value={nepaDailyHours}
              onChange={(e) => setValue('nepa_daily_hours', Number(e.target.value), { shouldValidate: true })}
            />
          </div>
        </div>

        {/* NEPA Tariff */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label htmlFor="tariff">Your electricity band rate (₦/kWh)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger type="button">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  <p className="font-semibold mb-1">Nigerian DISCO Tariff Bands</p>
                  <p>Band A (20+ hrs supply): ₦225/kWh</p>
                  <p>Band B (16–20 hrs): ₦206/kWh</p>
                  <p>Band C (12–16 hrs): ₦184/kWh</p>
                  <p>Band D (8–12 hrs): ₦167/kWh</p>
                  <p>Band E (&lt;8 hrs): ₦167/kWh</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="tariff"
            type="number"
            className="w-40"
            {...register('nepa_tariff_per_kwh', { valueAsNumber: true })}
          />
          {errors.nepa_tariff_per_kwh && (
            <p className="text-red-500 text-xs mt-1">{errors.nepa_tariff_per_kwh.message}</p>
          )}
        </div>

        {/* Editable Fuel Prices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div>
            <Label htmlFor="petrol-price">Current Petrol Price (₦/litre)</Label>
            <Input
              id="petrol-price"
              type="number"
              placeholder="e.g. 1250"
              {...register('petrol_price', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">Lagos average as of May 2026. Update to your local pump price.</p>
            {errors.petrol_price && (
              <p className="text-red-500 text-xs mt-1">{errors.petrol_price.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="diesel-price">Current Diesel Price (₦/litre)</Label>
            <Input
              id="diesel-price"
              type="number"
              placeholder="e.g. 1750"
              {...register('diesel_price', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">National average as of May 2026. Update to your local pump price.</p>
            {errors.diesel_price && (
              <p className="text-red-500 text-xs mt-1">{errors.diesel_price.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Section C: Budget Tier ── */}
      <section>
        <h3 className="font-semibold text-base mb-1">C. Budget Tier</h3>
        <p className="text-sm text-muted-foreground mb-4">Select the quality tier for component selection.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIERS.map((tier) => {
            const active = selectedTier === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setValue('selected_tier', tier.id, { shouldValidate: true })}
                className={`text-left rounded-2xl border-2 p-4 transition-all ${
                  active ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30' : 'border-border hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{tier.label}</p>
                  {active && <CheckCircle className="w-4 h-4 text-teal-600" />}
                </div>
                <p className="text-xs text-muted-foreground mb-3">{tier.desc}</p>
                <p className="text-sm font-bold text-foreground mb-2">{tier.range}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tier.tagColor}`}>
                  {tier.tag}
                </span>
              </button>
            );
          })}
        </div>
        {errors.selected_tier && (
          <p className="text-red-500 text-xs mt-2">{errors.selected_tier.message}</p>
        )}
      </section>

      {/* ── Section C.2: Advanced Sizing Options Accordion ── */}
      <section className="border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 space-y-4">
        <button
          type="button"
          onClick={() => setShowAdvancedSizing(!showAdvancedSizing)}
          className="w-full flex items-center justify-between transition-all text-left"
        >
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>⚙️</span> Advanced Sizing Logic Settings
          </span>
          <span className="text-[11px] text-teal-650 font-semibold">
            {showAdvancedSizing ? '▲ Hide Advanced Options' : '▼ Show Advanced Options'}
          </span>
        </button>
        
        {showAdvancedSizing && (
          <div className="pt-2 border-t space-y-4 animate-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Battery Sizing Method */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Battery Capacity Sizing Methodology
                </Label>
                <select
                  value={watch('battery_sizing_method')}
                  onChange={(e) => setValue('battery_sizing_method', e.target.value as 'backup-hours' | 'flat-load', { shouldValidate: true })}
                  className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="backup-hours">Direct Load Runtime during Backup (Standard Installer Method)</option>
                  <option value="flat-load">24-Hour Flat Average Load (Traditional Sizing)</option>
                </select>
                <span className="block text-[10px] text-slate-400">
                  Direct Load Runtime sizes batteries based on real-world backup period consumption. 24h Flat Sizing distributes load equally over a 24h period.
                </span>
              </div>

              {/* Panel Sizing Basis */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Solar Panel Array Sizing Basis
                </Label>
                <select
                  value={watch('panel_sizing_basis')}
                  onChange={(e) => setValue('panel_sizing_basis', e.target.value as 'total' | 'essential', { shouldValidate: true })}
                  className="w-full text-xs p-2 rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="essential">Essential Backed-up Loads Only (Grid-Bypass Standard)</option>
                  <option value="total">Total Household Load (Grid Offset / Net-Zero Sizing)</option>
                </select>
                <span className="block text-[10px] text-slate-400">
                  Grid-Bypass limits panels to battery charging & essential loads. Total Household sizes panels for all loads.
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Section D: Legacy Energy Spend ── */}
      <section className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-base mb-1">D. Current Monthly Energy Spend</h3>
          <p className="text-sm text-muted-foreground">Estimate your legacy monthly utility costs to calculate solar ROI.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="monthly-phcn" className="text-sm font-medium">Monthly PHCN Bill (₦)</Label>
            <Input
              id="monthly-phcn"
              type="number"
              className="mt-2"
              placeholder="e.g. 8000"
              {...register('monthly_phcn_bill', { valueAsNumber: true })}
            />
            {errors.monthly_phcn_bill && (
              <p className="text-red-500 text-xs mt-1">{errors.monthly_phcn_bill.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="monthly-gen-fuel" className="text-sm font-medium">Monthly Gen Fuel Cost (₦)</Label>
            <Input
              id="monthly-gen-fuel"
              type="number"
              className="mt-2"
              placeholder="e.g. 85000"
              {...register('monthly_gen_fuel_cost', { valueAsNumber: true })}
            />
            {errors.monthly_gen_fuel_cost && (
              <p className="text-red-500 text-xs mt-1">{errors.monthly_gen_fuel_cost.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="monthly-gen-maint" className="text-sm font-medium">Monthly Gen Maintenance (₦)</Label>
            <Input
              id="monthly-gen-maint"
              type="number"
              className="mt-2"
              placeholder="e.g. 12000"
              {...register('monthly_gen_maintenance', { valueAsNumber: true })}
            />
            {errors.monthly_gen_maintenance && (
              <p className="text-red-500 text-xs mt-1">{errors.monthly_gen_maintenance.message}</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-1">
            <Label htmlFor="annual-inflation" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              Annual Fuel/Grid Inflation Rate (%)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger type="button">
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>Compounding annual rate to simulate fuel & grid price increases over the 5-30 year project lifecycle (e.g. 20% default).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="annual-inflation"
              type="number"
              className="w-32"
              min={0}
              max={100}
              placeholder="e.g. 20"
              {...register('annual_inflation_rate', { valueAsNumber: true })}
            />
          </div>
          <div className="flex flex-col md:items-end justify-center">
            <span className="text-xs text-muted-foreground font-semibold">Total Legacy Energy Cost:</span>
            <span className="text-xl font-extrabold text-teal-600 dark:text-teal-400">
              ₦{totalLegacyEnergyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} / month
            </span>
          </div>
        </div>
      </section>

      {/* ── Navigation ── */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => { setStep(1); onBack(); }} className="flex-1">
          ← Back
        </Button>
        <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
          Next: Hardware Selection →
        </Button>
      </div>
    </form>
  );
}
