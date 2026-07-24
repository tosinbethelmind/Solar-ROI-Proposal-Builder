-- Migration: Marketplace Tables and Platform Admin Roles Setup
-- Description: Creates schemas for persistent B2B installers directory, service areas, subscriptions, leads, assignments, operations logging, and updates platform admin roles.

-- 1. Create B2B Installers Profile Table
CREATE TABLE IF NOT EXISTS public.marketplace_installers (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name text NOT NULL,
  logo_url text,
  description text NOT NULL,
  specialty_tags text[] DEFAULT '{}'::text[],
  brands_handled text[] DEFAULT '{}'::text[],
  is_verified boolean DEFAULT false,
  rating_count integer DEFAULT 0,
  rating_average numeric(3,2) DEFAULT 0.00,
  response_speed text,
  contact_preference text CHECK (contact_preference IN ('WhatsApp', 'Phone Call', 'Email')),
  cac_number text,
  is_claimed boolean DEFAULT false,
  claimed_at timestamptz,
  claimed_by_email text,
  claimed_by_phone text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_installers ENABLE ROW LEVEL SECURITY;

-- 2. Create Service Area Table
CREATE TABLE IF NOT EXISTS public.installer_service_areas (
  id text PRIMARY KEY,
  installer_id text REFERENCES public.marketplace_installers(id) ON DELETE CASCADE,
  state text NOT NULL,
  city text NOT NULL
);

-- Enable RLS
ALTER TABLE public.installer_service_areas ENABLE ROW LEVEL SECURITY;

-- 3. Create Listing Subscription Table
CREATE TABLE IF NOT EXISTS public.installer_subscriptions (
  id text PRIMARY KEY,
  installer_id text REFERENCES public.marketplace_installers(id) ON DELETE CASCADE,
  tier text CHECK (tier IN ('basic', 'verified_partner', 'verified_partner_plus')) DEFAULT 'basic',
  status text CHECK (status IN ('active', 'trialing', 'canceled', 'expired')) DEFAULT 'trialing',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.installer_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Create Marketplace Leads Table
CREATE TABLE IF NOT EXISTS public.marketplace_leads (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  property_type text CHECK (property_type IN ('residential', 'commercial', 'industrial')),
  monthly_spend numeric(12,2) DEFAULT 0,
  power_source text CHECK (power_source IN ('grid', 'generator', 'mixed')),
  interest_type text CHECK (interest_type IN ('bill_savings', 'backup_power', 'full_solar')),
  budget_range text,
  preferred_contact text CHECK (preferred_contact IN ('WhatsApp', 'Phone Call', 'Email')),
  timeline text CHECK (timeline IN ('Immediate', '1-3 Months', 'Researching')),
  note text,
  request_source text CHECK (request_source IN ('general', 'estimator', 'direct_profile')) DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_leads ENABLE ROW LEVEL SECURITY;

-- 5. Create Lead Assignment Table
CREATE TABLE IF NOT EXISTS public.lead_assignments (
  id text PRIMARY KEY,
  lead_id text REFERENCES public.marketplace_leads(id) ON DELETE CASCADE,
  installer_id text REFERENCES public.marketplace_installers(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  is_exclusive boolean DEFAULT false,
  assigned_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;

-- 6. Create Operations Audit Log Table (Telemetry)
CREATE TABLE IF NOT EXISTS public.operations_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (action_type IN ('sheets_sync', 'cac_verify', 'receipt_reconcile', 'lead_route', 'admin_role_change')),
  status text NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  response_details text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operations_audit_log ENABLE ROW LEVEL SECURITY;

-- 7. Alter platform_admins to add roles
ALTER TABLE public.platform_admins ADD COLUMN IF NOT EXISTS role text DEFAULT 'superadmin' CHECK (role IN ('superadmin', 'operations', 'billing', 'read_only'));

-- 8. Define Platform Admins Security Policies
-- Platform admins can select/manage all tables in this migration
CREATE POLICY "Admins read marketplace_installers" ON public.marketplace_installers FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins manage marketplace_installers" ON public.marketplace_installers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins read service_areas" ON public.installer_service_areas FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins manage service_areas" ON public.installer_service_areas FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins read subscriptions" ON public.installer_subscriptions FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins manage subscriptions" ON public.installer_subscriptions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins read leads" ON public.marketplace_leads FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins manage leads" ON public.marketplace_leads FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins read assignments" ON public.lead_assignments FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins manage assignments" ON public.lead_assignments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins read audit_log" ON public.operations_audit_log FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
);
CREATE POLICY "Admins manage audit_log" ON public.operations_audit_log FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
);
