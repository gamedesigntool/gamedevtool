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

→ Editor Sync Hardening Pass

Previous completed phases:
- Data Extraction Pass
- Architecture Boundary Pass
- Provider & Async Boundaries Pass
- Render & State Stabilization Pass
- Document Architecture Planning Pass
- Document Actions Extraction Pass
- Editor Orchestration Pass
- Document Product Decisions Pass

Current goals:
- harden synchronization between DOM mutations and React draft state
- ensure editContent remains the canonical in-memory textual draft
- ensure hasUnsaved is updated consistently
- reduce hidden editor synchronization gaps
- prepare safe foundations for future navigation guard
- prepare safe foundations for future export warning
- prepare safe foundations for future hooks extraction
- prepare safe foundations for future Supabase integration

Current non-goals:
- implementing autosave
- implementing navigation guard
- implementing export warning
- implementing Supabase
- introducing routing/global state
- broad hooks extraction
- rewriting the editor
- replacing contentEditable
- redesigning activeDoc immediately
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

→ Strengthen synchronization between DOM mutations, editContent, and hasUnsaved.

Primary synchronization path:

DOM mutations
↓
editContent
↓
hasUnsaved

Key questions:
- Which mutation paths alter the editor DOM?
- Which paths already synchronize draft state?
- Which paths leave editContent stale?
- Which paths leave hasUnsaved stale?
- What is the smallest safe hardening pass?

---

## Editor Semantics Focus

Core concepts:
- pData.docs (persisted source of truth)
- editContent (canonical in-memory textual draft)
- activeDoc (operational snapshot)
- hasUnsaved (session dirty flag, not a reliable diff proof)
- contentEditable DOM state

Formalized decisions / future directions:
- navigation: manual save remains current behavior; future direction is a navigation guard for unsaved textual drafts
- export: export remains based on persisted pData.docs content; future UX should warn or offer save-before-export
- hasUnsaved: currently a session dirty flag, not a reliable diff proof, and must not be persisted to storage or Supabase
- activeDoc: currently an operational snapshot; future direction may move toward activeDocId plus derived selected document
- async workflows: message persistence is scoped by captured project/module/document ids; global loading remains a known limitation
- autosave: still a non-goal and requires stronger DOM sync, reliable dirty state, document scoping, and conflict strategy first

---

## Planning Philosophy

This phase is implementation-light and behavior-preserving.

Preferred approach:
1. map all editor mutation paths
2. identify synchronization gaps
3. classify risks
4. implement the smallest safe hardening
5. validate runtime behavior

This phase should be:
- focused
- pragmatic
- low-risk
- anti-overengineering

Not:
- rewrite-driven
- abstraction-heavy
- feature-driven

---

## Hooks / Controllers Strategy

Hooks extraction remains postponed.

Hooks/controllers should only happen after:
- product decisions are explicit
- document semantics are stable
- editor synchronization is reliable
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
- dirty state must be reliable
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
- Prefer targeted hardening over broad refactors
- Prefer small commits
- Prefer low-risk isolated changes

When implementing:
1. identify responsibilities
2. isolate the smallest safe unit
3. validate runtime
4. commit

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
- feature/editor-sync-hardening

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
3. Synchronization paths
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
- Do not implement autosave
- Do not implement navigation guard
- Do not implement export warning
- Do not implement Supabase yet
- Do not extract hooks prematurely
- Do not replace contentEditable
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
→ explicit, thoughtful, behavior-preserving architectural decisions