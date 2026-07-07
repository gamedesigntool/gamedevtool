# Supabase Readiness Note

This note records the accepted architecture direction for the Supabase Readiness Pass.
It prepares the project for an incremental migration from localStorage-backed persistence to Supabase-backed persistence.

This is not a full Supabase integration pass. It does not implement autosave, realtime collaboration, repository replacement, editor rewrites, or broad state extraction.

Update after the Supabase Authentication Pass:

- optional Supabase authentication now exists behind a nullable client boundary
- missing Supabase environment variables keep the app in local-only mode
- login and logout do not alter local projects, project data, or settings
- localStorage remains the active runtime persistence
- authenticated user identity is only a foundation for future cloud persistence
- cloud sync, import, merge, sign-up, and account management remain future phases

Update for the Cloud Product Foundation phase:

- existing local projects do not need to be migrated to cloud for this phase
- testers are expected to start with a fresh authenticated cloud workspace
- local-to-cloud import, coexistence, merge strategies, conflict resolution, and automatic sync are out of scope unless explicitly reintroduced later
- `projectRepository` remains the first cloud persistence target, reframed as cloud-native persistence for new authenticated projects

## Purpose

The goal of this pass is to make the current persistence boundaries explicit and define a low-risk path toward cloud persistence.

The intended migration path is:

1. Document the current localStorage boundaries.
2. Define target persistence contracts.
3. Introduce async repository contracts while keeping localStorage as the first implementation.
4. Add Supabase-backed repositories one area at a time.
5. Add migration/coexistence behavior only after the target contracts are stable.

The current product behavior should be preserved during this pass.

## Current Persistence Boundaries

Current persistence is intentionally thin and synchronous.

| Boundary | File | Current owner | Backend | localStorage key |
| --- | --- | --- | --- | --- |
| Projects | `src/repositories/projectRepository.ts` | `Project[]` | localStorage | `gdt_projects` |
| Project data | `src/repositories/projectDataRepository.ts` | `ProjectData` | localStorage | `gdt_pdata` |
| Settings | `src/repositories/settingsRepository.ts` | `lang`, `theme` | localStorage | `gdt_lang`, `gdt_theme` |
| Storage helper | `src/services/localStorage.ts` | JSON get/set wrapper | localStorage | defined in `LS_KEYS` |

`projectDataRepository` is the highest-risk boundary because `ProjectData` currently stores several product areas in one nested object:

- module documents
- document HTML content
- document AI messages
- flow builder data
- production tasks
- canvas elements and strokes
- embedded image references or base64 image data

The canonical saved document source remains `pData[projectId][moduleId].docs`.
Editor session state such as `activeDoc`, `editContent`, `hasUnsaved`, view selection, modal state, and loading state must not become persisted data.

## Async Repository Readiness

`projectRepository` has a preparatory async contract and a localStorage-backed adapter.
`settingsRepository` has a preparatory async contract and a localStorage-backed adapter.

`src/services/bootstrap/projectBootstrapService.ts` exists as a future bootstrap boundary.
Its `loadInitialProjects(fallback)` function delegates to `localProjectRepository.loadProjects({ fallback })`.
It is not used by runtime yet.
`GameDesignTool.tsx` still uses the current synchronous project initialization path, preserving behavior while preparing a future async bootstrap step.

`projectDataRepository` intentionally remains synchronous and blob-based for now.
It should be split into narrower future repositories before async conversion.

No call sites have been migrated to async runtime usage yet.
localStorage remains the active backing implementation.

## Target Supabase Model

The pragmatic v1 Supabase model should favor explicit ownership and queryable product entities without normalizing every interactive sub-shape.

Proposed v1 Postgres entities:

- `profiles`
- `projects`
- `documents`
- `document_messages`
- `production_tasks`
- `canvas_boards`
- `assets`
- `user_settings`

Potential v1 or later entity:

- `project_modules`

### Postgres vs Storage

Postgres should store:

- projects and project metadata
- document metadata and saved HTML content
- document messages
- production tasks
- canvas and flow metadata
- asset records and ownership metadata
- user settings

Supabase Storage should store:

