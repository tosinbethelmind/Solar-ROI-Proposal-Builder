-- Enums
CREATE TYPE battery_chemistry AS ENUM ('lead-acid', 'lithium');
CREATE TYPE generator_fuel_type AS ENUM ('petrol', 'diesel');
CREATE TYPE appliance_load_type AS ENUM ('essential', 'heavy');
CREATE TYPE component_item_type AS ENUM ('inverter', 'battery', 'panel', 'charge_controller');
CREATE TYPE proposal_tier AS ENUM ('budget', 'standard', 'premium');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');

-- 1. Installers (User Profiles)
CREATE TABLE installers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    logo_url TEXT,
    phone TEXT,
    address TEXT,
    currency TEXT DEFAULT 'NGN',
    default_pms_price_ngn NUMERIC DEFAULT 750.00,
    default_ago_price_ngn NUMERIC DEFAULT 1815.00,
    default_nepa_tariff_ngn NUMERIC DEFAULT 225.00,
    defaults_updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE installers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Installers can read/write own profile" ON installers
    FOR ALL USING (id = auth.uid());

-- 2. Nigeria Regions (PSH Lookups)
CREATE TABLE nigeria_regions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    default_psh NUMERIC NOT NULL,
    climate_zone TEXT NOT NULL
);

INSERT INTO nigeria_regions (name, default_psh, climate_zone) VALUES
('Lagos', 4.2, 'coastal'),
('Abuja', 5.0, 'savanna'),
('Kano', 5.8, 'sahel'),
('Port Harcourt', 4.0, 'coastal'),
('Enugu', 4.5, 'tropical'),
('Ibadan', 4.8, 'savanna'),
('Benin City', 4.3, 'tropical'),
('Kaduna', 5.5, 'savanna'),
('Jos', 5.2, 'highland'),
('Calabar', 3.8, 'coastal'),
('Owerri', 4.2, 'tropical'),
('Warri', 4.1, 'coastal')
ON CONFLICT (name) DO UPDATE SET default_psh = EXCLUDED.default_psh;

-- 3. Appliances Preset Library
CREATE TABLE appliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    default_wattage INTEGER NOT NULL,
    is_inductive BOOLEAN DEFAULT FALSE,
    load_type appliance_load_type DEFAULT 'essential',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

INSERT INTO appliances (name, default_wattage, is_inductive, load_type) VALUES
('1.5HP Inverter Split AC', 1050, TRUE, 'heavy'),
('1HP Standing Fan', 75, FALSE, 'essential'),
('Chest Freezer (200L)', 150, TRUE, 'essential'),
('Upright Fridge', 120, TRUE, 'essential'),
('32" LED TV', 40, FALSE, 'essential'),
('43" LED TV', 80, FALSE, 'essential'),
('Wi-Fi Router', 12, FALSE, 'essential'),
('LED Bulb (9W)', 9, FALSE, 'essential'),
('Laptop/Charger', 65, FALSE, 'essential'),
('0.75HP Submersible Pump', 550, TRUE, 'heavy'),
('Electric Iron', 1000, FALSE, 'heavy'),
('Microwave (800W)', 800, FALSE, 'heavy'),
('DSTV Decoder', 15, FALSE, 'essential'),
('CCTV DVR (4-ch)', 20, FALSE, 'essential')
ON CONFLICT (name) DO UPDATE SET default_wattage = EXCLUDED.default_wattage;

-- 4. Catalog Components
CREATE TABLE inverters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL,
    model_name TEXT NOT NULL,
    capacity_kva NUMERIC NOT NULL,
    system_voltage INTEGER NOT NULL,
    price_ngn NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE batteries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL,
    model_name TEXT NOT NULL,
    capacity_ah INTEGER NOT NULL,
    voltage INTEGER NOT NULL,
    chemistry battery_chemistry NOT NULL,
    dod_percentage INTEGER NOT NULL,
    price_ngn NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE panels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL,
    model_name TEXT NOT NULL,
    wattage_wp INTEGER NOT NULL,
    price_ngn NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE charge_controllers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL,
    model_name TEXT NOT NULL,
    current_rating_a INTEGER NOT NULL,
    system_voltage_options INTEGER[] NOT NULL,
    price_ngn NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable basic component RLS
