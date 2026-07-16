-- Drop existing INSERT policies for tasks
DROP POLICY IF EXISTS "tasks_insert_member" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_pmo" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_manager" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_admin" ON public.tasks;

-- 1. PMO and Administrator can insert tasks on any project
CREATE POLICY "tasks_insert_pmo_admin" ON public.tasks
FOR INSERT
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('pmo', 'administrator')
);

-- 2. Project Manager can insert tasks ONLY if they are the PM of the project
CREATE POLICY "tasks_insert_manager" ON public.tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id 
    AND pm_id = auth.uid()
  )
);

-- Note: 'project_team' role is NOT allowed to insert tasks.
