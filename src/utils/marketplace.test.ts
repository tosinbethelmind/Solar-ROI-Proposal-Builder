import { describe, it, expect, beforeEach } from 'vitest';
import { isEligibleForPremiumListing } from './subscriptionRules';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';

describe('Marketplace Store & Gating Rules', () => {
  beforeEach(() => {
    // Reset stores to their defaults before each test
    useMarketplaceStore.setState({
      installers: [
        {
          id: 'test-inst-1',
          user_id: 'user-1',
          business_name: 'Test Installer 1',
          logo_url: '',
          description: 'A test installer business',
          specialty_tags: ['Residential'],
          brands_handled: ['Sunsynk'],
          is_verified: true,
          rating_count: 5,
          rating_average: 4.5,
          response_speed: 'Usually under 2 hours',
          contact_preference: 'WhatsApp',
          created_at: new Date().toISOString()
        },
        {
          id: 'test-inst-2',
          user_id: 'user-2',
          business_name: 'Test Installer 2',
          logo_url: '',
          description: 'Another test installer business',
          specialty_tags: ['Commercial'],
          brands_handled: ['Deye'],
          is_verified: true,
          rating_count: 8,
          rating_average: 4.8,
          response_speed: 'Usually under 1 hour',
          contact_preference: 'Phone Call',
          created_at: new Date().toISOString()
        }
      ],
      serviceAreas: [
        { id: 'sa-test-1', installer_id: 'test-inst-1', state: 'Lagos', city: 'Ikeja' },
        { id: 'sa-test-2', installer_id: 'test-inst-1', state: 'Lagos', city: 'Lekki' },
        { id: 'sa-test-3', installer_id: 'test-inst-2', state: 'Lagos', city: 'Ikeja' }
      ],
      subscriptions: [
        {
          id: 'sub-test-1',
          installer_id: 'test-inst-1',
          tier: 'basic',
          status: 'active',
          expires_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: 'sub-test-2',
          installer_id: 'test-inst-2',
          tier: 'verified_partner_plus',
          status: 'active',
          expires_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ],
      leads: [],
      leadAssignments: [],
      currentInstallerId: 'test-inst-1'
    });
  });

  describe('isEligibleForPremiumListing', () => {
    it('allows basic listing for any software tier', () => {
      expect(isEligibleForPremiumListing('free', 'basic')).toBe(true);
      expect(isEligibleForPremiumListing('starter', 'basic')).toBe(true);
      expect(isEligibleForPremiumListing('pro', 'basic')).toBe(true);
    });

    it('requires pro software tier or above for verified partner listings', () => {
      expect(isEligibleForPremiumListing('free', 'verified_partner')).toBe(false);
      expect(isEligibleForPremiumListing('starter', 'verified_partner')).toBe(false);
      expect(isEligibleForPremiumListing('pro', 'verified_partner')).toBe(true);
      expect(isEligibleForPremiumListing('business', 'verified_partner')).toBe(true);
      expect(isEligibleForPremiumListing('enterprise', 'verified_partner')).toBe(true);
    });

    it('requires pro software tier or above for partner plus listings', () => {
      expect(isEligibleForPremiumListing('free', 'verified_partner_plus')).toBe(false);
      expect(isEligibleForPremiumListing('starter', 'verified_partner_plus')).toBe(false);
      expect(isEligibleForPremiumListing('pro', 'verified_partner_plus')).toBe(true);
      expect(isEligibleForPremiumListing('business', 'verified_partner_plus')).toBe(true);
      expect(isEligibleForPremiumListing('enterprise', 'verified_partner_plus')).toBe(true);
    });
  });

  describe('Service Area Limits', () => {
    it('allows adding service areas up to the limit of 10', () => {
      const store = useMarketplaceStore.getState();
      
      // Let's add 8 more areas to test-inst-1 (it already has 2)
      for (let i = 1; i <= 8; i++) {
        const added = store.addServiceArea('test-inst-1', 'Lagos', `City-${i}`);
        expect(added).toBe(true);
      }

      // Try adding the 11th service area, it should return false
      const added11th = store.addServiceArea('test-inst-1', 'Lagos', 'City-11');
      expect(added11th).toBe(false);
    });

    it('prevents adding duplicate service areas', () => {
      const store = useMarketplaceStore.getState();
      const duplicate = store.addServiceArea('test-inst-1', 'Lagos', 'Ikeja');
      expect(duplicate).toBe(false);
    });
  });

  describe('Lead Routing Matching', () => {
    it('performs exact matching of state and city', () => {
      const store = useMarketplaceStore.getState();
      
      store.submitLead({
        name: 'John Doe',
        phone: '08012345678',
        email: 'john@example.com',
        state: 'Lagos',
        city: 'Lekki',
        property_type: 'residential',
        monthly_spend: 50000,
        power_source: 'mixed',
        interest_type: 'full_solar',
        budget_range: '₦1M - ₦3M',
        preferred_contact: 'WhatsApp',
        timeline: 'Immediate',
        request_source: 'general'
      });

      const leads = useMarketplaceStore.getState().leads;
      const assignments = useMarketplaceStore.getState().leadAssignments;

      expect(leads.length).toBe(1);
      // test-inst-1 is listed in Lagos Lekki, so it should be routed
      expect(assignments.some(la => la.installer_id === 'test-inst-1')).toBe(true);
      // test-inst-2 is not in Lagos Lekki, so it shouldn't be routed
      expect(assignments.some(la => la.installer_id === 'test-inst-2')).toBe(false);
    });

    it('falls back to state-level matching if no city matches exist', () => {
      const store = useMarketplaceStore.getState();

      // Change test-inst-2 to verified_partner so it's not exclusive, allowing shared routing
      useMarketplaceStore.setState({
        subscriptions: [
          {
            id: 'sub-test-1',
            installer_id: 'test-inst-1',
            tier: 'verified_partner',
            status: 'active',
            expires_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          },
          {
            id: 'sub-test-2',
            installer_id: 'test-inst-2',
            tier: 'verified_partner',
            status: 'active',
            expires_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        ]
      });

      store.submitLead({
        name: 'Jane Smith',
        phone: '08098765432',
        email: 'jane@example.com',
        state: 'Lagos',
        city: 'Surulere',
        property_type: 'residential',
        monthly_spend: 120000,
        power_source: 'mixed',
        interest_type: 'full_solar',
        budget_range: '₦1M - ₦3M',
        preferred_contact: 'Phone Call',
        timeline: 'Immediate',
        request_source: 'general'
      });

      const assignments = useMarketplaceStore.getState().leadAssignments;

      // Both test-inst-1 and test-inst-2 are in Lagos state, so they should be matched via fallback state routing
      expect(assignments.some(la => la.installer_id === 'test-inst-1')).toBe(true);
      expect(assignments.some(la => la.installer_id === 'test-inst-2')).toBe(true);
    });
  });
});
