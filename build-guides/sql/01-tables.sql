-- =========================================================
-- PMO Monitoring & Governance - Tables
-- =========================================================

-- Ensure UUID generation support for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1. Create enum role type (idempotent for migrations)
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'user_role' and typnamespace = 'public'::regnamespace
  ) then
    create type public.user_role as enum ('project_team', 'project_manager', 'pmo');
  end if;
end $$;

-- 2. Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'project_team',
  project_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 3. Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status text not null default 'planned',
  start_date date,
  end_date date,
  pm_id uuid references public.profiles(id) on delete set null,
  pmo_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- 4. Project team members
create table if not exists public.project_team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('lead', 'member')),
  created_at timestamptz not null default now(),
  unique (project_id, profile_id)
);

alter table public.project_team_members enable row level security;

-- 5. Workstreams
create table if not exists public.workstreams (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_id uuid references public.workstreams(id) on delete cascade,
  name text not null,
  level text not null check (level in ('L1', 'L2', 'L3')),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workstreams enable row level security;

-- 6. Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workstream_id uuid references public.workstreams(id) on delete set null,
  name text not null,
  owner_id uuid references public.profiles(id) on delete set null,
  planned_start date,
  planned_end date,
  actual_start date,
  actual_end date,
  progress int not null default 0 check (progress between 0 and 100),
  status text not null default 'planned',
  is_governance_readonly boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

-- 7. Progress updates
create table if not exists public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  updated_by uuid not null references public.profiles(id) on delete set null,
  update_date timestamptz not null default now(),
  progress int not null default 0 check (progress between 0 and 100),
  note text
);

alter table public.progress_updates enable row level security;

-- 8. Governance indicators
create table if not exists public.governance_indicators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  indicator_type text not null,
  planned_value numeric,
  actual_value numeric,
  status text not null default 'pending',
  updated_at timestamptz not null default now()
);

alter table public.governance_indicators enable row level security;

-- 9. Governance warnings
create table if not exists public.governance_warnings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  warning_code text not null,
  message text not null,
  level text not null default 'warning' check (level in ('info', 'warning', 'critical')),
  triggered_by text not null,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.governance_warnings enable row level security;

-- 10. Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id uuid,
  action text not null,
  performed_by uuid references public.profiles(id) on delete set null,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- 11. Helpful indexes
create index if not exists idx_projects_pm_id on public.projects(pm_id);
create index if not exists idx_projects_pmo_id on public.projects(pmo_id);
create index if not exists idx_project_team_members_project_id on public.project_team_members(project_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_owner_id on public.tasks(owner_id);
create index if not exists idx_governance_indicators_project_id on public.governance_indicators(project_id);
create index if not exists idx_governance_warnings_project_id on public.governance_warnings(project_id);
