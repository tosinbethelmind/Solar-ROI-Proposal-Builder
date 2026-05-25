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
    },
  });

  const chemistry = watch('battery_chemistry');
  const backupHours = watch('backup_hours');
  const nepaDailyHours = watch('nepa_daily_hours');
  const selectedTier = watch('selected_tier');

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

  const onSubmit = (data: Step2Form) => {
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
    });

    // Pre-compute sizing so Step 3 loads instantly
    const { totalDailyWh, essentialDailyWh, pContinuous } = calculateDailyLoad(proposal.appliances);
    const { kva, systemVoltage, peakSurgeWatts } = calculateInverterSize(proposal.appliances, pContinuous);
    const battery = calculateBatteryBank(essentialDailyWh, data.backup_hours, systemVoltage, data.battery_chemistry);
    const panel = calculatePanelArray(totalDailyWh, proposal.peak_sun_hours, data.battery_chemistry);

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
        <p className="text-sm text-muted-foreground mb-4">How long must the system power your essential loads without sun or grid?</p>

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

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Legacy Energy Cost:</span>
          <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
            ₦{totalLegacyEnergyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} / month
          </span>
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
