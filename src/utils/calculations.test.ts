// src/utils/calculations.test.ts

import { describe, it, expect } from 'vitest';
import {
  calculateDailyLoad,
  calculateInverterSize,
  calculateBatteryBank,
  calculatePanelArray,
  getGeneratorFuelRate,
  calculateROI,
  generateWhatsAppComparison,
  InputAppliance
} from './calculations';

describe('calculations', () => {
  describe('calculateDailyLoad', () => {
    it('sums daily Wh and essential Wh correctly', () => {
      const appliances: InputAppliance[] = [
        { name: 'TV', wattage: 100, quantity: 2, dailyRuntimeHours: 5, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: false },
        { name: 'AC', wattage: 1000, quantity: 1, dailyRuntimeHours: 8, isInductive: true, loadType: 'heavy', isIncludedInBackup: false, simultaneousStart: false },
      ];
      const result = calculateDailyLoad(appliances);
      expect(result.totalDailyWh).toBe((100 * 2 * 5) + (1000 * 1 * 8)); // 1000 + 8000 = 9000
      expect(result.essentialDailyWh).toBe(100 * 2 * 5); // 1000
      expect(result.pContinuous).toBe(200 + 1000); // 1200
    });
  });

  describe('calculateInverterSize', () => {
    it('calculates surge with two-pass logic (simultaneous + non-simultaneous items)', () => {
      // AC (simultaneous=true, 1050W) + Pump (simultaneous=true, 550W) + Fridge (simultaneous=false, 150W)
      const appliances: InputAppliance[] = [
        { name: 'AC', wattage: 1050, quantity: 1, dailyRuntimeHours: 4, isInductive: true, loadType: 'heavy', isIncludedInBackup: false, simultaneousStart: true },
        { name: 'Pump', wattage: 550, quantity: 1, dailyRuntimeHours: 1, isInductive: true, loadType: 'heavy', isIncludedInBackup: false, simultaneousStart: true },
        { name: 'Fridge', wattage: 150, quantity: 1, dailyRuntimeHours: 24, isInductive: true, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: false }
      ];
      const pContinuous = 1050 + 550 + 150; // 1750W
      
      const { peakSurgeWatts, kva } = calculateInverterSize(appliances, pContinuous);
      
      // Expected:
      // AC: default inductive -> 3.0x multiplier -> surge delta = 2.0 -> 1050 * 2 = 2100W
      // Pump: heavy inductive -> 5.0x multiplier -> surge delta = 4.0 -> 550 * 4 = 2200W
      // simultaneous_surge = 2100 + 2200 = 4300W
      // Fridge: default inductive -> 3.0x multiplier -> surge delta = 2.0 -> 150 * 2 = 300W
      // peakSurge = 1750 + 4300 + 300 = 6350W
      expect(peakSurgeWatts).toBe(6350);
      
      // reqKvaRaw = (6350 * 1.25) / (0.8 * 1000) = 9.921875 kVA
      // Standard tiers: [1.5, 2.5, 3.5, 5, 7.5, 10, 15]
      // Expected tier: 10 kVA
      expect(kva).toBe(10);
    });

    it('Resistive Only Test: All appliances resistive (no inductive) -> Surge delta is 0', () => {
      const appliances: InputAppliance[] = [
        { name: 'Bulb', wattage: 10, quantity: 5, dailyRuntimeHours: 5, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: false }
      ];
      const pContinuous = 50;
      const { peakSurgeWatts, kva } = calculateInverterSize(appliances, pContinuous);
      
      expect(peakSurgeWatts).toBe(50); // No surge
      expect(kva).toBe(1.5); // Minimum tier
    });

    it('Single Bulb Test: Single 9W LED bulb -> Produces 1.5 kVA, 12V minimum boundary', () => {
      const appliances: InputAppliance[] = [
        { name: 'Bulb', wattage: 9, quantity: 1, dailyRuntimeHours: 5, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: false }
      ];
      const pContinuous = 9;
      const { kva, systemVoltage } = calculateInverterSize(appliances, pContinuous);
      
      expect(kva).toBe(1.5);
      expect(systemVoltage).toBe(12);
    });
  });

  describe('calculateBatteryBank', () => {
    it('Direct Load Runtime Sizing (backup-hours) sizes battery for actual runtime', () => {
      const appliances: InputAppliance[] = [
        { name: 'TV', wattage: 100, quantity: 1, dailyRuntimeHours: 4, isInductive: false, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: false },
        { name: 'Fridge', wattage: 200, quantity: 1, dailyRuntimeHours: 24, isInductive: true, loadType: 'essential', isIncludedInBackup: true, simultaneousStart: false }
      ];
      const flat = calculateBatteryBank(5200, 8, 48, 'lithium', 'flat-load', appliances);
      const backupHours = calculateBatteryBank(5200, 8, 48, 'lithium', 'backup-hours', appliances);
      
      expect(flat.reqAhRaw).toBeCloseTo(1733.33 / (48 * 0.8), 1);
      expect(backupHours.reqAhRaw).toBeCloseTo(2000 / (48 * 0.8), 1);
    });

    it('Battery DoD Test: Require ~1.6x more Ah for lead-acid (0.5) vs lithium (0.8) for same load', () => {
      // 2400 Wh essential per day.
      const essentialDailyWh = 2400;
      const backupHours = 12; // half day -> 1200 Wh required
      const systemVoltage = 24;

      const leadAcid = calculateBatteryBank(essentialDailyWh, backupHours, systemVoltage, 'lead-acid');
      const lithium = calculateBatteryBank(essentialDailyWh, backupHours, systemVoltage, 'lithium');

      expect(leadAcid.reqAhRaw).toBe(1200 / (24 * 0.5)); // 100 Ah
      expect(lithium.reqAhRaw).toBe(1200 / (24 * 0.8)); // 62.5 Ah

      expect(leadAcid.reqAhRaw / lithium.reqAhRaw).toBeCloseTo(1.6);
    });

    it('Multi-Day Test: Battery backup hours > 24 handles autonomy', () => {
      const essentialDailyWh = 2400;
      const backupHours = 48; // 2 days -> 4800 Wh required
      const systemVoltage = 48;
      const lithium = calculateBatteryBank(essentialDailyWh, backupHours, systemVoltage, 'lithium');
      expect(lithium.reqAhRaw).toBe(4800 / (48 * 0.8)); // 125 Ah
    });

    it('Tubular Array Test: 48V system with 12V batteries yields "4S1P" minimum config', () => {
      const leadAcid = calculateBatteryBank(2400, 12, 48, 'lead-acid');
      // 1200 Wh required. 48V * 0.5 = 24. Ah required = 50 Ah.
      // Unit is 12V 200Ah. SCount = 4. PCount = ceil(50/200) = 1.
      expect(leadAcid.configString).toBe('4S1P');
      expect(leadAcid.totalBatteries).toBe(4);
    });
  });

  describe('calculatePanelArray', () => {
    it('uses different charging overheads for different chemistries', () => {
      const lithium = calculatePanelArray(5000, 4.5, 'lithium');
      const leadAcid = calculatePanelArray(5000, 4.5, 'lead-acid');
      
      expect(lithium.reqArrayWp).toBeLessThan(leadAcid.reqArrayWp);
    });

    it('supports essential load sizing basis for budget/standard tiers', () => {
      const totalDailyWh = 10000;
      const essentialDailyWh = 4000;
      const totalBasis = calculatePanelArray(totalDailyWh, 4.5, 'lithium', 450, 'total', essentialDailyWh);
      const essentialBasis = calculatePanelArray(totalDailyWh, 4.5, 'lithium', 450, 'essential', essentialDailyWh);

      expect(essentialBasis.panelCount).toBeLessThan(totalBasis.panelCount);
      // etaCombined base = 0.612. Derating factor (default matches 'other') = 0.88 * 0.92 = 0.8096
      // etaCombined = 0.612 * 0.8096 = 0.4954752
      expect(essentialBasis.reqArrayWp).toBeCloseTo((4000 * 1.05) / (4.5 * 0.4954752), 1);
    });
  });

  describe('getGeneratorFuelRate', () => {
    it('Generator Fuel Lookup Test: 2.5kVA petrol uses table lookup (1.0 L/hr)', () => {
      expect(getGeneratorFuelRate(2.5, 'petrol')).toBe(1.0);
    });

    it('selects new lookup ratings like 1.0kVA, 6.5kVA, 25kVA correctly', () => {
      expect(getGeneratorFuelRate(1.0, 'petrol')).toBe(0.45);
      expect(getGeneratorFuelRate(6.5, 'diesel')).toBe(1.7);
      expect(getGeneratorFuelRate(25, 'diesel')).toBe(5.8);
    });

    it('Generator Missing Test: gen_capacity_kva = 6 selects nearest table entry (6.5)', () => {
      expect(getGeneratorFuelRate(6, 'petrol')).toBe(2.2);
      // |6 - 6.5| = 0.5 (closest)
      // |6 - 5| = 1.0
    });

    it('throws error if fuel type is not supported for the closest entry', () => {
      // 1.5 kVA has no diesel in the table
      expect(() => getGeneratorFuelRate(1.5, 'diesel')).toThrowError('Unsupported configuration');
    });
  });

  describe('calculateROI', () => {
    it('Zero Savings Test: Zero NEPA hours + zero generator hours -> Payback returns Infinity', () => {
      const roi = calculateROI(2000000, null, null, 1000);
      expect(roi.paybackMonths).toBe(Infinity);
      expect(roi.baseMonthlySavings).toBeLessThanOrEqual(0);
    });

    it('Calculates normal payback months correctly with degradation', () => {
      const genInputs: import('./calculations').GeneratorInputs = {
        fuelType: 'petrol',
        capacityKva: 2.5,
        dailyHours: 6,
        fuelPricePerLiter: 750,
      };
      
      const gridInputs: import('./calculations').GridInputs = {
        dailyHours: 8,
        tariffPerKwh: 225
      };

      const roi = calculateROI(3000000, genInputs, gridInputs, 4800);
      
      // Fuel rate for 2.5 petrol is 1.0. 
      // Fuel cost = 6 * 1.0 * 750 * 30.4 = 136,800
      // Maintenance = (6 * 30.4 / 100) * 6000 = 10,944
      // Gen Cost = 147,744
      
      // Grid Cost = (4800/24/1000) * 8 * 225 * 30.4 = 0.2 * 8 * 225 * 30.4 = 10,944
      
      // Solar O&M = 3000000 * 0.01 / 12 = 2,500
      
      // Base savings = 147,744 + 10,944 - 2,500 = 156,188
      
      // Without degradation, payback = 3000000 / 156188 = ~19.2 months
      // With degradation, should be slightly more than 19.2 months
      
      expect(roi.paybackMonths).toBeGreaterThan(19);
      expect(roi.paybackMonths).toBeLessThan(21);
      expect(roi.baseMonthlySavings).toBe(156188);
    });

    it('Respects custom serviceCostPerEvent correctly', () => {
      const genInputs: import('./calculations').GeneratorInputs = {
        fuelType: 'petrol',
        capacityKva: 2.5,
        dailyHours: 6,
        fuelPricePerLiter: 750,
        serviceCostPerEvent: 15000 // Custom: ₦15,000 instead of default ₦6,000
      };

      const gridInputs: import('./calculations').GridInputs = {
        dailyHours: 8,
        tariffPerKwh: 225
      };

      const roi = calculateROI(3000000, genInputs, gridInputs, 4800);
      
      // Fuel rate for 2.5 petrol is 1.0. 
      // Fuel cost = 6 * 1.0 * 750 * 30.4 = 136,800
      // Maintenance = (6 * 30.4 / 100) * 15000 = 27,360
      // Gen Cost = 164,160
      
      // Grid Cost = (4800/24/1000) * 8 * 225 * 30.4 = 0.2 * 8 * 225 * 30.4 = 10,944
      
      // Solar O&M = 3000000 * 0.01 / 12 = 2,500
      
      // Base savings = 164,160 + 10,944 - 2,500 = 172,604
      
      expect(roi.baseMonthlySavings).toBe(172604);
    });

    it('Calculates payback using actual billing entries as override', () => {
      const genInputs: import('./calculations').GeneratorInputs = {
        fuelType: 'petrol',
        capacityKva: 2.5,
        dailyHours: 6,
        fuelPricePerLiter: 750,
      };
      
      const gridInputs: import('./calculations').GridInputs = {
        dailyHours: 8,
        tariffPerKwh: 225
      };

      const actualBilling = {
        monthlyGridBill: 15000,
        monthlyGenFuel: 80000,
        monthlyGenMaint: 10000
      };

      const roi = calculateROI(3000000, genInputs, gridInputs, 4800, actualBilling);
      
      // With actualBilling override:
      // genMonthlyCost = 80,000 + 10,000 = 90,000
      // gridMonthlyCost = 15,000
      // Solar O&M = 3,000,000 * 0.01 / 12 = 2,500
      // Base savings = 90,000 + 15,000 - 2,500 = 102,500
      
      expect(roi.genMonthlyCost).toBe(90000);
      expect(roi.gridMonthlyCost).toBe(15000);
      expect(roi.baseMonthlySavings).toBe(102500);
      expect(roi.paybackMonths).toBeGreaterThan(28); // 3000000 / 102500 is ~29.2 without degradation, which means slightly more with degradation
      expect(roi.paybackMonths).toBeLessThan(31);
    });
  });

  describe('generateWhatsAppComparison', () => {
    it('generates the correct string', () => {
      const tiers: import('./calculations').TierSummary[] = [
        {
          tier: 'budget',
          inverterKva: 1.5,
          batteryConfig: '1S1P',
          batteryType: 'Lead-Acid',
          panelCount: 2,
          panelWp: 450,
          price: 1500000,
          payback: 24,
          summary: 'Budget Option'
        }
      ];
      const msg = generateWhatsAppComparison('John Doe', tiers);
      expect(msg).toContain('*BUDGET TIER:* ₦1,500,000');
      expect(msg).toContain('24mo payback');
    });
  });
});
