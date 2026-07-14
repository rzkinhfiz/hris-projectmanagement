-- =========================================================
-- PMO Monitoring & Governance - Functions and Grants
-- =========================================================

-- Helper: check if current user is member of a project
create or replace function public.is_project_member(project_id uuid)
returns boolean
language sql
stable
as $$
  select case
    when to_regclass('public.project_team_members') is null then false
    else exists (
      select 1
      from public.project_team_members ptm
      where ptm.project_id = $1
        and ptm.profile_id = auth.uid()
    )
  end;
$$;

-- Helper: check if current user is PMO
create or replace function public.is_pmo()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'pmo'
  );
$$;

-- Helper: check if current user manages a project
create or replace function public.is_project_manager(project_id uuid)
returns boolean
language sql
stable
as $$
  select case
    when to_regclass('public.projects') is null then false
    else exists (
      select 1
      from public.projects p
      where p.id = $1
        and p.pm_id = auth.uid()
    )
  end;
$$;

-- Trigger to auto-create profile when auth user registers
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, project_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'project_team',
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Grant the authenticated role access to the schema and tables.
-- RLS policies will still enforce the final access rules.
grant usage on schema public to authenticated;
grant usage on type public.user_role to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.project_team_members to authenticated;
grant select, insert, update, delete on public.workstreams to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.progress_updates to authenticated;
grant select, insert, update, delete on public.governance_indicators to authenticated;
grant select, insert, update, delete on public.governance_warnings to authenticated;
grant select, insert, update, delete on public.audit_logs to authenticated;

grant execute on function public.is_project_member(uuid) to authenticated;
grant execute on function public.is_pmo() to authenticated;
grant execute on function public.is_project_manager(uuid) to authenticated;
grant execute on function public.handle_new_user() to authenticated;
