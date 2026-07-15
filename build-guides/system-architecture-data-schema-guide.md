# System Architecture & Data Schema Guide

## Tujuan
Panduan ini mendefinisikan struktur tabel Supabase (PostgreSQL) untuk sistem PMO Monitoring & Governance, serta aturan Row Level Security (RLS) untuk memastikan area governance bersifat read-only bagi pengguna non-PMO.

## Struktur Tabel Utama

### `profiles`
- `id uuid primary key`
- `email text not null unique`
- `full_name text not null`
- `role text not null` — enum: `project_team`, `project_manager`, `pmo`
- `project_id uuid` (opsional untuk anggota tim yang terkait proyek tertentu)
- `created_at timestamptz default now()`

### `projects`
- `id uuid primary key`
- `code text not null unique`
- `name text not null`
- `description text`
- `status text not null`
- `start_date date`
- `end_date date`
- `pm_id uuid references profiles(id)`
- `pmo_id uuid references profiles(id)`
- `created_at timestamptz default now()`

### `project_team_members`
- `id uuid primary key`
- `project_id uuid references projects(id)`
- `profile_id uuid references profiles(id)`
- `role text not null` — `lead`, `member`
- `created_at timestamptz default now()`

### `workstreams`
- `id uuid primary key`
- `project_id uuid references projects(id)`
- `parent_id uuid references workstreams(id)`
- `name text not null`
- `level text not null` — `L1`, `L2`, `L3`
- `status text not null`
- `created_at timestamptz default now()`

### `tasks`
- `id uuid primary key`
- `project_id uuid references projects(id)`
- `workstream_id uuid references workstreams(id)`
- `name text not null`
- `owner_id uuid references profiles(id)`
- `planned_start date`
- `planned_end date`
- `actual_start date`
- `actual_end date`
- `progress int default 0`
- `status text not null`
- `is_governance_readonly boolean default false`
- `created_at timestamptz default now()`

### `progress_updates`
- `id uuid primary key`
- `task_id uuid references tasks(id)`
- `project_id uuid references projects(id)`
- `updated_by uuid references profiles(id)`
- `update_date timestamptz default now()`
- `progress int not null`
- `note text`

### `governance_indicators`
- `id uuid primary key`
- `project_id uuid references projects(id)`
- `indicator_type text not null`
- `planned_value numeric`
- `actual_value numeric`
- `status text not null`
- `updated_at timestamptz default now()`

### `governance_warnings`
- `id uuid primary key`
- `project_id uuid references projects(id)`
- `warning_code text not null`
- `message text not null`
- `level text not null` — `info`, `warning`, `critical`
- `triggered_by text not null`
- `created_at timestamptz default now()`
- `is_resolved boolean default false`

### `audit_logs`
- `id uuid primary key`
- `entity text not null`
- `entity_id uuid`
- `action text not null`
- `performed_by uuid references profiles(id)`
- `details jsonb`
- `created_at timestamptz default now()`

## Role & Permission Matrix

| Role | Akses Utama | Create | Read | Update | Delete | Governance Read-only |
|---|---|---|---|---|---|---|
| `project_team` | own project/task | ✅ progress, note | ✅ own project/task, own profile | ✅ own progress/task, own profile | ❌ | ✅ baca saja |
| `project_manager` | project planning/execution | ✅ planning, milestones, tasks | ✅ project, own profile | ✅ plan/execution, own profile | ❌ | ✅ baca saja |
| `pmo` | monitoring penuh & admin | ✅ user, project, warning | ✅ semua | ✅ user, project, governance | ✅ governance, user (deactivate) | ❌ bukan read-only |

> - **Account Settings:** Semua role dapat melakukan *Read* dan *Update* pada profil mereka sendiri (Edit Nama, Ganti Password).
> - **User Management:** Hanya role `pmo` yang dapat melakukan CRUD pada entitas `profiles`.
> - **Project CRUD:** Pembuatan proyek (Create) dilakukan oleh `pmo`. Pengelolaan data operasional proyek (Update) dilakukan oleh `project_manager`. Governance area harus hanya dapat ditulis oleh role `pmo`.

## Row Level Security (RLS)

### Logika RLS Umum
- `project_team` hanya dapat mengakses data proyek yang menjadi anggota tim mereka.
- `project_manager` hanya dapat mengakses proyek yang mereka manage.
- `pmo` dapat melihat seluruh data sekaligus mengubah governance.
- Semua role dapat membaca `governance_indicators` dan `governance_warnings`, tetapi update/delete governance hanya untuk `pmo`.

### Contoh fungsi helper

```sql
create function public.is_project_member(project_id uuid) returns boolean 
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from project_team_members
    where project_id = $1
      and profile_id = auth.uid()
  );
$$;
```

### Contoh policy untuk tabel `projects`

```sql
alter table projects enable row level security;

create policy "Project team can select own projects" on projects
  for select using (
    auth.role() = 'project_team'
    and exists (
      select 1 from project_team_members
      where project_id = projects.id
        and profile_id = auth.uid()
    )
  );

create policy "Project manager can select managed projects" on projects
  for select using (
    auth.role() = 'project_manager'
    and pm_id = auth.uid()
  );

create policy "Project manager can update managed projects" on projects
  for update using (
    auth.role() = 'project_manager'
    and pm_id = auth.uid()
  );

create policy "PMO can select all projects" on projects
  for select using (
    auth.role() = 'pmo'
  );

create policy "PMO can insert projects" on projects
  for insert with check (
    auth.role() = 'pmo'
  );

create policy "PMO can update all projects" on projects
  for update using (
    auth.role() = 'pmo'
  );
```

### Contoh policy untuk tabel `profiles` (User Management)

```sql
alter table profiles enable row level security;

create policy "Users can select own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "PMO can select all profiles" on profiles
  for select using (auth.role() = 'pmo');

create policy "PMO can insert profiles" on profiles
  for insert with check (auth.role() = 'pmo');

create policy "PMO can update all profiles" on profiles
  for update using (auth.role() = 'pmo');
```

### Contoh policy governance read-only

```sql
alter table governance_indicators enable row level security;

grant select on governance_indicators to authenticated;

create policy "Governance select for all roles" on governance_indicators
  for select using (
    auth.role() in ('pmo','project_manager','project_team')
  );

create policy "Governance update only for PMO" on governance_indicators
  for update using (auth.role() = 'pmo');
create policy "Governance delete only for PMO" on governance_indicators
  for delete using (auth.role() = 'pmo');

alter table governance_warnings enable row level security;
create policy "Governance warnings select for all roles" on governance_warnings
  for select using (
    auth.role() in ('pmo','project_manager','project_team')
  );
create policy "Governance warnings update/delete only for PMO" on governance_warnings
  for update using (auth.role() = 'pmo');
create policy "Governance warnings update/delete only for PMO" on governance_warnings
  for delete using (auth.role() = 'pmo');
```

## Praktik Terbaik Next.js + Supabase

- Simpan koneksi Supabase di `/lib/supabaseClient.ts`.
- Gunakan `auth.role()` dan `auth.uid()` untuk policy.
- Jangan hardcode role di client; baca role dari session jika render UI.
- Gunakan service layer di `/services` untuk data access.
- `governance` read-only enforcement harus ada di dua lapis: Supabase RLS + UI.
