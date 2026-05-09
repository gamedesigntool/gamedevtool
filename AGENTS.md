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

→ Document Architecture Planning Pass

Previous completed phases:
- Data Extraction Pass
- Architecture Boundary Pass
- Provider & Async Boundaries Pass
- Render & State Stabilization Pass

Current goals:
- understand the document model deeply
- clarify ownership and lifecycle semantics
- define boundaries between persisted and transient state
- prepare for future hooks extraction
- prepare for future Supabase integration
- avoid premature implementation

Current non-goals:
- implementing Supabase
- introducing routing/global state
- broad hooks extraction
- rewriting the editor
- redesigning activeDoc immediately
- large refactors without a clear architectural decision

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

This is intentional.

---

## Current Priority

The current architectural priority is:

→ Clarify document architecture semantics before any major implementation.

See `docs/architecture/document-semantics.md` for the current mental contract of the document system.

Main concepts under analysis:
- pData
- activeDoc
- editContent
- hasUnsaved
- project/module/view
- editor transient state
- persistence timing

Key questions:
- What is the source of truth?
- What is persisted?
- What is transient?
- What is navigation state?
- What is editing state?
- What is an async snapshot?

---

## Planning Philosophy

This phase is analysis-first.

Preferred approach:
- understand current responsibilities
- map ownership
- identify conflicts
- evaluate future models
- define a safe roadmap

This phase should be:
- thoughtful
- moderately ambitious
- still pragmatic
- anti-overengineering

Not:
- excessively conservative
- reckless
- implementation-driven

---

## Document Architecture Focus

Areas to understand:
- document lifecycle
- editing lifecycle
- save lifecycle
- async mutation flows
- guide-generated documents
- FlowBuilder documents
- Canvas documents
- export behavior

The objective is to define:
- stable semantics
- ownership boundaries
- future migration strategy

---

## Hooks / Controllers Strategy

Hooks extraction remains postponed.

Hooks/controllers should only happen after:
- document semantics are clear
- ownership boundaries are explicit
- state responsibilities are better understood

Preferred future direction:
- focused hooks
- focused orchestration boundaries
- explicit responsibilities

---

## Supabase Strategy

Supabase is still NOT the current implementation target.

Before Supabase:
- document semantics must be understood
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
- feature/document-architecture-planning

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
- Do not redesign activeDoc immediately
- Do not introduce global state
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