-- Migration 20: Resource Management Safe Delete & Offboarding
-- Adds `is_active` and `end_date` columns to project_resource_allocations

-- 1. Update project_resource_allocations
ALTER TABLE public.project_resource_allocations 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- The `functional_roles` table already has `is_active` from Migration 19.

-- Add index on is_active for faster filtering
CREATE INDEX IF NOT EXISTS idx_project_resource_allocations_is_active 
ON public.project_resource_allocations(is_active);

-- Informative Comment:
-- Safe delete logic will be handled at the application layer via Smart Removal:
-- 1. If a resource has logged time on the project (time_logs), we perform a Soft Delete 
--    (is_active = false, end_date = NOW()) to preserve cost/budget calculations.
-- 2. If no time has been logged, we perform a Hard Delete (DELETE FROM) to clean up.
