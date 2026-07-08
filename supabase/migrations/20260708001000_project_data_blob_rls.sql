-- Minimal project data blob foundation for Cloud Product Foundation.
-- Runtime wiring remains separate from this migration.

create table if not exists public.project_data (
  project_id uuid primary key references public.projects(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_data_data_is_object check (jsonb_typeof(data) = 'object')
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_project_data_updated_at on public.project_data;

create trigger set_project_data_updated_at
before update on public.project_data
for each row
execute function public.set_updated_at();

alter table public.project_data enable row level security;

drop policy if exists "Users can read own project data" on public.project_data;
drop policy if exists "Users can create own project data" on public.project_data;
drop policy if exists "Users can update own project data" on public.project_data;
drop policy if exists "Users can delete own project data" on public.project_data;

create policy "Users can read own project data"
on public.project_data
for select
to authenticated
using (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.projects
    where projects.id = project_data.project_id
      and projects.owner_id = auth.uid()
  )
);

create policy "Users can create own project data"
on public.project_data
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.projects
    where projects.id = project_data.project_id
      and projects.owner_id = auth.uid()
  )
);

create policy "Users can update own project data"
on public.project_data
for update
to authenticated
using (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.projects
    where projects.id = project_data.project_id
      and projects.owner_id = auth.uid()
  )
)
with check (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.projects
    where projects.id = project_data.project_id
      and projects.owner_id = auth.uid()
  )
);

create policy "Users can delete own project data"
on public.project_data
for delete
to authenticated
using (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.projects
    where projects.id = project_data.project_id
      and projects.owner_id = auth.uid()
  )
);