- uploaded document images
- generated document images
- canvas image assets
- future document assets that are binary or large
- future export artifacts only if cloud export history becomes a product requirement

Storage should not be used for:

- document HTML
- chat messages
- flow data
- small canvas JSON
- guide constants
- transient export overlays
- editor draft state

### JSONB Choices

JSONB is acceptable in v1 for shapes that are highly UI-tool-specific and not yet worth querying relationally:

- `documents.flow_data`
- `canvas_boards.elements`
- `canvas_boards.strokes`
- `assets.metadata`
- migration metadata, if needed

These shapes can be normalized later if product requirements demand collaboration, per-node history, per-element permissions, or analytics.

### Not Normalized Yet

Do not normalize these during the readiness pass:

- flow builder nodes and edges
- canvas elements and strokes
- guide form intermediate state
- editor session draft state
- per-toolbar editor operations
- module configuration constants

## ProjectData Split Boundaries

`projectDataRepository` is currently a synchronous localStorage snapshot repository.
It persists the whole `ProjectData` blob under `gdt_pdata`, and it remains the active runtime path for now.

It should not be converted directly to async yet because:

- the current `useState` initializer cannot become async directly
- the global `pData` save effect could race against async loading or later async saves
- `ProjectData` mixes documents, messages, production tasks, canvas data, flow data, and embedded image references
- document/editor semantics are sensitive and are already documented in the document and editor architecture notes

Future persistence should split this blob into narrower boundaries:

- `documentRepository` for saved document metadata, status, content, module ownership, and delete/create/update operations
- `documentMessageRepository` for document chat history, append/set operations, and future AI context retrieval
- `productionTaskRepository` for Kanban task persistence by project
- `canvasRepository` for project canvas boards, keeping elements and strokes as JSON initially
- `assetRepository` later for uploaded/generated images and Storage-backed metadata
- flow builder data should remain inside `Document.flowData` initially, rather than becoming a separate normalized boundary

Recommended migration order:

1. Keep `projectDataRepository` as the local snapshot repository.
2. Document the split boundaries before changing runtime behavior.
3. Define async contracts later, once project identity and bootstrap behavior are clearer.
4. Migrate documents after project identity and async bootstrapping are stable.
5. Normalize messages with the first document migration.
6. Migrate production tasks after documents and messages.
7. Migrate canvas and flow JSON later.
8. Migrate Storage-backed assets last.

Non-goals for this pass:

- no async conversion of `projectDataRepository` yet
- no `GameDesignTool.tsx` changes
- no editor rewrite
- no autosave
- no Storage migration now
- no normalization of canvas or flow internals now

## Open Schema Decisions

### `project_modules` vs `module_key`

`module_key` on `documents` may be enough for v1 because modules are currently static product configuration, not user-created entities.

`project_modules` becomes useful if the product needs module-level metadata, ordering, enable/disable state, permissions, progress, or custom modules.

Recommendation for v1:

- Use `documents.module_key` as the primary link.
- Add `project_modules` only if a concrete module-level persistence need appears before implementation.
- Keep the schema open to adding `project_modules` later without changing document identity.

### Local IDs to UUIDs

Current local IDs are short random strings or legacy numbers.
Supabase entities should use UUIDs.

During migration, local IDs should be mapped to UUIDs through a deterministic migration map for the active import batch.

Recommended approach:

- Generate new UUIDs for migrated cloud rows.
- Keep a temporary `local_id` and `migration_batch_id` in migration metadata or import staging records.
- Preserve relationships by mapping old project/document/task IDs to new UUIDs during the import.
- Do not expose local IDs as durable cloud identifiers.

### Document Messages

`document_messages` should be normalized from the first document migration if the document repository is being migrated to Supabase.

Reasons:

- messages are append-oriented
- messages may grow independently from document content
- message history is useful for AI context, pagination, auditing, and future quotas
- embedding messages inside `documents` would preserve the current blob problem

Temporary embedding is acceptable only for a short localStorage coexistence adapter, not as the preferred Supabase schema.

## Auth Strategy

The product should remain local-first by default.

Users should be able to use the local app without login while persistence remains localStorage-backed.

