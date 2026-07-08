-- Secure project persistence foundation for Cloud Product Foundation.
-- Authenticated runtime project lists are cloud-backed; anonymous/unconfigured usage remains local.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  genre text not null default 'Indefinido',
  platform text not null default 'Indefinida',
  color text not null,
  emoji text not null,
  progress integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects
  add column if not exists owner_id uuid,
  add column if not exists name text,
  add column if not exists genre text,
  add column if not exists platform text,
  add column if not exists color text,
  add column if not exists emoji text,
  add column if not exists progress integer,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

alter table public.projects
  alter column id set default gen_random_uuid(),
  alter column owner_id set default auth.uid(),
  alter column genre set default 'Indefinido',
  alter column platform set default 'Indefinida',
  alter column progress set default 0,
  alter column created_at set default now(),
  alter column updated_at set default now();

update public.projects
set
  genre = coalesce(genre, 'Indefinido'),
  platform = coalesce(platform, 'Indefinida'),
  color = coalesce(color, '#7c3aed'),
  emoji = coalesce(emoji, '🎮'),
  progress = coalesce(progress, 0),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.projects
  alter column owner_id set not null,
  alter column name set not null,
  alter column genre set not null,
  alter column platform set not null,
  alter column color set not null,
  alter column emoji set not null,
  alter column progress set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_owner_id_fkey'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_owner_id_fkey
      foreign key (owner_id)
      references auth.users(id)
      on delete cascade;
  end if;
end
$$;

alter table public.projects
  drop constraint if exists projects_progress_range;

alter table public.projects
  add constraint projects_progress_range
  check (progress >= 0 and progress <= 100);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;

create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

alter table public.projects enable row level security;

drop policy if exists "Users can read own projects" on public.projects;
drop policy if exists "Users can create own projects" on public.projects;
drop policy if exists "Users can update own projects" on public.projects;
drop policy if exists "Users can delete own projects" on public.projects;

create policy "Users can read own projects"
on public.projects
for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can create own projects"
on public.projects
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update own projects"
on public.projects
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete own projects"
on public.projects
for delete
to authenticated
using (owner_id = auth.uid());
