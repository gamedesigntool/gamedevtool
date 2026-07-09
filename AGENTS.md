# AGENTS.md — Game Design Tool

## Purpose

This repository uses AI-assisted development (Codex, Copilot, ChatGPT).
This file defines how AI agents should behave when working on this project.

The goal is not just to generate code, but to act as a thoughtful engineering and product partner.

---

## Product Identity

Game Design Tool is NOT a generic AI text editor.

It is a guided game design platform that helps users:
- move from idea → structured design
- build GDDs using frameworks and guided flows
- think like a game designer, not just write text

Key principles:
- Opinionated workflows are a feature, not a limitation
- Structure is more valuable than freeform flexibility
- The tool should assist thinking, not just writing

Do NOT simplify the product into:
- a chat interface
- a generic notes editor
- a Google Docs clone with AI

---

## Current Phase

The project is in:

→ Secure AI Foundation

Previous completed phases:
- Data Extraction Pass
- Architecture Boundary Pass
- Provider & Async Boundaries Pass
- Render & State Stabilization Pass
- Document Architecture Planning Pass
- Document Actions Extraction Pass
- Editor Orchestration Pass
- Document Product Decisions Pass
- Editor Sync Hardening Pass
- Supabase Readiness Pass
- Supabase Foundation Pass
- Supabase Authentication Pass
- Repository Migration Planning Pass
- Production Readiness Pass
- Cloud Product Foundation

Completed Supabase Authentication Pass:
- optional Supabase authentication
- session reading
- auth state observation
- minimal email/password login and logout foundations
- authenticated user identity for future cloud persistence
- local-first behavior preserved

Completed Production Readiness Pass:
- safe `.env.example` with placeholder Supabase variables
- local environment files ignored by Git
- `typecheck` script available
- TypeScript clean
- ESLint clean
- production build passing
- minimum auth UX with login, signup, password reset, logout, and signed-in user email display
- README updated from the default Vite template to the current project state

Completed Cloud Product Foundation:
- authenticated users use Supabase for the top-level project list when Supabase is configured
- authenticated cloud projects use Supabase `project_data` for the active project's internal content blob
- anonymous and Supabase-unconfigured users remain localStorage-backed
- Cloud Product Foundation persistence migrations remain limited to `projects` and `project_data`
- local-to-cloud import, automatic sync, merge, realtime collaboration, and Storage/assets remain out of scope

Current goals:
- harden the implemented secure text AI foundation
- keep text AI execution behind the secure backend boundary
- keep provider secrets out of frontend code
- keep the current cloud persistence baseline stable
- preserve local-first anonymous and Supabase-unconfigured behavior until explicit AI product decisions change it
- keep Supabase Edge Functions as the MVP secure AI proxy unless implementation findings prove otherwise
- keep the implemented text AI proxy path stable before image generation migration
- enforce the MVP daily text AI usage counter before provider calls
- avoid overbuilding multi-provider abstractions before the first secure provider path works
- keep validation commands passing before handoff

Current non-goals:
- local-to-cloud import
- automatic sync
- coexistence between local and cloud workspaces for the same user
- local/cloud merge
- conflict resolution
- preserving existing local projects after login
- realtime collaboration
- autosave
- global state
- broad hooks extraction
- normalized documents/tasks/canvas/assets/settings tables in active migrations
- Supabase Storage/assets handling
- image generation ownership/storage migration unless explicitly reintroduced
- RAG, embeddings, vector memory, workflow engines, complex billing, or enterprise rate limiting
- prompt registry/versioning as a full system
- broad multi-provider framework architecture
- large rewrites

---

## Canonical Architecture Documents

The following documents are the current source of truth:

- docs/architecture/document-semantics.md
- docs/architecture/editor-orchestration.md
- docs/architecture/editor-sync-risks.md
- docs/architecture/persistence-context.md
- docs/architecture/repository-migration-strategy.md
- docs/architecture/secure-ai-foundation.md
- docs/architecture/secure-ai-validation.md
- docs/architecture/supabase-readiness.md
- docs/architecture/supabase-schema-v1.sql

These documents must be consulted before proposing architectural changes.

`docs/architecture/local-to-cloud-import-service.md` is historical planning from an earlier assumption. It is not active or canonical for the Secure AI Foundation phase unless local project import is explicitly reintroduced later.

Repository migration documents remain canonical planning references. Runtime cloud persistence has started for the authenticated top-level project list and active `project_data` blobs.

---

## Current Architectural State

Already extracted:
- domain types
- repositories
- mutation helpers
- selectors
- runtime/text/export utilities
- guide constants
- document suggestions
- document message mutation helpers
- aiMessageService
- aiClient
- imageGenerationService
- projectBootstrapService
- authSessionService
- AuthControls

Production readiness already completed:
- safe Supabase environment example
- environment ignore policy
- `typecheck` script
- TypeScript cleanup
- ESLint cleanup
- README cleanup

