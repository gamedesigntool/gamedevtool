# Game Design Tool

Game Design Tool is a guided game design platform for turning early ideas into structured project documentation. It is built around opinionated modules, guided flows, visual planning tools, and GDD-oriented writing, not as a generic text editor or chat interface.

## Stack

- React
- TypeScript
- Vite
- localStorage-backed project data persistence
- Optional Supabase Auth, cloud-backed project list persistence, and active project data blob persistence
- Cloudflare Pages deployment target

## Current Status

The app is local-first for anonymous and Supabase-unconfigured usage. Documents, canvas data, production tasks, settings, chats, and related workspace state remain browser-local in those modes.

Supabase is optional. When Supabase environment variables are missing, the app remains local-only. When they are present, authenticated users use a fresh cloud-backed project list and a cloud-backed `project_data` JSONB blob for the active project's internal content.

Signing in enables cloud persistence only for the migrated runtime boundaries: the top-level project list and the active project's `project_data` blob. There is no automatic import, sync, merge behavior, protected routes, or account pages.

Existing local projects are not imported or merged into cloud workspaces for this phase.

## What Exists Today

- Project dashboard with local project creation, cloning, deletion, and progress tracking.
- Guided game design modules for brainstorming, production, mechanics, characters, worldbuilding, narrative, level design, and flowcharts.
- Document creation and editing inside project modules.
- Document-level AI chat assistance.
- Visual brainstorming canvas with notes, drawing, shapes, and images.
- Production Kanban board.
- Flow builder for visual gameplay, narrative, or decision flows.
- Guided framework flows for selected design areas.
- PDF export for selected GDD modules and documents.
- Theme and language preferences saved locally.
- Optional Supabase Auth session foundation when configured.
- Cloud-backed project list persistence for authenticated users when Supabase is configured.
- Cloud-backed active project data persistence through the `project_data` JSONB blob for authenticated users when Supabase is configured.

## What Does Not Exist Yet

- Normalized cloud persistence for documents, tasks, canvas, chats, assets, or settings beyond the active `project_data` blob.
- Automatic sync between localStorage and Supabase.
- Local-to-cloud import UX, which is out of scope for this phase.
- Local/cloud merge or conflict resolution.
- Normalized Supabase-backed repositories for document, task, canvas, chat, or asset detail data.
- Supabase Storage-backed assets.
- Edge Functions or a secure AI proxy.
- Protected routes, account pages, or cloud workspace switching.
- Realtime collaboration.

## Environment Setup

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Supabase is optional. To enable the current authentication foundation, create a local environment file with placeholder values like:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Without these variables, the app runs in local-only mode and no Supabase-backed auth UI is required.

## Available Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run preview
```

## Validation

Before handing off changes, run:

```bash
npm run lint
npm run typecheck
npm run build
git diff --check
```

## Architecture Notes

The top-level project list is cloud-backed for authenticated Supabase users. Authenticated cloud projects store internal project content in `project_data.data` as an MVP JSONB blob.

The blob is an intentional bridge and current source of truth for migrated project contents. It supports fast iteration across new modules, guided flows, documents, production tasks, canvas/flow data, and AI chat history without schema churn.

This is not the final ideal architecture for every future need. Known pressure points include cache granularity, indexing and search, analytics, partial updates, large project blobs, frequent canvas writes, multi-device conflicts, collaboration/realtime, and embedded base64 images.

Future normalized repositories should be extracted only when real product needs justify them. The likely order is document data, document messages, production tasks, canvas/flow data, and finally assets backed by Supabase Storage. Future migrations can backfill normalized tables from `project_data.data`.

Large images should not remain embedded as base64 inside `project_data` long term. Future Storage work should store binary assets in Supabase Storage and keep references, keys, or URLs in project data. An `assets` table should be added only when metadata, cleanup, deduplication, thumbnails, permissions, or analytics require it.
