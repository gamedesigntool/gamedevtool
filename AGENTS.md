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

→ **Render & State Stabilization Pass**

Previous completed phases:
- Data Extraction Pass
- Architecture Boundary Pass
- Provider & Async Boundaries Pass

Current goals:
- stabilize render/state coordination
- improve ownership clarity
- reduce implicit synchronization risks
- improve async/render safety
- preserve runtime behavior
- prepare for future orchestration extraction
- prepare groundwork for future Supabase adoption

Current non-goals:
- introducing Supabase
- routing/global state
- hooks extraction
- large rewrites
- generic controller layers
- framework architectures
- performance optimization passes

---

## Current Architectural State

The original monolithic GameDesignTool.tsx has already gone through major extraction passes.

Already extracted:
- domain types
- repositories
- mutation helpers
- selectors
- runtime/text/export utils
- guide static constants
- flow builder constants
- kanban constants
- document suggestions
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

Current state of GameDesignTool.tsx:
- orchestration-heavy
- render coordination-heavy
- async coordination-heavy
- still owns state/navigation behavior intentionally

Current known sensitive areas:
- activeDoc synchronization
- pData ownership
- render timing assumptions
- navigation during async flows
- persistence timing
- editor transient state
- guide chat duplication

---

## Current Priority

The current architectural priorities are:

1. stabilize render/state synchronization
2. reduce implicit ownership assumptions
3. improve async/render safety
4. clarify persistence timing behavior
5. only then evaluate hooks/controllers
6. only later prepare Supabase foundation

Reason:
- provider boundaries already exist
- hooks extraction now risks moving unstable orchestration into hooks
- ownership clarity must improve before orchestration extraction

---

## State Stabilization Philosophy

Current philosophy:
- stabilize before abstracting
- preserve orchestration order
- preserve runtime behavior
- prefer explicit ownership
- avoid broad state redesigns

Current focus:
- render safety
- async/render coordination
- state ownership clarity
- navigation synchronization
- persistence synchronization

Do NOT:
- redesign the editor architecture yet
- rewrite activeDoc globally
- introduce global state
- introduce giant hooks
- move orchestration into controller layers

---

## activeDoc Strategy

activeDoc is currently a sensitive coordination point.

It currently acts simultaneously as:
- navigation state
- render source
- editing source
- persistence target
- async reference

This is known and intentional for now.

Current strategy:
- stabilize behavior first
- reduce implicit assumptions incrementally
- avoid broad redesigns

Do NOT:
- redesign activeDoc globally yet
- split activeDoc into multiple systems yet
- introduce synchronization frameworks

---

## Async Safety Strategy

Async behavior remains a first-class architectural concern.

Known sensitive areas:
- navigation during async operations
- deletion during async operations
- stale closures
- render synchronization during async updates
- persistence ordering
- editor state synchronization

Current philosophy:
- preserve orchestration order
- prefer explicit snapshots before async boundaries
- prefer small async safety improvements
- avoid async framework abstractions

Do NOT:
- introduce generic async runners
- introduce controller frameworks
- introduce cancellation systems globally
- introduce AbortController everywhere preemptively

---

## Hooks / Controllers Strategy

Hooks extraction is STILL intentionally postponed.

Hooks/controllers should only happen after:
- ownership becomes clearer
- render/state synchronization stabilizes
- async risks are better understood
- orchestration responsibilities become cleaner

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
- render/state synchronization must stabilize
- async behavior must already be safer
- repositories must already isolate persistence cleanly
- orchestration responsibilities must become clearer

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
- merge completed architecture phases into main
- create one branch per major architectural phase

Current active branch:
- feature/render-state-stabilization

Commit philosophy:
- one safe stabilization/refactor per commit
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
- Do not redesign activeDoc globally
- Do not redesign orchestration globally
- Do not introduce controller frameworks
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