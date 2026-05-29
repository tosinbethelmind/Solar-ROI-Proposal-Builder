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
