/* ─── Region Configuration for International Solar Estimator ─── */

export type RegionCode = 'NG' | 'GH' | 'KE' | 'ZA' | 'IN' | 'US' | 'UK' | 'AE';

export interface RegionProfile {
  code: RegionCode;
  name: string;
  flag: string;
  currency: {
    symbol: string;
    code: string;
    locale: string;
  };
  grid: {
    name: string;           // e.g. "NEPA", "ECG", "KPLC", "Eskom", "Grid"
    avgHoursDefault: number;
    label: string;          // e.g. "How many hours of grid (NEPA) power..."
    lowGridNote: string;    // Contextual note for low grid areas
  };
  fuel: {
    petrolPricePerLitre: number;
    dieselPricePerLitre: number;
    petrolLabel: string;
    dieselLabel: string;
    priceNote: string;      // e.g. "Petrol ₦1,250/L..."
  };
  solar: {
    peakSunHours: number;   // Average daily peak sun hours
    panelEfficiency: number; // 0.75 = 75%
    weatherNote: string;    // e.g. "Nigerian weather"
  };
  costs: {
    /** Multiplier applied to base Naira costs to get local currency costs */
    multiplier: number;
  };
  context: {
    marketName: string;     // e.g. "Nigerian market", "Kenyan market"
    fuelLiabilityNote: string;
    defaultMonthlySpend: string;
  };
  subscription: {
    singleTokenPrice: string;
    monthlyPrice: string;
  };
}

