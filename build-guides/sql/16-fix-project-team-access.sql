-- 1. Create or replace the is_project_member function to check project_resource_allocations
CREATE OR REPLACE FUNCTION public.is_project_member(project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when to_regclass('public.project_resource_allocations') is null then false
    else (
      exists (
        select 1
        from public.projects p
        where p.id = $1
          and p.pm_id = auth.uid()
      )
      OR
      exists (
        select 1
        from public.project_team_members ptm
        where ptm.project_id = $1
          and ptm.profile_id = auth.uid()
      )
      OR
      exists (
        select 1
        from public.project_resource_allocations pra
        where pra.project_id = $1
          and pra.user_id = auth.uid()
      )
    )
  end;
$function$;

-- 2. Update RLS for projects
DROP POLICY IF EXISTS "projects_select_pmo" ON public.projects;
DROP POLICY IF EXISTS "projects_select_member" ON public.projects;
DROP POLICY IF EXISTS "projects_select_manager" ON public.projects;
DROP POLICY IF EXISTS "Read access for projects" ON public.projects;

CREATE POLICY "Read access for projects"
  ON public.projects
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role' IN ('pmo', 'administrator'))
    OR is_project_member(id)
  );

-- 3. Update RLS for tasks
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
DROP POLICY IF EXISTS "Read access for tasks" ON public.tasks;

CREATE POLICY "Read access for tasks"
  ON public.tasks
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role' IN ('pmo', 'administrator'))
    OR is_project_member(project_id)
  );
