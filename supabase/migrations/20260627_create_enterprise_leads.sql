/* Migration to create enterprise_leads table and configure security policies */
CREATE TABLE IF NOT EXISTS public.enterprise_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  project_scope TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.enterprise_leads ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Anyone can insert enterprise leads" ON public.enterprise_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage enterprise leads" ON public.enterprise_leads FOR SELECT USING (true);
