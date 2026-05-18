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

→ Post Supabase Authentication Planning

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

Completed Supabase Authentication Pass:
- optional Supabase authentication
- session reading
- auth state observation
- minimal email/password login and logout foundations
- authenticated user identity for future cloud persistence
- local-first behavior preserved

Current non-goals:
- full cloud sync
- repository migration
- local/cloud merge
- realtime collaboration
- autosave
- global state
- broad hooks extraction
- large rewrites

---

## Canonical Architecture Documents

The following documents are the current source of truth:

- docs/architecture/document-semantics.md
- docs/architecture/editor-orchestration.md
- docs/architecture/editor-sync-risks.md
- docs/architecture/supabase-readiness.md
- docs/architecture/supabase-schema-v1.sql

These documents must be consulted before proposing architectural changes.

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

Supabase foundations already implemented:
- environment configuration
- nullable Supabase client
- migrations infrastructure
- runtime bootstrap integration
- optional authentication service and minimal auth controls

Persistence currently remains localStorage-backed.
Supabase is not active runtime persistence yet.

---

## Current Priority

The current architectural priority is:

→ Decide the next incremental cloud persistence boundary after authentication.

Key questions:
- Which repository should be prepared next?
- How should authenticated identity be threaded into future persistence without changing local-first runtime behavior?
- When should explicit local-to-cloud import be designed?

---

## Authentication Focus

Primary areas:
- session retrieval
- auth state observation
- login/logout flows
- local-first coexistence
- user identity ownership

Future directions:
- project repository migration
- cloud sync
- secure AI proxying
- collaboration-ready foundations

---

## Planning Philosophy

This phase is implementation-focused and incremental.

Preferred approach:
1. add session boundary
2. read auth state
3. introduce minimal login/logout
4. preserve anonymous local usage
5. prepare future persistence migration

This phase should be:
- practical
- low-risk
- reversible
- anti-overengineering

---

## Hooks / Controllers Strategy

Hooks extraction remains postponed.

Hooks/controllers should only happen after:
- authentication boundaries are stable
- repository contracts are stable
- ownership boundaries are clear

---

## Supabase Strategy

Migration philosophy:
→ incremental coexistence, not big-bang replacement.

Completed:
1. environment variables
2. nullable Supabase client
3. migrations setup
4. project bootstrap integration

Current:
5. authentication complete

Future:
6. repository-by-repository migration
7. cloud persistence
8. optional realtime

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
- feature/supabase-authentication

---

## Tech Stack

Current:
- React
- TypeScript
- Vite
- localStorage
- Cloudflare Pages

Supabase foundations:
- Supabase
- Postgres
- Auth
- Storage
- Edge Functions

Planned later:
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
2. Implementation targets
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
- Do not implement full cloud sync immediately
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
