// TypeScript Interfaces for SolarPro Installer Marketplace

export interface InstallerProfile {
  id: string;
  user_id: string;
  business_name: string;
  logo_url?: string;
  description: string;
  specialty_tags: string[];
  brands_handled: string[];
  is_verified: boolean;
  rating_count: number;
  rating_average: number;
  response_speed: string;
  contact_preference: 'WhatsApp' | 'Phone Call' | 'Email';
  is_claimed?: boolean;
  claimed_at?: string;
  claimed_by_email?: string;
  claimed_by_phone?: string;
  created_at: string;
}

export interface ServiceArea {
  id: string;
  installer_id: string;
  state: string;
  city: string;
}

export interface ListingSubscription {
  id: string;
  installer_id: string;
  tier: 'basic' | 'verified_partner' | 'verified_partner_plus';
  status: 'active' | 'trialing' | 'canceled' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface HomeownerLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  property_type: 'residential' | 'commercial' | 'industrial';
  monthly_spend: number;
  power_source: 'grid' | 'generator' | 'mixed';
  interest_type: 'bill_savings' | 'backup_power' | 'full_solar';
  budget_range: string;
  preferred_contact: 'WhatsApp' | 'Phone Call' | 'Email';
  timeline: 'Immediate' | '1-3 Months' | 'Researching';
  note?: string;
  request_source: 'general' | 'estimator' | 'direct_profile';
  created_at: string;
}

export interface LeadAssignment {
  id: string;
  lead_id: string;
  installer_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  is_exclusive: boolean;
  assigned_at: string;
  updated_at: string;
}
