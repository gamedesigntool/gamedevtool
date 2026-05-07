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

→ **Architecture Boundary Pass: Service Boundaries**

Current goals:
- reduce coupling
- isolate side effects
- introduce service boundaries
- stabilize orchestration
- prepare for Supabase integration later
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

Current state:
- GameDesignTool.tsx is now primarily:
  - orchestration
  - UI coordination
  - async flows
  - AI interaction
  - state ownership

Current architecture:

UI/components
↓
domain helpers
↓
repositories/services
↓
localStorage

---

## Current Priority

The current architectural priority is:

→ create AI service boundaries before extracting hooks

Reason:
- hooks extraction right now would move:
  - state
  - navigation
  - async flows
  - side effects
  together into new files without reducing coupling.

The biggest remaining architectural violation is:
→ direct AI provider coupling inside UI/orchestration.

---

## AI Boundary Strategy

Current strategy:
- first isolate provider transport/fetch
- then isolate response parsing
- keep prompt construction in UI initially
- preserve runtime behavior
- preserve orchestration order

Do NOT:
- rewrite the AI flow
- redesign prompts
- extract all AI logic at once
- generalize prematurely
- introduce agent frameworks
- introduce multi-provider abstractions yet

Preferred incremental order:

1. Extract provider fetch transport
2. Extract response parsing
3. Define typed request/response contracts
4. Stabilize AI service boundary
5. Only then consider hooks/controllers

---

## Supabase Strategy

Supabase is NOT the current phase yet.

Before Supabase:
- service boundaries must exist
- repositories must already isolate persistence
- AI boundaries should already be stabilized
- orchestration responsibilities should be clearer

Do NOT:
- introduce Supabase directly inside UI
- mix auth/routing/persistence in one phase
- replace localStorage globally in one step

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

## AI Integration Rules

AI must NOT be directly coupled to UI long-term.

Target direction:

UI
↓
orchestration
↓
AI service
↓
provider transport

The first AI service boundary should:
- preserve prompt construction in UI
- move only:
  - fetch
  - transport
  - response parsing

Do NOT:
- redesign prompts during boundary extraction
- mix prompt refactor + service extraction
- introduce provider abstraction layers yet

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
- Do not redesign prompts during AI boundary extraction
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