Supabase foundations already implemented:
- environment configuration
- nullable Supabase client
- migrations infrastructure
- runtime bootstrap integration
- optional authentication service and minimum UI
- login, signup, password reset, logout, and signed-in user email display

Persistence is split by context and repository boundary.
Authenticated users use Supabase for the top-level project list when Supabase is configured.
Authenticated cloud projects use Supabase `project_data` for the active project's internal content blob.
Anonymous and Supabase-unconfigured users remain localStorage-backed.
Project data remains local-only for anonymous and Supabase-unconfigured usage.
Normalized documents, tasks, canvas, chats, settings, and assets remain future work.
Active Supabase migrations must create only the runtime tables currently used by the app: `projects`, `project_data`, and the Secure AI operational table `ai_daily_usage`.
Signing in does not enable local-to-cloud import, automatic sync, merge, protected routes, account pages, image Storage, or image ownership migration.
Text AI now flows through `aiMessageService` -> `aiClient` -> Supabase Edge Function -> provider adapter. Frontend text AI must not reintroduce provider-specific endpoints, models, headers, payload fields, or response parsing.
The `text-generation` Edge Function enforces the MVP daily usage counter before provider calls. The active usage table is `public.ai_daily_usage`, which stores only user id, UTC date, request count, and timestamps.
Current legacy image generation still calls Pollinations directly through `imageGenerationService`; it should migrate only after the secure text AI path is hardened and after image ownership/storage decisions are explicit.

---

## Current Priority

The current priority is:

→ Harden the implemented secure text AI proxy foundation while preserving the existing cloud persistence and local-first baselines.

The secure AI direction is documented in:
- docs/architecture/secure-ai-foundation.md

The current repository migration strategy remains documented in:
- docs/architecture/repository-migration-strategy.md
- docs/architecture/persistence-context.md

Before future Secure AI implementation, re-check:
- Does new text AI code go through `aiClient` instead of provider-specific frontend calls?
- Has the text-generation Edge Function been validated locally with Deno and Supabase CLI?
- Has authenticated text AI been manually tested with a real Supabase session?
- Does the daily usage counter reject over-limit requests with safe `rate_limited` feedback?
- Should `contextSnapshot` and `locale` be refined for the next text AI surface?
- Should safe AI error feedback move from minimal alerts toward inline UI?
- How should anonymous or Supabase-unconfigured AI behavior evolve now that direct text provider calls are removed?

---

## Repository Migration Focus

Repository migration beyond the top-level project list and active `project_data` blob remains future work.

Planning areas:
- projectRepository cloud persistence planning
- fresh authenticated cloud workspace behavior
- ownership-aware persistence
- implementation sequencing

Current planning decisions:
- projectRepository is the first active migration target
- projectDataRepository uses a minimal active-project blob bridge before normalized split migration
- anonymous and Supabase-unconfigured local-first behavior remains preserved
- existing local projects do not need to be migrated in this phase
- local-to-cloud import is not required in this phase
- runtime cloud persistence exists for the authenticated top-level project list and active project data blob
- `project_data.data` is the MVP bridge and current source of truth for authenticated internal project content
- normalized tables should be introduced only when real product needs justify their repositories, ownership checks, and RLS policies
- active migrations should not create planned future tables before runtime code uses them safely
- normalized projectDataRepository split migration has not started
- PersistenceContext is documented in docs/architecture/persistence-context.md
- LocalToCloudImportService is historical and not active for this phase

Future directions:
- normalized cloud persistence beyond the `project_data` blob
- projectData split migration
- documentRepository, documentMessageRepository, productionTaskRepository, canvas/flow repository, then assets/storage
- collaboration-ready foundations

---

## Secure AI Strategy

Secure AI migration is now in scope.

Current direction:
- frontend text AI calls go through the product-level `aiClient`
- the AI client calls a secure AI proxy instead of provider APIs
- Supabase Edge Functions are the recommended MVP proxy backend unless implementation findings prove otherwise
- provider adapters should live behind the secure proxy
- provider secrets must never be exposed to the frontend
- frontend code must not add or reintroduce direct text AI provider calls

Migration order:
1. document and align the secure AI boundary
2. define the minimal frontend AI client contract
3. migrate text AI through the secure proxy first. Completed.
4. add minimal per-user daily usage protection for text AI. Completed.
5. harden text AI with Deno/Supabase validation, manual authenticated testing, `contextSnapshot`/`locale` refinement, and better inline error feedback as needed
6. defer image generation migration until image ownership, Storage, cleanup, and HTML reference handling are explicitly designed

Abstraction rule:
- do not overbuild multi-provider abstractions before the first secure provider path works
- add provider abstraction only where it removes real provider leakage or enables the first secure path

Local Edge Function validation commands:

```sh
deno check supabase/functions/text-generation/index.ts
supabase functions serve text-generation --env-file <edge-env-file>
```

---

## Planning Philosophy

Future repository migration should remain planning-focused before implementation.

