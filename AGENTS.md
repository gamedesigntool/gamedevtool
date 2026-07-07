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

→ Post-Production Readiness Baseline

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

Current goals:
- preserve the local-first production-ready baseline
- keep README and agent guidance aligned with real runtime behavior
- use the repository migration documents as planning references before future implementation
- keep validation commands passing before handoff

Current non-goals:
- real cloud persistence
- automatic sync
- local/cloud merge
- repository implementation changes
- repository migration implementation
- realtime collaboration
- autosave
- global state
- broad hooks extraction
- Edge Functions or AI proxy implementation
- large rewrites

---

## Canonical Architecture Documents

The following documents are the current source of truth:

- docs/architecture/document-semantics.md
- docs/architecture/editor-orchestration.md
- docs/architecture/editor-sync-risks.md
- docs/architecture/local-to-cloud-import-service.md
- docs/architecture/persistence-context.md
- docs/architecture/repository-migration-strategy.md
- docs/architecture/supabase-readiness.md
- docs/architecture/supabase-schema-v1.sql

These documents must be consulted before proposing architectural changes.

Repository migration documents remain canonical planning references. They do not mean runtime cloud persistence or repository migration has started.

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

Persistence currently remains localStorage-backed.
Supabase is not active runtime persistence yet.
Signing in does not enable cloud sync, cloud persistence, import, merge, protected routes, or account pages.

---

## Current Priority

The current priority is:

→ Preserve the production-ready local-first baseline while keeping future repository migration explicit and incremental.

The current repository migration strategy is documented in:
- docs/architecture/repository-migration-strategy.md
- docs/architecture/persistence-context.md
- docs/architecture/local-to-cloud-import-service.md

Repository migration has not started in runtime code. Before future implementation, re-check:
- Which repository should migrate first?
- How should authenticated identity be threaded into persistence?
- How should local and cloud coexist?
- How should explicit import from local to cloud work?
- How can data loss and overwrites be avoided?

---

## Repository Migration Focus

Repository migration remains future work.

Planning areas:
- projectRepository migration planning
- local-first + cloud coexistence
- explicit import UX
- ownership-aware persistence
- implementation sequencing

Current planning decisions:
- projectRepository is the first planned migration target
- projectDataRepository must not be migrated first
- local-first behavior remains preserved
- explicit local-to-cloud import is required
- no runtime cloud persistence exists yet
- no repository has been migrated to Supabase yet
- PersistenceContext is documented in docs/architecture/persistence-context.md
- LocalToCloudImportService is documented in docs/architecture/local-to-cloud-import-service.md

Future directions:
- cloud persistence
- projectData split migration
- secure AI proxying
- Edge Functions
- collaboration-ready foundations

---

## Planning Philosophy

Future repository migration should remain planning-focused before implementation.

Preferred approach:
1. analyze current repositories
2. choose the first migration target
3. define coexistence model
4. define import UX
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
→ incremental coexistence, not big-bang replacement.

Completed:
1. environment variables
2. nullable Supabase client
3. migrations setup
4. project bootstrap integration
5. authentication foundation
6. minimum auth UX
7. production readiness cleanup

Current:
8. localStorage remains the active runtime persistence
9. repository migration implementation has not started

Repository migration planning is captured in:
- docs/architecture/repository-migration-strategy.md

Future:
10. explicit local-to-cloud import UX
11. projectRepository migration
12. projectData migration
13. cloud sync
14. Edge Functions / secure AI proxy
15. optional realtime

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
- feature/project-repository-cloud-migration

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

Planned later:
- Postgres-backed persistence
- Supabase Storage
- Edge Functions
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
- Do not implement cloud persistence during the current baseline phase
- Do not imply signing in enables sync or cloud persistence
- Do not implement Edge Functions or AI proxying yet
- Do not introduce global state
- Do not extract hooks prematurely
- Do not overengineer abstractions
- Do not create framework architectures

---

## Final Principle

This project should evolve:

from:
→ a working AI-assisted prototype

into:
→ a cloud-backed, scalable game design platform

through:
→ explicit, incremental, behavior-preserving architectural decisions