ALTER TABLE inverters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read inverters" ON inverters FOR SELECT TO authenticated USING (TRUE);
ALTER TABLE batteries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read batteries" ON batteries FOR SELECT TO authenticated USING (TRUE);
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read panels" ON panels FOR SELECT TO authenticated USING (TRUE);
ALTER TABLE charge_controllers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read charge controllers" ON charge_controllers FOR SELECT TO authenticated USING (TRUE);

-- 5. Proposals
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installer_id UUID REFERENCES installers(id) ON DELETE CASCADE,
    parent_proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    region_id INTEGER REFERENCES nigeria_regions(id),
    status proposal_status DEFAULT 'draft',
    
    backup_hours NUMERIC NOT NULL,
    peak_sun_hours NUMERIC DEFAULT 4.2,
    
    nepa_daily_hours NUMERIC DEFAULT 0,
    nepa_tariff_per_kwh NUMERIC DEFAULT 225,
    
    gen_fuel_type generator_fuel_type,
    gen_capacity_kva NUMERIC,
    gen_daily_hours NUMERIC DEFAULT 0,
    gen_fuel_price_per_liter NUMERIC DEFAULT 750,
    
    labour_cost_ngn NUMERIC DEFAULT 0,
    accessories_cost_ngn NUMERIC DEFAULT 0,
    markup_percentage NUMERIC DEFAULT 15,
    discount_ngn NUMERIC DEFAULT 0,
    vat_percentage NUMERIC DEFAULT 7.5,
    
    selected_tier proposal_tier DEFAULT 'standard',
    
    calc_inverter_kva NUMERIC,
    calc_battery_ah NUMERIC,
    calc_battery_config TEXT,
    calc_panel_count INTEGER,
    calc_array_wp NUMERIC,
    calc_daily_load_wh NUMERIC,
    calc_essential_load_wh NUMERIC,
    calc_monthly_savings_ngn NUMERIC,
    calc_payback_months NUMERIC,
    final_quoted_price_ngn NUMERIC,
    locked_fx_rate NUMERIC DEFAULT NULL,
    fx_rate_locked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    calculations_snapshot JSONB DEFAULT NULL,
    
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc', NOW()) + INTERVAL '30 days'),
    sent_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_proposals_installer_id ON proposals(installer_id);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Installers manage own proposals" ON proposals
    FOR ALL USING (installer_id = auth.uid());

CREATE POLICY "Public read proposals by UUID" ON proposals
    FOR SELECT USING (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = TIMEZONE('utc', NOW()); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. Proposal Appliances
CREATE TABLE proposal_appliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    appliance_id UUID REFERENCES appliances(id) ON DELETE SET NULL,
    custom_name TEXT,
    custom_wattage INTEGER, -- stores resolved value via TS
    is_inductive BOOLEAN DEFAULT FALSE,
    load_type appliance_load_type DEFAULT 'essential',
    quantity INTEGER NOT NULL DEFAULT 1,
    daily_runtime_hours NUMERIC NOT NULL,
    is_included_in_backup BOOLEAN DEFAULT TRUE,
    simultaneous_start BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_proposal_appliances_proposal_id ON proposal_appliances(proposal_id);

ALTER TABLE proposal_appliances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Installers manage proposal appliances" ON proposal_appliances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM proposals p
            WHERE p.id = proposal_appliances.proposal_id
            AND p.installer_id = auth.uid()
        )
    );

CREATE POLICY "Public read proposal appliances by UUID" ON proposal_appliances
    FOR SELECT USING (true);

-- 7. Proposal Line Items (Granular BOM)
CREATE TABLE proposal_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    tier proposal_tier NOT NULL DEFAULT 'standard',
    item_type component_item_type NOT NULL,

    inverter_id UUID REFERENCES inverters(id) ON DELETE SET NULL,
    battery_id UUID REFERENCES batteries(id) ON DELETE SET NULL,
    panel_id UUID REFERENCES panels(id) ON DELETE SET NULL,
    charge_controller_id UUID REFERENCES charge_controllers(id) ON DELETE SET NULL,
    
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_ngn NUMERIC NOT NULL,
    configuration_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    -- Constraint: exactly one FK must be set
    CONSTRAINT one_component_only CHECK (
        (inverter_id IS NOT NULL)::int +
        (battery_id IS NOT NULL)::int +
        (panel_id IS NOT NULL)::int +
        (charge_controller_id IS NOT NULL)::int = 1
    )
);

