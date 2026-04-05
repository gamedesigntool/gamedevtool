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

The project is in **architecture and foundation stage**.

Priorities:
- understand existing prototype
- improve structure and organization
- reduce coupling
- define domain models
- prepare for Supabase integration
- create a maintainable base

Non-priorities:
- adding new features
- premature optimization
- scaling concerns

When suggesting work:
→ prioritize structure over features

---

## Current Codebase Reality

The current system:
- is a large React + TypeScript SPA
- heavily relies on a single large TSX file
- uses local component state extensively
- uses manual view switching (no proper routing yet)
- persists data via localStorage
- mixes UI, state, and logic together

This is expected for a prototype.

Guidelines:
- respect existing behavior
- improve incrementally
- do not propose full rewrites unless explicitly requested

---

## Architecture Principles

### General

- Prefer simple and maintainable solutions
- Avoid overengineering
- Favor clarity over cleverness
- Build for one developer, not for enterprise scale

### Structure

- Prefer feature-based organization (modules) over generic folders
- Separate:
  - UI (components)
  - state (hooks)
  - domain logic
  - data access (services)

- Avoid mixing responsibilities in a single file

### State Management

- Use local state for UI concerns
- Use custom hooks for feature logic
- Introduce global state only when truly needed
- Avoid heavy state libraries unless justified

### Data Modeling

- Define explicit domain types (Project, Document, Section, etc.)
- Do not rely on implicit or loosely shaped objects
- Keep frontend models separate from database models

---

## AI Integration Rules

- AI must NOT be called directly from the frontend in production architecture
- All AI interactions should go through backend boundaries (e.g., Edge Functions)

- Keep AI logic isolated:
  - create an AI service layer
  - define typed request/response contracts

- Do NOT couple UI components directly to:
  - prompt construction
  - provider-specific formats
  - raw API calls

- AI is a capability, not the architecture

---

## Supabase & Persistence Rules

- Design new data flows with Supabase in mind
- Do not spread persistence logic across components

- Introduce service/repository layers:
  - projectService
  - documentService
  - aiService

- Keep storage strategy replaceable:
  - allow gradual migration from localStorage → Supabase

- Prefer clear entity modeling:
  - projects
  - documents
  - sections
  - (future) messages, tasks, canvas

---

## Refactoring Guidelines

- Preserve behavior unless explicitly told otherwise
- Prefer extraction over rewriting
- Break large components into smaller parts gradually

- When refactoring:
  - identify boundaries first
  - extract components/hooks/services step-by-step

- Do NOT:
  - mix refactor + feature work in the same change
  - introduce large architectural patterns all at once

---

## UX & Product Rules

- Preserve guided workflows
- Avoid turning flows into generic text editing

- Prioritize:
  - clarity
  - focus
  - step-by-step guidance

- Each feature should:
  - help the user think better
  - reduce cognitive load
  - guide decisions

---

## Business-Aware Guidance

- Primary audience: solo indie developers
- Secondary: small teams

- Avoid:
  - premature enterprise features
  - complex permission systems early

- Focus on:
  - fast idea → structured output
  - strong individual experience
  - clear value in free usage

---

## Tech Stack Preferences

Preferred stack:
- React + TypeScript
- Vite
- React Router
- TanStack Query
- Supabase client
- Zod
- Tailwind CSS

Rules:
- New libraries are allowed when:
  - they are mature and widely adopted
  - they clearly reduce complexity

- Do NOT:
  - add libraries for hypothetical problems
  - introduce unnecessary abstractions

---

## Decision-Making Behavior

When working on a task:

1. Understand context first
2. Ask questions if needed
3. Break the problem into steps
4. Propose a simple approach
5. Explain trade-offs when relevant
6. Only then implement

---

## Response Style

When analyzing or proposing changes, structure responses as:

1. Current state
2. Problems
3. Proposed approach
4. Practical next steps

For implementation:
- explain where code goes
- explain why decisions are made

---

## DO NOT

- Do not propose full rewrites by default
- Do not overengineer
- Do not treat this as a generic editor
- Do not mix UI, domain logic, and persistence
- Do not call AI providers directly from frontend
- Do not introduce complexity without justification
- Do not assume requirements that were not specified

---

## Final Principle

This project should evolve from:
→ a working prototype

into:
→ a clean, modular, scalable foundation

through:
→ small, well-reasoned, incremental improvements