Preferred approach:
1. analyze current repositories
2. choose the first migration target
3. define the authenticated cloud workspace model
4. preserve anonymous/unconfigured local behavior
5. define implementation order
6. document tradeoffs

This phase should be:
- pragmatic
- low-risk
- architecture-first
- anti-overengineering

---

## Hooks / Controllers Strategy

Hooks extraction remains postponed.

Hooks/controllers should only happen after:
- repository boundaries are stable
- ownership boundaries are clear
- cloud persistence contracts are defined

---

## Supabase Strategy

Migration philosophy:
→ incremental cloud-native persistence for fresh authenticated workspaces, not big-bang replacement.

Completed:
1. environment variables
2. nullable Supabase client
3. migrations setup
4. project bootstrap integration
5. authentication foundation
6. minimum auth UX
7. production readiness cleanup

Current:
8. localStorage remains active for anonymous/unconfigured users and internal project data
9. authenticated users use Supabase for top-level project list persistence
10. authenticated active project content uses the `project_data` JSONB blob
11. text AI uses the secure Supabase Edge Function proxy path
12. text AI is protected by a minimal per-user daily usage counter

Repository migration planning is captured in:
- docs/architecture/repository-migration-strategy.md
Secure AI planning is captured in:
- docs/architecture/secure-ai-foundation.md

Future:
13. Deno/Supabase CLI validation and manual authenticated text AI hardening
14. projectData split planning
15. normalized document/task/canvas/chat persistence after product needs justify it
16. Supabase Storage and asset metadata after image ownership, cleanup, and references are designed
17. image generation through secure proxy after Storage/asset ownership is designed
18. optional realtime

---

## Architecture Principles

### General

- Prefer simple and maintainable solutions
- Avoid overengineering
- Favor clarity over cleverness
- Build for one developer, not enterprise scale

### Structure

Prefer separation between:
- UI
- orchestration
- domain logic
- services
- repositories
- persistence
- provider transport

### State Management

- Local state remains acceptable
- Avoid global state prematurely
- Hooks should extract focused responsibilities only

### Data Modeling

- Keep domain models explicit
- Prefer typed repository contracts
- Align frontend and database semantics carefully

---

## Refactoring Guidelines

- Preserve runtime behavior unless explicitly requested otherwise
- Prefer incremental migration over replacement
- Prefer small commits
- Prefer reversible changes

When implementing:
1. identify target boundary
2. define contract
3. implement minimal change
4. validate behavior
5. commit

---

## Git Workflow Rules

The human developer is responsible for all Git operations.

AI agents must NOT:
- create branches
- commit
- push
- pull
- merge
- rebase

AI agents may:
- suggest branch names
- suggest commit messages
- suggest safe Git commands

Current active branch:
- feature/cloud-product-foundation

---

## Tech Stack

Current:
- React
- TypeScript
- Vite
- localStorage
- Cloudflare Pages

Implemented Supabase foundations:
- Supabase
- Auth
- nullable client boundary
- optional environment configuration

Implemented in Secure AI Foundation:
- Supabase Edge Function as the MVP secure text AI proxy
- server-side provider adapter for the first text AI provider
- frontend `aiClient` boundary for text AI

Still planned in Secure AI Foundation:
- local Deno/Supabase Edge Function validation
- manual authenticated text AI testing
- `contextSnapshot` and `locale` refinement
- better inline AI error feedback if alerts become too disruptive

Planned later:
- normalized Postgres-backed persistence beyond `projects` and `project_data`
- Supabase Storage
- Realtime
- React Router
- TanStack Query
- Zod

Rules:
- avoid new dependencies unless clearly justified
- prefer incremental adoption
- avoid introducing infrastructure before boundaries exist

---

## Response Style

When analyzing:
1. Current state
2. Planning targets
3. Risks
4. Tradeoffs
5. Recommendation
6. Practical next steps

When implementing:
1. Explanation
2. Plan
3. Code
4. Notes / Risks

---

## DO NOT

- Do not propose full rewrites
- Do not replace all repositories at once
- Do not migrate all data at once
- Do not implement local-to-cloud import unless explicitly reintroduced later
- Do not imply signing in enables sync, import, merge, or cloud persistence beyond the top-level project list and active project data blob
- Do not introduce merge or conflict resolution for this phase
- Do not expose provider secrets to frontend code, `VITE_*` variables, logs, docs, or examples
- Do not add new direct frontend calls to AI providers
- Do not migrate image generation before text AI unless explicitly requested
- Do not implement Supabase Storage or asset tables yet
- Do not add unused future tables to active migrations
- Do not introduce global state
- Do not extract hooks prematurely
- Do not overengineer abstractions
- Do not create broad multi-provider framework architectures before the first secure provider path works

---

## Final Principle

This project should evolve:

from:
→ a working AI-assisted prototype

into:
→ a cloud-backed, scalable game design platform

through:
→ explicit, incremental, behavior-preserving architectural decisions
