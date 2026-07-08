# Game Design Tool

Game Design Tool is a guided game design platform for turning early ideas into structured project documentation. It is built around opinionated modules, guided flows, visual planning tools, and GDD-oriented writing, not as a generic text editor or chat interface.

## Stack

- React
- TypeScript
- Vite
- localStorage-backed project data persistence
- Optional Supabase Auth and cloud-backed project list persistence
- Cloudflare Pages deployment target

## Current Status

The app is local-first for internal project data. Documents, canvas data, production tasks, settings, chats, and related workspace state are persisted in the browser through localStorage.

Supabase is optional. When Supabase environment variables are missing, the app remains local-only. When they are present, authenticated users use a fresh cloud-backed project list, while anonymous users remain localStorage-backed.

Signing in enables cloud persistence only for the top-level project list. Project contents remain local-only, and there is no automatic import, sync, merge behavior, protected routes, or account pages.

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

## What Does Not Exist Yet

- Cloud persistence for internal project data, documents, tasks, canvas, chats, or settings.
- Automatic sync between localStorage and Supabase.
- Local-to-cloud import UX, which is out of scope for this phase.
- Local/cloud merge or conflict resolution.
- Supabase-backed repositories for document or project detail data.
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

The top-level project list is cloud-backed for authenticated Supabase users. Internal project data remains localStorage-backed until narrower document, task, canvas, chat, and asset repositories are designed and migrated.
