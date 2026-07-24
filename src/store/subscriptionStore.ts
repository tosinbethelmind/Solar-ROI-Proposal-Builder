'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual' | 'quarterly';

export const FEATURE_GATES = {
  wizardFlow: {
    tierRequired: 'pro' as SubscriptionTier,
    featureName: 'Full Wizard Sizing & Config',
    description: 'Custom detailed sizing with multi-appliance runtime analysis, customizable inverter parameters, and exact engineering loads.'
  },
  advancedPricing: {
    tierRequired: 'pro' as SubscriptionTier,
    featureName: 'Advanced Commercial Pricing Mode',
    description: 'Protect margins with custom overhead breakdowns, contingencies, locked FX buffers, warranties, professional SLA fees, and down-payment rules.'
  },
  roiComparison: {
    tierRequired: 'pro' as SubscriptionTier,
    featureName: 'Generator ROI Comparison Tables',
    description: 'Detailed diesel vs. solar expenditure charts over 5, 7, and 10 years to educate sticker-shocked Lagos clients.'
  },
  watermarkRemoval: {
    tierRequired: 'pro' as SubscriptionTier,
    featureName: 'SolarQuotePro Watermark Removal',
    description: 'Export pristine, highly professional proposal PDFs with your custom branding only, removing the SolarQuotePro default watermark.'
  },
  customBranding: {
    tierRequired: 'enterprise' as SubscriptionTier,
    featureName: 'Custom Brand Identity & Branding Styles',
    description: 'Complete white-label capability. Embed your company logo, custom color palettes, CAC registration info, and NERC certifications into proposal templates.'
  },
  installmentPlan: {
    tierRequired: 'pro' as SubscriptionTier,
    featureName: 'Installment & Financing Terms',
    description: 'Offer structured down-payment options, monthly repayment tenures, and custom interest rates for high-ticket quotes.'
  },
  crmPipeline: {
    tierRequired: 'business' as SubscriptionTier,
    featureName: 'CRM Lead Kanban Pipeline',
    description: 'Keep your client conversions organized. Move estimates dynamically between columns, view deal totals, and prevent hot leads from getting lost.'
  },
  whatsappShare: {
    tierRequired: 'business' as SubscriptionTier,
    featureName: 'One-Click WhatsApp Sharing',
    description: 'Instantly generate beautiful, structured solar project proposals formatted for WhatsApp chat. Send pricing, component sizes, and financing terms in a single tap.'
  },
  teamSeats: {
    tierRequired: 'business' as SubscriptionTier,
    featureName: 'Multi-Seat Team Collaboration',
    description: 'Invite estimators, site engineers, and sales reps to quote from a unified dashboard with role permissions.'
  },
  sharedTemplates: {
    tierRequired: 'business' as SubscriptionTier,
    featureName: 'Shared Company Templates & Default BOMs',
    description: 'Maintain quoting standards across your entire team with predefined component pricing templates.'
  },
  approvalWorkflow: {
    tierRequired: 'business' as SubscriptionTier,
    featureName: 'Low-Margin Quote Approval Workflow',
    description: 'Prevent field reps from selling below healthy profit safeguards. Low-margin proposals automatically lock until approved by managers.'
  },
  auditTrail: {
    tierRequired: 'business' as SubscriptionTier,
    featureName: 'Company Activity Logs & Audit Trail',
    description: 'Trace proposal edits, customer delivery clicks, and status changes across all sales personnel.'
  },
  advancedOfflineSync: {
    tierRequired: 'business' as SubscriptionTier,
    featureName: 'Corporate Cloud Sync Depth',
    description: 'Enterprise-grade automated conflict-resolution when team members work offline in poor coverage areas.'
  },
  customIntegrations: {
    tierRequired: 'enterprise' as SubscriptionTier,
    featureName: 'EPC Custom Integrations & Dedicated Support',
    description: 'Integrate proposal flows directly into corporate CRM, ERP, and inventory management APIs.'
  },
  interactiveProposals: {
    tierRequired: 'pro' as SubscriptionTier,
    featureName: 'Interactive Web Proposals & Checkout',
    description: 'Generate client-facing web proposals with live load toggle sliders, Paystack site survey checkouts, and custom warranty insurance coverage.'
  }
};