export const REGION_PROFILES: Record<RegionCode, RegionProfile> = {
  NG: {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: { symbol: '₦', code: 'NGN', locale: 'en-NG' },
    grid: {
      name: 'NEPA/DisCo',
      avgHoursDefault: 8,
      label: 'How many hours of grid (NEPA) power do you get daily?',
      lowGridNote: 'High NEPA hours mean you can recharge batteries mostly with grid, potentially needing fewer solar panels.',
    },
    fuel: {
      petrolPricePerLitre: 1250,
      dieselPricePerLitre: 1750,
      petrolLabel: 'Petrol Gen ⛽',
      dieselLabel: 'Diesel Gen 🚜',
      priceNote: 'Fuel costs are based on current rates (Petrol ₦1,250/L, Diesel ₦1,750/L as of 2026).',
    },
    solar: {
      peakSunHours: 4.5,
      panelEfficiency: 0.75,
      weatherNote: 'Nigerian weather',
    },
    costs: { multiplier: 1 },
    context: {
      marketName: 'the Nigerian market',
      fuelLiabilityNote: 'In Nigeria, generator fuel is a continuous, burning liability. Solar is an asset that pays for itself and provides quiet, pollution-free power for 20+ years.',
      defaultMonthlySpend: '60000',
    },
    subscription: {
      singleTokenPrice: '₦1,500',
      monthlyPrice: '₦3,000',
    },
  },

  GH: {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    currency: { symbol: 'GH₵', code: 'GHS', locale: 'en-GH' },
    grid: {
      name: 'ECG/NEDCo',
      avgHoursDefault: 14,
      label: 'How many hours of grid (ECG) power do you get daily?',
      lowGridNote: 'Higher grid availability in your area means batteries can recharge via mains, reducing your solar panel requirement.',
    },
    fuel: {
      petrolPricePerLitre: 17,
      dieselPricePerLitre: 19,
      petrolLabel: 'Petrol Gen ⛽',
      dieselLabel: 'Diesel Gen 🚜',
      priceNote: 'Fuel costs are based on current Ghana rates (Petrol GH₵17/L, Diesel GH₵19/L).',
    },
    solar: {
      peakSunHours: 4.8,
      panelEfficiency: 0.75,
      weatherNote: 'Ghanaian weather conditions',
    },
    costs: { multiplier: 0.0085 }, // ~NGN→GHS
    context: {
      marketName: 'the Ghanaian market',
      fuelLiabilityNote: 'In Ghana, dumsor-era habits persist. Solar eliminates generator dependency and provides stable, clean power for 20+ years.',
      defaultMonthlySpend: '500',
    },
    subscription: {
      singleTokenPrice: 'GH₵15',
      monthlyPrice: 'GH₵30',
    },
  },

  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: { symbol: 'KSh', code: 'KES', locale: 'en-KE' },
    grid: {
      name: 'KPLC Grid',
      avgHoursDefault: 18,
      label: 'How many hours of grid (Kenya Power) do you get daily?',
      lowGridNote: 'Kenya has relatively good grid coverage, but rural and peri-urban areas still experience frequent outages.',
    },
    fuel: {
      petrolPricePerLitre: 210,
      dieselPricePerLitre: 195,
      petrolLabel: 'Petrol Gen ⛽',
      dieselLabel: 'Diesel Gen 🚜',
      priceNote: 'Fuel costs based on current Kenya rates (Petrol KSh210/L, Diesel KSh195/L).',
    },
    solar: {
      peakSunHours: 5.0,
      panelEfficiency: 0.78,
      weatherNote: 'Kenyan equatorial climate',
    },
    costs: { multiplier: 0.095 }, // ~NGN→KES
    context: {
      marketName: 'the Kenyan market',
      fuelLiabilityNote: 'In Kenya, solar is increasingly the smart investment. With excellent equatorial sun exposure, payback periods are often faster than West African markets.',
      defaultMonthlySpend: '5000',
    },
    subscription: {
      singleTokenPrice: 'KSh200',
      monthlyPrice: 'KSh400',
    },
  },

  ZA: {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    currency: { symbol: 'R', code: 'ZAR', locale: 'en-ZA' },
    grid: {
      name: 'Eskom Grid',
      avgHoursDefault: 16,
      label: 'How many hours of grid (Eskom) power do you get daily?',
      lowGridNote: 'Load-shedding stages reduce grid availability. Solar + battery eliminates loadshedding impact completely.',
    },
    fuel: {
      petrolPricePerLitre: 25,
      dieselPricePerLitre: 23,
      petrolLabel: 'Petrol Gen ⛽',
      dieselLabel: 'Diesel Gen 🚜',
      priceNote: 'Fuel costs based on SA rates (Petrol R25/L, Diesel R23/L).',
    },
    solar: {
      peakSunHours: 5.5,
      panelEfficiency: 0.78,
      weatherNote: 'South African climate conditions',
    },
    costs: { multiplier: 0.012 }, // ~NGN→ZAR
    context: {
      marketName: 'the South African market',
      fuelLiabilityNote: 'With ongoing load-shedding, solar + battery storage is the definitive solution for South African homes and businesses. It pays for itself and provides energy independence.',
      defaultMonthlySpend: '3500',
    },
    subscription: {
      singleTokenPrice: 'R25',
      monthlyPrice: 'R50',
    },
  },

  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: { symbol: '₹', code: 'INR', locale: 'en-IN' },
    grid: {
      name: 'State Grid',
      avgHoursDefault: 18,
      label: 'How many hours of grid power do you get daily?',
      lowGridNote: 'Many Indian states have improving grid reliability, but rural and tier-2 cities still experience frequent outages.',
    },
    fuel: {
      petrolPricePerLitre: 105,
      dieselPricePerLitre: 92,
      petrolLabel: 'Petrol Gen ⛽',
      dieselLabel: 'Diesel Gen 🚜',
      priceNote: 'Fuel costs based on current Indian rates (Petrol ₹105/L, Diesel ₹92/L).',
    },
    solar: {
      peakSunHours: 5.0,
      panelEfficiency: 0.76,
      weatherNote: 'Indian tropical and subtropical climate',
    },
    costs: { multiplier: 0.055 }, // ~NGN→INR
    context: {
      marketName: 'the Indian market',
      fuelLiabilityNote: 'India\'s National Solar Mission makes rooftop solar highly attractive with government subsidies. Solar pays for itself faster with net metering benefits.',
      defaultMonthlySpend: '5000',
    },
    subscription: {
      singleTokenPrice: '₹125',
      monthlyPrice: '₹250',
    },
  },

  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: { symbol: '$', code: 'USD', locale: 'en-US' },
    grid: {
      name: 'Utility Grid',
      avgHoursDefault: 23,
      label: 'How many hours of reliable grid power do you get daily?',
      lowGridNote: 'Most US households have near-continuous grid. Solar primarily reduces utility bills rather than replacing generators.',
    },
    fuel: {
      petrolPricePerLitre: 1.05,
      dieselPricePerLitre: 1.15,
      petrolLabel: 'Gas Generator ⛽',
      dieselLabel: 'Diesel Generator 🚜',
      priceNote: 'Fuel costs based on US averages (Gas ~$1.05/L, Diesel ~$1.15/L).',
    },
    solar: {
      peakSunHours: 4.5,
      panelEfficiency: 0.80,
      weatherNote: 'US climate varies by state',
    },
    costs: { multiplier: 0.00065 }, // ~NGN→USD
    context: {
      marketName: 'the US market',
      fuelLiabilityNote: 'With the 30% Federal ITC tax credit and state incentives, residential solar delivers strong ROI in most US states. Net metering can further reduce payback periods.',
      defaultMonthlySpend: '200',
    },
    subscription: {
      singleTokenPrice: '$2',
      monthlyPrice: '$4',
    },
  },

  UK: {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: { symbol: '£', code: 'GBP', locale: 'en-GB' },
    grid: {
      name: 'National Grid',
      avgHoursDefault: 24,
      label: 'How many hours of reliable grid power do you get daily?',
      lowGridNote: 'The UK grid is highly reliable. Solar primarily offsets electricity bills and can earn via the Smart Export Guarantee (SEG).',
    },
    fuel: {
      petrolPricePerLitre: 1.45,
      dieselPricePerLitre: 1.50,
      petrolLabel: 'Petrol Generator ⛽',
      dieselLabel: 'Diesel Generator 🚜',
      priceNote: 'Fuel costs based on UK averages (Petrol £1.45/L, Diesel £1.50/L).',
    },
    solar: {
      peakSunHours: 3.0,
      panelEfficiency: 0.78,
      weatherNote: 'UK maritime climate with variable sunlight',
    },
    costs: { multiplier: 0.00052 }, // ~NGN→GBP
    context: {
      marketName: 'the UK market',
      fuelLiabilityNote: 'With rising UK energy prices and the Smart Export Guarantee, solar panels typically pay back in 8-12 years while providing 25+ years of clean energy.',
      defaultMonthlySpend: '150',
    },
    subscription: {
      singleTokenPrice: '£2',
      monthlyPrice: '£3',
    },
  },

  AE: {
    code: 'AE',
    name: 'UAE / Dubai',
    flag: '🇦🇪',
    currency: { symbol: 'AED', code: 'AED', locale: 'en-AE' },
    grid: {
      name: 'DEWA Grid',
      avgHoursDefault: 24,
      label: 'How many hours of grid (DEWA) power do you get daily?',
      lowGridNote: 'UAE has excellent grid reliability. Solar primarily reduces your DEWA bill and supports Shams Dubai net metering.',
    },
    fuel: {
      petrolPricePerLitre: 3.2,
      dieselPricePerLitre: 3.5,
      petrolLabel: 'Petrol Generator ⛽',
      dieselLabel: 'Diesel Generator 🚜',
      priceNote: 'Fuel costs based on UAE rates (Petrol AED 3.2/L, Diesel AED 3.5/L).',
    },
    solar: {
      peakSunHours: 6.5,
      panelEfficiency: 0.80,
      weatherNote: 'UAE desert climate with exceptional solar irradiance',
    },
    costs: { multiplier: 0.0024 }, // ~NGN→AED
    context: {
      marketName: 'the UAE/Dubai market',
      fuelLiabilityNote: 'The UAE\'s Shams Dubai initiative and exceptional solar irradiance (~6.5 peak sun hours) make rooftop solar extremely attractive, with some of the fastest payback periods globally.',
      defaultMonthlySpend: '1500',
    },
    subscription: {
      singleTokenPrice: 'AED 6',
      monthlyPrice: 'AED 12',
    },
  },
};

/** Format a number with the region's currency symbol */
export function formatCurrency(amount: number, region: RegionProfile): string {
  return `${region.currency.symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/** Convert base Naira cost to local currency */
export function convertCost(nairaCost: number, region: RegionProfile): number {
  return Math.round(nairaCost * region.costs.multiplier);
}

/** Get default region, defaulting to Nigeria */
export function getDefaultRegion(): RegionCode {
  return 'NG';
}
