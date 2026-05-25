'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BatteryChemistry = 'lead-acid' | 'lithium';
export type FuelType = 'petrol' | 'diesel';
export type ProposalTier = 'budget' | 'standard' | 'premium';
export type LoadType = 'essential' | 'heavy';

export interface InputAppliance {
  id: string;
  applianceId?: string;
  name: string;
  wattage: number;
  quantity: number;
  dailyRuntimeHours: number;
  isInductive: boolean;
  loadType: LoadType;
  isIncludedInBackup: boolean;
  simultaneousStart: boolean;
}

export interface SizingResult {
  totalDailyWh: number;
  essentialDailyWh: number;
  pContinuous: number;
  peakSurgeWatts: number;
  inverterKva: number;
  systemVoltage: number;
  batteryConfigString: string;
  batteryTotalUnits: number;
  batteryUnitVoltage: number;
  batteryUnitAh: number;
  panelCount: number;
  panelUnitWp: number;
  panelTotalWp: number;
}

export interface ProposalState {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  region_id?: number;
  backup_hours: number;
  peak_sun_hours: number;
  battery_chemistry: BatteryChemistry;
  selected_tier: ProposalTier;
  gen_fuel_type?: FuelType;
  gen_capacity_kva?: number;
  gen_daily_hours: number;
  fuelPrices: {
    petrolPerLitre: number;
    dieselPerLitre: number;
  };
  nepa_daily_hours: number;
  nepa_tariff_per_kwh: number;
  
  // ROI Calculator Fields
  roi_gen_size_kva?: number;
  roi_fuel_consumption?: number;
  roi_gen_hours_per_day?: number;
  roi_fuel_price?: number;
  roi_years_to_calculate?: number;
  
  // Legacy energy costs (monthly ₦)
  monthly_phcn_bill: number;
  monthly_gen_fuel_cost: number;
  monthly_gen_maintenance: number;
  
  // Pricing Fields
  inverter_cost_ngn: number;
  battery_unit_cost_ngn: number;
  panel_unit_cost_ngn: number;
  labour_cost_ngn: number;
  accessories_cost_ngn: number;
  markup_percentage: number;
  discount_ngn: number;
  vat_percentage: number;
  final_quoted_price_ngn?: number;

  overrideInverterId?: string;
  overrideBatteryId?: string;
  overridePanelId?: string;
  selectedInverterBrand?: string;
  selectedBatteryBrand?: string;
  selectedPanelBrand?: string;
  appliances: InputAppliance[];
  installer_primary_color: string;
  installer_secondary_color: string;
  installer_logo_url: string;
  installer_tagline: string;
  
  paymentPlan?: {
    selectedPlan: 'outright' | '6months' | '12months' | '24months';
    downPaymentPercent: number;
    interestRatePercent: number;
    includeInProposal: boolean;
    markup6Months: number;
    markup12Months: number;
    markup24Months: number;
  };

  lockedFXRate?: number;
  fxRateLockedAt?: string;

  // New Advanced Pricing and ROI Properties
  transport_cost_ngn?: number;
  contingency_cost_ngn?: number;
  min_margin_threshold?: number;
  fx_buffer_percentage?: number;
  admin_fee_ngn?: number;
  service_fee_ngn?: number;
  warranty_cost_ngn?: number;
  maintenance_plan_cost_ngn?: number;
  recurring_service_fee_ngn?: number;
  quote_validity_days?: number;
  pricing_mode?: 'simple' | 'advanced';
  proposal_notes?: string;
  proposal_exclusions?: string;
  include_vat?: boolean;
}

interface WizardStore {
  step: number;
  proposal: ProposalState;
  calculations?: SizingResult;
  setStep: (n: number) => void;
  updateProposal: (data: Partial<ProposalState>) => void;
  setCalculations: (result: SizingResult) => void;
  reset: () => void;
  
  // Validation & Formatting selectors
  isStep1Valid: () => boolean;
  isStep2Valid: () => boolean;
  isStep3Valid: () => boolean;
  isStep5Valid: () => boolean;
  finalPriceNaira: () => number;
}

