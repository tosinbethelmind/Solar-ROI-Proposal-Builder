-- PostgreSQL Schema for SolarQuotePro Installer Marketplace

-- 1. Installer Profiles
CREATE TABLE IF NOT EXISTS installer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    business_name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT NOT NULL,
    specialty_tags TEXT[] DEFAULT '{}',
    brands_handled TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    rating_count INT DEFAULT 0,
    rating_average FLOAT DEFAULT 0.0,
    response_speed TEXT DEFAULT 'Usually within 24 hours',
    contact_preference TEXT DEFAULT 'WhatsApp',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Service Areas (States & Cities covered by each installer)
CREATE TABLE IF NOT EXISTS service_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installer_id UUID NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    UNIQUE(installer_id, state, city)
);

-- 3. Listing Subscriptions (SaaS listing tiers separate from operational proposal software)
CREATE TABLE IF NOT EXISTS listing_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installer_id UUID NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('basic', 'verified_partner', 'verified_partner_plus')),
    status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Homeowner Leads
CREATE TABLE IF NOT EXISTS homeowner_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    phone TEXT,
    email TEXT,
    location TEXT,
    running_load_w INTEGER,
    kva_recommended TEXT,
    monthly_savings_ngn NUMERIC,
    monthly_fuel_spend NUMERIC,
    full_name TEXT,
    whatsapp TEXT,
    city_disco TEXT,
    estimated_system_size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Lead Assignments (Tracks lead routing)
CREATE TABLE IF NOT EXISTS lead_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES homeowner_leads(id) ON DELETE CASCADE,
    installer_id UUID NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
    is_exclusive BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE installer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeowner_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view profiles, only owners can manage
CREATE POLICY "Public profiles are readable by everyone" ON installer_profiles 
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own installer profile" ON installer_profiles 
    FOR ALL USING (auth.uid() = user_id);

-- Service Areas: Anyone can view, only profile owner can manage
CREATE POLICY "Public service areas are readable by everyone" ON service_areas 
    FOR SELECT USING (true);

CREATE POLICY "Installers can manage their own service areas" ON service_areas 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM installer_profiles 
            WHERE installer_profiles.id = service_areas.installer_id 
            AND installer_profiles.user_id = auth.uid()
        )
    );

-- Leads: Homeowners can write, installers can read assigned leads
CREATE POLICY "Homeowners can submit leads" ON homeowner_leads 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Installers can view leads assigned to them" ON homeowner_leads 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lead_assignments
            INNER JOIN installer_profiles ON lead_assignments.installer_id = installer_profiles.id
            WHERE lead_assignments.lead_id = homeowner_leads.id
            AND installer_profiles.user_id = auth.uid()
        )
    );
