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
