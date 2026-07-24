import { SubscriptionTier } from '@/store/subscriptionStore';

/**
 * Validates if a user's core software plan tier is eligible to upgrade to a premium directory listing.
 * Premium listings (Verified Partner, Partner Plus) are gated and restricted to users on active Pro software plans or above.
 */
export function isEligibleForPremiumListing(softwareTier: SubscriptionTier, targetListingTier: 'basic' | 'verified_partner' | 'verified_partner_plus'): boolean {
  if (targetListingTier === 'basic') return true;
  
  const eligibleSoftwareTiers: SubscriptionTier[] = ['pro', 'business', 'enterprise'];
  return eligibleSoftwareTiers.includes(softwareTier);
}
