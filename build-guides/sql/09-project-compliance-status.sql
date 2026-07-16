-- Migration: Project Compliance Status & Document URLs
-- Add Legal Document URLs
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS spk_document_url TEXT,
  ADD COLUMN IF NOT EXISTS nda_document_url TEXT;

-- Update existing statuses to map to the new LegalStatus types
UPDATE projects SET spk_status = 'NOT_STARTED' WHERE spk_status = 'pending';
UPDATE projects SET spk_status = 'SIGNED' WHERE spk_status = 'done';

UPDATE projects SET nda_status = 'NOT_STARTED' WHERE nda_status = 'pending';
UPDATE projects SET nda_status = 'SIGNED' WHERE nda_status = 'done';
UPDATE projects SET nda_status = 'NOT_REQUIRED' WHERE nda_status = 'not_required';
