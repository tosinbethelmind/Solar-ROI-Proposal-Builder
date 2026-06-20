'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HomeownerTier = 'free' | 'monthly' | 'pay_per_use';

interface HomeownerSubscriptionState {
  tier: HomeownerTier;
  tokens: number; // Token balance for pay-per-use sizing reports
  estimationsUsedThisMonth: number;
  lastResetTimestamp: number;
  
  // Modal toggle state
  upgradeModalOpen: boolean;
  
  // Actions
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  subscribeMonthly: () => void;
  purchaseTokens: (qty: number) => void;
  cancelSubscription: () => void;
  checkAccess: () => { allowed: boolean; remaining: number; reason: string };
  consumeEstimation: () => boolean;
}

export const useHomeownerSubscriptionStore = create<HomeownerSubscriptionState>()(
  persist(
    (set, get) => ({
      tier: 'free',
      tokens: 0,
      estimationsUsedThisMonth: 0,
      lastResetTimestamp: typeof Date !== 'undefined' ? Date.now() : 0,
      upgradeModalOpen: false,

      openUpgradeModal: () => set({ upgradeModalOpen: true }),
      closeUpgradeModal: () => set({ upgradeModalOpen: false }),

      subscribeMonthly: () => {
        set({
          tier: 'monthly',
          upgradeModalOpen: false
        });
      },

      purchaseTokens: (qty) => {
        set((s) => ({
          tier: s.tier === 'monthly' ? 'monthly' : 'pay_per_use',
          tokens: s.tokens + qty,
          upgradeModalOpen: false
        }));
      },

      cancelSubscription: () => {
        set({
          tier: 'free',
          upgradeModalOpen: false
        });
      },

      checkAccess: () => {
        const state = get();
        
        // Reset monthly free quota if 30 days have passed
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (now - state.lastResetTimestamp > thirtyDays) {
          set({
            estimationsUsedThisMonth: 0,
            lastResetTimestamp: now
          });
        }

        if (state.tier === 'monthly') {
          return { allowed: true, remaining: 9999, reason: 'Unlimited Monthly Subscriber' };
        }

        if (state.tier === 'pay_per_use' && state.tokens > 0) {
          return { allowed: true, remaining: state.tokens, reason: `${state.tokens} Token(s) available` };
        }

        // Free tier gets 1 calculation per month
        const freeLimit = 1;
        const remainingFree = Math.max(0, freeLimit - state.estimationsUsedThisMonth);
        
        if (remainingFree > 0) {
          return { allowed: true, remaining: remainingFree, reason: '1 Free Monthly Estimation' };
        }

        return { 
          allowed: false, 
          remaining: 0, 
          reason: 'You have used your 1 free monthly estimation. Upgrade to unlock.' 
        };
      },

      consumeEstimation: () => {
        const access = get().checkAccess();
        if (!access.allowed) return false;

        const state = get();
        if (state.tier === 'monthly') {
          return true;
        }

        if (state.tier === 'pay_per_use' && state.tokens > 0) {
          set((s) => ({ tokens: Math.max(0, s.tokens - 1) }));
          return true;
        }

        // Consume free monthly limit
        set((s) => ({ estimationsUsedThisMonth: s.estimationsUsedThisMonth + 1 }));
        return true;
      }
    }),
    {
      name: 'solarquotepro-homeowner-subscription-store',
    }
  )
);
