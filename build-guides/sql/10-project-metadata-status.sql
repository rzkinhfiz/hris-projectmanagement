-- Migration: Update project status enum values
-- Map existing statuses to new format

UPDATE projects SET status = 'Draft' WHERE status = 'draft';
UPDATE projects SET status = 'In progress' WHERE status = 'active';
UPDATE projects SET status = 'Hold' WHERE status = 'on_hold';
UPDATE projects SET status = 'Completed' WHERE status = 'completed';

NOTIFY pgrst, 'reload schema';
