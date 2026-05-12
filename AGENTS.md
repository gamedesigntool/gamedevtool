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

→ Document Product Decisions Pass

Previous completed phases:
- Data Extraction Pass
- Architecture Boundary Pass
- Provider & Async Boundaries Pass
- Render & State Stabilization Pass
- Document Architecture Planning Pass
- Document Actions Extraction Pass
- Editor Orchestration Pass

Current goals:
- make explicit product decisions about document behavior
- define the intended semantics of drafts and saving
- remove ambiguity before structural refactors
- prepare for future editor hooks
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
- large refactors without explicit decisions

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

This is intentional.

---

## Current Priority

The current architectural priority is:

→ Make explicit product and architecture decisions about document behavior before major refactors.

Primary decision areas:
- navigation vs unsaved drafts
- export vs unsaved drafts
- hasUnsaved semantics
- activeDoc semantics
- async document scoping
- future autosave assumptions

---

## Decision-Making Philosophy

This phase is decision-first.

Preferred approach:
1. identify open questions
2. analyze tradeoffs
3. recommend explicit decisions
4. document the decisions
5. only then consider implementation

This phase should be:
- thoughtful
- pragmatic
- moderately ambitious
- anti-overengineering

Not:
- excessively conservative
- reckless
- implementation-driven

---

## Document Semantics Focus

Core concepts:
- pData.docs (persisted source of truth)
- editContent (volatile draft)
- activeDoc (operational snapshot)
- hasUnsaved (draft divergence indicator)
- contentEditable DOM state

Open questions:
- Should navigation warn before discarding drafts?
- Should export include unsaved drafts?
- Should hasUnsaved remain a stored flag?
- Should activeDoc remain a snapshot?
- Should AI workflows become document-scoped?

---

## Hooks / Controllers Strategy

Hooks extraction remains postponed.

Hooks/controllers should only happen after:
- product decisions are explicit
- document semantics are stable
- editor semantics are stable
- ownership boundaries are explicit

Preferred future direction:
- focused hooks
- focused orchestration boundaries
- explicit responsibilities

---

## Supabase Strategy

Supabase is still NOT the current implementation target.

Before Supabase:
- document semantics must be explicit
- editor semantics must be explicit
- product decisions must be documented
- persistence boundaries must be clear

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
- Prefer decisions before implementation
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
- feature/document-product-decisions

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
2. Open questions
3. Tradeoffs
4. Risks
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
→ explicit, thoughtful, behavior-preserving architectural decisions