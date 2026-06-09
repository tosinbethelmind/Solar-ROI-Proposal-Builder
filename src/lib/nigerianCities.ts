/**
 * Nigerian city configuration for regional compliance and tariff data.
 * Used by the estimator city selector (B3).
 *
 * Data sources: NERC tariff orders, DISCO service territories.
 * Update ₦/kWh rates as NERC revises tariff orders.
 */

export interface NigerianCity {
  id: string;
  name: string;
  state: string;
  disco: string;
  discoFull: string;
  tariffBand: string;
  tariffRateNGN: number; // ₦ per kWh, Band A reference rate
  complianceNotes: string[];
  gridReliability: 'poor' | 'moderate' | 'good';
}

export const NIGERIAN_CITIES: NigerianCity[] = [
  {
    id: 'lagos',
    name: 'Lagos (Eko)',
    state: 'Lagos State',
    disco: 'EKEDC',
    discoFull: 'Eko Electricity Distribution Company',
    tariffBand: 'Band A',
    tariffRateNGN: 225,
    complianceNotes: [
      'LSEB certification required for grid-tied hybrid inverters',
      'Roof structural load must not exceed 15 kg/sqm (Lagos Building Control Agency)',
      'EPDM waterproofing required at all roof penetrations',
      'Landlord addendum required for removable solar assets on leased property',
      'Wind shear deflection angle must be configured below 15°',
    ],
    gridReliability: 'moderate',
  },
  {
    id: 'lagos-ikeja',
    name: 'Lagos (Ikeja)',
    state: 'Lagos State',
    disco: 'IKEDC',
    discoFull: 'Ikeja Electricity Distribution Company',
    tariffBand: 'Band A',
    tariffRateNGN: 225,
    complianceNotes: [
      'LSEB certification required for grid-tied hybrid inverters',
      'Roof structural load must not exceed 15 kg/sqm (Lagos Building Control Agency)',
      'EPDM waterproofing required at all roof penetrations',
      'Landlord addendum required for removable solar assets on leased property',
      'Wind shear deflection angle must be configured below 15°',
    ],
    gridReliability: 'moderate',
  },
  {
    id: 'abuja',
    name: 'Abuja',
    state: 'FCT',
    disco: 'AEDC',
    discoFull: 'Abuja Electricity Distribution Company',
    tariffBand: 'Band A',
    tariffRateNGN: 209,
    complianceNotes: [
      'NERC registration required for systems above 5kVA',
      'FCDA building permit required for permanent roof-mounted arrays',
      'Earthing and bonding per IEC 60364-7-712',
      'Landlord addendum required for leased residential properties',
    ],
    gridReliability: 'moderate',
  },
  {
    id: 'port-harcourt',
    name: 'Port Harcourt',
    state: 'Rivers State',
    disco: 'PHED',
    discoFull: 'Port Harcourt Electricity Distribution Company',
    tariffBand: 'Band B',
    tariffRateNGN: 195,
    complianceNotes: [
      'Rivers State Ministry of Environment approval for commercial systems',
      'Coastal humidity: use marine-grade mounting hardware (SS304 minimum)',
      'Salt-air corrosion protection required on all metal penetrations',
      'Landlord addendum required for leased residential properties',
    ],
    gridReliability: 'poor',
  },
  {
    id: 'kano',
    name: 'Kano',
    state: 'Kano State',
    disco: 'KEDCO',
    discoFull: 'Kano Electricity Distribution Company',
    tariffBand: 'Band B',
    tariffRateNGN: 185,
    complianceNotes: [
      'Harmattan dust: quarterly panel cleaning recommended',
      'High irradiance region (5.5+ peak sun hours) — excellent solar yield',
      'Flat-roof mounting common: use ballast frame to avoid structural penetration',
      'NERC registration required for systems above 5kVA',
    ],
    gridReliability: 'poor',
  },
  {
    id: 'ibadan',
    name: 'Ibadan',
    state: 'Oyo State',
    disco: 'IBEDC',
    discoFull: 'Ibadan Electricity Distribution Company',
    tariffBand: 'Band B',
    tariffRateNGN: 190,
    complianceNotes: [
      'IBEDC net metering pilot available in select areas — confirm eligibility',
      'Roof load: pitched corrugated iron common, verify purlin spacing before mounting',
      'Landlord addendum required for leased residential properties',
      'NERC registration required for systems above 5kVA',
    ],
    gridReliability: 'poor',
  },
  {
    id: 'enugu',
    name: 'Enugu',
    state: 'Enugu State',
    disco: 'EEDC',
    discoFull: 'Enugu Electricity Distribution Company',
    tariffBand: 'Band A',
    tariffRateNGN: 215,
    complianceNotes: [
      'NERC registration required for systems above 5kVA',
      'Landlord addendum required for leased residential properties',
      'Earthing and bonding per IEC 60364 standards',
    ],
    gridReliability: 'poor',
  },
  {
    id: 'benin',
    name: 'Benin',
    state: 'Edo State',
    disco: 'BEDC',
    discoFull: 'Benin Electricity Distribution Company',
    tariffBand: 'Band B',
    tariffRateNGN: 195,
    complianceNotes: [
      'NERC registration required for systems above 5kVA',
      'Landlord addendum required for leased residential properties',
    ],
    gridReliability: 'poor',
  },
  {
    id: 'jos',
    name: 'Jos',
    state: 'Plateau State',
    disco: 'JEDC',
    discoFull: 'Jos Electricity Distribution Company',
    tariffBand: 'Band B',
    tariffRateNGN: 190,
    complianceNotes: [
      'Harmattan dust: periodic panel cleaning recommended',
      'NERC registration required for systems above 5kVA',
    ],
    gridReliability: 'poor',
  },
  {
    id: 'kaduna',
    name: 'Kaduna',
    state: 'Kaduna State',
    disco: 'KAEDCO',
    discoFull: 'Kaduna Electricity Distribution Company',
    tariffBand: 'Band B',
    tariffRateNGN: 185,
    complianceNotes: [
      'Harmattan dust: periodic panel cleaning recommended',
      'High ambient temperatures: check ventilation for inverter sizing',
    ],
    gridReliability: 'poor',
  },
  {
    id: 'yola',
    name: 'Yola',
    state: 'Adamawa State',
    disco: 'YEDC',
    discoFull: 'Yola Electricity Distribution Company',
    tariffBand: 'Band B',
    tariffRateNGN: 188,
    complianceNotes: [
      'High solar irradiance region — excellent yield parameters',
      'NERC registration required for systems above 5kVA',
    ],
    gridReliability: 'poor',
  },
  {
    id: 'other',
    name: 'Other / Not Listed',
    state: 'Nigeria',
    disco: 'NERC-licensed DISCO',
    discoFull: 'Your local NERC-licensed distribution company',
    tariffBand: 'Varies',
    tariffRateNGN: 200,
    complianceNotes: [
      'Contact your local DISCO for applicable tariff band and grid-tie requirements',
      'NERC registration required for systems above 5kVA',
      'Landlord addendum recommended for leased properties',
    ],
    gridReliability: 'poor',
  },
];

export function getCityById(id: string): NigerianCity {
  return NIGERIAN_CITIES.find((c) => c.id === id) ?? NIGERIAN_CITIES[NIGERIAN_CITIES.length - 1];
}
