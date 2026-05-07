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

→ **Architecture Boundary Pass: Provider & Async Boundaries**

Current goals:
- reduce provider coupling
- isolate side effects
- stabilize async flows
- improve architectural boundaries
- prepare for future Supabase integration
- preserve runtime behavior

Current non-goals:
- adding major features
- introducing Supabase
- auth/routing/global state
- large rewrites
- premature optimization

---

## Current Architectural State

The original monolithic GameDesignTool.tsx has already gone through major extraction passes.

Already extracted:
- domain types
- default/seed data
- project data selectors
- project data mutations
- document mutations
- repositories
- shared controls/components
- runtime/text/export utils
- guide static constants
- flow builder constants
- kanban constants
- document suggestions

AI boundary already extracted:
- aiMessageService
- provider transport/parsing isolated from UI
- Anthropic coupling centralized

Current state:
- GameDesignTool.tsx is now primarily:
  - orchestration
  - UI coordination
  - async flows
  - state ownership
  - navigation/view coordination

Current architecture:

UI/components
↓
orchestration/state
↓
services/repositories
↓
providers/persistence

---

## Current Priority

The current architectural priorities are:

1. isolate remaining provider coupling
2. stabilize async behavior
3. improve orchestration boundaries
4. only then evaluate hooks/controllers
5. only later prepare Supabase foundation

Reason:
- hooks extraction before async/provider stabilization would only relocate complexity
- provider boundaries must exist before orchestration extraction
- async behavior must become safer before introducing async persistence

---

## AI Boundary Strategy

Anthropic text/chat provider boundary is already implemented.

Current rule:
- prompts remain in UI/orchestration for now
- orchestration remains in UI for now
- provider transport/parsing belongs to services

Do NOT:
- redesign prompts during boundary passes
- introduce multi-provider abstractions yet
- introduce agent frameworks
- generalize providers prematurely

Current approved pattern:

UI/orchestration
↓
service boundary
↓
provider transport/parsing

---

## Image Generation Boundary Strategy

Image generation providers must follow the same philosophy:
- isolate provider transport
- isolate provider-specific parsing
- preserve orchestration
- preserve runtime behavior

Do NOT:
- redesign image workflows
- introduce generic media frameworks
- mix provider extraction with UI redesign

---

## Async Safety Strategy

Async behavior is now a first-class architectural concern.

Known sensitive areas:
- activeDoc synchronization
- loading states
- navigation during async requests
- deletion during async requests
- stale closures
- guide chat async duplication

Current philosophy:
- stabilize before abstracting
- preserve orchestration order
- prefer small async safety improvements
- avoid large async rewrites

---

## Hooks / Controllers Strategy

Hooks extraction is intentionally postponed.

Hooks/controllers should only happen after:
- provider boundaries stabilize
- async risks are mapped
- orchestration responsibilities become clearer

Do NOT:
- move orchestration chaos into hooks
- create giant hooks
- introduce controller layers prematurely

Preferred future direction:
- focused hooks
- focused orchestration boundaries
- isolated responsibilities only

---

## Supabase Strategy

Supabase is STILL NOT the current phase.

Before Supabase:
- provider boundaries must exist
- async risks should already be understood
- repositories should already isolate persistence
- orchestration boundaries should be clearer

Do NOT:
- introduce Supabase directly into UI
- replace localStorage globally in one step
- mix auth/routing/persistence together

Migration philosophy:
→ incremental coexistence, not big-bang replacement.

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

Avoid:
- giant reusable abstractions
- generic framework layers too early
- architecture for hypothetical future problems

### State Management

- Local state is still acceptable
- Avoid introducing global state libraries prematurely
- Hooks should extract focused responsibilities only
- Do not move orchestration chaos into hooks

### Data Modeling

- Define explicit domain types
- Keep frontend/domain models explicit
- Avoid loosely shaped objects
- Prefer incremental typing improvements

---

## Refactoring Guidelines

- Preserve runtime behavior unless explicitly requested otherwise
- Prefer extraction over rewriting
- Prefer small commits
- Prefer low-risk isolated changes

When refactoring:
1. identify responsibilities
2. isolate boundaries
3. move smallest safe unit first
4. validate runtime
5. commit

Avoid:
- broad rewrites
- mixing unrelated responsibilities
- large async refactors
- architectural "cleanup passes"

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

Current branch strategy:
- keep using:
  - feature/architecture-boundaries

Branch philosophy:
- one branch per architectural phase
- many small commits inside the branch

Commit philosophy:
- one safe extraction/refactor per commit
- preserve behavior
- validate before commit

---

## Tech Stack

Current:
- React
- TypeScript
- Vite
- localStorage
- Cloudflare Pages

Planned later:
- Supabase
- React Router
- TanStack Query
- Zod

Rules:
- avoid new dependencies unless clearly justified
- prefer incremental adoption
- avoid introducing infra before boundaries exist

---

## Response Style

When analyzing:
1. Current state
2. Problems
3. Proposed direction
4. Risks
5. Practical next steps

When implementing:
1. Explanation
2. Plan
3. Code
4. Notes / Risks

---

## DO NOT

- Do not propose full rewrites
- Do not introduce Supabase yet
- Do not extract hooks prematurely
- Do not introduce global state libraries yet
- Do not redesign prompts during provider boundary extraction
- Do not mix routing/auth/persistence together
- Do not overengineer abstractions
- Do not introduce generic framework layers

---

## Final Principle

This project should evolve:

from:
→ a working AI-assisted prototype

into:
→ a modular, maintainable, scalable product foundation

through:
→ small, safe, behavior-preserving architectural steps