'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InstallerProfile, ServiceArea, ListingSubscription, HomeownerLead, LeadAssignment } from '@/types/marketplace';

// ═══ Pre-loaded Mock Installers in Nigeria ═══
const MOCK_INSTALLERS: InstallerProfile[] = [
  {
    id: 'inst-1',
    user_id: 'user-inst-1',
    business_name: 'Lekki Clean Energy Ltd',
    logo_url: '',
    description: 'Premier residential and commercial solar installations specializing in hybrid inverter setups, Lithium-ion high-capacity storage, and structural wind permitting in coastal Lagos.',
    specialty_tags: ['Lithium Storage', 'Residential Hybrid', 'LSEB Certified'],
    brands_handled: ['Sunsynk', 'Victron Energy', 'Must Inverters', 'Felicity Solar'],
    is_verified: true,
    rating_count: 24,
    rating_average: 4.8,
    response_speed: 'Usually under 2 hours',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-2',
    user_id: 'user-inst-2',
    business_name: 'Gbagada Solar Systems Ltd',
    logo_url: '',
    description: 'Expert solar services focused on reducing monthly generator diesel expenditures. Offering customized grid-tie and net-metering arrays for residential estates in Gbagada, Ikeja, and Surulere.',
    specialty_tags: ['Diesel Offsets', 'Net Metering', 'Residential Hybrid'],
    brands_handled: ['Growatt', 'Must Inverters', 'Deye', 'Jinko Solar'],
    is_verified: true,
    rating_count: 15,
    rating_average: 4.6,
    response_speed: 'Usually under 4 hours',
    contact_preference: 'Phone Call',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-3',
    user_id: 'user-inst-3',
    business_name: 'Eko Solar Tech Solutions',
    logo_url: '',
    description: 'Nigeria-focused solar integration agency specializing in premium corporate grid-tied systems and advanced roof weight deflection permitting in Lagos Island & Victoria Island.',
    specialty_tags: ['Commercial Grid-Tie', 'Premium Inverters', 'Wind Deflection'],
    brands_handled: ['Victron Energy', 'SMA Inverters', 'Fronius', 'Canadian Solar'],
    is_verified: true,
    rating_count: 32,
    rating_average: 4.9,
    response_speed: 'Usually under 1 hour',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-4',
    user_id: 'user-inst-4',
    business_name: 'Ajao Estate Energy Partners',
    logo_url: '',
    description: 'Affordable, premium-grade household battery backups and solar panel retrofits. Committed to making stable clean power accessible in Lagos mainland.',
    specialty_tags: ['Battery Upgrades', 'Affordable Home Solar', 'Gel Batteries'],
    brands_handled: ['Felicity Solar', 'Luminous', 'Must Inverters'],
    is_verified: false,
    rating_count: 5,
    rating_average: 4.2,
    response_speed: 'Usually within 24 hours',
    contact_preference: 'Email',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-5',
    user_id: 'user-inst-5',
    business_name: 'Arnergy Solar',
    logo_url: '',
    description: 'Tech-driven Solar-as-a-Service provider using IoT-enabled smart energy monitoring systems. Specializes in solar+storage bundles for homes, businesses, hospitals, and schools across Nigeria — with real-time remote monitoring via the Arnergy app.',
    specialty_tags: ['Solar-as-a-Service', 'IoT Monitoring', 'Commercial Storage', 'Pay-As-You-Go'],
    brands_handled: ['Arnergy Smart Packs', 'LG Energy', 'Victron Energy', 'Pylontech'],
    is_verified: true,
    rating_count: 61,
    rating_average: 4.8,
    response_speed: 'Usually under 2 hours',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-6',
    user_id: 'user-inst-6',
    business_name: 'SolarKobo',
    logo_url: '',
    description: 'Lagos-based renewable energy company offering full solar installations, inverter-only setups, solar water pumps, solar security systems, and maintenance contracts. Known for transparent pricing and detailed energy audits before any installation.',
    specialty_tags: ['Solar Water Pumps', 'Inverter Systems', 'Energy Audits', 'Residential Hybrid'],
    brands_handled: ['Luminous', 'Felicity Solar', 'Canadian Solar', 'Deye'],
    is_verified: true,
    rating_count: 44,
    rating_average: 4.7,
    response_speed: 'Usually under 3 hours',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-7',
    user_id: 'user-inst-7',
    business_name: 'Auxano Solar Nigeria',
    logo_url: '',
    description: 'Pioneer of local solar panel manufacturing and assembly in Nigeria. Offers solar panel supply, inverter systems, street lighting, solar water pumps, and a certified solar training academy. Ideal for installers seeking locally-sourced components.',
    specialty_tags: ['Local Manufacturing', 'Solar Training', 'Street Lighting', 'Wholesale Supply'],
    brands_handled: ['Auxano Panels', 'Growatt', 'Jinko Solar', 'Trina Solar'],
    is_verified: true,
    rating_count: 38,
    rating_average: 4.6,
    response_speed: 'Usually under 4 hours',
    contact_preference: 'Phone Call',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-8',
    user_id: 'user-inst-8',
    business_name: 'Gennex Technologies',
    logo_url: '',
    description: 'Well-established firm with deep expertise in both on-grid and off-grid solar solutions. Handles large-scale commercial and industrial projects across Lagos, Abuja, and Port Harcourt — including solar-powered borehole pumping systems and grid-interconnected arrays.',
    specialty_tags: ['On-Grid Systems', 'Off-Grid Industrial', 'Solar Borehole', 'Commercial Grid-Tie'],
    brands_handled: ['SMA Inverters', 'Fronius', 'Canadian Solar', 'BYD Batteries'],
    is_verified: true,
    rating_count: 53,
    rating_average: 4.9,
    response_speed: 'Usually under 2 hours',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-9',
    user_id: 'user-inst-9',
    business_name: 'Rubitec Solar',
    logo_url: '',
    description: 'Major player in Nigerian solar manufacturing and mini-grid development. Specializes in industrial-scale solar farms, mini-grid deployment for rural communities, and EPC (Engineering, Procurement, Construction) contracts for public institutions.',
    specialty_tags: ['Mini-Grid Development', 'Solar Farms', 'EPC Contracts', 'Rural Electrification'],
    brands_handled: ['JA Solar', 'Huawei Inverters', 'CATL Batteries', 'Trina Solar'],
    is_verified: true,
    rating_count: 29,
    rating_average: 4.7,
    response_speed: 'Usually under 4 hours',
    contact_preference: 'Email',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-10',
    user_id: 'user-inst-10',
    business_name: 'Solar Depot Nigeria',
    logo_url: '',
    description: 'Leading solar component supplier and installer with a strong Lagos showroom presence. Provides wide-ranging solar products, system design, and turnkey installation for homes and SMEs. A go-to destination for installers sourcing quality panels, inverters, and batteries.',
    specialty_tags: ['Component Supply', 'Turnkey Installation', 'SME Solar', 'System Design'],
    brands_handled: ['Victron Energy', 'Growatt', 'Felicity Solar', 'Sunsynk', 'Jinko Solar'],
    is_verified: true,
    rating_count: 72,
    rating_average: 4.8,
    response_speed: 'Usually under 2 hours',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-11',
    user_id: 'user-inst-11',
    business_name: 'Solarlify Nigeria',
    logo_url: '',
    description: 'Customer-centric solar installer offering free maintenance packages and educational resources for system owners. Known for honest energy assessments, post-installation support, and helping Nigerian homeowners understand their solar systems better.',
    specialty_tags: ['Free Maintenance', 'Customer Education', 'Residential Hybrid', 'Affordable Home Solar'],
    brands_handled: ['Deye', 'Must Inverters', 'Luminous', 'Canadian Solar'],
    is_verified: true,
    rating_count: 33,
    rating_average: 4.6,
    response_speed: 'Usually under 3 hours',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-12',
    user_id: 'user-inst-12',
    business_name: 'Lumos Nigeria',
    logo_url: '',
    description: 'Widely recognized pioneer of Pay-As-You-Go household solar subscription services in Nigeria. Specializes in entry-level solar home systems with mobile payment integration, serving both urban and peri-urban households who cannot afford large upfront costs.',
    specialty_tags: ['Pay-As-You-Go', 'Solar Home Systems', 'Mobile Payments', 'Affordable Home Solar'],
    brands_handled: ['Lumos Classic', 'Lumos Mobile Solar', 'Lumos Max'],
    is_verified: true,
    rating_count: 88,
    rating_average: 4.5,
    response_speed: 'Usually under 24 hours',
    contact_preference: 'Phone Call',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-13',
    user_id: 'user-inst-13',
    business_name: 'GVE Projects Ltd',
    logo_url: '',
    description: 'Specialist in off-grid solar power, rural electrification, and smart energy systems. GVE has deployed solar mini-grids serving thousands of rural Nigerian households. Also provides solar EPC services for commercial buildings and healthcare facilities.',
    specialty_tags: ['Off-Grid Solar', 'Rural Electrification', 'Mini-Grids', 'Healthcare Solar'],
    brands_handled: ['SMA Inverters', 'Victron Energy', 'JA Solar', 'BYD Batteries'],
    is_verified: true,
    rating_count: 41,
    rating_average: 4.8,
    response_speed: 'Usually under 4 hours',
    contact_preference: 'Email',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-14',
    user_id: 'user-inst-14',
    business_name: 'Astrum Energy Nigeria',
    logo_url: '',
    description: 'Premium solar solutions provider serving high-net-worth residential estates and commercial towers in Lagos and Abuja. Specializes in aesthetically designed rooftop installations, premium LFP battery storage systems, and 24/7 remote monitoring dashboards.',
    specialty_tags: ['Premium Residential', 'LFP Batteries', 'Remote Monitoring', 'Commercial Grid-Tie'],
    brands_handled: ['Tesla Powerwall', 'Fronius', 'Canadian Solar', 'Pylontech', 'SMA Inverters'],
    is_verified: true,
    rating_count: 27,
    rating_average: 4.9,
    response_speed: 'Usually under 1 hour',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-15',
    user_id: 'user-inst-15',
    business_name: 'JP2 Solar Power',
    logo_url: '',
    description: 'Prominent Lekki-based solar provider renowned for premium panel selection, hybrid inverter integration, and exceptional after-sales support. Serves high-density residential estates across Lekki Phase 1, Chevron, and Ajah corridors.',
    specialty_tags: ['Residential Hybrid', 'Premium Inverters', 'After-Sales Support', 'LSEB Certified'],
    brands_handled: ['Sunsynk', 'Victron Energy', 'Canadian Solar', 'Trina Solar'],
    is_verified: true,
    rating_count: 49,
    rating_average: 4.8,
    response_speed: 'Usually under 2 hours',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-16',
    user_id: 'user-inst-16',
    business_name: 'PVPRO Solar Energy',
    logo_url: '',
    description: 'Ikeja-focused solar specialist known for reliable hybrid inverter systems and lithium battery installations for homes and small businesses. Offers detailed load analysis, NERC-compliant designs, and prompt field support across Lagos mainland.',
    specialty_tags: ['Lithium Storage', 'Ikeja Specialist', 'Load Analysis', 'Residential Hybrid'],
    brands_handled: ['Growatt', 'Deye', 'Jinko Solar', 'Pylontech'],
    is_verified: true,
    rating_count: 36,
    rating_average: 4.7,
    response_speed: 'Usually under 3 hours',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-17',
    user_id: 'user-inst-17',
    business_name: 'Felicity Solar Nigeria',
    logo_url: '',
    description: 'Leading importer and installer of Felicity-branded solar inverters, batteries, and panels with established Ikeja showrooms. Popular among Lagos installers for affordable, quality wholesale procurement and consumer direct installations.',
    specialty_tags: ['Wholesale Supply', 'Component Supply', 'Inverter Systems', 'Affordable Home Solar'],
    brands_handled: ['Felicity Solar', 'Felicity Lithium', 'Luminous', 'Jinko Solar'],
    is_verified: true,
    rating_count: 58,
    rating_average: 4.6,
    response_speed: 'Usually under 4 hours',
    contact_preference: 'Phone Call',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-18',
    user_id: 'user-inst-18',
    business_name: 'Daystar Power',
    logo_url: '',
    description: 'Nigeria\u2019s foremost commercial and industrial solar-as-a-service provider. Delivers hybrid solar + gas + battery Power-as-a-Service (PaaS) to factories, manufacturers, and large enterprises — eliminating diesel dependency without capital expenditure.',
    specialty_tags: ['Industrial Solar', 'Power-as-a-Service', 'Commercial Grid-Tie', 'Diesel Offsets'],
    brands_handled: ['SMA Inverters', 'BYD Batteries', 'JA Solar', 'Huawei Inverters'],
    is_verified: true,
    rating_count: 43,
    rating_average: 4.9,
    response_speed: 'Usually under 2 hours',
    contact_preference: 'Email',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-19',
    user_id: 'user-inst-19',
    business_name: 'Solynta Energy',
    logo_url: '',
    description: 'Residential-focused solar subscription company helping Lagos homeowners eliminate generator noise with 1kW–5kW solar-as-a-service packages. Monthly subscription model removes upfront cost barriers for middle-income households.',
    specialty_tags: ['Solar-as-a-Service', 'Subscription Model', 'Generator Replacement', 'Affordable Home Solar'],
    brands_handled: ['Solynta Smart Packs', 'Must Inverters', 'Canadian Solar', 'Felicity Solar'],
    is_verified: true,
    rating_count: 31,
    rating_average: 4.5,
    response_speed: 'Usually under 3 hours',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-20',
    user_id: 'user-inst-20',
    business_name: 'Simba Solar Nigeria',
    logo_url: '',
    description: 'A division of the Simba Group providing solar electrification for residential and commercial clients. Runs Nigeria\u2019s largest independent solar Installer Partner Program, training and equipping hundreds of field technicians across Lagos and beyond.',
    specialty_tags: ['Installer Training', 'Residential Hybrid', 'SME Solar', 'Nationwide Coverage'],
    brands_handled: ['Simba Panels', 'Growatt', 'Deye', 'Luminous'],
    is_verified: true,
    rating_count: 67,
    rating_average: 4.6,
    response_speed: 'Usually under 4 hours',
    contact_preference: 'Phone Call',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-21',
    user_id: 'user-inst-21',
    business_name: 'Solar Haven Nigeria',
    logo_url: '',
    description: 'Ikoyi and Victoria Island solar specialist catering to high-end homeowners and diplomatic residences. Offers bespoke rooftop aesthetic designs, silent hybrid systems, and dedicated concierge-level after-sales maintenance packages.',
    specialty_tags: ['Luxury Residential', 'Silent Hybrid Systems', 'Bespoke Design', 'Premium Inverters'],
    brands_handled: ['Victron Energy', 'SMA Inverters', 'Canadian Solar', 'Pylontech'],
    is_verified: true,
    rating_count: 22,
    rating_average: 4.9,
    response_speed: 'Usually under 1 hour',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-22',
    user_id: 'user-inst-22',
    business_name: 'Solarity Plus Limited',
    logo_url: '',
    description: 'Consistently rated among Nigeria\u2019s top solar providers for 2025/2026. Serves both residential and nationwide commercial clients with tailored hybrid systems, NERC-compliant permit documentation, and full generator decommissioning packages.',
    specialty_tags: ['Residential Hybrid', 'LSEB Certified', 'Generator Offsets', 'Nationwide Coverage'],
    brands_handled: ['Sunsynk', 'Deye', 'Trina Solar', 'Pylontech'],
    is_verified: true,
    rating_count: 54,
    rating_average: 4.8,
    response_speed: 'Usually under 2 hours',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-23',
    user_id: 'user-inst-23',
    business_name: 'Greenfield Energy Solutions',
    logo_url: '',
    description: 'Comprehensive solar and renewable energy provider offering end-to-end installations, equipment supply, and post-installation maintenance for residential, commercial, and industrial clients across Lagos State.',
    specialty_tags: ['Turnkey Installation', 'Maintenance Contracts', 'Commercial Grid-Tie', 'System Design'],
    brands_handled: ['Fronius', 'JA Solar', 'Growatt', 'BYD Batteries'],
    is_verified: true,
    rating_count: 28,
    rating_average: 4.6,
    response_speed: 'Usually under 4 hours',
    contact_preference: 'Email',
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-24',
    user_id: 'user-inst-24',
    business_name: 'Solar Valley Ltd',
    logo_url: '',
    description: 'Lagos-based installer specializing in medium-capacity inverter and solar panel systems for residential estates, schools, and small businesses. Known for fast deployment timelines, competitive pricing, and reliable post-installation monitoring.',
    specialty_tags: ['Inverter Systems', 'School Solar', 'SME Solar', 'Fast Deployment'],
    brands_handled: ['Must Inverters', 'Luminous', 'Jinko Solar', 'Felicity Solar'],
    is_verified: false,
    rating_count: 19,
    rating_average: 4.4,
    response_speed: 'Usually under 24 hours',
    contact_preference: 'WhatsApp',
    created_at: new Date().toISOString()
  }
];

