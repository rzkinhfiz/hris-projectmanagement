-- Add avatar_url and phone_number to public.profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
