// src/utils/calculations.ts

export interface InputAppliance {
  id?: string;
  name: string;
  wattage: number;
  quantity: number;
  dailyRuntimeHours: number;
  isInductive: boolean;
  loadType: 'essential' | 'heavy';
  isIncludedInBackup: boolean;
  simultaneousStart: boolean;
}

export interface GeneratorInputs {
  fuelType: 'petrol' | 'diesel';
  capacityKva: number;
  dailyHours: number;
  fuelPricePerLiter: number;
  serviceCostPerEvent?: number;
}

export interface GridInputs {
  dailyHours: number;
  tariffPerKwh: number;
}

const INDUCTIVE_SURGE_MULTIPLIER = 3;
const SURGE_DELTA = INDUCTIVE_SURGE_MULTIPLIER - 1; // 2

export function getApplianceSurgeMultiplier(app: InputAppliance): number {
  if (!app.isInductive) return 1;
  const nameLower = app.name.toLowerCase();
  if (nameLower.includes('inverter')) {
    return 1.5;
  }
  if (
    nameLower.includes('pump') ||
    nameLower.includes('borehole') ||
    nameLower.includes('compressor') ||
    nameLower.includes('motor')
  ) {
    return 5.0;
  }
  return 3.0; // standard default
}

export const FUEL_PRICES_NGN = {
  petrol: 1250,  // ₦/litre — Lagos average, May 2026
  diesel: 1750,  // ₦/litre — Lagos average, May 2026
} as const;

/**
 * Calculates daily load totals in Watt-hours (Wh) and Watt peak (W)
 */
export function calculateDailyLoad(appliances: InputAppliance[]) {
  let totalDailyWh = 0;
  let essentialDailyWh = 0;
  let pContinuous = 0;

  for (const app of appliances) {
    const dailyWh = app.wattage * app.quantity * app.dailyRuntimeHours;
    totalDailyWh += dailyWh;

    if (app.isIncludedInBackup && app.loadType === 'essential') {
      essentialDailyWh += dailyWh;
    }

    pContinuous += app.wattage * app.quantity;
  }

  return { totalDailyWh, essentialDailyWh, pContinuous };
}

/**
 * Calculates the required inverter capacity in kVA using a two-pass surge logic.
 */
export function calculateInverterSize(appliances: InputAppliance[], pContinuous: number) {
  // Pass 1: simultaneous starters — add full surge delta
  const simultaneousSurge = appliances
    .filter(a => a.isInductive && a.simultaneousStart)
    .reduce((sum, a) => {
      const mult = getApplianceSurgeMultiplier(a);
      return sum + (a.wattage * a.quantity * (mult - 1));
    }, 0);

  // Pass 2: non-simultaneous — take only the single largest surge delta
  const nonSimultaneousStarters = appliances.filter(a => a.isInductive && !a.simultaneousStart);
  let nonSimultaneousMaxSurge = 0;
  if (nonSimultaneousStarters.length > 0) {
    nonSimultaneousMaxSurge = Math.max(
      ...nonSimultaneousStarters.map(a => {
        const mult = getApplianceSurgeMultiplier(a);
        return a.wattage * (mult - 1);
      })
    );
  }

  const peakSurgeWatts = pContinuous + simultaneousSurge + nonSimultaneousMaxSurge;
  
  // Power factor 0.8, 25% safety margin
  const reqKvaRaw = (peakSurgeWatts * 1.25) / (0.8 * 1000);

  // Standard Nigerian market tiers
  const standardTiers = [1.5, 2.5, 3.5, 5, 7.5, 10, 15];
  const kva = standardTiers.find(tier => tier >= reqKvaRaw) || reqKvaRaw;

  // Determine Nominal System Voltage
  let systemVoltage = 48;
  if (kva <= 1.5) systemVoltage = 12;
  else if (kva <= 3.5) systemVoltage = 24;

  return { reqKvaRaw, kva, systemVoltage, peakSurgeWatts };
}

/**
 * Calculates the required battery bank capacity in Ah and determines the configuration.
 */
