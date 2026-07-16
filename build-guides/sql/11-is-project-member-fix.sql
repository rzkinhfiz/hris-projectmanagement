CREATE OR REPLACE FUNCTION public.is_project_member(project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when to_regclass('public.project_team_members') is null then false
    else (
      exists (
        select 1
        from public.project_team_members ptm
        where ptm.project_id = $1
          and ptm.profile_id = auth.uid()
      )
      OR
      exists (
        select 1
        from public.projects p
        where p.id = $1
          and p.pm_id = auth.uid()
      )
    )
  end;
$function$;
