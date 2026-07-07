# Game Design Tool

Game Design Tool is a guided game design platform for turning early ideas into structured project documentation. It is built around opinionated modules, guided flows, visual planning tools, and GDD-oriented writing, not as a generic text editor or chat interface.

## Stack

- React
- TypeScript
- Vite
- localStorage persistence
- Optional Supabase foundation for authentication
- Cloudflare Pages deployment target

## Current Status

The app is currently local-first. Projects, project data, documents, canvas data, production tasks, settings, and related workspace state are persisted in the browser through localStorage.

Supabase is present only as an optional foundation for authentication. When Supabase environment variables are missing, the app remains local-only. When they are present, the app can show minimal email/password authentication UI.

Signing in does not enable cloud persistence, cloud sync, automatic import, merge behavior, protected routes, or account pages. Local data remains localStorage-backed.

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

## What Does Not Exist Yet

- Runtime cloud persistence.
- Automatic sync between localStorage and Supabase.
- Local-to-cloud import UX.
- Local/cloud merge or conflict resolution.
- Supabase-backed repositories for project or document data.
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

Persistence is intentionally still localStorage-backed. Supabase Auth exists to prepare future ownership-aware cloud persistence, but repository migration, explicit import, and cloud-backed project data remain future work.
