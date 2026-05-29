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
