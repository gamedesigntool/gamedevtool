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
- active Supabase migrations remain limited to `projects` and `project_data`
- local-to-cloud import, automatic sync, merge, realtime collaboration, and Storage/assets remain out of scope

Current goals:
- establish the secure AI architecture foundation
- move future AI execution toward a secure backend boundary
- keep provider secrets out of frontend code
- keep the current cloud persistence baseline stable
- preserve local-first anonymous and Supabase-unconfigured behavior until explicit AI product decisions change it
- prefer Supabase Edge Functions as the MVP secure AI proxy unless implementation findings prove otherwise
- migrate text AI before image generation
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
Active Supabase migrations must create only the runtime tables currently used by the app: `projects` and `project_data`.
Signing in does not enable local-to-cloud import, automatic sync, merge, protected routes, account pages, image Storage, or image ownership migration.
Current legacy text AI calls still go directly from the frontend to the provider through `aiMessageService`; this is the primary Secure AI Foundation migration target.
Current legacy image generation still calls Pollinations directly through `imageGenerationService`; it should migrate after the secure text AI path and after image ownership/storage decisions are explicit.

---

## Current Priority

The current priority is:

→ Establish a secure AI proxy foundation while preserving the existing cloud persistence and local-first baselines.

The secure AI direction is documented in:
- docs/architecture/secure-ai-foundation.md

The current repository migration strategy remains documented in:
- docs/architecture/repository-migration-strategy.md
- docs/architecture/persistence-context.md

Before future Secure AI implementation, re-check:
- How should the frontend AI client avoid provider-specific payloads?
- Which text AI capability should migrate first?
- How should Supabase Auth and project/document ownership be validated?
- How should anonymous or Supabase-unconfigured AI behavior work after direct provider calls are removed?
- What minimal request, error, timeout, logging, and usage controls are needed for MVP?
- How can text AI migration avoid changing editor, prompt, or persistence behavior?

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
- frontend AI calls should move toward a product-level AI client
- the AI client should call a secure AI proxy instead of provider APIs
- Supabase Edge Functions are the recommended MVP proxy backend unless implementation findings prove otherwise
- provider adapters should live behind the secure proxy
- provider secrets must never be exposed to the frontend
- frontend code must not add new direct AI provider calls after this epic implementation begins

Migration order:
1. document and align the secure AI boundary
2. define the minimal frontend AI client contract
3. migrate text AI through the secure proxy first
4. migrate document chat before broader guide/benchmarking text surfaces when possible
5. defer image generation migration until image ownership, Storage, cleanup, and HTML reference handling are explicitly designed

Abstraction rule:
- do not overbuild multi-provider abstractions before the first secure provider path works
- add provider abstraction only where it removes real provider leakage or enables the first secure path

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
11. Secure AI Foundation is planning the first secure AI proxy path

Repository migration planning is captured in:
- docs/architecture/repository-migration-strategy.md
Secure AI planning is captured in:
- docs/architecture/secure-ai-foundation.md

Future:
12. text AI execution through Supabase Edge Functions
13. projectData split planning
14. normalized document/task/canvas/chat persistence after product needs justify it
15. Supabase Storage and asset metadata after image ownership, cleanup, and references are designed
16. image generation through secure proxy after Storage/asset ownership is designed
17. optional realtime

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

Planned in Secure AI Foundation:
- Supabase Edge Functions as the recommended MVP secure AI proxy
- server-side provider adapters for AI providers
- frontend AI client boundary

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