export function calculateBatteryBank(
  essentialDailyWh: number,
  backupHours: number,
  systemVoltage: number,
  chemistry: 'lead-acid' | 'lithium',
  sizingMethod: 'backup-hours' | 'flat-load' = 'backup-hours',
  appliances: InputAppliance[] = []
) {
  const dod = chemistry === 'lithium' ? 0.8 : 0.5;

  let backupReqWh = 0;
  if (sizingMethod === 'flat-load') {
    const averageHourlyEssentialWh = essentialDailyWh / 24;
    backupReqWh = averageHourlyEssentialWh * backupHours;
  } else {
    // Sizing method: backup-hours (Direct Load Runtime method)
    for (const app of appliances) {
      if (app.isIncludedInBackup && app.loadType === 'essential') {
        const backupRuntime = Math.min(app.dailyRuntimeHours, backupHours);
        backupReqWh += app.wattage * app.quantity * backupRuntime;
      }
    }
    // Fallback if no essential appliances are provided
    if (backupReqWh === 0) {
      const averageHourlyEssentialWh = essentialDailyWh / 24;
      backupReqWh = averageHourlyEssentialWh * backupHours;
    }
  }

  const reqAhRaw = backupReqWh / (systemVoltage * dod);

  // Determine configurations based on standard unit batteries
  let configString = '';
  let batteryUnitAh = 200; // Typical default for Tubular Lead-Acid
  let batteryUnitVoltage = 12;
  let sCount = 1;
  let pCount = 1;
  let totalBatteries = 1;

  if (chemistry === 'lead-acid') {
    batteryUnitVoltage = 12;
    batteryUnitAh = 200;
    sCount = systemVoltage / batteryUnitVoltage; // e.g. 48V / 12V = 4
    pCount = Math.ceil(reqAhRaw / batteryUnitAh);
    if (pCount === 0) pCount = 1;
    totalBatteries = sCount * pCount;
    configString = `${sCount}S${pCount}P`;
  } else {
    // Lithium is usually 48V rack-mount 100Ah or 200Ah (assume 48V system)
    batteryUnitVoltage = 48;
    if (systemVoltage === 48) {
      batteryUnitAh = 100; // Let's base it on standard 100Ah blocks for granularity
      sCount = 1;
      pCount = Math.ceil(reqAhRaw / batteryUnitAh);
      if (pCount === 0) pCount = 1;
      totalBatteries = sCount * pCount;
      configString = `${sCount}S${pCount}P`;
    } else {
      // 12V or 24V lithium
      batteryUnitVoltage = 12; // Or 24V
      batteryUnitAh = 100;
      sCount = systemVoltage / batteryUnitVoltage;
      pCount = Math.ceil(reqAhRaw / batteryUnitAh);
      if (pCount === 0) pCount = 1;
      totalBatteries = sCount * pCount;
      configString = `${sCount}S${pCount}P`;
    }
  }

  // Provide calculated values
  return { 
    reqAhRaw, 
    calculatedAh: pCount * batteryUnitAh, 
    totalBatteries,
    configString, 
    batteryUnitVoltage, 
    batteryUnitAh 
  };
}

export const CITY_DERATING_FACTORS: Record<string, { thermalLoss: number; soilingLoss: number }> = {
  'lagos': { thermalLoss: 0.15, soilingLoss: 0.05 },
  'lagos-ikeja': { thermalLoss: 0.15, soilingLoss: 0.05 },
  'abuja': { thermalLoss: 0.10, soilingLoss: 0.08 },
  'port-harcourt': { thermalLoss: 0.12, soilingLoss: 0.08 },
  'kano': { thermalLoss: 0.12, soilingLoss: 0.15 },
  'ibadan': { thermalLoss: 0.11, soilingLoss: 0.10 },
  'enugu': { thermalLoss: 0.11, soilingLoss: 0.07 },
  'benin': { thermalLoss: 0.12, soilingLoss: 0.06 },
  'jos': { thermalLoss: 0.08, soilingLoss: 0.12 },
  'kaduna': { thermalLoss: 0.12, soilingLoss: 0.12 },
  'yola': { thermalLoss: 0.15, soilingLoss: 0.15 },
};

/**
 * Calculates the required Solar Array size in Wp
 */
export function calculatePanelArray(
  totalDailyWh: number,
  peakSunHours: number,
  chemistry: 'lead-acid' | 'lithium',
  panelUnitWp: number = 450,
  sizingBasis: 'total' | 'essential' = 'total',
  essentialDailyWh: number = 0,
  cityId?: string
) {
  const chargingOverheadFactor = chemistry === 'lithium' ? 1.05 : 1.25;
  
  // Localized derating values
  const derating = CITY_DERATING_FACTORS[cityId || ''] || { thermalLoss: 0.12, soilingLoss: 0.08 };
  const deratingFactor = (1 - derating.thermalLoss) * (1 - derating.soilingLoss);
  
  const etaBase = 0.85 * 0.80 * 0.90; // 0.612
  const etaCombined = etaBase * deratingFactor;

  const baseWh = sizingBasis === 'essential' ? essentialDailyWh : totalDailyWh;
  const reqArrayWp = (baseWh * chargingOverheadFactor) / (peakSunHours * etaCombined);
  
  let panelCount = Math.ceil(reqArrayWp / panelUnitWp);
  if (panelCount === 0 && baseWh > 0) panelCount = 1;

  return { reqArrayWp, panelCount, panelUnitWp, totalWp: panelCount * panelUnitWp };
}