const defaultProposal: ProposalState = {
  customer_name: '',
  backup_hours: 8,
  peak_sun_hours: 4.2,
  battery_chemistry: 'lithium',
  selected_tier: 'standard',
  selectedInverterBrand: 'Growatt',
  selectedBatteryBrand: 'Felicity Lithium',
  selectedPanelBrand: 'Jinko',
  gen_daily_hours: 0,
  fuelPrices: {
    petrolPerLitre: 1250,
    dieselPerLitre: 1750,
  },
  nepa_daily_hours: 4,
  nepa_tariff_per_kwh: 225,
  roi_gen_size_kva: 5,
  roi_fuel_consumption: 1.2,
  roi_gen_hours_per_day: 4,
  roi_fuel_price: 1200,
  roi_years_to_calculate: 5,
  monthly_phcn_bill: 8000,
  monthly_gen_fuel_cost: 85000,
  monthly_gen_maintenance: 12000,
  inverter_cost_ngn: 0,
  battery_unit_cost_ngn: 0,
  panel_unit_cost_ngn: 0,
  labour_cost_ngn: 0,
  accessories_cost_ngn: 0,
  markup_percentage: 15,
  discount_ngn: 0,
  vat_percentage: 7.5,
  appliances: [],
  installer_primary_color: '#01696f',
  installer_secondary_color: '#01414a',
  installer_logo_url: '',
  installer_tagline: '',
  paymentPlan: {
    selectedPlan: 'outright',
    downPaymentPercent: 20,
    interestRatePercent: 0,
    includeInProposal: true,
    markup6Months: 10,
    markup12Months: 15,
    markup24Months: 20
  },
  
  // New Advanced Pricing Defaults
  transport_cost_ngn: 25000,
  contingency_cost_ngn: 15000,
  min_margin_threshold: 10,
  fx_buffer_percentage: 2,
  admin_fee_ngn: 10000,
  service_fee_ngn: 0,
  warranty_cost_ngn: 30000,
  maintenance_plan_cost_ngn: 0,
  recurring_service_fee_ngn: 0,
  quote_validity_days: 30,
  pricing_mode: 'simple',
  proposal_notes: '',
  proposal_exclusions: '',
  include_vat: true
};

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      step: 1,
      proposal: defaultProposal,
      calculations: undefined,
      setStep: (n) => set({ step: n }),
      updateProposal: (data) =>
        set((state) => {
          const nextProposal = { ...state.proposal, ...data };
          console.log('WizardStore Proposal Update:', nextProposal);
          return { proposal: nextProposal };
        }),
      setCalculations: (result) => set({ calculations: result }),
      reset: () => set({ step: 1, proposal: defaultProposal, calculations: undefined }),

      isStep1Valid: () => {
        const { proposal } = get();
        if (!proposal.appliances.length) return false;
        return proposal.appliances.every(a => a.wattage > 0 && a.dailyRuntimeHours > 0);
      },
      
      isStep2Valid: () => {
        const { proposal } = get();
        const totalHours = (proposal.nepa_daily_hours || 0) + (proposal.gen_daily_hours || 0);
        if (totalHours > 24) return false;
        if (proposal.peak_sun_hours <= 0) return false;
        return true;
      },
      
      isStep3Valid: () => {
        const { calculations } = get();
        const peakSurgeKw = (calculations?.peakSurgeWatts || 0) / 1000;
        const selectedInverterKva = calculations?.inverterKva || 0;
        return selectedInverterKva >= peakSurgeKw;
      },
      
      finalPriceNaira: () => {
        const { proposal, calculations } = get();
        
        const inverterTotal = proposal.inverter_cost_ngn || 0;
        const batteryTotal = (proposal.battery_unit_cost_ngn || 0) * (calculations?.batteryTotalUnits || 1);
        const panelTotal = (proposal.panel_unit_cost_ngn || 0) * (calculations?.panelCount || 1);
        
        const hardwareCost = inverterTotal + batteryTotal + panelTotal;
        const labour = proposal.labour_cost_ngn || 0;
        const transport = proposal.transport_cost_ngn || 0;
        const accessories = proposal.accessories_cost_ngn || 0;

        // Advanced-only cost inputs
        const isAdvanced = proposal.pricing_mode === 'advanced';
        const contingency = isAdvanced ? (proposal.contingency_cost_ngn || 0) : 0;
        const adminFee = isAdvanced ? (proposal.admin_fee_ngn || 0) : 0;
        const serviceFee = isAdvanced ? (proposal.service_fee_ngn || 0) : 0;
        const warranty = isAdvanced ? (proposal.warranty_cost_ngn || 0) : 0;
        const maintenance = isAdvanced ? (proposal.maintenance_plan_cost_ngn || 0) : 0;

        const basePrice = hardwareCost + labour + transport + accessories + contingency + adminFee + serviceFee + warranty + maintenance;

        if (basePrice <= 0) return 0;

        const markup = proposal.markup_percentage || 0;
        const withMarkup = basePrice * (1 + markup / 100);
        
        const includeVat = proposal.include_vat !== false;
        const vatRate = includeVat ? (proposal.vat_percentage || 7.5) : 0;
        const withVat = withMarkup * (1 + vatRate / 100);
        
        const final = withVat - (proposal.discount_ngn || 0);

        return Math.max(0, Math.round(final));
      },
      
      isStep5Valid: () => {
        const finalPrice = get().finalPriceNaira();
        return finalPrice > 0;
      },
    }),
    { name: 'solar-wizard-store' }
  )
);
