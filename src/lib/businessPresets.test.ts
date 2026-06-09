import { describe, it, expect } from 'vitest';
import {
  BUSINESS_PRESETS,
  mapTemplateToEstimator,
  mapTemplateToWizard
} from './businessPresets';

describe('businessPresets mappers', () => {
  const smallOfficeTemplate = BUSINESS_PRESETS.find(t => t.id === 'office')!;
  const clinicTemplate = BUSINESS_PRESETS.find(t => t.id === 'clinic')!;

  it('small office template exists and is correct', () => {
    expect(smallOfficeTemplate).toBeDefined();
    expect(smallOfficeTemplate.label).toBe('Small Office');
    expect(smallOfficeTemplate.suggestedBackupHours).toBe(9);
  });

  it('contains all 6 templates with correct attributes', () => {
    expect(BUSINESS_PRESETS.length).toBe(6);
    BUSINESS_PRESETS.forEach(template => {
      expect(template.id).toBeDefined();
      expect(template.label).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.suggestedBackupHours).toBeGreaterThan(0);
      expect(template.appliances.length).toBeGreaterThan(0);
      expect(template.confidence).toMatch(/High|Medium/);
    });
  });

  describe('mapTemplateToEstimator', () => {
    it('correctly maps Small Office template', () => {
      const estimatorQty = mapTemplateToEstimator(smallOfficeTemplate);
      
      expect(estimatorQty.led_lights).toBe(12);
      expect(estimatorQty.standing_fans).toBe(2);
      expect(estimatorQty.inverter_ac).toBe(1);
      expect(estimatorQty.standard_fridge).toBe(1);
      expect(estimatorQty.led_tv).toBe(1);
      expect(estimatorQty.laptops).toBe(8);
      expect(estimatorQty.microwave).toBe(1);
      
      // Heavy loads are present, but deep freezer is 0
      expect(estimatorQty.deep_freezer).toBe(0);
      expect(estimatorQty.standard_ac).toBe(0);
      expect(estimatorQty.water_pump).toBe(0);
    });

    it('gracefully handles and ignores clinic appliances not in estimator (like wifi_router, cctv_dvr)', () => {
      const estimatorQty = mapTemplateToEstimator(clinicTemplate);
      
      // Check that standard items exist
      expect(estimatorQty.led_lights).toBe(15);
      expect(estimatorQty.standing_fans).toBe(4);
      expect(estimatorQty.inverter_ac).toBe(1);
      expect(estimatorQty.deep_freezer).toBe(1);
      expect(estimatorQty.standard_fridge).toBe(2);
      expect(estimatorQty.laptops).toBe(3);
      expect(estimatorQty.water_pump).toBe(1);
      
      // E.g. cctv_dvr and wifi_router are clinic appliances, but not present in the estimator
      // keys. Verify they are NOT included.
      expect((estimatorQty as any).cctv_dvr).toBeUndefined();
      expect((estimatorQty as any).wifi_router).toBeUndefined();
    });
  });

  describe('mapTemplateToWizard', () => {
    it('correctly maps Small Office template to wizard DB IDs', () => {
      const wizardLoads = mapTemplateToWizard(smallOfficeTemplate);
      
      // AC -> '1'
      expect(wizardLoads['1']).toEqual({ qty: 1, hours: 8 });
      // Standing fan -> '2'
      expect(wizardLoads['2']).toEqual({ qty: 2, hours: 8 });
      // Fridge -> '4'
      expect(wizardLoads['4']).toEqual({ qty: 1, hours: 9 });
      // TV -> '5'
      expect(wizardLoads['5']).toEqual({ qty: 1, hours: 3 });
      // Wi-Fi router -> '6'
      expect(wizardLoads['6']).toEqual({ qty: 1, hours: 12 });
      // LED Bulbs -> '7'
      expect(wizardLoads['7']).toEqual({ qty: 12, hours: 9 });
      // Laptop -> '8'
      expect(wizardLoads['8']).toEqual({ qty: 8, hours: 8 });
      // Microwave -> '10'
      expect(wizardLoads['10']).toEqual({ qty: 1, hours: 0.5 });
      // CCTV -> '12'
      expect(wizardLoads['12']).toEqual({ qty: 1, hours: 24 });
      
      // Freezers / Pumps should be 0, but have safe default hours
      expect(wizardLoads['3'].qty).toBe(0);
      expect(wizardLoads['9'].qty).toBe(0);
    });

    it('correctly maps Clinic template', () => {
      const wizardLoads = mapTemplateToWizard(clinicTemplate);
      
      expect(wizardLoads['1']).toEqual({ qty: 1, hours: 24 });
      expect(wizardLoads['2']).toEqual({ qty: 4, hours: 24 });
      expect(wizardLoads['3']).toEqual({ qty: 1, hours: 24 });
      expect(wizardLoads['4']).toEqual({ qty: 2, hours: 24 });
      expect(wizardLoads['5']).toEqual({ qty: 1, hours: 12 });
      expect(wizardLoads['6']).toEqual({ qty: 1, hours: 24 });
      expect(wizardLoads['7']).toEqual({ qty: 15, hours: 24 });
      expect(wizardLoads['8']).toEqual({ qty: 3, hours: 12 });
      expect(wizardLoads['9']).toEqual({ qty: 1, hours: 2 });
      expect(wizardLoads['10']).toEqual({ qty: 1, hours: 0.5 });
      expect(wizardLoads['12']).toEqual({ qty: 1, hours: 24 });
    });
  });
});
