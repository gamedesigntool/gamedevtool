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

→ Supabase Readiness Pass

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

Current goals:
- prepare architecture for remote persistence
- define migration strategy from localStorage to Supabase
- identify repositories that will become async
- design initial database schema
- define authentication strategy
- define storage and realtime needs
- prepare AI Edge Function boundaries
- minimize migration risk

Current non-goals:
- implementing full Supabase integration
- replacing all repositories immediately
- migrating all data at once
- introducing global state
- broad hooks extraction
- rewriting the editor
- implementing autosave
- large refactors without explicit justification

---

## Canonical Architecture Documents

The following documents are the source of truth for current document/editor semantics:

- docs/architecture/document-semantics.md
- docs/architecture/editor-orchestration.md
- docs/architecture/editor-sync-risks.md

These documents must be consulted before proposing structural changes.

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

Current architecture:

UI/components
↓
orchestration/state
↓
services/repositories
↓
providers/persistence

Repositories are still:
- synchronous
- localStorage-backed
- intentionally thin

This is intentional.

---

## Current Priority

The current architectural priority is:

→ Prepare a safe and incremental migration path from localStorage to Supabase.

Primary migration path:

localStorage repositories
↓
async repository contracts
↓
Supabase-backed repositories
↓
optional coexistence/migration layer

Key questions:
- Which repositories should become async first?
- What database schema best represents current domain models?
- How should authentication work?
- What data belongs in Postgres vs Storage?
- How should AI requests flow through Edge Functions?
- How should localStorage and Supabase coexist during migration?

---

## Supabase Readiness Focus

Primary areas:
- database schema design
- authentication design
- repository async conversion strategy
- migration strategy
- environment variables
- storage usage
- realtime requirements
- Edge Functions architecture

Future directions:
- gradual replacement of localStorage repositories
- per-user cloud persistence
- secure AI proxying through Edge Functions
- collaboration-ready foundations

---

## Planning Philosophy

This phase is architecture-first and moderately ambitious.

Preferred approach:
1. map current persistence boundaries
2. identify migration targets
3. design schema and contracts
4. define migration strategy
5. only then implement incrementally

This phase should be:
- pragmatic
- forward-looking
- structured
- anti-overengineering

Not:
- big-bang migration
- framework mania
- speculative abstraction

---

## Hooks / Controllers Strategy

Hooks extraction remains postponed.

Hooks/controllers should only happen after:
- Supabase integration boundaries are explicit
- repository contracts are stable
- ownership boundaries are clear

---

## Supabase Strategy

Migration philosophy:
→ incremental coexistence, not big-bang replacement.

Preferred order:
1. schema design
2. auth design
3. repository async planning
4. environment setup
5. one repository migration at a time
6. local data migration
7. optional realtime

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
- feature/supabase-readiness

---

## Tech Stack

Current:
- React
- TypeScript
- Vite
- localStorage
- Cloudflare Pages

Planned:
- Supabase
- Postgres
- Auth
- Storage
- Realtime
- Edge Functions
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
2. Migration targets
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
- Do not implement autosave
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