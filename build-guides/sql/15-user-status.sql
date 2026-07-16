-- Add status column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';

-- Update existing profiles to ACTIVE if null
UPDATE public.profiles SET status = 'ACTIVE' WHERE status IS NULL;

-- Make it NOT NULL for future
ALTER TABLE public.profiles ALTER COLUMN status SET NOT NULL;
