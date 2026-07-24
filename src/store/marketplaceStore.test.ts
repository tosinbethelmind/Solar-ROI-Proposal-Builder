import { describe, it, expect } from 'vitest';
import { useMarketplaceStore } from './marketplaceStore';
import { isEligibleForPremiumListing } from '../utils/subscriptionRules';

describe('marketplaceStore', () => {
  describe('updateInstallerProfile', () => {
    it('updates installer profile fields correctly including CAC number, preferred contact method, and response speed', () => {
      const store = useMarketplaceStore.getState();
      const installerId = 'inst-1';
      
      store.updateInstallerProfile(installerId, {
        business_name: 'Lekki Clean Energy Updated',
        description: 'New Description',
        cac_number: 'RC-9876543',
        contact_preference: 'Phone Call',
        response_speed: 'Usually under 1 hour',
      });

      const updatedInstaller = useMarketplaceStore.getState().installers.find(i => i.id === installerId);
      expect(updatedInstaller?.business_name).toBe('Lekki Clean Energy Updated');
      expect(updatedInstaller?.description).toBe('New Description');
      expect(updatedInstaller?.cac_number).toBe('RC-9876543');
      expect(updatedInstaller?.contact_preference).toBe('Phone Call');
      expect(updatedInstaller?.response_speed).toBe('Usually under 1 hour');
    });
  });

  describe('lead routing priority rules', () => {
    it('routes homeowner leads to installers matching the state and city', () => {
      const store = useMarketplaceStore.getState();
      
      // Let's seed service area for a mock installer
      const installerId = 'inst-1';
      store.addServiceArea(installerId, 'LagosStateTest', 'LagosCityTest');

      // Submit lead for that service area
      store.submitLead({
        name: 'Lead Test Client',
        phone: '08012345678',
        email: 'test@example.com',
        state: 'LagosStateTest',
        city: 'LagosCityTest',
        property_type: 'residential',
        monthly_spend: 50000,
        power_source: 'mixed',
        interest_type: 'full_solar',
        budget_range: '₦1M - ₦3M',
        preferred_contact: 'WhatsApp',
        timeline: 'Immediate',
        request_source: 'general'
      });

      const state = useMarketplaceStore.getState();
      const assignments = state.leadAssignments.filter(la => la.installer_id === installerId);
      expect(assignments.length).toBeGreaterThan(0);
      
      // Clean up service area
      const addedSa = state.serviceAreas.find(sa => sa.state === 'LagosStateTest' && sa.city === 'LagosCityTest');
      if (addedSa) {
        store.removeServiceArea(addedSa.id);
      }
    });

    it('assigns leads exclusively to Verified Partner Plus listings', () => {
      // Let's seed two installers in a test area
      const instPlusId = 'inst-test-plus';
      const instBasicId = 'inst-test-basic';
      
      useMarketplaceStore.setState({
        installers: [
          {
            id: instPlusId,
            user_id: 'user-plus',
            business_name: 'Plus Installer',
            logo_url: '',
            description: 'Verified Partner Plus installer description',
            specialty_tags: [],
            brands_handled: [],
            is_verified: true,
            rating_count: 5,
            rating_average: 4.8,
            response_speed: 'Usually under 1 hour',
            contact_preference: 'WhatsApp',
            cac_number: 'RC-111111',
            created_at: new Date().toISOString()
          },
          {
            id: instBasicId,
            user_id: 'user-basic',
            business_name: 'Basic Installer',
            logo_url: '',
            description: 'Basic installer description',
            specialty_tags: [],
            brands_handled: [],
            is_verified: false,
            rating_count: 1,
            rating_average: 4.0,
            response_speed: 'Usually within 24 hours',
            contact_preference: 'Email',
            created_at: new Date().toISOString()
          }
        ],
        serviceAreas: [
          { id: 'sa-plus', installer_id: instPlusId, state: 'RouterState', city: 'RouterCity' },
          { id: 'sa-basic', installer_id: instBasicId, state: 'RouterState', city: 'RouterCity' }
        ],
        subscriptions: [
          { id: 'sub-test-plus', installer_id: instPlusId, tier: 'verified_partner_plus', status: 'active', expires_at: '2030-01-01T00:00:00Z', created_at: new Date().toISOString() },
          { id: 'sub-test-basic', installer_id: instBasicId, tier: 'basic', status: 'active', expires_at: '2030-01-01T00:00:00Z', created_at: new Date().toISOString() }
        ],
        leads: [],
        leadAssignments: []
      });

      // Submit lead to matching area
      useMarketplaceStore.getState().submitLead({
        name: 'Routing Test Client',
        phone: '08099999999',
        email: 'routing@example.com',
        state: 'RouterState',
        city: 'RouterCity',
        property_type: 'residential',
        monthly_spend: 40000,
        power_source: 'mixed',
        interest_type: 'full_solar',
        budget_range: '₦1M - ₦3M',
        preferred_contact: 'WhatsApp',
        timeline: 'Immediate',
        request_source: 'general'
      });

      const updatedState = useMarketplaceStore.getState();
      const plusAssignments = updatedState.leadAssignments.filter(la => la.installer_id === instPlusId);
      const basicAssignments = updatedState.leadAssignments.filter(la => la.installer_id === instBasicId);

      // Verified Partner Plus should get exclusive routing
      expect(plusAssignments.length).toBe(1);
      expect(plusAssignments[0].is_exclusive).toBe(true);
      expect(basicAssignments.length).toBe(0); // Basic should not get it because Plus was routed exclusively
    });
  });

  describe('isEligibleForPremiumListing eligibility checking', () => {
    it('allows basic listing for any software tier', () => {
      expect(isEligibleForPremiumListing('free', 'basic')).toBe(true);
      expect(isEligibleForPremiumListing('starter', 'basic')).toBe(true);
      expect(isEligibleForPremiumListing('pro', 'basic')).toBe(true);
    });

    it('denies premium listings to free and starter software tiers', () => {
      expect(isEligibleForPremiumListing('free', 'verified_partner')).toBe(false);
      expect(isEligibleForPremiumListing('starter', 'verified_partner')).toBe(false);
      expect(isEligibleForPremiumListing('free', 'verified_partner_plus')).toBe(false);
      expect(isEligibleForPremiumListing('starter', 'verified_partner_plus')).toBe(false);
    });

    it('allows premium listings to pro, business, and enterprise software tiers', () => {
      expect(isEligibleForPremiumListing('pro', 'verified_partner')).toBe(true);
      expect(isEligibleForPremiumListing('business', 'verified_partner')).toBe(true);
      expect(isEligibleForPremiumListing('enterprise', 'verified_partner_plus')).toBe(true);
    });
  });
});
