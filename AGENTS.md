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

→ Supabase Foundation Pass

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

Current goals:
- introduce the first concrete Supabase foundations
- add environment configuration
- add Supabase client setup
- prepare migrations infrastructure
- integrate project bootstrap through the async boundary
- validate coexistence with localStorage
- preserve runtime behavior

Current non-goals:
- full cloud sync
- full authentication
- replacing all repositories
- migrating all data
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

Prepared but not yet fully used:
- async repository contracts
- initial Supabase schema
- migration strategy
- Edge Functions strategy

Current architecture:

UI/components
↓
orchestration/state
↓
services/repositories
↓
providers/persistence

Persistence currently remains localStorage-backed.

---

## Current Priority

The current architectural priority is:

→ Introduce the first runtime foundations for Supabase while preserving local-first behavior.

Primary implementation path:

environment configuration
↓
Supabase client
↓
migrations infrastructure
↓
bootstrap boundary usage
↓
future repository migration

Key questions:
- How should environment variables be organized?
- How should the Supabase client be initialized?
- How should bootstrap remain backward-compatible?
- What is the safest first runtime integration?

---

## Supabase Foundation Focus

Primary areas:
- environment configuration
- Supabase client setup
- migrations infrastructure
- runtime bootstrap integration
- backward compatibility
- localStorage coexistence

Future directions:
- authentication
- cloud persistence
- secure AI proxying
- collaboration-ready foundations

---

## Planning Philosophy

This phase is implementation-focused but still highly incremental.

Preferred approach:
1. introduce one foundational layer at a time
2. preserve current behavior
3. validate each step
4. keep local fallback working
5. avoid big-bang migration

This phase should be:
- practical
- low-risk
- forward-looking
- anti-overengineering

---

## Hooks / Controllers Strategy

Hooks extraction remains postponed.

Hooks/controllers should only happen after:
- Supabase integration boundaries are stable
- repository contracts are stable
- ownership boundaries are clear

---

## Supabase Strategy

Migration philosophy:
→ incremental coexistence, not big-bang replacement.

Implementation order:
1. environment variables
2. Supabase client
3. migrations setup
4. project bootstrap integration
5. authentication
6. repository-by-repository migration
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
- feature/supabase-foundation

---

## Tech Stack

Current:
- React
- TypeScript
- Vite
- localStorage
- Cloudflare Pages

Being introduced:
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