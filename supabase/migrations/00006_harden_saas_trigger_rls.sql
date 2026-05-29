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