const FUEL_CONSUMPTION_TABLE: Record<number, { petrol?: number; diesel?: number }> = {
  1.0:  { petrol: 0.45 },
  1.5:  { petrol: 0.6 },
  2.0:  { petrol: 0.85 },
  2.5:  { petrol: 1.0 },
  3.5:  { petrol: 1.4 },
  5.0:  { petrol: 1.8, diesel: 1.4 },
  6.5:  { petrol: 2.2, diesel: 1.7 },
  7.5:  { diesel: 2.1, petrol: 2.5 },
  10.0: { diesel: 2.5, petrol: 3.2 },
  12.5: { diesel: 3.0 },
  15.0: { diesel: 3.5, petrol: 4.0 },
  20.0: { diesel: 4.8 },
  25.0: { diesel: 5.8 },
};

/**
 * Gets the generator fuel consumption rate based on a stepped table.
 */
export function getGeneratorFuelRate(capacityKva: number, fuelType: 'petrol' | 'diesel'): number {
  const sizes = Object.keys(FUEL_CONSUMPTION_TABLE).map(Number).sort((a, b) => a - b);
  const closestKva = sizes.reduce((prev, curr) => 
    Math.abs(curr - capacityKva) < Math.abs(prev - capacityKva) ? curr : prev
  );
  
  const rate = FUEL_CONSUMPTION_TABLE[closestKva]?.[fuelType];
  
  if (rate === undefined) {
    throw new Error(`Unsupported configuration: No fuel rate found for ${capacityKva}kVA ${fuelType} generator.`);
  }
  
  return rate;
}

/**
 * Calculates ROI payback period in months
 */
export function calculateROI(
  totalCapEx: number,
  genInputs: GeneratorInputs | null,
  gridInputs: GridInputs | null,
  essentialDailyWh: number,
  actualBilling?: {
    monthlyGridBill?: number;
    monthlyGenFuel?: number;
    monthlyGenMaint?: number;
  },
  annualInflationRate: number = 0 // default 0 to preserve test cases
) {
  let genMonthlyCost = 0;
  if (actualBilling && actualBilling.monthlyGenFuel !== undefined && actualBilling.monthlyGenFuel > 0) {
    genMonthlyCost = (actualBilling.monthlyGenFuel || 0) + (actualBilling.monthlyGenMaint || 0);
  } else if (genInputs && genInputs.dailyHours > 0) {
    const fuelRate = getGeneratorFuelRate(genInputs.capacityKva, genInputs.fuelType);
    const fuelCost = genInputs.dailyHours * fuelRate * genInputs.fuelPricePerLiter * 30.4;
    
    const serviceInterval = genInputs.fuelType === 'petrol' ? 100 : 150;
    const serviceCostPerEvent = genInputs.serviceCostPerEvent || (genInputs.fuelType === 'petrol' ? 6000 : 35000);
    const maintenanceCost = ((genInputs.dailyHours * 30.4) / serviceInterval) * serviceCostPerEvent;
    
    genMonthlyCost = fuelCost + maintenanceCost;
  }

  let gridMonthlyCost = 0;
  if (actualBilling && actualBilling.monthlyGridBill !== undefined && actualBilling.monthlyGridBill > 0) {
    gridMonthlyCost = actualBilling.monthlyGridBill;
  } else if (gridInputs && gridInputs.dailyHours > 0) {
    const avgEssentialKw = essentialDailyWh / 24 / 1000;
    const gridDailyKwh = avgEssentialKw * gridInputs.dailyHours;
    gridMonthlyCost = gridDailyKwh * gridInputs.tariffPerKwh * 30.4;
  }

  const solarOMMonthly = (totalCapEx * 0.01) / 12;
  const baseMonthlySavings = (genMonthlyCost + gridMonthlyCost) - solarOMMonthly;

  const PANEL_DEGRADATION_RATE = 0.005; // 0.5% per year
  const MAX_MONTHS = 360; // 30 years cap
  let remaining = totalCapEx;
  let month = 0;

  if (baseMonthlySavings <= 0) return { paybackMonths: Infinity, baseMonthlySavings, genMonthlyCost, gridMonthlyCost };

  while (remaining > 0 && month < MAX_MONTHS) {
    const year = Math.floor(month / 12) + 1;
    const inflatedLegacyCost = (genMonthlyCost + gridMonthlyCost) * Math.pow(1 + annualInflationRate, year - 1);
    const inflatedSolarOM = solarOMMonthly * Math.pow(1 + annualInflationRate, year - 1);
    const monthlySavings = (inflatedLegacyCost * Math.pow(1 - PANEL_DEGRADATION_RATE, year - 1)) - inflatedSolarOM;

    if (monthlySavings <= 0) return { paybackMonths: Infinity, baseMonthlySavings, genMonthlyCost, gridMonthlyCost };
    remaining -= monthlySavings;
    month++;
  }

  const paybackMonths = month >= MAX_MONTHS ? Infinity : month;
  return { paybackMonths, baseMonthlySavings, genMonthlyCost, gridMonthlyCost };
}

