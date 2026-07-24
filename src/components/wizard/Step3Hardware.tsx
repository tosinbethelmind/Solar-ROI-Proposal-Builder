'use client';

import * as React from 'react';
import { Zap, Battery, Sun, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useWizardStore, ProposalTier } from '@/store/wizardStore';
import { useUiStore } from '@/store/uiStore';
import { calculateBatteryBank, calculatePanelArray } from '@/utils/calculations';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';

// ── Interfaces ──────────────────────────────────────────────────────────────
interface Inverter {
  id: string;
  brand: string;
  model_name: string;
  capacity_kva: number;
  system_voltage: number;
  price_ngn: number;
}

interface Battery {
  id: string;
  brand: string;
  model_name: string;
  capacity_ah: number;
  voltage: number;
  chemistry: 'lead-acid' | 'lithium';
  price_ngn: number;
}

interface Panel {
  id: string;
  brand: string;
  model_name: string;
  wattage_wp: number;
  price_ngn: number;
}

export interface ComponentBrand {
  name: string;
  warrantyYears: number;
  sonCertified: boolean;
  type: string;
}

export const INVERTER_BRANDS: ComponentBrand[] = [
  { name: 'Luminous', warrantyYears: 2, sonCertified: true, type: 'Pure Sine Wave' },
  { name: 'Growatt', warrantyYears: 5, sonCertified: true, type: 'Smart Hybrid' },
  { name: 'Victron', warrantyYears: 5, sonCertified: true, type: 'Premium Low-Frequency' },
  { name: 'Felicity', warrantyYears: 2, sonCertified: false, type: 'Hybrid' },
  { name: 'Prag', warrantyYears: 1, sonCertified: true, type: 'Offline/Hybrid' },
  { name: 'Mercury', warrantyYears: 1, sonCertified: false, type: 'Economy Hybrid' },
  { name: 'Schneider', warrantyYears: 5, sonCertified: true, type: 'Industrial Hybrid' },
];

export const BATTERY_BRANDS: ComponentBrand[] = [
  { name: 'Felicity Lithium', warrantyYears: 5, sonCertified: true, type: 'Lithium LiFePO4' },
  { name: 'BDJ', warrantyYears: 2, sonCertified: true, type: 'Lithium LiFePO4' },
  { name: 'Leoch', warrantyYears: 1, sonCertified: true, type: 'Lead-Acid Gel' },
  { name: 'Fiamm', warrantyYears: 1, sonCertified: true, type: 'Lead-Acid AGM' },
  { name: 'Vision', warrantyYears: 1, sonCertified: false, type: 'Lead-Acid AGM' },
  { name: 'Trojan', warrantyYears: 2, sonCertified: true, type: 'Deep-Cycle Flooded' },
];

export const PANEL_BRANDS: ComponentBrand[] = [
  { name: 'Jinko', warrantyYears: 12, sonCertified: true, type: 'Monocrystalline' },
  { name: 'Canadian Solar', warrantyYears: 12, sonCertified: true, type: 'Monocrystalline' },
  { name: 'Monocrystalline Generic', warrantyYears: 5, sonCertified: false, type: 'Monocrystalline' },
  { name: 'Felicity', warrantyYears: 10, sonCertified: true, type: 'Monocrystalline' },
  { name: 'Astronergy', warrantyYears: 12, sonCertified: true, type: 'Monocrystalline' },
];

