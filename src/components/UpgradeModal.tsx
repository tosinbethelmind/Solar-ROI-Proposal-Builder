'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSubscriptionStore, FEATURE_GATES, SubscriptionTier } from '@/store/subscriptionStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

export default function UpgradeModal() {
  const router = useRouter();
  const { 
    upgradeModalOpen, 
    lockedFeatureKey, 
    closeUpgradeModal, 
    setSubscription,
    tier: currentTier
  } = useSubscriptionStore();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const featureInfo = lockedFeatureKey ? FEATURE_GATES[lockedFeatureKey] : null;
  if (!featureInfo) return null;

  const requiredTier = featureInfo.tierRequired;
  
  // Decide target audience text
  let audienceText = '';
  if (requiredTier === 'pro') {
    audienceText = 'Best for active independent installers & growing residential engineers.';
  } else if (requiredTier === 'business') {
    audienceText = 'Best for growing B2B solar teams, procurement managers, and multi-user companies.';
  } else {
    audienceText = 'Best for custom engineering agencies and commercial EPC partners.';
  }

  const handleGoToPricing = () => {
    closeUpgradeModal();
    router.push('/pricing');
  };

  const handleSimulateUnlock = () => {
    // Instantly simulate upgrading to satisfy testing immediately!
    setSubscription(requiredTier, 'monthly', false);
    closeUpgradeModal();
    alert(`🎉 Instantly unlocked! You simulated upgrading to the ${requiredTier.toUpperCase()} Plan. Click the feature again to use it!`);
  };

  return (
    <Dialog open={upgradeModalOpen} onOpenChange={(open) => !open && closeUpgradeModal()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold text-amber-600 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Upgrade Required
              </Badge>
              <DialogTitle className="text-lg font-black text-slate-850 dark:text-slate-50 mt-1">
                Unlock {featureInfo.featureName}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-medium">
            {featureInfo.description}
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Required Tier: <span className="uppercase text-teal-650 dark:text-teal-400 font-extrabold">{requiredTier}</span>
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {audienceText}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  Current Tier: <span className="uppercase text-slate-400 font-extrabold">{currentTier}</span>
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500">
                  Downgrade protects draft records, but restricts premium calculations.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="flex flex-col w-full gap-2">
            <Button
              className="w-full bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"
              onClick={handleGoToPricing}
            >
              <span>View Pricing Plans</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            {/* QA Test Helper Link to simulate instantaneous unlock for testing validation */}
            <button
              onClick={handleSimulateUnlock}
              className="w-full text-center text-[10px] font-black tracking-wider text-teal-500 hover:text-teal-600 dark:text-teal-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/50 dark:hover:bg-slate-800 py-2 rounded-xl transition-all uppercase"
            >
              ⚡ QA Bypass: Simulate Instant Unlock
            </button>

            <Button
              variant="ghost"
              className="w-full text-slate-500 dark:text-slate-400 font-bold rounded-xl text-xs"
              onClick={closeUpgradeModal}
            >
              Maybe Later
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