const MOCK_SERVICE_AREAS: ServiceArea[] = [
  // Lekki Clean Energy (Lekki, VI, Ikoyi)
  { id: 'sa-1', installer_id: 'inst-1', state: 'Lagos', city: 'Lekki' },
  { id: 'sa-2', installer_id: 'inst-1', state: 'Lagos', city: 'Victoria Island' },
  { id: 'sa-3', installer_id: 'inst-1', state: 'Lagos', city: 'Ikoyi' },
  // Gbagada Solar Systems (Gbagada, Ikeja, Surulere)
  { id: 'sa-4', installer_id: 'inst-2', state: 'Lagos', city: 'Gbagada' },
  { id: 'sa-5', installer_id: 'inst-2', state: 'Lagos', city: 'Ikeja' },
  { id: 'sa-6', installer_id: 'inst-2', state: 'Lagos', city: 'Surulere' },
  // Eko Solar Tech
  { id: 'sa-7', installer_id: 'inst-3', state: 'Lagos', city: 'Lekki' },
  { id: 'sa-8', installer_id: 'inst-3', state: 'Lagos', city: 'Victoria Island' },
  // Ajao Estate Energy
  { id: 'sa-9', installer_id: 'inst-4', state: 'Lagos', city: 'Gbagada' },
  // Arnergy Solar (Victoria Island, Ilupeju, Ikeja)
  { id: 'sa-10', installer_id: 'inst-5', state: 'Lagos', city: 'Victoria Island' },
  { id: 'sa-11', installer_id: 'inst-5', state: 'Lagos', city: 'Ikeja' },
  { id: 'sa-12', installer_id: 'inst-5', state: 'Abuja', city: 'Wuse' },
  { id: 'sa-13', installer_id: 'inst-5', state: 'Rivers', city: 'Port Harcourt' },
  // SolarKobo (Lekki, Ajah, Ibeju-Lekki)
  { id: 'sa-14', installer_id: 'inst-6', state: 'Lagos', city: 'Lekki' },
  { id: 'sa-15', installer_id: 'inst-6', state: 'Lagos', city: 'Ajah' },
  { id: 'sa-16', installer_id: 'inst-6', state: 'Lagos', city: 'Ibeju-Lekki' },
  // Auxano Solar (Lekki, Ibeju-Lekki, Ajah)
  { id: 'sa-17', installer_id: 'inst-7', state: 'Lagos', city: 'Lekki' },
  { id: 'sa-18', installer_id: 'inst-7', state: 'Lagos', city: 'Ibeju-Lekki' },
  { id: 'sa-19', installer_id: 'inst-7', state: 'Lagos', city: 'Ajah' },
  // Gennex Technologies (Ikeja, VI, Abuja, Port Harcourt)
  { id: 'sa-20', installer_id: 'inst-8', state: 'Lagos', city: 'Ikeja' },
  { id: 'sa-21', installer_id: 'inst-8', state: 'Lagos', city: 'Victoria Island' },
  { id: 'sa-22', installer_id: 'inst-8', state: 'Abuja', city: 'Maitama' },
  { id: 'sa-23', installer_id: 'inst-8', state: 'Rivers', city: 'Port Harcourt' },
  // Rubitec Solar (Abuja, Lagos, Kano)
  { id: 'sa-24', installer_id: 'inst-9', state: 'Lagos', city: 'Ikeja' },
  { id: 'sa-25', installer_id: 'inst-9', state: 'Abuja', city: 'Garki' },
  { id: 'sa-26', installer_id: 'inst-9', state: 'Kano', city: 'Kano' },
  // Solar Depot Nigeria (Ikeja, Surulere, Lagos Island)
  { id: 'sa-27', installer_id: 'inst-10', state: 'Lagos', city: 'Ikeja' },
  { id: 'sa-28', installer_id: 'inst-10', state: 'Lagos', city: 'Surulere' },
  { id: 'sa-29', installer_id: 'inst-10', state: 'Lagos', city: 'Lagos Island' },
  { id: 'sa-30', installer_id: 'inst-10', state: 'Lagos', city: 'Gbagada' },
  // Solarlify (Lekki, Ajah, Ikoyi)
  { id: 'sa-31', installer_id: 'inst-11', state: 'Lagos', city: 'Lekki' },
  { id: 'sa-32', installer_id: 'inst-11', state: 'Lagos', city: 'Ajah' },
  { id: 'sa-33', installer_id: 'inst-11', state: 'Lagos', city: 'Ikoyi' },
  // Lumos Nigeria (Nationwide coverage - major cities)
  { id: 'sa-34', installer_id: 'inst-12', state: 'Lagos', city: 'Ikeja' },
  { id: 'sa-35', installer_id: 'inst-12', state: 'Lagos', city: 'Gbagada' },
  { id: 'sa-36', installer_id: 'inst-12', state: 'Abuja', city: 'Garki' },
  { id: 'sa-37', installer_id: 'inst-12', state: 'Kano', city: 'Kano' },
  { id: 'sa-38', installer_id: 'inst-12', state: 'Oyo', city: 'Ibadan' },
  // GVE Projects (Abuja, Lagos, Delta)
  { id: 'sa-39', installer_id: 'inst-13', state: 'Abuja', city: 'Garki' },
  { id: 'sa-40', installer_id: 'inst-13', state: 'Abuja', city: 'Wuse' },
  { id: 'sa-41', installer_id: 'inst-13', state: 'Lagos', city: 'Lekki' },
  { id: 'sa-42', installer_id: 'inst-13', state: 'Delta', city: 'Warri' },
  // Astrum Energy (Lekki, Victoria Island, Abuja Maitama)
  { id: 'sa-43', installer_id: 'inst-14', state: 'Lagos', city: 'Lekki' },
  { id: 'sa-44', installer_id: 'inst-14', state: 'Lagos', city: 'Victoria Island' },
  { id: 'sa-45', installer_id: 'inst-14', state: 'Lagos', city: 'Ikoyi' },
  { id: 'sa-46', installer_id: 'inst-14', state: 'Abuja', city: 'Maitama' },
  // JP2 Solar Power (Lekki, Chevron, Ajah)
  { id: 'sa-47', installer_id: 'inst-15', state: 'Lagos', city: 'Lekki' },
  { id: 'sa-48', installer_id: 'inst-15', state: 'Lagos', city: 'Ajah' },
  { id: 'sa-49', installer_id: 'inst-15', state: 'Lagos', city: 'Ibeju-Lekki' },
  // PVPRO Solar Energy (Ikeja, Agege, Ogba)
  { id: 'sa-50', installer_id: 'inst-16', state: 'Lagos', city: 'Ikeja' },
  { id: 'sa-51', installer_id: 'inst-16', state: 'Lagos', city: 'Agege' },
  { id: 'sa-52', installer_id: 'inst-16', state: 'Lagos', city: 'Surulere' },
  // Felicity Solar Nigeria (Ikeja, Lagos Island, Badagry)
  { id: 'sa-53', installer_id: 'inst-17', state: 'Lagos', city: 'Ikeja' },
  { id: 'sa-54', installer_id: 'inst-17', state: 'Lagos', city: 'Lagos Island' },
  { id: 'sa-55', installer_id: 'inst-17', state: 'Lagos', city: 'Gbagada' },
  // Daystar Power (Lagos Island, Apapa, Ikeja — industrial zones)
  { id: 'sa-56', installer_id: 'inst-18', state: 'Lagos', city: 'Apapa' },
  { id: 'sa-57', installer_id: 'inst-18', state: 'Lagos', city: 'Ikeja' },
  { id: 'sa-58', installer_id: 'inst-18', state: 'Lagos', city: 'Lagos Island' },
  { id: 'sa-59', installer_id: 'inst-18', state: 'Abuja', city: 'Garki' },
  // Solynta Energy (Lekki, Surulere, Yaba)
  { id: 'sa-60', installer_id: 'inst-19', state: 'Lagos', city: 'Lekki' },
  { id: 'sa-61', installer_id: 'inst-19', state: 'Lagos', city: 'Surulere' },
  { id: 'sa-62', installer_id: 'inst-19', state: 'Lagos', city: 'Yaba' },
  // Simba Solar (Ikeja, Gbagada, Kano, Abuja — nationwide)
  { id: 'sa-63', installer_id: 'inst-20', state: 'Lagos', city: 'Ikeja' },
  { id: 'sa-64', installer_id: 'inst-20', state: 'Lagos', city: 'Gbagada' },
  { id: 'sa-65', installer_id: 'inst-20', state: 'Kano', city: 'Kano' },
  { id: 'sa-66', installer_id: 'inst-20', state: 'Abuja', city: 'Garki' },
  { id: 'sa-67', installer_id: 'inst-20', state: 'Oyo', city: 'Ibadan' },
  // Solar Haven (Ikoyi, Victoria Island, Lekki)
  { id: 'sa-68', installer_id: 'inst-21', state: 'Lagos', city: 'Ikoyi' },
  { id: 'sa-69', installer_id: 'inst-21', state: 'Lagos', city: 'Victoria Island' },
  { id: 'sa-70', installer_id: 'inst-21', state: 'Lagos', city: 'Lekki' },
  // Solarity Plus (Lagos, Abuja, PH — nationwide)
  { id: 'sa-71', installer_id: 'inst-22', state: 'Lagos', city: 'Lekki' },
  { id: 'sa-72', installer_id: 'inst-22', state: 'Lagos', city: 'Ikeja' },
  { id: 'sa-73', installer_id: 'inst-22', state: 'Abuja', city: 'Maitama' },
  { id: 'sa-74', installer_id: 'inst-22', state: 'Rivers', city: 'Port Harcourt' },
  // Greenfield Energy Solutions (Lekki, Surulere, Yaba)
  { id: 'sa-75', installer_id: 'inst-23', state: 'Lagos', city: 'Lekki' },
  { id: 'sa-76', installer_id: 'inst-23', state: 'Lagos', city: 'Surulere' },
  { id: 'sa-77', installer_id: 'inst-23', state: 'Lagos', city: 'Yaba' },
  // Solar Valley Ltd (Gbagada, Ojodu, Agege)
  { id: 'sa-78', installer_id: 'inst-24', state: 'Lagos', city: 'Gbagada' },
  { id: 'sa-79', installer_id: 'inst-24', state: 'Lagos', city: 'Ojodu' },
  { id: 'sa-80', installer_id: 'inst-24', state: 'Lagos', city: 'Agege' }
];