export default function Step3Hardware({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { proposal, calculations, updateProposal, setStep } = useWizardStore();
  const { fieldMode } = useUiStore();

  // Compute appliance groups for "What This System Powers" card
  const categories = React.useMemo(() => {
    const cats = {
      lighting: { label: 'Lighting & Fans', icon: '💡', list: [] as string[] },
      cooling: { label: 'Cooling & Comfort', icon: '❄️', list: [] as string[] },
      entertainment: { label: 'Entertainment & Office', icon: '📺', list: [] as string[] },
      kitchen: { label: 'Kitchen & Utility', icon: '🍳', list: [] as string[] },
      other: { label: 'Other Loads', icon: '🔌', list: [] as string[] }
    };

    (proposal.appliances || []).forEach(app => {
      const nameLower = app.name.toLowerCase();
      const itemStr = `${app.quantity}x ${app.name}`;
      if (nameLower.includes('bulb') || nameLower.includes('light') || nameLower.includes('fan') || nameLower.includes('lamp')) {
        cats.lighting.list.push(itemStr);
      } else if (nameLower.includes('ac') || nameLower.includes('air conditioner') || nameLower.includes('fridge') || nameLower.includes('freezer') || nameLower.includes('refrigerator') || nameLower.includes('cooler') || nameLower.includes('heater')) {
        cats.cooling.list.push(itemStr);
      } else if (nameLower.includes('tv') || nameLower.includes('television') || nameLower.includes('laptop') || nameLower.includes('computer') || nameLower.includes('desktop') || nameLower.includes('decoder') || nameLower.includes('sound') || nameLower.includes('router') || nameLower.includes('wifi')) {
        cats.entertainment.list.push(itemStr);
      } else if (nameLower.includes('microwave') || nameLower.includes('blender') || nameLower.includes('kettle') || nameLower.includes('pump') || nameLower.includes('washing') || nameLower.includes('cooker')) {
        cats.kitchen.list.push(itemStr);
      } else {
        cats.other.list.push(itemStr);
      }
    });
    return cats;
  }, [proposal.appliances]);

  const utilization = React.useMemo(() => {
    const capWatts = (calculations?.inverterKva || 5) * 800;
    return capWatts > 0 ? Math.round(((calculations?.pContinuous || 0) / capWatts) * 100) : 0;
  }, [calculations]);

  const selectedInverterBrand = proposal.selectedInverterBrand || 'Growatt';
  const selectedBatteryBrand = proposal.selectedBatteryBrand || 'Felicity Lithium';
  const selectedPanelBrand = proposal.selectedPanelBrand || 'Jinko';

  const inverterBrandObj = INVERTER_BRANDS.find(b => b.name === selectedInverterBrand) || INVERTER_BRANDS[1];
  const batteryBrandObj = BATTERY_BRANDS.find(b => b.name === selectedBatteryBrand) || BATTERY_BRANDS[0];
  const panelBrandObj = PANEL_BRANDS.find(b => b.name === selectedPanelBrand) || PANEL_BRANDS[0];

  const allSonCertified = inverterBrandObj.sonCertified && batteryBrandObj.sonCertified && panelBrandObj.sonCertified;

  const {
    inverterKva = 0,
    systemVoltage = 24,
    essentialDailyWh = 0,
    totalDailyWh = 0,
  } = calculations || {};
  const backupHours = proposal.backup_hours;
  const peakSunHours = proposal.peak_sun_hours;

  // Find next size up for inverter fetch
  const standardTiers = [1.5, 2.5, 3.5, 5, 7.5, 10, 15];
  const currentIdx = standardTiers.indexOf(inverterKva);
  const nextKva = currentIdx !== -1 && currentIdx < standardTiers.length - 1
    ? standardTiers[currentIdx + 1]
    : inverterKva;

  // ── Sizing and Pricing per Tier ──────────────────────────────────────────
  // 1. Budget Sizing
  const budgetBattery = React.useMemo(() => 
    calculateBatteryBank(essentialDailyWh, backupHours, systemVoltage, 'lead-acid'),
    [essentialDailyWh, backupHours, systemVoltage]
  );
  const budgetPanel = React.useMemo(() => 
    calculatePanelArray(totalDailyWh, peakSunHours, 'lead-acid', 450, 'total', 0, proposal.city_id),
    [totalDailyWh, peakSunHours, proposal.city_id]
  );
  const budgetPrice = React.useMemo(() => 
    (budgetBattery.totalBatteries * 170000) + (budgetPanel.panelCount * 95000) + (inverterKva * 90000) + 100000 + 75000,
    [budgetBattery.totalBatteries, budgetPanel.panelCount, inverterKva]
  );
  const budgetUsableKwh = React.useMemo(() => 
    (budgetBattery.totalBatteries * 12 * 200 * 0.5) / 1000,
    [budgetBattery.totalBatteries]
  );

  // 2. Standard Sizing
  const standardBattery = React.useMemo(() => 
    calculateBatteryBank(essentialDailyWh, backupHours, systemVoltage, 'lithium'),
    [essentialDailyWh, backupHours, systemVoltage]
  );
  const standardPanel = React.useMemo(() => 
    calculatePanelArray(totalDailyWh, peakSunHours, 'lithium', 450, 'total', 0, proposal.city_id),
    [totalDailyWh, peakSunHours, proposal.city_id]
  );
  const standardPrice = React.useMemo(() => 
    (standardBattery.totalBatteries * 850000) + (standardPanel.panelCount * 105000) + (inverterKva * 170000) + 150000 + 120000,
    [standardBattery.totalBatteries, standardPanel.panelCount, inverterKva]
  );
  const standardUsableKwh = React.useMemo(() => 
    (standardBattery.totalBatteries * standardBattery.batteryUnitVoltage * standardBattery.batteryUnitAh * 0.8) / 1000,
    [standardBattery]
  );

  // 3. Premium Sizing (with 200Ah battery blocks)
  const premiumBatteryInfo = React.useMemo(() => {
    const avgEssentialWh = essentialDailyWh / 24;
    const reqAhRaw = (avgEssentialWh * backupHours) / (systemVoltage * 0.8);
    const unitVoltage = systemVoltage === 48 ? 48 : systemVoltage === 24 ? 24 : 12;
    const unitAh = 200;
    const sCount = systemVoltage / unitVoltage;
    const pCount = Math.ceil(reqAhRaw / unitAh) || 1;
    const totalCount = sCount * pCount;
    return {
      configString: `${sCount}S${pCount}P`,
      totalBatteries: totalCount,
      batteryUnitVoltage: unitVoltage,
      batteryUnitAh: unitAh
    };
  }, [essentialDailyWh, backupHours, systemVoltage]);

  const premiumPanel = React.useMemo(() => 
    calculatePanelArray(totalDailyWh, peakSunHours, 'lithium', 550, 'total', 0, proposal.city_id),
    [totalDailyWh, peakSunHours, proposal.city_id]
  );
  const premiumPrice = React.useMemo(() => 
    (premiumBatteryInfo.totalBatteries * 1900000) + (premiumPanel.panelCount * 135000) + (inverterKva * 300000) + 250000 + 220000,
    [premiumBatteryInfo.totalBatteries, premiumPanel.panelCount, inverterKva]
  );
  const premiumUsableKwh = React.useMemo(() => 
    (premiumBatteryInfo.totalBatteries * premiumBatteryInfo.batteryUnitVoltage * premiumBatteryInfo.batteryUnitAh * 0.8) / 1000,
    [premiumBatteryInfo]
  );

  // ── State for Expert Mode & Overrides ──────────────────────────────────────
  const [expertMode, setExpertMode] = React.useState(() => {
    return !!(proposal.overrideInverterId || proposal.overrideBatteryId || proposal.overridePanelId);
  });
  const [inverters, setInverters] = React.useState<Inverter[]>([]);
  const [batteries, setBatteries] = React.useState<Battery[]>([]);
  const [panels, setPanels] = React.useState<Panel[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [selectedInverter, setSelectedInverter] = React.useState<Inverter | null>(null);
  const [selectedBattery, setSelectedBattery] = React.useState<Battery | null>(null);
  const [selectedPanel, setSelectedPanel] = React.useState<Panel | null>(null);

  // Fetch db items
  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: invData, error: invErr } = await supabase
          .from('inverters')
          .select('*')
          .or(`capacity_kva.eq.${inverterKva},capacity_kva.eq.${nextKva}`);

        if (invErr) throw invErr;
        setInverters(invData || []);
      } catch (error) {
        console.warn('Supabase inverters fetch failed, using fallback:', error);
        setInverters([
          { id: 'inv-1', brand: 'Luminous', model_name: `Cruze+ ${inverterKva}KVA`, capacity_kva: inverterKva, system_voltage: systemVoltage, price_ngn: inverterKva * 90000 },
          { id: 'inv-2', brand: 'Deye', model_name: `SUN-${inverterKva}K-SG03LP1`, capacity_kva: inverterKva, system_voltage: systemVoltage, price_ngn: inverterKva * 170000 },
          { id: 'inv-3', brand: 'Victron', model_name: `MultiPlus-II ${inverterKva}000`, capacity_kva: inverterKva, system_voltage: systemVoltage, price_ngn: inverterKva * 300000 }
        ]);
      }

      try {
        const { data: batData, error: batErr } = await supabase
          .from('batteries')
          .select('*'); // Load all batteries to support overrides and voltage verification warnings

        if (batErr) throw batErr;
        setBatteries(batData || []);
      } catch (error) {
        console.warn('Supabase batteries fetch failed, using fallback:', error);
        setBatteries([
          { id: 'bat-1', brand: 'Ritar', model_name: 'RA12-200', capacity_ah: 200, voltage: 12, chemistry: 'lead-acid', price_ngn: 170000 },
          { id: 'bat-2', brand: 'Felicity', model_name: 'LPBF48100', capacity_ah: 100, voltage: 48, chemistry: 'lithium', price_ngn: 850000 },
          { id: 'bat-3', brand: 'Pylontech', model_name: 'US3000C', capacity_ah: 74, voltage: 48, chemistry: 'lithium', price_ngn: 950000 }
        ]);
      }

      try {
        const { data: panData, error: panErr } = await supabase
          .from('panels')
          .select('*');

        if (panErr) throw panErr;
        setPanels(panData || []);
      } catch (error) {
        console.warn('Supabase panels fetch failed, using fallback:', error);
        setPanels([
          { id: 'pan-1', brand: 'Jinko', model_name: 'Eagle 450W', wattage_wp: 450, price_ngn: 95000 },
          { id: 'pan-2', brand: 'Canadian Solar', model_name: 'HiKu6 550W', wattage_wp: 550, price_ngn: 135000 },
          { id: 'pan-3', brand: 'Longi', model_name: 'Hi-MO6 550W', wattage_wp: 550, price_ngn: 135000 }
        ]);
      }
      setLoading(false);
    }
    fetchData();
  }, [inverterKva, nextKva, systemVoltage]);

  // Pre-populate dropdowns with override check
  React.useEffect(() => {
    if (inverters.length > 0 && !selectedInverter) {
      if (proposal.overrideInverterId) {
        const overridden = inverters.find(i => i.id === proposal.overrideInverterId);
        if (overridden) {
          setTimeout(() => setSelectedInverter(overridden), 0);
          return;
        }
      }
      const defaultBrand = proposal.selected_tier === 'budget' ? 'Luminous' : 'Deye';
      const matching = inverters.find(i => i.brand.toLowerCase() === defaultBrand.toLowerCase()) || inverters[0];
      setTimeout(() => setSelectedInverter(matching), 0);
    }
  }, [inverters, selectedInverter, proposal.overrideInverterId, proposal.selected_tier]);

  React.useEffect(() => {
    if (batteries.length > 0 && !selectedBattery) {
      if (proposal.overrideBatteryId) {
        const overridden = batteries.find(b => b.id === proposal.overrideBatteryId);
        if (overridden) {
          setTimeout(() => setSelectedBattery(overridden), 0);
          return;
        }
      }
      const chem = proposal.selected_tier === 'budget' ? 'lead-acid' : 'lithium';
      const matching = batteries.find(b => b.chemistry === chem) || batteries[0];
      setTimeout(() => setSelectedBattery(matching), 0);
    }
  }, [batteries, selectedBattery, proposal.overrideBatteryId, proposal.selected_tier]);

  React.useEffect(() => {
    if (panels.length > 0 && !selectedPanel) {
      if (proposal.overridePanelId) {
        const overridden = panels.find(p => p.id === proposal.overridePanelId);
        if (overridden) {
          setTimeout(() => setSelectedPanel(overridden), 0);
          return;
        }
      }
      const targetW = proposal.selected_tier === 'premium' ? 550 : 450;
      const matching = panels.find(p => p.wattage_wp === targetW) || panels[0];
      setTimeout(() => setSelectedPanel(matching), 0);
    }
  }, [panels, selectedPanel, proposal.overridePanelId, proposal.selected_tier]);

  // ── Expert Mode Sizing and Price calculations ──────────────────────────────
  const expertBatterySizing = React.useMemo(() => {
    if (!selectedBattery || !selectedInverter) return null;
    const activeSysVolt = selectedInverter.system_voltage;
    const activeUnitVolt = selectedBattery.voltage;
    const activeUnitAh = selectedBattery.capacity_ah;
    const activeChemistry = selectedBattery.chemistry;

    const avgEssentialWh = essentialDailyWh / 24;
    const reqAhRaw = (avgEssentialWh * backupHours) / (activeSysVolt * (activeChemistry === 'lithium' ? 0.8 : 0.5));
    const sCount = activeSysVolt / activeUnitVolt;
    const pCount = Math.ceil(reqAhRaw / activeUnitAh) || 1;
    const totalCount = sCount * pCount;

    return {
      configString: `${sCount}S${pCount}P`,
      totalBatteries: totalCount,
      usableKwh: (totalCount * activeUnitVolt * activeUnitAh * (activeChemistry === 'lithium' ? 0.8 : 0.5)) / 1000
    };
  }, [selectedBattery, selectedInverter, essentialDailyWh, backupHours]);

  const expertPanelSizing = React.useMemo(() => {
    if (!selectedPanel || !selectedBattery) return null;
    return calculatePanelArray(
      totalDailyWh, 
      peakSunHours, 
      selectedBattery.chemistry, 
      selectedPanel.wattage_wp, 
      'total', 
      0, 
      proposal.city_id
    );
  }, [selectedPanel, selectedBattery, totalDailyWh, peakSunHours, proposal.city_id]);

  const customPrice = React.useMemo(() => {
    if (!selectedInverter || !selectedBattery || !selectedPanel || !expertBatterySizing || !expertPanelSizing) return 0;
    let labour = 150000;
    let accessories = 120000;
    if (proposal.selected_tier === 'budget') {
      labour = 100000;
      accessories = 75000;
    } else if (proposal.selected_tier === 'premium') {
      labour = 250000;
      accessories = 220000;
    }
    return (selectedInverter.price_ngn) +
           (selectedBattery.price_ngn * expertBatterySizing.totalBatteries) +
           (selectedPanel.price_ngn * expertPanelSizing.panelCount) +
           labour + accessories;
  }, [selectedInverter, selectedBattery, selectedPanel, expertBatterySizing, expertPanelSizing, proposal.selected_tier]);

  // Determine actual final price to save in store
  const finalPrice = React.useMemo(() => {
    if (expertMode) return customPrice;
    if (proposal.selected_tier === 'budget') return budgetPrice;
    if (proposal.selected_tier === 'standard') return standardPrice;
    return premiumPrice;
  }, [expertMode, customPrice, proposal.selected_tier, budgetPrice, standardPrice, premiumPrice]);

  // Validation
  const hasVoltageMismatch = React.useMemo(() => {
    if (!expertMode || !selectedInverter || !selectedBattery) return false;
    return selectedInverter.system_voltage !== selectedBattery.voltage;
  }, [expertMode, selectedInverter, selectedBattery]);

  // Validation Warnings
  const isCapacityKvaTooLow = React.useMemo(() => {
    if (!expertMode || !selectedInverter) return false;
    return selectedInverter.capacity_kva < inverterKva;
  }, [expertMode, selectedInverter, inverterKva]);

  const isBatteryVoltageMismatchCalculated = React.useMemo(() => {
    if (!expertMode || !selectedBattery) return false;
    return selectedBattery.voltage !== systemVoltage;
  }, [expertMode, selectedBattery, systemVoltage]);

  const hasUnrealisticPanelCount = React.useMemo(() => {
    if (!expertMode || !expertPanelSizing) return false;
    return expertPanelSizing.panelCount > 32;
  }, [expertMode, expertPanelSizing]);

  // Next function
  const handleContinue = () => {
    if (hasVoltageMismatch) return;

    let inverterCost = 0;
    let batteryUnitCost = 0;
    let panelUnitCost = 0;
    let labourCost = 150000;
    let accessoriesCost = 120000;

    if (expertMode) {
      inverterCost = selectedInverter?.price_ngn || 0;
      batteryUnitCost = selectedBattery?.price_ngn || 0;
      panelUnitCost = selectedPanel?.price_ngn || 0;
      if (proposal.selected_tier === 'budget') {
        labourCost = 100000;
        accessoriesCost = 75000;
      } else if (proposal.selected_tier === 'premium') {
        labourCost = 250000;
        accessoriesCost = 220000;
      }
    } else {
      if (proposal.selected_tier === 'budget') {
        inverterCost = inverterKva * 90000;
        batteryUnitCost = 170000;
        panelUnitCost = 95000;
        labourCost = 100000;
        accessoriesCost = 75000;
      } else if (proposal.selected_tier === 'standard') {
        inverterCost = inverterKva * 170000;
        batteryUnitCost = 850000;
        panelUnitCost = 105000;
        labourCost = 150000;
        accessoriesCost = 120000;
      } else { // premium
        inverterCost = inverterKva * 300000;
        batteryUnitCost = 1900000;
        panelUnitCost = 135000;
        labourCost = 250000;
        accessoriesCost = 220000;
      }
    }

    updateProposal({
      selected_tier: proposal.selected_tier,
      overrideInverterId: expertMode ? selectedInverter?.id : undefined,
      overrideBatteryId: expertMode ? selectedBattery?.id : undefined,
      overridePanelId: expertMode ? selectedPanel?.id : undefined,
      inverter_cost_ngn: inverterCost,
      battery_unit_cost_ngn: batteryUnitCost,
      panel_unit_cost_ngn: panelUnitCost,
      labour_cost_ngn: labourCost,
      accessories_cost_ngn: accessoriesCost,
      final_quoted_price_ngn: finalPrice,
    });
    onNext();
  };

  if (!calculations) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-red-500 font-semibold">Calculations not found. Please complete Step 2 first.</p>
        <Button onClick={() => setStep(2)}>Go to Step 2</Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Top Header & Expert Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Step 3: Hardware Selection</h2>
          <p className="text-sm text-muted-foreground">Select a system tier or customize component selections.</p>
        </div>
        {!fieldMode && (
          <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border">
            <label htmlFor="expert-mode" className="text-xs font-semibold select-none cursor-pointer">
              Expert Mode — Override Recommendations
            </label>
            <Switch
              id="expert-mode"
              checked={expertMode}
              onCheckedChange={setExpertMode}
            />
          </div>
        )}
      </div>

      {/* READ-ONLY SUMMARY STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border text-sm">
        <div>
          <span className="block text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Req. Inverter</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{inverterKva} kVA</span>
        </div>
        <div>
          <span className="block text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Req. Battery Capacity</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {(calculations.batteryTotalUnits * calculations.batteryUnitAh)} Ah
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Req. Solar Array</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {calculations.panelTotalWp || (calculations.panelCount * calculations.panelUnitWp)} Wp
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">System Design Voltage</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{systemVoltage} V</span>
        </div>
      </div>

      {/* SECTION A — 3-Tier Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BUDGET TIER */}
        <Card className={`relative flex flex-col justify-between overflow-hidden border-2 transition-all ${
          proposal.selected_tier === 'budget' && !expertMode ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-border'
        }`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <Badge variant="outline" className="bg-slate-100 dark:bg-slate-900">Economy</Badge>
              {proposal.selected_tier === 'budget' && !expertMode && (
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <CardTitle className="text-lg font-bold mt-2">Budget Package</CardTitle>
            <CardDescription>Value-focused backup power</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-muted-foreground">Inverter</p>
                <p className="text-xs font-medium">{inverterKva}kVA Luminous Inverter</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600">
                <Battery className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-muted-foreground">Battery Bank</p>
                <p className="text-xs font-medium">{budgetBattery.configString} — {budgetBattery.totalBatteries}× 12V 200Ah</p>
                <span className="text-[10px] text-muted-foreground">Tubular Lead-Acid</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-muted-foreground">Solar Array</p>
                <p className="text-xs font-medium">{budgetPanel.panelCount}× 450W Poly panels</p>
                <span className="text-[10px] text-muted-foreground">{(budgetPanel.totalWp / 1000).toFixed(2)} kWp capacity</span>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-2 py-1 rounded-md">
                {budgetUsableKwh.toFixed(1)} kWh usable backup
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col border-t bg-muted/10 p-5 mt-4">
            <div className="w-full mb-4">
              <p className="text-xs text-muted-foreground">Estimated Cost</p>
              <p className="text-xl font-bold text-foreground">₦{budgetPrice.toLocaleString()}</p>
            </div>
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => {
                updateProposal({ selected_tier: 'budget' });
                setExpertMode(false);
              }}
            >
              Select Economy
            </Button>
          </CardFooter>
        </Card>

        {/* STANDARD TIER */}
        <Card className={`relative flex flex-col justify-between overflow-hidden border-2 transition-all ${
          proposal.selected_tier === 'standard' && !expertMode ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-border'
        }`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <Badge variant="outline" className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 border-teal-300">Standard</Badge>
              {proposal.selected_tier === 'standard' && !expertMode && (
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              )}
            </div>
            <CardTitle className="text-lg font-bold mt-2">Standard Package</CardTitle>
            <CardDescription>Premium Lithium lifecycle balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-muted-foreground">Inverter</p>
                <p className="text-xs font-medium">{inverterKva}kVA Deye Hybrid Inverter</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600">
                <Battery className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-muted-foreground">Battery Bank</p>
                <p className="text-xs font-medium">{standardBattery.configString} — {standardBattery.totalBatteries}× {standardBattery.batteryUnitVoltage}V {standardBattery.batteryUnitAh}Ah</p>
                <span className="text-[10px] text-muted-foreground">LiFePO₄ Lithium</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-muted-foreground">Solar Array</p>
                <p className="text-xs font-medium">{standardPanel.panelCount}× 450W Mono panels</p>
                <span className="text-[10px] text-muted-foreground">{(standardPanel.totalWp / 1000).toFixed(2)} kWp capacity</span>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-2 py-1 rounded-md">
                {standardUsableKwh.toFixed(1)} kWh usable backup
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col border-t bg-muted/10 p-5 mt-4">
            <div className="w-full mb-4">
              <p className="text-xs text-muted-foreground">Estimated Cost</p>
              <p className="text-xl font-bold text-foreground">₦{standardPrice.toLocaleString()}</p>
            </div>
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => {
                updateProposal({ selected_tier: 'standard' });
                setExpertMode(false);
              }}
            >
              Select Standard
            </Button>
          </CardFooter>
        </Card>

        {/* PREMIUM TIER */}
        <Card className={`relative flex flex-col justify-between overflow-hidden border-2 transition-all ${
          proposal.selected_tier === 'premium' && !expertMode ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-border'
        }`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-purple-300">Premium</Badge>
              {proposal.selected_tier === 'premium' && !expertMode && (
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <CardTitle className="text-lg font-bold mt-2">Premium Package</CardTitle>
            <CardDescription>Victron/Deye + Max Capacity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-muted-foreground">Inverter</p>
                <p className="text-xs font-medium">{inverterKva}kVA Deye / Victron Inverter</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600">
                <Battery className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-muted-foreground">Battery Bank</p>
                <p className="text-xs font-medium">{premiumBatteryInfo.configString} — {premiumBatteryInfo.totalBatteries}× {premiumBatteryInfo.batteryUnitVoltage}V {premiumBatteryInfo.batteryUnitAh}Ah</p>
                <span className="text-[10px] text-muted-foreground">Premium LiFePO₄ Lithium</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-muted-foreground">Solar Array</p>
                <p className="text-xs font-medium">{premiumPanel.panelCount}× 550W Mono panels</p>
                <span className="text-[10px] text-muted-foreground">{(premiumPanel.totalWp / 1000).toFixed(2)} kWp capacity</span>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-2 py-1 rounded-md">
                {premiumUsableKwh.toFixed(1)} kWh usable backup
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col border-t bg-muted/10 p-5 mt-4">
            <div className="w-full mb-4">
              <p className="text-xs text-muted-foreground">Estimated Cost</p>
              <p className="text-xl font-bold text-foreground">₦{premiumPrice.toLocaleString()}</p>
            </div>
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => {
                updateProposal({ selected_tier: 'premium' });
                setExpertMode(false);
              }}
            >
              Select Premium
            </Button>
          </CardFooter>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground italic">
        * Estimated price includes flat standard installation & accessories (₦115,000 flat).
      </p>

      {/* ═══ Component Brand Selector ═══ */}
      <Card className="border shadow-md">
        <CardHeader className="pb-3 border-b bg-card/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Verified Hardware Brands (Nigerian Market)
          </CardTitle>
          <CardDescription className="text-xs">
            Select authentic, SON-certified brands to increase proposal trust and ensure warranty eligibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Inverter Brand Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Inverter Brand</label>
              <select
                title="Select Inverter Brand"
                className="w-full text-sm bg-background border rounded-xl p-2.5 outline-none focus:border-teal-500 transition-colors"
                value={proposal.selectedInverterBrand || 'Growatt'}
                onChange={(e) => updateProposal({ selectedInverterBrand: e.target.value })}
              >
                {INVERTER_BRANDS.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name} ({b.type} · {b.warrantyYears}y) {b.sonCertified ? '✓ SON' : 'No SON'}
                  </option>
                ))}
              </select>
              {inverterBrandObj && (
                <div className="flex items-center justify-between text-[11px] mt-1 bg-slate-550/5 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/40">
                  <span className="text-muted-foreground">SON Certified:</span>
                  <span className={inverterBrandObj.sonCertified ? 'text-emerald-600 dark:text-emerald-450 font-bold' : 'text-slate-500'}>
                    {inverterBrandObj.sonCertified ? 'Yes ✓' : 'No ✗'}
                  </span>
                </div>
              )}
            </div>

            {/* Battery Brand Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Battery Brand</label>
              <select
                title="Select Battery Brand"
                className="w-full text-sm bg-background border rounded-xl p-2.5 outline-none focus:border-teal-500 transition-colors"
                value={proposal.selectedBatteryBrand || 'Felicity Lithium'}
                onChange={(e) => updateProposal({ selectedBatteryBrand: e.target.value })}
              >
                {BATTERY_BRANDS.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name} ({b.type} · {b.warrantyYears}y) {b.sonCertified ? '✓ SON' : 'No SON'}
                  </option>
                ))}
              </select>
              {batteryBrandObj && (
                <div className="flex items-center justify-between text-[11px] mt-1 bg-slate-550/5 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/40">
                  <span className="text-muted-foreground">SON Certified:</span>
                  <span className={batteryBrandObj.sonCertified ? 'text-emerald-600 dark:text-emerald-455 font-bold' : 'text-slate-500'}>
                    {batteryBrandObj.sonCertified ? 'Yes ✓' : 'No ✗'}
                  </span>
                </div>
              )}
            </div>

            {/* Solar Panel Brand Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Solar Panel Brand</label>
              <select
                title="Select Solar Panel Brand"
                className="w-full text-sm bg-background border rounded-xl p-2.5 outline-none focus:border-teal-500 transition-colors"
                value={proposal.selectedPanelBrand || 'Jinko'}
                onChange={(e) => updateProposal({ selectedPanelBrand: e.target.value })}
              >
                {PANEL_BRANDS.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name} ({b.type} · {b.warrantyYears}y) {b.sonCertified ? '✓ SON' : 'No SON'}
                  </option>
                ))}
              </select>
              {panelBrandObj && (
                <div className="flex items-center justify-between text-[11px] mt-1 bg-slate-550/5 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/40">
                  <span className="text-muted-foreground">SON Certified:</span>
                  <span className={panelBrandObj.sonCertified ? 'text-emerald-600 dark:text-emerald-455 font-bold' : 'text-slate-500'}>
                    {panelBrandObj.sonCertified ? 'Yes ✓' : 'No ✗'}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* SON Certification Shield Badge */}
          {allSonCertified && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-xs rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>✓ SON-Certified Components Used</span>
              </div>
              <Badge className="bg-emerald-600 dark:bg-emerald-700 text-white font-extrabold uppercase text-[9px] py-0.5 px-2">Verified Trust Seal</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FX Sensitivity Box */}
      <div className="mt-4 p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50">
        <details className="group">
          <summary className="flex items-center cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300">
            <span className="mr-2">⚠️</span>
            FX Sensitivity Analysis
            <span className="ml-auto text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            <p>
              These prices assume an exchange rate of ~₦{(proposal.lockedFXRate || 1600).toLocaleString()}/$1. Since approximately 70% of solar equipment costs are USD-indexed, 
              a 10% weakening of the Naira (e.g. to ₦{((proposal.lockedFXRate || 1600) * 1.1).toLocaleString(undefined, { maximumFractionDigits: 0 })}/$1) would increase the total system cost by around 
              <strong className="text-slate-800 dark:text-slate-200 ml-1">
                ~₦{(finalPrice * 0.7 * 0.1).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </strong>.
            </p>
          </div>
        </details>
      </div>

      {/* SECTION C — Expert Mode Overrides (Toggled ON) */}
      {expertMode && (
        <Card className="border-teal-500 bg-teal-50/10 dark:bg-teal-950/5">
          <CardHeader>
            <CardTitle className="text-base font-bold text-teal-700 dark:text-teal-400">Expert Mode Custom overrides</CardTitle>
            <CardDescription className="text-xs">Override computed hardware packages with catalog items. Prices will recalculate dynamically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <p className="text-xs text-muted-foreground">Fetching components from database...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Inverter Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold">1. Inverter Model ({inverterKva}kVA)</label>
                  <Select
                    value={selectedInverter?.id || ''}
                    onChange={(e) => {
                      const selected = inverters.find(i => i.id === e.target.value);
                      if (selected) setSelectedInverter(selected);
                    }}
                  >
                    {inverters.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.brand} {inv.model_name} ({inv.system_voltage}V) — ₦{Number(inv.price_ngn).toLocaleString()}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Battery Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold">2. Battery Bank ({systemVoltage}V System)</label>
                  <Select
                    value={selectedBattery?.id || ''}
                    onChange={(e) => {
                      const selected = batteries.find(b => b.id === e.target.value);
                      if (selected) setSelectedBattery(selected);
                    }}
                  >
                    {batteries.map((bat) => (
                      <option key={bat.id} value={bat.id}>
                        {bat.brand} {bat.model_name} ({bat.voltage}V {bat.capacity_ah}Ah {bat.chemistry}) — ₦{Number(bat.price_ngn).toLocaleString()}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Panel Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold">3. Solar Panel</label>
                  <Select
                    value={selectedPanel?.id || ''}
                    onChange={(e) => {
                      const selected = panels.find(p => p.id === e.target.value);
                      if (selected) setSelectedPanel(selected);
                    }}
                  >
                    {panels.map((pan) => (
                      <option key={pan.id} value={pan.id}>
                        {pan.brand} {pan.model_name} ({pan.wattage_wp}W) — ₦{Number(pan.price_ngn).toLocaleString()}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            {/* Warnings & Errors */}
            <div className="space-y-3">
              {hasVoltageMismatch && selectedInverter && selectedBattery && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Voltage Mismatch Error</AlertTitle>
                  <AlertDescription>
                    Selected inverter system voltage ({selectedInverter.system_voltage}V) does not match the selected battery voltage ({selectedBattery.voltage}V). Please choose matching components before continuing.
                  </AlertDescription>
                </Alert>
              )}

              {isCapacityKvaTooLow && selectedInverter && (
                <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold text-xs">Low Inverter Capacity Warning</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    Selected inverter capacity is {selectedInverter.capacity_kva}kVA, which is below the recommended capacity of {inverterKva}kVA. This may cause system overloads.
                  </AlertDescription>
                </Alert>
              )}

              {isBatteryVoltageMismatchCalculated && selectedBattery && (
                <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold text-xs">Battery Voltage Warning</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    Selected battery voltage ({selectedBattery.voltage}V) does not match system design voltage ({systemVoltage}V). Ensure appropriate cabling is planned.
                  </AlertDescription>
                </Alert>
              )}

              {hasUnrealisticPanelCount && expertPanelSizing && (
                <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold text-xs">High Panel Count Warning</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    Calculated system requires {expertPanelSizing.panelCount} panels. Please verify if the client has enough physical space to mount a solar array of this size.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Price Preview for Custom Override */}
            {!hasVoltageMismatch && selectedInverter && selectedBattery && selectedPanel && expertBatterySizing && expertPanelSizing && (
              <div className="border-t pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Custom Bill of Materials:</p>
                  <ul className="text-xs space-y-1">
                    <li>• 1× {selectedInverter.brand} {selectedInverter.model_name} Inverter</li>
                    <li>• {expertBatterySizing.totalBatteries}× {selectedBattery.brand} {selectedBattery.model_name} Batteries ({expertBatterySizing.configString})</li>
                    <li>• {expertPanelSizing.panelCount}× {selectedPanel.brand} {selectedPanel.model_name} Solar Panels</li>
                  </ul>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Custom Package Total Cost</p>
                  <p className="text-2xl font-black text-teal-600">₦{customPrice.toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION B — Tier Differences Table */}
      {!fieldMode && (
      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-tight">System Tier Comparison Reference</h3>
        <div className="border rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableHead className="w-1/4 font-semibold">Specification</TableHead>
                <TableHead className={`w-1/4 font-semibold text-center ${proposal.selected_tier === 'budget' ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300' : ''}`}>
                  Budget (Economy)
                </TableHead>
                <TableHead className={`w-1/4 font-semibold text-center ${proposal.selected_tier === 'standard' ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300' : ''}`}>
                  Standard
                </TableHead>
                <TableHead className={`w-1/4 font-semibold text-center ${proposal.selected_tier === 'premium' ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300' : ''}`}>
                  Premium
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-xs">Battery Type</TableCell>
                <TableCell className="text-xs text-center">Tubular Lead-Acid</TableCell>
                <TableCell className="text-xs text-center">LiFePO4 100Ah</TableCell>
                <TableCell className="text-xs text-center">LiFePO4 200Ah</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-xs">Usable DoD</TableCell>
                <TableCell className="text-xs text-center">50%</TableCell>
                <TableCell className="text-xs text-center">80%</TableCell>
                <TableCell className="text-xs text-center">80%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-xs">Battery Lifespan</TableCell>
                <TableCell className="text-xs text-center">3–5 years</TableCell>
                <TableCell className="text-xs text-center">8–10 years</TableCell>
                <TableCell className="text-xs text-center">10–12 years</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-xs">Inverter Type</TableCell>
                <TableCell className="text-xs text-center">High-Frequency</TableCell>
                <TableCell className="text-xs text-center">Hybrid MPPT</TableCell>
                <TableCell className="text-xs text-center">Premium Hybrid</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-xs">Panel Type</TableCell>
                <TableCell className="text-xs text-center">Poly 450W</TableCell>
                <TableCell className="text-xs text-center">Mono 450W</TableCell>
                <TableCell className="text-xs text-center">Mono 550W</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-xs">Warranty</TableCell>
                <TableCell className="text-xs text-center">1 year</TableCell>
                <TableCell className="text-xs text-center">2 years</TableCell>
                <TableCell className="text-xs text-center">3 years</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-xs">Est. Payback</TableCell>
                <TableCell className="text-xs text-center text-green-600 font-semibold">Fastest</TableCell>
                <TableCell className="text-xs text-center text-teal-600 font-semibold">Balanced</TableCell>
                <TableCell className="text-xs text-center text-purple-600 font-semibold">Longest</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      )}
      {/* What This System Powers section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>⚡</span> What This System Powers
            </h3>
            <p className="text-xs text-slate-500">Visual mapping of sized loads and system runtime profile.</p>
          </div>
          <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold px-3 py-1 rounded-full text-xs">
            ⚡ Runs ~{proposal.backup_hours} hours/day
          </span>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(categories).map(([key, cat]) => {
            if (cat.list.length === 0) return null;
            return (
              <div key={key} className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <span className="text-xl pt-0.5">{cat.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.label}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {cat.list.join(', ')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Capacity Sizing Utilization Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-700 dark:text-slate-300">
              System Load: {((calculations?.pContinuous || 0) / 1000).toFixed(1)} kW / {calculations?.inverterKva || 5} kVA capacity
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              utilization < 70 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
              utilization < 90 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
              'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {utilization}% utilized {utilization < 70 ? '✓ (Healthy)' : utilization < 90 ? '⚠️ (Warning)' : '❌ (Upgrade Recommended)'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-850 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                utilization < 70 ? 'bg-emerald-500' :
                utilization < 90 ? 'bg-amber-500' :
                'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, utilization)}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECTION D — Navigation Bottom Bar */}
      <div className="flex gap-4 border-t pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="flex-1 border"
        >
          ← Back
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={hasVoltageMismatch}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
        >
          Continue to ROI →
        </Button>
      </div>
    </div>
  );
}
