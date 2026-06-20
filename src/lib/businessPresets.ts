// Business Load Templates configuration for SolarQuotePro load calculators

export interface TemplateAppliance {
  applianceKey: string;
  quantity: number;
  runtimeHours: number;
  priorityClass: 'critical' | 'essential' | 'comfort' | 'optional';
  notes?: string;
}

export interface BusinessLoadTemplate {
  id: string;
  label: string;
  description: string;
  segment: 'residential' | 'commercial';
  summaryBadges: string[];
  suggestedBackupHours: number;
  appliances: TemplateAppliance[];
  warning?: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export const BUSINESS_PRESETS: BusinessLoadTemplate[] = [
  {
    id: 'residential',
    label: 'Residential / Home',
    description: 'Standard home with lighting, TV, fridge, fans, water pump and general electronics.',
    segment: 'residential',
    summaryBadges: ['10h backup standard', 'Essentials + refrigeration', 'Optional comfort backup'],
    suggestedBackupHours: 10,
    confidence: 'High',
    warning: 'Adjust based on actual occupancy, AC usage patterns, and heavy load runtimes.',
    appliances: [
      { applianceKey: 'led_lights', quantity: 6, runtimeHours: 8, priorityClass: 'essential', notes: 'Typical evening and bedtime lighting' },
      { applianceKey: 'standing_fans', quantity: 3, runtimeHours: 10, priorityClass: 'essential', notes: 'Continuous overnight ventilation' },
      { applianceKey: 'led_tv', quantity: 1, runtimeHours: 6, priorityClass: 'comfort', notes: 'Evening entertainment' },
      { applianceKey: 'laptops', quantity: 2, runtimeHours: 4, priorityClass: 'essential', notes: 'Work from home or charging' },
      { applianceKey: 'standard_fridge', quantity: 1, runtimeHours: 24, priorityClass: 'critical', notes: 'Continuous refrigeration for food safety' },
      { applianceKey: 'water_pump', quantity: 1, runtimeHours: 1, priorityClass: 'essential', notes: 'Run periodically to fill tanks' },
      { applianceKey: 'microwave', quantity: 1, runtimeHours: 0.5, priorityClass: 'optional', notes: 'Short high-surge bursts' },
      { applianceKey: 'dstv_decoder', quantity: 1, runtimeHours: 6, priorityClass: 'comfort', notes: 'Paired with entertainment' }
    ]
  },
  {
    id: 'office',
    label: 'Small Office',
    description: 'Optimized for day-time commercial operations: laptops, CCTV, Wi-Fi, server, lighting, and workspace cooling.',
    segment: 'commercial',
    summaryBadges: ['Daytime-focused', 'AC + office equipment', 'CCTV & Wi-Fi included'],
    suggestedBackupHours: 9,
    confidence: 'High',
    warning: 'Typically assumes daytime operations. Verify if servers or security systems need overnight backup.',
    appliances: [
      { applianceKey: 'led_lights', quantity: 12, runtimeHours: 9, priorityClass: 'essential', notes: 'Office space illumination' },
      { applianceKey: 'standing_fans', quantity: 2, runtimeHours: 8, priorityClass: 'essential', notes: 'Supplemental ventilation' },
      { applianceKey: 'inverter_ac', quantity: 1, runtimeHours: 8, priorityClass: 'comfort', notes: 'Climate control for office comfort' },
      { applianceKey: 'standard_fridge', quantity: 1, runtimeHours: 9, priorityClass: 'essential', notes: 'Office pantry fridge' },
      { applianceKey: 'led_tv', quantity: 1, runtimeHours: 3, priorityClass: 'optional', notes: 'Reception display/TV' },
      { applianceKey: 'wifi_router', quantity: 1, runtimeHours: 12, priorityClass: 'critical', notes: 'Business internet continuity' },
      { applianceKey: 'laptops', quantity: 8, runtimeHours: 8, priorityClass: 'critical', notes: 'Employee workstations' },
      { applianceKey: 'microwave', quantity: 1, runtimeHours: 0.5, priorityClass: 'optional', notes: 'Lunch heating pantry burst' },
      { applianceKey: 'cctv_dvr', quantity: 1, runtimeHours: 24, priorityClass: 'critical', notes: '24/7 security monitoring' }
    ]
  },
  {
    id: 'restaurant',
    label: 'Restaurant / Cafe',
    description: 'High refrigeration demand for food safety, ambiance lighting, cooling, TV/sound system and water pumping.',
    segment: 'commercial',
    summaryBadges: ['Cold storage heavy', 'AC + ambiance lighting', 'Continuous refrigeration'],
    suggestedBackupHours: 12,
    confidence: 'Medium',
    warning: 'Runtime assumptions vary widely based on freezer count, cooking equipment, and operating hours.',
    appliances: [
      { applianceKey: 'led_lights', quantity: 16, runtimeHours: 12, priorityClass: 'essential', notes: 'Ambiance and service floor lighting' },
      { applianceKey: 'standing_fans', quantity: 4, runtimeHours: 12, priorityClass: 'essential', notes: 'Guest comfort cooling' },
      { applianceKey: 'inverter_ac', quantity: 2, runtimeHours: 10, priorityClass: 'comfort', notes: 'Dining room climate control' },
      { applianceKey: 'deep_freezer', quantity: 2, runtimeHours: 24, priorityClass: 'critical', notes: 'Frozen ingredient storage' },
      { applianceKey: 'standard_fridge', quantity: 2, runtimeHours: 24, priorityClass: 'critical', notes: 'Fresh food preservation' },
      { applianceKey: 'led_tv', quantity: 2, runtimeHours: 12, priorityClass: 'comfort', notes: 'Entertainment displays' },
      { applianceKey: 'wifi_router', quantity: 1, runtimeHours: 15, priorityClass: 'essential', notes: 'Guest Wi-Fi and POS connection' },
      { applianceKey: 'laptops', quantity: 1, runtimeHours: 6, priorityClass: 'optional', notes: 'Manager back-office station' },
      { applianceKey: 'water_pump', quantity: 1, runtimeHours: 2, priorityClass: 'essential', notes: 'Frequent kitchen/cleaning supply' },
      { applianceKey: 'microwave', quantity: 1, runtimeHours: 1.5, priorityClass: 'comfort', notes: 'Preheating and warming' },
      { applianceKey: 'dstv_decoder', quantity: 1, runtimeHours: 12, priorityClass: 'comfort', notes: 'Paired with displays' },
      { applianceKey: 'cctv_dvr', quantity: 1, runtimeHours: 24, priorityClass: 'critical', notes: '24/7 commercial security' }
    ]
  },
  {
    id: 'retail',
    label: 'Retail Shop / Pharmacy',
    description: 'Focused on retail operations: product display lights, point of sale computers, CCTV, fridge and AC.',
    segment: 'commercial',
    summaryBadges: ['Product display lights', 'POS & cooling focus', 'Refrigeration backup'],
    suggestedBackupHours: 10,
    confidence: 'High',
    warning: 'Ensure pharmacy refrigeration (cold chain) is on critical circuits if storing vaccines.',
    appliances: [
      { applianceKey: 'led_lights', quantity: 15, runtimeHours: 10, priorityClass: 'essential', notes: 'Product display and store lights' },
      { applianceKey: 'standing_fans', quantity: 2, runtimeHours: 10, priorityClass: 'essential', notes: 'Supplemental ventilation' },
      { applianceKey: 'inverter_ac', quantity: 1, runtimeHours: 10, priorityClass: 'comfort', notes: 'Customer cooling comfort' },
      { applianceKey: 'deep_freezer', quantity: 1, runtimeHours: 24, priorityClass: 'critical', notes: 'Temperature-sensitive cold stock' },
      { applianceKey: 'standard_fridge', quantity: 1, runtimeHours: 24, priorityClass: 'critical', notes: 'Pantry/cold goods preservation' },
      { applianceKey: 'led_tv', quantity: 1, runtimeHours: 10, priorityClass: 'optional', notes: 'Promotional display' },
      { applianceKey: 'wifi_router', quantity: 1, runtimeHours: 12, priorityClass: 'essential', notes: 'Internet and payment terminal link' },
      { applianceKey: 'laptops', quantity: 2, runtimeHours: 10, priorityClass: 'critical', notes: 'POS systems and billing' },
      { applianceKey: 'cctv_dvr', quantity: 1, runtimeHours: 24, priorityClass: 'critical', notes: 'Store security' }
    ]
  },
  {
    id: 'salon',
    label: 'Barber Shop / Salon',
    description: 'Custom configurations for clippers, hair dryers, lighting, sound system, television, and client comfort.',
    segment: 'commercial',
    summaryBadges: ['Clippers & comfort AC', 'Ambiance music/TV', 'Water pump critical'],
    suggestedBackupHours: 10,
    confidence: 'Medium',
    warning: 'Verify high-surge loads like hair dryers are isolated or excluded from battery backup if needed.',
    appliances: [
      { applianceKey: 'led_lights', quantity: 8, runtimeHours: 10, priorityClass: 'essential', notes: 'Work station lighting' },
      { applianceKey: 'standing_fans', quantity: 2, runtimeHours: 10, priorityClass: 'essential', notes: 'Air circulation' },
      { applianceKey: 'inverter_ac', quantity: 1, runtimeHours: 9, priorityClass: 'comfort', notes: 'Climate control for salon' },
      { applianceKey: 'standard_fridge', quantity: 1, runtimeHours: 10, priorityClass: 'essential', notes: 'Beverage fridge for clients' },
      { applianceKey: 'led_tv', quantity: 1, runtimeHours: 10, priorityClass: 'comfort', notes: 'Client entertainment display' },
      { applianceKey: 'wifi_router', quantity: 1, runtimeHours: 12, priorityClass: 'essential', notes: 'Guest Wi-Fi' },
      { applianceKey: 'laptops', quantity: 1, runtimeHours: 8, priorityClass: 'essential', notes: 'Reception and billing station' },
      { applianceKey: 'water_pump', quantity: 1, runtimeHours: 1, priorityClass: 'critical', notes: 'High demand water pump for hair washing' },
      { applianceKey: 'dstv_decoder', quantity: 1, runtimeHours: 10, priorityClass: 'comfort', notes: 'Paired with TV' },
      { applianceKey: 'cctv_dvr', quantity: 1, runtimeHours: 24, priorityClass: 'critical', notes: '24/7 security' }
    ]
  },
  {
    id: 'clinic',
    label: 'Clinic / Small Medical Center',
    description: 'High reliability 24/7 profile: backup for cold-chain vaccine storage, continuous medical office, ward lighting, and essential cooling.',
    segment: 'commercial',
    summaryBadges: ['24/7 critical backup', 'Vaccine refrigeration', 'Outpatient cooling'],
    suggestedBackupHours: 24,
    confidence: 'High',
    warning: 'Starting assumption for a small outpatient clinic. Verify cold-chain loads, overnight cooling, and critical circuits before final sizing.',
    appliances: [
      { applianceKey: 'led_lights', quantity: 15, runtimeHours: 24, priorityClass: 'critical', notes: 'Continuous ward and clinic lighting' },
      { applianceKey: 'standing_fans', quantity: 4, runtimeHours: 24, priorityClass: 'critical', notes: 'Continuous ward ventilation' },
      { applianceKey: 'inverter_ac', quantity: 1, runtimeHours: 24, priorityClass: 'essential', notes: 'Lab or operating room climate control' },
      { applianceKey: 'deep_freezer', quantity: 1, runtimeHours: 24, priorityClass: 'critical', notes: 'Strict vaccine storage deep freezer' },
      { applianceKey: 'standard_fridge', quantity: 2, runtimeHours: 24, priorityClass: 'critical', notes: 'Medical fridge and pharmacy cooling' },
      { applianceKey: 'led_tv', quantity: 1, runtimeHours: 12, priorityClass: 'optional', notes: 'Waiting area TV' },
      { applianceKey: 'wifi_router', quantity: 1, runtimeHours: 24, priorityClass: 'critical', notes: 'Continuous connectivity for electronic health records' },
      { applianceKey: 'laptops', quantity: 3, runtimeHours: 12, priorityClass: 'essential', notes: 'Consulting room and reception PCs' },
      { applianceKey: 'water_pump', quantity: 1, runtimeHours: 2, priorityClass: 'critical', notes: 'Sanitation water supply' },
      { applianceKey: 'microwave', quantity: 1, runtimeHours: 0.5, priorityClass: 'optional', notes: 'Staff room microwave' },
      { applianceKey: 'cctv_dvr', quantity: 1, runtimeHours: 24, priorityClass: 'critical', notes: 'Security' }
    ]
  }
];

const ESTIMATOR_KEYS = [
  'led_lights', 'standing_fans', 'led_tv', 'laptops',
  'standard_fridge', 'deep_freezer', 'inverter_ac',
  'standard_ac', 'water_pump', 'microwave'
];

const WIZARD_KEY_MAP: Record<string, string> = {
  inverter_ac: '1',
  standing_fans: '2',
  deep_freezer: '3',
  standard_fridge: '4',
  led_tv: '5',
  wifi_router: '6',
  led_lights: '7',
  laptops: '8',
  water_pump: '9',
  microwave: '10',
  dstv_decoder: '11',
  cctv_dvr: '12',
  standard_ac: '1', // fallback to split AC slot
};

/**
 * Maps a canonical template to a record of estimator appliance quantities.
 * Gracefully ignores appliances that aren't present in the estimator.
 */
export function mapTemplateToEstimator(template: BusinessLoadTemplate): Record<string, number> {
  const quantities: Record<string, number> = {};

  // Initialize all estimator keys to 0
  ESTIMATOR_KEYS.forEach(key => {
    quantities[key] = 0;
  });

  template.appliances.forEach(app => {
    if (ESTIMATOR_KEYS.includes(app.applianceKey)) {
      quantities[app.applianceKey] = app.quantity;
    }
  });

  return quantities;
}

/**
 * Maps a canonical template to a record of wizard appliance quantities and runtime hours.
 * Uses a mapping from abstract applianceKey to database ID string ('1' to '12').
 */
export function mapTemplateToWizard(
  template: BusinessLoadTemplate
): Record<string, { qty: number; hours: number }> {
  const wizardLoads: Record<string, { qty: number; hours: number }> = {};

  // Initialize defaults for the 12 keys
  for (let i = 1; i <= 12; i++) {
    wizardLoads[i.toString()] = { qty: 0, hours: 4 }; // unit-safe default hours
  }

  template.appliances.forEach(app => {
    const wizardId = WIZARD_KEY_MAP[app.applianceKey];
    if (wizardId) {
      wizardLoads[wizardId] = {
        qty: app.quantity,
        hours: app.runtimeHours
      };
    }
  });

  return wizardLoads;
}
