/* Migration to add status (and optional notes) to leads */
ALTER TABLE leads
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'new';

-- Optional: enable free‑form notes for each lead
ALTER TABLE leads
  ADD COLUMN notes TEXT NULL;
