ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name TEXT;
NOTIFY pgrst, 'reload schema';