The Supabase Authentication Pass implemented only the minimal runtime foundations:

- `authSessionService` for session reading, auth state observation, email/password sign-in, and sign-out
- local component state for the current auth snapshot
- `AuthControls` for minimal login/logout UI when Supabase is configured

When Supabase is not configured, auth resolves to local-only mode and no login UI is shown.
When a user signs in or signs out, local projects, project data, and settings remain untouched.

Login should become necessary for:

- cloud sync
- Supabase Storage
- Edge Function AI calls
- multi-device persistence
- future collaboration and sharing

Historical note: an earlier plan assumed local data migration after login. That is not active for the Cloud Product Foundation phase.

If local import is reintroduced later, it should be explicit and user-controlled:

1. Detect existing localStorage projects and project data.
2. Ask the user to import local data into cloud storage.
3. Create cloud projects owned by the authenticated user.
4. Migrate nested project data into documents, messages, tasks, canvas boards, and assets.
5. Preserve localStorage until the import is confirmed.
6. Avoid duplicate imports with migration metadata.

Ownership should be rooted in `auth.users`.
Projects should have an `owner_id`.
Documents, tasks, canvas boards, and assets should derive access through their project.

## Realtime Strategy

Realtime is not needed for v1.

Do not design or implement collaboration during this pass.

Realtime may become useful later for:

- project collaboration
- document presence
- Kanban updates across users
- shared canvas or flow editing
- notifications for long-running AI or asset operations

Realtime should not be used yet for:

- autosave
- editor draft sync
- multiplayer editing
- replacing local React state

## Edge Functions Strategy

Future AI calls should go through Supabase Edge Functions rather than directly from the frontend to provider APIs.

Edge Functions should own:

- AI provider secrets
- provider request construction
- authentication checks
- project/document ownership checks
- rate limiting and quotas
- provider error normalization
- generated image upload to Storage
- minimal usage logging

The frontend should continue to own:

- UX orchestration
- prompt input state
- visible loading state
- manual save behavior
- editor insertion behavior
- deciding when AI output becomes saved document content

For text AI, the frontend should send the current project/document identity and the relevant context snapshot.
The Edge Function should validate access before calling the AI provider.

For image AI, the Edge Function should validate access, call the image provider, store generated assets in Supabase Storage, create asset metadata, and return a usable asset reference.

## Incremental Migration Plan

Recommended order:

1. Define the target schema and ownership model.
2. Introduce async repository contracts while keeping localStorage implementations.
3. Convert `projectRepository` first because `Project` is small, stable, and defines future ownership.
4. Treat `settingsRepository` as optional cloud persistence; local settings can remain local until user profiles are introduced.
5. Split `projectDataRepository` conceptually into narrower contracts before Supabase replacement:
   - documents
   - document messages
   - production tasks
   - canvas boards
6. Migrate documents after project identity and async contracts are stable.
7. Migrate document messages with the first Supabase document migration.
8. Migrate production tasks after documents.
9. Migrate canvas and flow data as JSONB after core documents are stable.
10. Migrate Storage-backed images and assets later, after asset ownership and HTML reference rewriting are designed.

During the Cloud Product Foundation phase, do not design local/cloud coexistence as a requirement.

## Non-Goals

This pass must not:

- implement full Supabase integration
- replace all repositories at once
- migrate all data at once
- implement autosave
- introduce global state
- extract broad hooks or controllers
- rewrite the editor
- change document save semantics
- change export semantics
- introduce realtime collaboration
- normalize every UI-specific data structure
- add new dependencies without a concrete migration need

## Recommended Next Implementation Step

The next step should return to architectural planning before runtime persistence changes.

Recommended focus:

1. Decide the first repository boundary to prepare after authentication.
2. Keep localStorage as the active runtime persistence until authenticated cloud project persistence is intentionally implemented.
3. Prepare `projectRepository` as the first cloud persistence target for fresh authenticated cloud workspaces.
4. Do not begin cloud sync, local/cloud merge, local-to-cloud import, Edge Functions, or AI proxying as part of the Cloud Product Foundation documentation update.