export type TariffBand = 'Band A' | 'Band B' | 'Band C' | 'Band D' | 'Band E';

export interface TariffBandInfo {
  band: TariffBand;
  minHoursPerDay: number;
  avgTariffPerKwh: number;
  description: string;
}

export const NERC_TARIFF_BANDS: Record<TariffBand, TariffBandInfo> = {
  'Band A': { band: 'Band A', minHoursPerDay: 20, avgTariffPerKwh: 209, description: '20+ hrs grid/day (Highest tariff)' },
  'Band B': { band: 'Band B', minHoursPerDay: 16, avgTariffPerKwh: 145, description: '16–20 hrs grid/day' },
  'Band C': { band: 'Band C', minHoursPerDay: 12, avgTariffPerKwh: 110, description: '12–16 hrs grid/day' },
  'Band D': { band: 'Band D', minHoursPerDay: 8, avgTariffPerKwh: 75, description: '8–12 hrs grid/day' },
  'Band E': { band: 'Band E', minHoursPerDay: 4, avgTariffPerKwh: 50, description: '<8 hrs grid/day (High generator reliance)' },
};

/**
 * Calculates 10-Year Total Cost of Ownership (TCO) comparison for Lithium (LiFePO4) vs Lead-Acid
 */
export function calculateBatteryTCO(initialLithiumCost: number, initialLeadAcidCost: number) {
  const leadAcidReplacements = 3; // at yr 2.5, yr 5.0, yr 7.5
  const leadAcidInflationRate = 0.12; // 12% annual replacement cost inflation in NGN
  
  let totalLeadAcidCost = initialLeadAcidCost;
  for (let i = 1; i <= leadAcidReplacements; i++) {
    const year = i * 2.5;
    totalLeadAcidCost += initialLeadAcidCost * Math.pow(1 + leadAcidInflationRate, year);
  }

  const totalLithiumCost = initialLithiumCost;
  const net10YearSavings = totalLeadAcidCost - totalLithiumCost;

  return {
    initialLithiumCost,
    initialLeadAcidCost,
    totalLithium10Yr: Math.round(totalLithiumCost),
    totalLeadAcid10Yr: Math.round(totalLeadAcidCost),
    net10YearSavings: Math.round(net10YearSavings),
  };
}

export interface TierSummary {
  tier: 'budget' | 'standard' | 'premium';
  inverterKva: number;
  batteryConfig: string;
  batteryType: string;
  panelCount: number;
  panelWp: number;
  price: number;
  payback: number;
  summary: string;
}

/**
 * Generates the WhatsApp 3-Tier comparison string
 */
export function generateWhatsAppComparison(
  customerName: string,
  tiers: TierSummary[],
  proposalUrl?: string
): string {
  const lines = tiers.map(t =>
    `*${t.tier.toUpperCase()} TIER:* ₦${t.price.toLocaleString()}\n` +
    `• System: ${t.inverterKva}kVA Inverter\n` +
    `• Battery: ${t.batteryConfig} (${t.batteryType})\n` +
    `• Solar: ${t.panelCount}x ${t.panelWp}W panels\n` +
    `• Payback: ${t.payback === Infinity ? 'N/A' : t.payback.toFixed(0) + 'mo payback'}\n`
  ).join('\n');

  const linkText = proposalUrl ? `\n\n📄 *View Interactive PDF Proposal:* ${proposalUrl}` : '';

  return `*Solar Proposal for ${customerName}*\n\n` +
         `Here are three tailored solar options for your load profile:\n\n` +
         `${lines}` +
         `${linkText}\n\n` +
         `Reply to this message with your preferred option (BUDGET, STANDARD, or PREMIUM) to finalize installation.`;
}