interface SubscriptionState {
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  isTrial: boolean;
  trialStartDate: number;
  trialProposalsRemaining: number;
  launchPromoClaimed?: boolean;
  claimLaunchPromo: () => void;
  
  // Upgrade Modal Trigger State
  upgradeModalOpen: boolean;
  lockedFeatureKey: keyof typeof FEATURE_GATES | null;
  openUpgradeModal: (featureKey: keyof typeof FEATURE_GATES | null) => void;
  closeUpgradeModal: () => void;
  
  // Simulated trial status (allows users to play with tiers inside our app easily)
  setSubscription: (tier: SubscriptionTier, billingCycle?: BillingCycle, isTrial?: boolean) => void;
  useProposalQuota: () => boolean; // Returns true if allowed, false if quota reached
  resetToTrial: () => void;
  
  // Gate check selectors
  checkAccess: (feature: keyof typeof FEATURE_GATES) => {
    unlocked: boolean;
    tierRequired: SubscriptionTier;
    featureName: string;
    description: string;
  };
}

const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
  enterprise: 4
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Defaults to 7-day Pro Trial (limit 7 total proposals) for excellent user onboarding experience
      tier: 'pro',
      billingCycle: 'monthly',
      isTrial: true,
      trialStartDate: typeof Date !== 'undefined' ? Date.now() : 0,
      trialProposalsRemaining: 7,
      launchPromoClaimed: false,

      claimLaunchPromo: () => {
        set({
          tier: 'pro',
          isTrial: true,
          trialProposalsRemaining: 20, // 20 lifetime proposals under free launch promo
          billingCycle: 'monthly',
          launchPromoClaimed: true
        });
      },

      // Modal State
      upgradeModalOpen: false,
      lockedFeatureKey: null,

      openUpgradeModal: (featureKey) => {
        set({ upgradeModalOpen: true, lockedFeatureKey: featureKey });
      },

      closeUpgradeModal: () => {
        set({ upgradeModalOpen: false, lockedFeatureKey: null });
      },

      setSubscription: (tier, billingCycle = 'monthly', isTrial = false) => {
        set({
          tier,
          billingCycle,
          isTrial,
          // Reset trial details if not on trial
          ...(isTrial ? {} : { trialProposalsRemaining: 0 })
        });
      },

      useProposalQuota: () => {
        const state = get();
        if (state.isTrial) {
          if (state.trialProposalsRemaining > 0) {
            set((s) => ({ trialProposalsRemaining: s.trialProposalsRemaining - 1 }));
            return true;
          }
          return false;
        }
        return true; // Other plans are checked server-side
      },

      resetToTrial: () => {
        set({
          tier: 'pro',
          billingCycle: 'monthly',
          isTrial: true,
          trialStartDate: Date.now(),
          trialProposalsRemaining: 7,
          launchPromoClaimed: false
        });
      },

      checkAccess: (featureKey) => {
        const state = get();
        const gate = FEATURE_GATES[featureKey];
        
        const effectiveUserTier = state.tier;
        const requiredTier = gate.tierRequired;
        
        const userTierValue = TIER_ORDER[effectiveUserTier];
        const requiredTierValue = TIER_ORDER[requiredTier];
        
        // Check for E2E bypass cookie in document.cookie
        let isE2E = false;
        if (typeof document !== 'undefined') {
          isE2E = document.cookie.includes('bypass_auth=solar-quotepro-e2e-secret-key-2026');
        }

        // If user is on trial, treat their access as Pro
        let unlocked = false;
        if (isE2E) {
          unlocked = true;
        } else if (state.isTrial) {
          // Pro level features and below are unlocked during active Pro trial
          unlocked = TIER_ORDER['pro'] >= requiredTierValue;
        } else {
          unlocked = userTierValue >= requiredTierValue;
        }

        return {
          unlocked,
          tierRequired: requiredTier,
          featureName: gate.featureName,
          description: gate.description
        };
      }
    }),
    {
      name: 'solarquotepro-subscription-store',
      // Exclude modal opening state from persistence to avoid launching with it open
      partialize: (state) => ({
        tier: state.tier,
        billingCycle: state.billingCycle,
        isTrial: state.isTrial,
        trialStartDate: state.trialStartDate,
        trialProposalsRemaining: state.trialProposalsRemaining,
        launchPromoClaimed: state.launchPromoClaimed,
      }),
    }
  )
);
