-- Migration: Allow public updates to proposals for client interaction tracking
CREATE POLICY "Public update proposals" ON proposals
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
