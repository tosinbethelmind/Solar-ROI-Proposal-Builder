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
