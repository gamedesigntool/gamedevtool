# Secure AI Foundation

## Purpose

This document defines the architecture direction for moving AI execution out of the browser and into a secure backend boundary.

It is an architecture foundation, not an implementation plan for a full AI platform.

## North Star

AI should feel native to the Game Design Tool: guided, contextual, and product-aware.

The secure target is:

```text
Frontend
-> AI Client
-> Secure AI Proxy
-> Provider Adapter
-> AI Provider
```

The frontend should own user experience and product context selection. The backend should own provider credentials, provider-specific request construction, access checks, abuse controls, and provider error normalization.

## Current AI State and Risks

Text AI has been migrated to the secure proxy path:

- frontend text call sites delegate to `src/services/ai/aiMessageService.ts`;
- `aiMessageService` is now a compatibility/orchestration layer, not a provider transport;
- `src/services/ai/aiClient.ts` is the frontend transport boundary for text generation;
- `aiClient` invokes the `text-generation` Supabase Edge Function;
- Anthropic request construction, model selection, response parsing, and credentials are isolated server-side behind the provider adapter.

Remaining text AI risks:

- AI prompts are embedded in UI components, especially `src/GameDesignTool.tsx`.
- AI responses are rendered as HTML after markdown conversion, so output handling must remain conservative.
- `contextSnapshot` and `locale` usage still need refinement across frontend call sites.
- Deno/Supabase CLI validation has not been run in this environment and remains required locally.

Current image generation has a separate risk profile:

- `src/services/image/imageGenerationService.ts` calls Pollinations directly from the frontend.
- Generated images are inserted as external URLs.
- There is no Storage-backed ownership, cleanup, or asset metadata boundary yet.

## Chosen Direction

Use a narrow frontend AI client that calls a secure AI proxy.

For the MVP, the recommended secure proxy backend is Supabase Edge Functions.

The first secure provider path is implemented for text AI. Image generation should migrate later because secure image generation also needs asset ownership, Storage policy, generated-file cleanup, and HTML/reference handling.

## Why Supabase Edge Functions for MVP

Supabase is already part of the runtime architecture:

- Supabase Auth is implemented.
- Authenticated cloud projects are already user-owned.
- `projects` and `project_data` have RLS-backed ownership foundations.
- The frontend already has a nullable Supabase client boundary.

Edge Functions are a good MVP fit because they can:

- keep provider secrets server-side;
- receive the user's Supabase auth context;
- validate project/document ownership before calling a provider;
- centralize provider payload construction;
- normalize provider errors;
- support basic quotas and abuse controls;
- avoid introducing a separate backend deployment too early.

## Alternatives Considered

### Keep Direct Frontend Provider Calls

Pros:

- smallest short-term change;
- no backend function deployment;
- current call sites remain simple.

Cons:

- provider secrets cannot be protected;
- provider details remain visible in the browser;
- no trustworthy rate limit, quota, or ownership validation;
- hard to introduce audit logging or usage controls;
- not suitable for production.

Decision: reject for production direction.

### Standalone Backend

Pros:

- maximum control over runtime, libraries, streaming, queues, and observability;
- easier to evolve into a larger AI platform later.

Cons:

- new deployment surface;
- new auth/session integration work;
- more operational cost for a one-developer project;
- premature before the first secure provider path proves the product shape.

Decision: defer unless Edge Functions prove insufficient.

### Supabase Edge Functions

Pros:

- aligns with existing Supabase Auth and ownership model;
- low infrastructure overhead;
- appropriate for a narrow secure proxy;
- good enough for MVP text AI and basic usage controls.

Cons:

- runtime constraints may shape library choices;
- sophisticated streaming, queues, and long-running work may need care;
- observability is simpler than a full backend stack;
- image generation plus Storage will require more design.

Decision: recommended MVP direction.

## Epic Scope

This epic should establish a secure AI execution path without turning the product into a generic AI platform.

In scope:

- define and document the secure AI boundary;
- introduce a minimal frontend AI client contract;
- move text AI provider execution behind a secure proxy;
- keep provider secrets out of frontend code;
- validate authenticated project/document access for cloud AI requests;
- preserve anonymous/local behavior until explicit product decisions require otherwise;
- normalize errors enough for consistent UI handling;
- add basic usage and abuse controls for MVP.

## Explicit Non-Goals

This epic must not introduce:

- RAG;
- embeddings;
- vector memory;
- workflow engine;
- sophisticated streaming;
- complex billing;
- enterprise rate limiting;
- prompt registry/versioning as a full system;
- image Storage/asset ownership migration;
- broad multi-provider abstraction before the first secure path works;
- local-to-cloud import;
- automatic sync;
- editor rewrite;
- global state.

## Initial API Boundary Proposal

The frontend AI client should expose product-level operations rather than provider-level operations.

Initial Edge Function:

- `supabase/functions/text-generation`

Implemented frontend text boundary:

- `src/services/ai/aiClient.ts`: invokes the Edge Function and normalizes transport failures;
- `src/services/ai/aiMessageService.ts`: preserves the existing frontend service API shape while delegating transport to `aiClient`.

