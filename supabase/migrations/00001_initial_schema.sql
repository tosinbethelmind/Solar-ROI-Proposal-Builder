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
    description TEXT NOT NULL,         -- e.g. "DC Cables (25mm²)", "MC4 Connectors x10"
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
