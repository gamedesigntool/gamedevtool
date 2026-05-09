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

→ Editor Orchestration Pass

Previous completed phases:
- Data Extraction Pass
- Architecture Boundary Pass
- Provider & Async Boundaries Pass
- Render & State Stabilization Pass
- Document Architecture Planning Pass
- Document Actions Extraction Pass

Current goals:
- understand editor responsibilities deeply
- clarify draft lifecycle semantics
- clarify save semantics
- clarify unsaved state behavior
- reduce editor orchestration complexity
- prepare for future hooks extraction
- prepare for future Supabase integration
- avoid premature implementation

Current non-goals:
- implementing Supabase
- introducing routing/global state
- broad hooks extraction
- rewriting the editor
- replacing contentEditable
- implementing autosave
- redesigning activeDoc immediately
- large refactors without clear architectural decisions

---

## Current Architectural State

Already extracted:
- domain types
- repositories
- mutation helpers
- selectors
- runtime/text/export utilities
- guide constants
- flow builder constants
- kanban constants
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

GameDesignTool.tsx remains:
- orchestration-heavy
- render coordination-heavy
- async coordination-heavy

DocEditor remains:
- DOM-heavy
- contentEditable-based
- tightly coupled to draft lifecycle

This is intentional.

---

## Current Priority

The current architectural priority is:

→ Clarify editor orchestration and draft lifecycle semantics.

Primary concepts under analysis:
- DocEditor
- editContent
- hasUnsaved
- activeDoc
- save lifecycle
- export behavior
- contentEditable DOM state
- editor transient state

Key questions:
- What is persisted?
- What is transient?
- What is draft state?
- What triggers hasUnsaved?
- What triggers save?
- What data is used by export?
- How does DOM state synchronize with React state?

---

## Planning Philosophy

This phase is analysis-first.

Preferred approach:
- understand responsibilities
- map lifecycle
- identify ownership conflicts
- document semantics
- implement only small safe steps when clearly justified

This phase should be:
- thoughtful
- pragmatic
- moderately ambitious
- anti-overengineering

Not:
- excessively conservative
- reckless
- rewrite-driven

---

## Editor Architecture Focus

Areas to understand:
- editor initialization
- editing lifecycle
- draft synchronization
- save lifecycle
- unsaved detection
- export interaction
- navigation interaction
- async interaction
- DOM ↔ React synchronization

The objective is to define:
- stable editor semantics
- explicit ownership boundaries
- future migration strategy

---

## Hooks / Controllers Strategy

Hooks extraction remains postponed.

Hooks/controllers should only happen after:
- document semantics are clear
- editor semantics are clear
- ownership boundaries are explicit
- responsibilities are better understood

Preferred future direction:
- focused hooks
- focused orchestration boundaries
- explicit responsibilities

---

## Supabase Strategy

Supabase is still NOT the current implementation target.

Before Supabase:
- document semantics must be understood
- editor semantics must be understood
- persistence boundaries must be explicit
- state ownership must be clearer

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

### State Management

- Local state is still acceptable
- Avoid global state prematurely
- Hooks should extract focused responsibilities only

### Data Modeling

- Define explicit domain types
- Keep frontend/domain models explicit
- Prefer incremental typing improvements

---

## Refactoring Guidelines

- Preserve runtime behavior unless explicitly requested otherwise
- Prefer analysis before implementation
- Prefer small commits
- Prefer low-risk isolated changes

When implementing:
1. identify responsibilities
2. isolate boundaries
3. move the smallest safe unit
4. validate runtime
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
- feature/editor-orchestration

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
- avoid introducing infrastructure before boundaries exist

---

## Response Style

When analyzing:
1. Current state
2. Ownership map
3. Problems
4. Risks
5. Candidate models
6. Recommended direction
7. Practical next steps

When implementing:
1. Explanation
2. Plan
3. Code
4. Notes / Risks

---

## DO NOT

- Do not propose full rewrites
- Do not implement Supabase yet
- Do not extract hooks prematurely
- Do not replace contentEditable
- Do not introduce global state
- Do not implement autosave yet
- Do not overengineer abstractions
- Do not create framework architectures

---

## Final Principle

This project should evolve:

from:
→ a working AI-assisted prototype

into:
→ a modular, maintainable, scalable product foundation

through:
→ thoughtful, incremental, behavior-preserving architectural decisions