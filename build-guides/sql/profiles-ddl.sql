-- DDL untuk tabel profiles yang terhubung ke auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'project_team' check (role in ('project_team', 'project_manager', 'pmo')),
  project_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Opsional: aktifkan RLS agar user hanya bisa mengakses data miliknya
alter table public.profiles enable row level security;

create policy if not exists "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy if not exists "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Trigger otomatis saat user baru daftar lewat Supabase Auth
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

create trigger if not exists on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
