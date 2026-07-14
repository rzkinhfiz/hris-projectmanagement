-- =========================================================
-- PMO Monitoring & Governance - Policies
-- =========================================================

-- Profiles policies
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Projects policies
alter table public.projects enable row level security;

drop policy if exists "projects_select_pmo" on public.projects;
drop policy if exists "projects_select_member" on public.projects;
drop policy if exists "projects_select_manager" on public.projects;
drop policy if exists "projects_insert_pmo" on public.projects;
drop policy if exists "projects_update_pmo" on public.projects;

drop policy if exists "projects_update_manager" on public.projects;

create policy "projects_select_pmo"
  on public.projects
  for select
  using (public.is_pmo());

create policy "projects_select_member"
  on public.projects
  for select
  using (public.is_project_member(id));

create policy "projects_select_manager"
  on public.projects
  for select
  using (public.is_project_manager(id));

create policy "projects_insert_pmo"
  on public.projects
  for insert
  with check (public.is_pmo());

create policy "projects_update_pmo"
  on public.projects
  for update
  using (public.is_pmo());

create policy "projects_update_manager"
  on public.projects
  for update
  using (public.is_project_manager(id));

-- Project team members policies
alter table public.project_team_members enable row level security;

drop policy if exists "project_members_select_pmo" on public.project_team_members;
drop policy if exists "project_members_select_member" on public.project_team_members;
drop policy if exists "project_members_insert_pmo" on public.project_team_members;
drop policy if exists "project_members_update_pmo" on public.project_team_members;

create policy "project_members_select_pmo"
  on public.project_team_members
  for select
  using (public.is_pmo());

create policy "project_members_select_member"
  on public.project_team_members
  for select
  using (public.is_project_member(project_id));

create policy "project_members_insert_pmo"
  on public.project_team_members
  for insert
  with check (public.is_pmo());

create policy "project_members_update_pmo"
  on public.project_team_members
  for update
  using (public.is_pmo());

-- Workstreams policies
alter table public.workstreams enable row level security;

drop policy if exists "workstreams_select_pmo" on public.workstreams;
drop policy if exists "workstreams_select_member" on public.workstreams;
drop policy if exists "workstreams_select_manager" on public.workstreams;
drop policy if exists "workstreams_insert_pmo" on public.workstreams;
drop policy if exists "workstreams_update_pmo" on public.workstreams;

create policy "workstreams_select_pmo"
  on public.workstreams
  for select
  using (public.is_pmo());

create policy "workstreams_select_member"
  on public.workstreams
  for select
  using (public.is_project_member(project_id));

create policy "workstreams_select_manager"
  on public.workstreams
  for select
  using (public.is_project_manager(project_id));

create policy "workstreams_insert_pmo"
  on public.workstreams
  for insert
  with check (public.is_pmo());

create policy "workstreams_update_pmo"
  on public.workstreams
  for update
  using (public.is_pmo());

-- Tasks policies
alter table public.tasks enable row level security;

drop policy if exists "tasks_select_pmo" on public.tasks;
drop policy if exists "tasks_select_member" on public.tasks;
drop policy if exists "tasks_select_manager" on public.tasks;
drop policy if exists "tasks_update_member" on public.tasks;
drop policy if exists "tasks_update_manager" on public.tasks;
drop policy if exists "tasks_insert_pmo" on public.tasks;
drop policy if exists "tasks_insert_member" on public.tasks;

create policy "tasks_select_pmo"
  on public.tasks
  for select
  using (public.is_pmo());

create policy "tasks_select_member"
  on public.tasks
  for select
  using (public.is_project_member(project_id));

create policy "tasks_select_manager"
  on public.tasks
  for select
  using (public.is_project_manager(project_id));

create policy "tasks_update_member"
  on public.tasks
  for update
  using (public.is_project_member(project_id));

create policy "tasks_update_manager"
  on public.tasks
  for update
  using (public.is_project_manager(project_id));

create policy "tasks_insert_pmo"
  on public.tasks
  for insert
  with check (public.is_pmo());

create policy "tasks_insert_member"
  on public.tasks
  for insert
  with check (public.is_project_member(project_id));

-- Progress updates policies
alter table public.progress_updates enable row level security;

drop policy if exists "progress_updates_select_pmo" on public.progress_updates;
drop policy if exists "progress_updates_select_member" on public.progress_updates;
drop policy if exists "progress_updates_select_manager" on public.progress_updates;
drop policy if exists "progress_updates_insert_member" on public.progress_updates;

drop policy if exists "progress_updates_update_member" on public.progress_updates;

create policy "progress_updates_select_pmo"
  on public.progress_updates
  for select
  using (public.is_pmo());

create policy "progress_updates_select_member"
  on public.progress_updates
  for select
  using (public.is_project_member(project_id));

create policy "progress_updates_select_manager"
  on public.progress_updates
  for select
  using (public.is_project_manager(project_id));

create policy "progress_updates_insert_member"
  on public.progress_updates
  for insert
  with check (public.is_project_member(project_id));

create policy "progress_updates_update_member"
  on public.progress_updates
  for update
  using (public.is_project_member(project_id));

-- Governance indicators policies
alter table public.governance_indicators enable row level security;

drop policy if exists "gov_indicators_select_all_auth" on public.governance_indicators;
drop policy if exists "gov_indicators_write_pmo" on public.governance_indicators;
drop policy if exists "gov_indicators_update_pmo" on public.governance_indicators;
drop policy if exists "gov_indicators_delete_pmo" on public.governance_indicators;

create policy "gov_indicators_select_all_auth"
  on public.governance_indicators
  for select
  using (auth.role() = 'authenticated');

create policy "gov_indicators_write_pmo"
  on public.governance_indicators
  for insert
  with check (public.is_pmo());

create policy "gov_indicators_update_pmo"
  on public.governance_indicators
  for update
  using (public.is_pmo());

create policy "gov_indicators_delete_pmo"
  on public.governance_indicators
  for delete
  using (public.is_pmo());

-- Governance warnings policies
alter table public.governance_warnings enable row level security;

drop policy if exists "gov_warnings_select_all_auth" on public.governance_warnings;
drop policy if exists "gov_warnings_write_pmo" on public.governance_warnings;
drop policy if exists "gov_warnings_update_pmo" on public.governance_warnings;
drop policy if exists "gov_warnings_delete_pmo" on public.governance_warnings;

create policy "gov_warnings_select_all_auth"
  on public.governance_warnings
  for select
  using (auth.role() = 'authenticated');

create policy "gov_warnings_write_pmo"
  on public.governance_warnings
  for insert
  with check (public.is_pmo());

create policy "gov_warnings_update_pmo"
  on public.governance_warnings
  for update
  using (public.is_pmo());

create policy "gov_warnings_delete_pmo"
  on public.governance_warnings
  for delete
  using (public.is_pmo());

-- Audit logs policies
alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_pmo" on public.audit_logs;
drop policy if exists "audit_logs_insert_pmo" on public.audit_logs;

create policy "audit_logs_select_pmo"
  on public.audit_logs
  for select
  using (public.is_pmo());

create policy "audit_logs_insert_pmo"
  on public.audit_logs
  for insert
  with check (public.is_pmo());