const MOCK_SUBSCRIPTIONS: ListingSubscription[] = [
  { id: 'sub-1', installer_id: 'inst-1', tier: 'verified_partner_plus', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-2', installer_id: 'inst-2', tier: 'verified_partner', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-3', installer_id: 'inst-3', tier: 'verified_partner_plus', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-4', installer_id: 'inst-4', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  // Real Nigerian companies — all start as unclaimed basic listings
  { id: 'sub-5',  installer_id: 'inst-5',  tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-6',  installer_id: 'inst-6',  tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-7',  installer_id: 'inst-7',  tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-8',  installer_id: 'inst-8',  tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-9',  installer_id: 'inst-9',  tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-10', installer_id: 'inst-10', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-11', installer_id: 'inst-11', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-12', installer_id: 'inst-12', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-13', installer_id: 'inst-13', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-14', installer_id: 'inst-14', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  // New Lagos batch — all unclaimed basic listings
  { id: 'sub-15', installer_id: 'inst-15', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-16', installer_id: 'inst-16', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-17', installer_id: 'inst-17', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-18', installer_id: 'inst-18', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-19', installer_id: 'inst-19', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-20', installer_id: 'inst-20', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-21', installer_id: 'inst-21', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-22', installer_id: 'inst-22', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-23', installer_id: 'inst-23', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-24', installer_id: 'inst-24', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() }
];

interface MarketplaceState {
  installers: InstallerProfile[];
  serviceAreas: ServiceArea[];
  subscriptions: ListingSubscription[];
  leads: HomeownerLead[];
  leadAssignments: LeadAssignment[];
  currentInstallerId: string | null;
  
  // Actions
  addInstallerProfile: (profile: Omit<InstallerProfile, 'id' | 'rating_count' | 'rating_average' | 'created_at'>) => void;
  updateInstallerProfile: (id: string, updates: Partial<InstallerProfile>) => void;
  addServiceArea: (installerId: string, state: string, city: string) => void;
  removeServiceArea: (id: string) => void;
  submitLead: (lead: Omit<HomeownerLead, 'id' | 'created_at'>, targetInstallerId?: string) => void;
  updateLeadStatus: (assignmentId: string, status: LeadAssignment['status']) => void;
  updateLeadPipelineStatus: (assignmentId: string, pipelineStatus: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Won' | 'Lost') => void;
  moderateListing: (id: string, isVerified: boolean) => void;
  moderateListingSubscription: (id: string, tier: ListingSubscription['tier']) => void;
  claimListing: (id: string, email: string, phone: string) => void;
}

// Helper to calculate routing match score
const computeRoutePriority = (installerId: string, lead: Omit<HomeownerLead, 'id' | 'created_at'>, subscriptions: ListingSubscription[]) => {
  const sub = subscriptions.find(s => s.installer_id === installerId);
  if (!sub) return 0;
  let score = 0;
  if (sub.tier === 'verified_partner_plus') score += 1000;
  if (sub.tier === 'verified_partner') score += 500;
  return score;
};

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      installers: MOCK_INSTALLERS.map(inst => ({
        ...inst,
        is_claimed: inst.id === 'inst-1' || inst.id === 'inst-2' || inst.id === 'inst-3'
      })),
      serviceAreas: MOCK_SERVICE_AREAS,
      subscriptions: MOCK_SUBSCRIPTIONS,
      leads: [],
      leadAssignments: [],
      currentInstallerId: 'inst-1',

      addInstallerProfile: (profile) => {
        const id = 'inst-' + Math.random().toString(36).substr(2, 9);
        const newProfile: InstallerProfile = {
          ...profile,
          id,
          rating_count: 0,
          rating_average: 0.0,
          created_at: new Date().toISOString()
        };
        set((state) => ({
          installers: [...state.installers, newProfile],
          subscriptions: [...state.subscriptions, {
            id: 'sub-' + Math.random().toString(36).substr(2, 9),
            installer_id: id,
            tier: 'basic',
            status: 'active',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString()
          }]
        }));
      },

      updateInstallerProfile: (id, updates) => {
        set((state) => ({
          installers: state.installers.map((inst) =>
            inst.id === id ? { ...inst, ...updates } : inst
          )
        }));
      },

      addServiceArea: (installerId, state, city) => {
        const id = 'sa-' + Math.random().toString(36).substr(2, 9);
        set((stateData) => ({
          serviceAreas: [...stateData.serviceAreas, { id, installer_id: installerId, state, city }]
        }));
      },

      removeServiceArea: (id) => {
        set((state) => ({
          serviceAreas: state.serviceAreas.filter((sa) => sa.id !== id)
        }));
      },

      submitLead: (lead, targetInstallerId) => {
        const leadId = 'lead-' + Math.random().toString(36).substr(2, 9);
        const newLead: HomeownerLead = {
          ...lead,
          id: leadId,
          created_at: new Date().toISOString()
        };

        const currentAssignments: LeadAssignment[] = [];

        if (targetInstallerId) {
          // Direct Routing
          currentAssignments.push({
            id: 'la-' + Math.random().toString(36).substr(2, 9),
            lead_id: leadId,
            installer_id: targetInstallerId,
            status: 'pending',
            is_exclusive: true,
            assigned_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          // General Matching Algorithm
          const allAreas = get().serviceAreas;
          // 1. Service Area Match (State & City)
          const matchingInstallers = Array.from(
            new Set(
              allAreas
                .filter(
                  (sa) =>
                    sa.state.toLowerCase() === lead.state.toLowerCase() &&
                    sa.city.toLowerCase() === lead.city.toLowerCase()
                )
                .map((sa) => sa.installer_id)
            )
          );

          if (matchingInstallers.length > 0) {
            // Sort matching installers based on verified listing tiers
            const sortedByTier = matchingInstallers.sort((a, b) => {
              const scoreA = computeRoutePriority(a, lead, get().subscriptions);
              const scoreB = computeRoutePriority(b, lead, get().subscriptions);
              return scoreB - scoreA;
            });

            // Route to top matches (Exclusive for Verified Plus, shared for others)
            const topMatch = sortedByTier[0];
            const topSub = get().subscriptions.find(s => s.installer_id === topMatch);
            const isExclusive = topSub?.tier === 'verified_partner_plus';

            if (isExclusive) {
              currentAssignments.push({
                id: 'la-' + Math.random().toString(36).substr(2, 9),
                lead_id: leadId,
                installer_id: topMatch,
                status: 'pending',
                is_exclusive: true,
                assigned_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            } else {
              // Share lead with up to 3 matching installers
              sortedByTier.slice(0, 3).forEach((instId) => {
                currentAssignments.push({
                  id: 'la-' + Math.random().toString(36).substr(2, 9),
                  lead_id: leadId,
                  installer_id: instId,
                  status: 'pending',
                  is_exclusive: false,
                  assigned_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              });
            }
          }
        }

        set((state) => ({
          leads: [...state.leads, newLead],
          leadAssignments: [...state.leadAssignments, ...currentAssignments]
        }));
      },

      updateLeadStatus: (assignmentId, status) => {
        set((state) => ({
          leadAssignments: state.leadAssignments.map((la) =>
            la.id === assignmentId
              ? { ...la, status, updated_at: new Date().toISOString() }
              : la
          )
        }));
      },

      updateLeadPipelineStatus: (assignmentId, pipelineStatus) => {
        set((state) => ({
          leadAssignments: state.leadAssignments.map((la) =>
            la.id === assignmentId
              ? { ...la, status: pipelineStatus === 'Lost' ? 'declined' : la.status, updated_at: new Date().toISOString() }
              : la
          )
        }));
      },

      moderateListing: (id, isVerified) => {
        set((state) => ({
          installers: state.installers.map((inst) =>
            inst.id === id ? { ...inst, is_verified: isVerified } : inst
          )
        }));
      },

      moderateListingSubscription: (id, tier) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.installer_id === id ? { ...sub, tier } : sub
          )
        }));
      },

      claimListing: (id, email, phone) => {
        set((state) => ({
          installers: state.installers.map((inst) =>
            inst.id === id
              ? {
                  ...inst,
                  is_claimed: true,
                  claimed_at: new Date().toISOString(),
                  claimed_by_email: email,
                  claimed_by_phone: phone
                }
              : inst
          ),
          currentInstallerId: id
        }));
      }
    }),
    {
      name: 'solarpro-marketplace-store'
    }
  )
);
