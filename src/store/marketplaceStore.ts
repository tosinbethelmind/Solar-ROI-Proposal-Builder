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
  { id: 'sa-9', installer_id: 'inst-4', state: 'Lagos', city: 'Gbagada' }
];

const MOCK_SUBSCRIPTIONS: ListingSubscription[] = [
  { id: 'sub-1', installer_id: 'inst-1', tier: 'verified_partner_plus', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-2', installer_id: 'inst-2', tier: 'verified_partner', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-3', installer_id: 'inst-3', tier: 'verified_partner_plus', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-4', installer_id: 'inst-4', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() }
];

interface MarketplaceState {
  installers: InstallerProfile[];
  serviceAreas: ServiceArea[];
  subscriptions: ListingSubscription[];
  leads: HomeownerLead[];
  leadAssignments: LeadAssignment[];
  
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
      installers: MOCK_INSTALLERS,
      serviceAreas: MOCK_SERVICE_AREAS,
      subscriptions: MOCK_SUBSCRIPTIONS,
      leads: [],
      leadAssignments: [],

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
      }
    }),
    {
      name: 'solarpro-marketplace-store'
    }
  )
);
