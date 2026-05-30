-- Migration: Monetization, Commission Partnerships, & Lead Captures
-- Drops old check constraints on companies and builds B2B partner and service referral schema.

-- 1. Drop old check constraints on companies subscription fields
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_subscription_tier_check;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_subscription_status_check;

-- 2. Add pricing & usage tracker columns directly to companies table for high performance
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS proposal_usage_count int DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS proposals_reset_date timestamptz DEFAULT (now() + INTERVAL '1 month');
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_proposal_limit int;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_seat_limit int;

-- Update the new CHECK constraints to support our custom plan tiers
ALTER TABLE public.companies ADD CONSTRAINT companies_subscription_tier_check 
  CHECK (subscription_tier IN ('free', 'trial', 'starter', 'pro', 'enterprise'));

ALTER TABLE public.companies ADD CONSTRAINT companies_subscription_status_check 
  CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'expired'));

-- 3. Create paid implementation/setup service leads table
CREATE TABLE IF NOT EXISTS public.implementation_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  phone text,
  email text,
  team_size int,
  current_workflow text,
  desired_package text CHECK (desired_package IN ('basic', 'professional', 'enterprise')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create supplier partners table (Admin-managed)
CREATE TABLE IF NOT EXISTS public.supplier_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  whatsapp_number text,
  categories text[], -- e.g., {'panels', 'batteries', 'inverters', 'accessories'}
  regions text[], -- e.g., {'Lagos', 'Abuja', 'Port Harcourt'}
  commission_model text NOT NULL DEFAULT 'percentage_of_sale' CHECK (commission_model IN ('percentage_of_sale', 'flat_fee_per_won_referral', 'custom')),
  commission_rate numeric DEFAULT 0,
  active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 5. Create supplier referrals table
CREATE TABLE IF NOT EXISTS public.supplier_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid, -- requesting user (estimator/admin)
  customer_name text,
  equipment_summary text,
  system_size text,
  preferred_supplier_id uuid REFERENCES public.supplier_partners(id) ON DELETE SET NULL,
  preferred_contact_method text,
  location text,
  status text NOT NULL DEFAULT 'new' 
    CHECK (status IN ('new', 'assigned', 'sent_to_supplier', 'supplier_responded', 'quoted', 'won', 'lost', 'cancelled')),
  expected_commission numeric DEFAULT 0,
  actual_commission numeric DEFAULT 0,
  commission_status text NOT NULL DEFAULT 'pending' 
    CHECK (commission_status IN ('pending', 'approved', 'paid', 'waived')),
  payout_date date,
  latest_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Create training cohort leads table
CREATE TABLE IF NOT EXISTS public.training_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  company text,
  role text,
  experience_level text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- 7. Configure Row-Level Security (RLS) on new tables
ALTER TABLE public.implementation_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_leads ENABLE ROW LEVEL SECURITY;

-- Implementation Leads Policies
CREATE POLICY "Users can insert own company implementation leads" ON public.implementation_leads
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own company implementation leads" ON public.implementation_leads
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage all implementation leads" ON public.implementation_leads
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.platform_admins));

-- Supplier Partners Policies
CREATE POLICY "Admins manage all supplier partners" ON public.supplier_partners
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.platform_admins));

CREATE POLICY "All authenticated users can read active partners" ON public.supplier_partners
  FOR SELECT USING (active = true);

-- Supplier Referrals Policies
CREATE POLICY "Users can create own company referrals" ON public.supplier_referrals
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can select own company referrals" ON public.supplier_referrals
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage all supplier referrals" ON public.supplier_referrals
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.platform_admins));

-- Training Leads Policies
CREATE POLICY "Anyone can submit training lead interest" ON public.training_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins manage all training leads" ON public.training_leads
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.platform_admins));