CREATE INDEX idx_proposal_line_items_proposal_id ON proposal_line_items(proposal_id);

ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Installers manage proposal line items" ON proposal_line_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM proposals p
            WHERE p.id = proposal_line_items.proposal_id
            AND p.installer_id = auth.uid()
        )
    );

-- 8. Proposal Misc Items (For non-catalogued costs like cables and accessories)
CREATE TABLE proposal_misc_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    tier proposal_tier NOT NULL DEFAULT 'standard',
    description TEXT NOT NULL,         -- e.g. "DC Cables (25mmÂ²)", "MC4 Connectors x10"
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_ngn NUMERIC NOT NULL
);

CREATE INDEX idx_proposal_misc_items_proposal_id ON proposal_misc_items(proposal_id);

ALTER TABLE proposal_misc_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Installers manage proposal misc items" ON proposal_misc_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM proposals p
            WHERE p.id = proposal_misc_items.proposal_id
            AND p.installer_id = auth.uid()
        )
    );
-- Migration: Add Interactive Proposal fields to proposals table
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_token UUID UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS tracking_status VARCHAR(50) DEFAULT 'Sent'; -- 'Sent', 'Viewed', 'Revision Requested', 'Approved'
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_feedback TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS proposal_version INTEGER DEFAULT 1;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS first_viewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100) DEFAULT 'WhatsApp Share';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- Create an index on client_token for fast lookup
CREATE INDEX IF NOT EXISTS idx_proposals_client_token ON proposals(client_token);

-- Allow public read on installers table so clients can view installer profile details
CREATE POLICY "Public read installers" ON installers
    FOR SELECT USING (true);
-- Migration: Allow public updates to proposals for client interaction tracking
CREATE POLICY "Public update proposals" ON proposals
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
-- Migration: SaaS Multi-Tenant Authentication
-- Creates companies, company_members tables and configures post-signup automation trigger.

-- 1. Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text,
  logo_url text,
  phone text,
  email text,
  address text,
  cac_number text,
  nerc_number text,
  social_handle text,
  whatsapp text,
  brand_primary_color text DEFAULT '#01696f',
  brand_secondary_color text DEFAULT '#01414a',
  subscription_tier text NOT NULL DEFAULT 'starter' CHECK (subscription_tier IN ('starter','pro','business','enterprise')),
  subscription_status text NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial','active','past_due','cancelled')),
  trial_ends_at timestamptz DEFAULT (now() + INTERVAL '7 days'),
  paystack_customer_id text,
  paystack_subscription_code text,
  created_at timestamptz DEFAULT now()
);

-- 2. Create company_members junction table
CREATE TABLE IF NOT EXISTS company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'estimator' CHECK (role IN ('owner','admin','estimator')),
  invited_email text,
  invite_accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- 3. Row Level Security Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- Companies Policies
CREATE POLICY "members can read own company"
  ON companies FOR SELECT
  USING (id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "owners/admins can update own company"
  ON companies FOR UPDATE
  USING (id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- Company Members Policies
CREATE POLICY "read own company members"
  ON company_members FOR SELECT
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "owners/admins can manage company members"
  ON company_members FOR ALL
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- 4. Post-signup trigger to automate company creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_company_id uuid;
  company_name text;
BEGIN
  -- Extract company name from metadata or default to "My Solar Company"
  company_name := COALESCE(new.raw_user_meta_data->>'company_name', 'My Solar Company');
  
  -- Create default company
  INSERT INTO public.companies (name, subscription_tier, subscription_status, trial_ends_at)
  VALUES (company_name, 'starter', 'trial', now() + INTERVAL '7 days')
  RETURNING id INTO new_company_id;
  
  -- Create default company member connection as Owner
  INSERT INTO public.company_members (company_id, user_id, role, invite_accepted_at)
  VALUES (new_company_id, new.id, 'owner', now());
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Migration: SaaS Proposals and Clients Schema Update
-- Integrates multi-tenancy relations into proposals and sets up clients / fx_rates tables.

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can manage company clients"
  ON clients FOR ALL
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- 2. Alter proposals table to support multi-tenancy
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

-- 3. Create fx_rates table for parallel market rates caching
CREATE TABLE IF NOT EXISTS fx_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair text NOT NULL UNIQUE, -- e.g., 'USD_NGN'
  rate numeric NOT NULL,
  source text NOT NULL DEFAULT 'custom', -- e.g., 'parallel', 'cbn'
  fetched_at timestamptz DEFAULT now()
);

-- Enable RLS on fx_rates
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read fx_rates" ON fx_rates FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can update fx_rates" ON fx_rates FOR ALL USING (true); -- allowed for server/edge operations

-- 4. Update proposals RLS policies to be company/tenant-scoped
DROP POLICY IF EXISTS "Installers manage own proposals" ON proposals;

CREATE POLICY "company members manage own proposals"
  ON proposals FOR ALL
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Also check proposal appliances RLS policy updates
DROP POLICY IF EXISTS "Installers manage proposal appliances" ON proposal_appliances;
CREATE POLICY "company members manage proposal appliances"
  ON proposal_appliances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_appliances.proposal_id
      AND p.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    )
  );

