-- Supabase schema v1 draft for the Supabase Readiness Pass.
-- This file is an architecture artifact, not an applied migration.
-- It models the first pragmatic cloud persistence shape while preserving
-- the current local-first product semantics.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Application profile row keyed by auth.users. Auth remains optional until cloud sync is enabled.';

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  genre text,
  platform text,
  color text,
  emoji text,
  progress integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

comment on table public.projects is
  'Top-level user-owned game projects. Future sharing should be modeled separately, not through this v1 owner column.';

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_key text not null,
  title text not null,
  content_html text not null default '',
  status text not null default 'progress' check (status in ('progress', 'done')),
  framework text,
  flow_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.documents is
  'Saved document data. Textual drafts, activeDoc snapshots, and dirty state are intentionally not persisted.';

comment on column public.documents.module_key is
  'References the static product module key. A project_modules table can be added later if module-level persistence becomes necessary.';

comment on column public.documents.flow_data is
  'Flow builder nodes and edges remain JSONB in v1 to avoid premature normalization of UI-tool internals.';

create index documents_project_module_idx
  on public.documents(project_id, module_key);

create table public.document_messages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  ordinal integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.document_messages is
  'Document AI chat history is normalized from the first document migration to avoid preserving the local ProjectData blob shape.';

create index document_messages_document_idx
  on public.document_messages(document_id, ordinal, created_at);

create table public.production_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority text not null default 'medium',
  category text not null default 'Design',
  column_key text not null default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.production_tasks is
  'Kanban task persistence by project. Columns, priorities, and categories remain product-level string values in v1.';

create index production_tasks_project_column_idx
  on public.production_tasks(project_id, column_key);

create table public.canvas_boards (
  project_id uuid primary key references public.projects(id) on delete cascade,
  elements jsonb not null default '[]'::jsonb,
  strokes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.canvas_boards is
  'One brainstorming canvas per project. Elements and strokes remain JSONB in v1.';

comment on column public.canvas_boards.elements is
  'Canvas element internals are intentionally not normalized until collaboration or per-element history requires it.';

comment on column public.canvas_boards.strokes is
  'Freehand stroke data remains JSONB to match the current local canvas shape.';

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  kind text not null,
  bucket text not null,
  path text not null,
  mime_type text,
  size_bytes bigint,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.assets is
  'Metadata for uploaded or generated assets stored in Supabase Storage. Storage migration is intentionally later than core document migration.';

comment on column public.assets.metadata is
  'Flexible metadata for provider details, prompts, dimensions, or migration notes.';

create index assets_project_idx
  on public.assets(project_id);

create index assets_document_idx
  on public.assets(document_id);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lang text not null default 'pt',
  theme text not null default 'dark',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_settings is
  'Cloud-backed user preferences. Local settings can remain local until login/cloud sync is enabled.';

-- Future RLS policy placeholders:
-- 1. Enable row level security on all application tables before production use.
-- 2. profiles: users can select/update only their own profile row.
-- 3. projects: users can select/insert/update/delete projects where owner_id = auth.uid().
-- 4. documents, document_messages, production_tasks, canvas_boards:
--    access should be derived through the parent project owner_id.
-- 5. assets: users can access assets where owner_id = auth.uid()
--    and the related project is also owned by auth.uid().
-- 6. user_settings: users can select/update only their own settings row.
