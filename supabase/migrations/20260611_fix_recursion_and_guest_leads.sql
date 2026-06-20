-- Migration: Fix company_members infinite recursion & enable anonymous guest implementation leads

-- 1. Helper functions with SECURITY DEFINER to bypass RLS recursion loops
CREATE OR REPLACE FUNCTION public.get_user_companies(user_uuid uuid)
RETURNS TABLE (company_id uuid) AS $$
BEGIN
  RETURN QUERY 
  SELECT cm.company_id 
  FROM public.company_members cm 
  WHERE cm.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_company_admin(user_uuid uuid, company_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.company_members cm 
    WHERE cm.user_id = user_uuid 
      AND cm.company_id = company_uuid 
      AND cm.role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop and recreate company_members policies without recursion
DROP POLICY IF EXISTS "read own company members" ON public.company_members;
CREATE POLICY "read own company members"
  ON public.company_members FOR SELECT
  USING (
    user_id = auth.uid() 
    OR 
    company_id IN (SELECT public.get_user_companies(auth.uid()))
  );

DROP POLICY IF EXISTS "owners/admins can manage company members" ON public.company_members;
CREATE POLICY "owners/admins can manage company members"
  ON public.company_members FOR ALL
  USING (public.is_company_admin(auth.uid(), company_id));

-- 3. Drop and recreate implementation_leads policies to support anonymous guest submissions
DROP POLICY IF EXISTS "Users can insert own company implementation leads" ON public.implementation_leads;
CREATE POLICY "Users can insert own company implementation leads" ON public.implementation_leads
  FOR INSERT WITH CHECK (
    company_id IS NULL 
    OR 
    company_id IN (SELECT public.get_user_companies(auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view own company implementation leads" ON public.implementation_leads;
CREATE POLICY "Users can view own company implementation leads" ON public.implementation_leads
  FOR SELECT USING (
    company_id IN (SELECT public.get_user_companies(auth.uid()))
  );