-- Update proposal line items RLS policy updates
DROP POLICY IF EXISTS "Installers manage proposal line items" ON proposal_line_items;
CREATE POLICY "company members manage proposal line items"
  ON proposal_line_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_line_items.proposal_id
      AND p.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    )
  );

-- Update proposal misc items RLS policy updates
DROP POLICY IF EXISTS "Installers manage proposal misc items" ON proposal_misc_items;
CREATE POLICY "company members manage proposal misc items"
  ON proposal_misc_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_misc_items.proposal_id
      AND p.company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    )
  );
-- Migration: Harden SaaS Provisioning Trigger and RLS Schema Isolation

-- 1. Refactor handle_new_user to be exceptionally safe with input sanitization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_company_id uuid;
  company_name text;
BEGIN
  -- Sanitize company name inputs by removing any dangerous/unwanted special chars
  company_name := REGEXP_REPLACE(
    COALESCE(new.raw_user_meta_data->>'company_name', 'My Solar Company'),
    '[^\w\s\-\.\,\(\)]', '', 'g'
  );

  IF TRIM(company_name) = '' THEN
    company_name := 'My Solar Company';
  END IF;

  BEGIN
    -- Provision company record
    INSERT INTO public.companies (name, subscription_tier, subscription_status, trial_ends_at)
    VALUES (company_name, 'starter', 'trial', now() + INTERVAL '7 days')
    RETURNING id INTO new_company_id;

    -- Make the user owner of this workspace
    INSERT INTO public.company_members (company_id, user_id, role, invite_accepted_at)
    VALUES (new_company_id, new.id, 'owner', now());

  EXCEPTION WHEN OTHERS THEN
    -- Log warning internally so auth.users signup transaction is never blocked
    RAISE WARNING 'Tenant provisioning failed for user %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger connection to ensure it is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create sync_telemetry table for offline sync tracing
CREATE TABLE IF NOT EXISTS public.sync_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  status text NOT NULL, -- 'success', 'failed'
  records_synced integer DEFAULT 0,
  error_details text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on sync_telemetry
ALTER TABLE public.sync_telemetry ENABLE ROW LEVEL SECURITY;

-- Configure tenant-scoped RLS policies for sync_telemetry
DROP POLICY IF EXISTS "company members manage sync_telemetry" ON public.sync_telemetry;
CREATE POLICY "company members manage sync_telemetry" ON public.sync_telemetry
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));

-- 3. Enable RLS on metadata lookup tables to ensure absolute 100% coverage
ALTER TABLE public.nigeria_regions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read nigeria_regions" ON public.nigeria_regions;
CREATE POLICY "Anyone can read nigeria_regions" ON public.nigeria_regions FOR SELECT TO authenticated, anon USING (true);

ALTER TABLE public.appliances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read appliances" ON public.appliances;
CREATE POLICY "Anyone can read appliances" ON public.appliances FOR SELECT TO authenticated, anon USING (true);

-- Migration: Platform Admin Controls and Gating
-- Creates platform_admins table, suspended flag on companies, active status on company_members.

-- 1. Create platform_admins table
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text NOT NULL UNIQUE,
  is_superadmin boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage platform_admins" ON public.platform_admins
  FOR ALL USING (true);

-- 2. Add suspended column to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false;

-- 3. Add active column to company_members table
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- 4. Enable RLS on platform_admins and make it readable for checking admin role
-- (Normally this is accessed via service_role client in edge functions / server components, 
-- but this policy ensures safe authenticated reads as well)
DROP POLICY IF EXISTS "Anyone can select platform_admins" ON public.platform_admins;
CREATE POLICY "Anyone can select platform_admins" ON public.platform_admins
  FOR SELECT TO authenticated, anon USING (true);
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