Initial text request shape:

- `capability`: document chat, guide chat, benchmarking, or concept generation;
- `projectId`: required cloud project id;
- `moduleId`: when relevant;
- `documentId`: when relevant;
- `instructions`: product-level behavior and response instructions for the current AI surface;
- `contextSnapshot`: contextual/reference material selected by the frontend at send time;
- `messages`: domain chat messages, not provider-native messages;
- `locale`: current product language when relevant.

Initial text response shape:

- `text`;
- `requestId`;
- optional `usage`;
- optional normalized warning or recoverable error metadata.

The frontend should not send provider model names, provider URLs, API keys, or provider-specific options unless explicitly exposed as product-level configuration later.

## Authentication Expectations

Secure AI calls should require an authenticated Supabase session for cloud-backed AI execution.

The proxy should validate:

- the request is authenticated;
- the requested project belongs to the user;
- the requested document belongs to that project when a document id is supplied;
- the capability is allowed for the current product state.

Anonymous/local AI behavior needs an explicit product decision. It should not accidentally continue through direct provider calls once secure proxy migration begins.

## Secrets Policy

Provider secrets must never be exposed to the frontend.

Rules:

- no provider API keys in `VITE_*` variables;
- no provider API keys in client-side config;
- no provider secrets in checked-in docs, examples, screenshots, or logs;
- Edge Function environment variables own provider credentials;
- frontend code must not construct provider authorization headers.

Initial Edge Function secret names:

- `ANTHROPIC_API_KEY`: required by the current text provider adapter.
- `ANTHROPIC_TEXT_MODEL`: optional server-side model override.

These are Edge Function environment variables only. They must not be mirrored into root `.env.example`, Vite config, or frontend code.

## Error Handling Expectations

The secure proxy should normalize provider and validation failures into stable frontend categories:

- unauthenticated;
- unauthorized;
- invalid request;
- quota or rate limited;
- provider unavailable;
- provider timeout;
- provider rejected request;
- unknown server error.

The UI should receive safe messages. Provider raw errors should not be displayed directly to users.

## Timeout Expectations

MVP text AI should use conservative timeouts.

Expectations:

- frontend should handle timeout as a recoverable request failure;
- proxy should set an upper bound for provider calls;
- long-running work should not be introduced in the initial path;
- image generation timeouts should be designed separately with Storage cleanup rules.

## Edge Function Validation

Detailed validation guidance is documented in:

- `docs/architecture/secure-ai-validation.md`

The text-generation Edge Function should be validated with Deno before handoff when the local toolchain provides it:

```sh
deno check supabase/functions/text-generation/index.ts
```

For local runtime validation with Supabase CLI, use:

```sh
supabase functions serve text-generation --env-file <edge-env-file>
```

Do not treat the frontend `typecheck` script as full Edge Function validation. The current app TypeScript check only covers `src`.

## Logging and Observability Expectations

MVP logging should be minimal and privacy-conscious.

Log:

- request id;
- user id;
- project id;
- capability;
- provider;
- normalized status;
- duration;
- rough token or usage data when available.

Do not log full prompts, full document content, full message history, provider secrets, or generated private content by default.

## Provider Abstraction Expectations

Introduce only the abstraction needed for the first secure provider path.

Recommended shape:

- product-facing AI client in the frontend;
- secure proxy request handler;
- one text provider adapter;
- narrow normalized response type.

Avoid a broad plugin/registry architecture until there are at least two real provider paths with proven differences that need abstraction.

## Cost and Abuse Controls for MVP

MVP controls should be simple:

- require authentication for secure AI;
- validate project/document ownership;
- cap request size;
- cap response size;
- use conservative provider max tokens;
- apply basic per-user rate limits or daily usage counters;
- reject unsupported capabilities;
- avoid exposing provider model choice to the frontend.

Complex billing and enterprise-grade rate limiting are not part of this epic.

## Migration Sequence

1. Document the secure AI direction. Completed by this note.
2. Update project guidance so future work does not add new direct provider calls.
3. Define the minimal frontend AI client contract.
4. Create the secure text AI proxy.
5. Add a provider adapter for the first text provider.
6. Migrate `aiMessageService` call path to the AI client/proxy without changing UI behavior.
7. Migrate document chat, guide chats, benchmarking, and concept generation through the secure text path.
8. Validate authenticated text AI manually with a real Supabase session and Edge Function environment.
9. Reassess anonymous/local AI behavior explicitly.
10. Refine `contextSnapshot`, `locale`, and inline error handling after the secure text path is stable.
11. Plan image generation migration separately, including Storage and asset ownership.

## Remaining Risks

- Existing prompts are embedded in UI components and may need extraction later.
- Document AI request lifecycle is still not fully document-scoped.
- AI messages remain embedded in `project_data` until future document/message repositories exist.
- Markdown-to-HTML rendering must remain conservative.
- Anonymous AI behavior is not yet decided.
- Edge Function runtime constraints may affect provider SDK usage.
- Local Deno/Supabase CLI validation is still required before treating the Edge Function runtime as fully verified.
- Image generation security depends on future Storage and asset ownership design.
