CREATE TYPE time_log_status AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

CREATE TABLE IF NOT EXISTS public.time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    hours NUMERIC(5, 2) NOT NULL CHECK (hours >= 0 AND hours <= 24),
    status time_log_status NOT NULL DEFAULT 'DRAFT',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "time_logs_select_all"
ON public.time_logs FOR SELECT 
USING (
  profile_id = auth.uid() 
  OR public.is_project_member(project_id) 
  OR public.is_pmo() 
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'administrator'
);

-- Insert policy (only for oneself)
CREATE POLICY "time_logs_insert_own"
ON public.time_logs FOR INSERT 
WITH CHECK (
  profile_id = auth.uid()
);

-- Update policy (own draft/rejected, or PM/Admin approve/reject)
CREATE POLICY "time_logs_update_access"
ON public.time_logs FOR UPDATE
USING (
  profile_id = auth.uid() 
  OR public.is_project_manager(project_id) 
  OR public.is_pmo() 
  OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'administrator'
);

-- Delete policy (only own draft)
CREATE POLICY "time_logs_delete_own_draft"
ON public.time_logs FOR DELETE
USING (
  profile_id = auth.uid() AND (status = 'DRAFT' OR status = 'REJECTED')
);
