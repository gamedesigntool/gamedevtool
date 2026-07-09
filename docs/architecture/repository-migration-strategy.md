# Repository Migration Strategy

## Purpose

This document records the planning decision for incrementally introducing Supabase-backed repositories.

The Cloud Product Foundation goal is to support fresh authenticated cloud workspaces where users can create projects and reopen them from another browser or device. Existing local projects do not need to be imported or migrated in this phase.

This document records the planning direction and current partial implementation. Runtime cloud persistence is active for the top-level authenticated project list and the active project's `project_data` blob. It does not implement local import, sync, merge, realtime collaboration, autosave, global state, normalized project data tables, or broad repository replacement.

## Current State

Persistence is split by authenticated context and repository boundary.

Supabase foundations already exist:

- nullable Supabase client
- environment configuration
- migration infrastructure
- optional authentication
- auth session reading and observation
- minimal login/logout UI
- secure `projects` table with RLS
- Supabase-backed project list operations for authenticated users
- secure `project_data` blob table with RLS
- runtime `supabaseProjectDataRepository` wiring for active cloud project data blobs

Authenticated users use Supabase for the top-level project list. Anonymous users and Supabase-unconfigured environments remain localStorage-backed.

Login and logout do not import, merge, delete, or upload existing local project data. Authenticated cloud projects load and save one `project_data` blob per active project. Anonymous and Supabase-unconfigured project data remains local-only.

Active Supabase migrations for product persistence should create only the runtime persistence tables currently used by the app: `projects` and `project_data`. The Secure AI operational usage table `ai_daily_usage` is separate from product data persistence and stores only safe request-count metadata. Planned tables for profiles, documents, document messages, production tasks, canvas boards, assets, and settings belong in architecture docs until their repositories, ownership checks, RLS policies, and product requirements exist.

## Repository Inventory

| Repository | Responsibility | Migration value | Migration risk | Recommendation |
| --- | --- | --- | --- | --- |
| `settingsRepository` | Stores user interface preferences such as language and theme. | Low. Useful later for account-level preferences, but not central to project ownership. | Low. Small data shape and low product impact. | Keep local for now. Consider cloud settings only after project persistence is stable. |
| `projectRepository` | Stores the top-level `Project[]`: project identity, name, genre, platform, color, emoji, and progress. | High. Establishes the project ownership boundary required for future cloud persistence. | Medium. Runtime bootstrap and save behavior must avoid mixing local defaults with authenticated cloud rows. | First cloud persistence target. |
| `projectDataRepository` / `supabaseProjectDataRepository` | Stores the `ProjectData` blob locally and, for authenticated cloud projects, one single-project JSONB blob per active project. | Very high, because it contains the most valuable user content. | Very high. It mixes multiple product areas and is tightly coupled to editor, export, AI message, guide, canvas, and Kanban flows. | Use the blob bridge minimally for multi-device persistence. Split into narrower repositories later. |

## First Migration Target

`projectRepository` should be the first cloud persistence target.

It is better than `settingsRepository` because projects define the core ownership boundary. Cloud persistence needs a user-owned project row before documents, tasks, canvas boards, assets, or messages can safely belong to anything. Migrating settings first would be technically simple but strategically shallow: it would not validate the most important cloud model.

`projectDataRepository` must not be normalized first because it is currently a synchronous blob repository. It contains several distinct persistence concerns in one nested object:

- saved documents
- document HTML content
- document AI messages
- production tasks
- canvas elements and strokes
- flow builder data
- embedded image references or base64 image data

The current cloud bridge stores one single-project blob only to unlock fresh authenticated multi-device persistence. This is not local import, sync, collaboration, or the final document/task/canvas model.

## Project Data Blob Strategy

`project_data.data` is the MVP bridge and current source of truth for authenticated internal project content. It supports fast iteration across new modules, guided flows, documents, production tasks, canvas and flow data, and AI chat history without schema churn.

This bridge should remain deliberately narrow:

- one row per cloud project
- one JSONB object per active project
- no normalized child tables until runtime repositories need them
- no local-to-cloud import, merge, autosave, collaboration, or realtime assumptions

Known future weaknesses:

- coarse cache granularity
- limited indexing and search inside documents, messages, tasks, and canvas data
- weak analytics support
- whole-blob writes instead of partial updates
- large project blobs as project content grows
- frequent canvas writes
- multi-device conflicts without merge or version strategy
- collaboration and realtime requirements
- embedded base64 images or other large binary payloads

Future normalized repositories should be extracted only when real product needs justify the extra schema and policies. The likely order remains:

1. `documentRepository`
2. `documentMessageRepository`
3. `productionTaskRepository`
4. canvas/flow repository
5. assets and Supabase Storage

Future migrations can backfill normalized tables from `project_data.data` once the target repositories exist.

Large images should not remain embedded as base64 inside the blob long term. Future asset work should store binary data in Supabase Storage and keep references, keys, or URLs in project data. Add an `assets` table only when metadata, cleanup, deduplication, thumbnails, permissions, or analytics require it.

## Fresh Cloud Workspace Model

### Anonymous / Local Mode

Anonymous and Supabase-unconfigured users remain fully local-first.

Authoritative source:

- localStorage for projects
- localStorage for project data
- localStorage for settings

No cloud reads or writes should occur.

### Authenticated Cloud Mode

A signed-in user uses a fresh cloud workspace for migrated repositories.

Authoritative source:

- Supabase for the migrated top-level project list
- Supabase `project_data` for the active project data blob
- localStorage remains the fallback only for anonymous or Supabase-unconfigured usage
- cloud project rows belong to the authenticated user
- localStorage remains authoritative for anonymous and Supabase-unconfigured internal project data

Existing local projects are not imported into the cloud workspace during this phase.

No automatic bidirectional sync should be implied.

## Out-of-Scope Local Data Handling

This phase does not require:

- local-to-cloud import
- local/cloud workspace coexistence for the same user
- merge strategies
- conflict resolution
- preserving existing local projects after login as cloud data
- automatic sync

## Ownership Model

Cloud projects belong to the authenticated Supabase user identity.

Recommended ownership root:

- `projects.owner_id -> auth.users.id`

Future child records should derive access through their parent project where possible:

- documents
- document messages
- production tasks
- canvas boards
- assets

Local projects remain device-local and unauthenticated. They should not receive a fake cloud owner.

Repositories should receive persistence/session context explicitly rather than reading ambient auth state directly. This keeps boundaries testable and prevents hidden behavior changes when login state changes.

Logout must not mutate local data. It should only remove access to the authenticated cloud context.

## Incremental Implementation Order

1. Keep the repository migration strategy aligned with fresh authenticated cloud workspaces.
2. Define a small persistence context model:
   - local anonymous/unconfigured
   - authenticated cloud
3. Ensure the Supabase `projects` table has ownership and RLS before runtime writes.
4. Implement `projectRepository` cloud behavior for authenticated users.
5. Preserve localStorage-backed behavior for anonymous and Supabase-unconfigured usage.
6. Validate key scenarios:
   - anonymous local usage
   - authenticated user with empty cloud workspace
   - create cloud project
   - reopen cloud project from another browser/device
   - logout from cloud workspace
   - login as a different user
   - local defaults are not written into cloud unintentionally
7. Add the isolated `project_data` blob foundation.
8. Wire project data runtime with source tracking and stale async guards.
9. Only later split `projectDataRepository` into narrower boundaries.
10. Migrate project data areas incrementally after the blob path is stable:
   - documents
   - document messages
   - production tasks
   - canvas boards
   - assets and storage-backed images last

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Unintended default project writes | Do not save `ECHOES_DEFAULT` or local fallback data into Supabase during async bootstrap. |
| Cloud/local confusion | Surface the active persistence context once cloud writes exist. |
| Cross-user data exposure | Enable RLS and scope all cloud project reads/writes by authenticated owner id. |
| Over-broad cloud save semantics | Prefer explicit create/update/delete repository operations before treating cloud persistence as "save the whole list". |
| `projectDataRepository` blob complexity | Keep the blob bridge minimal and one-project-at-a-time. Split into narrower future repositories after basic cloud persistence is stable. |
| Editor unsaved state | Never migrate `activeDoc`, `editContent`, `hasUnsaved`, DOM draft state, modal state, loading state, or view state. Only saved document data should be considered for future migration. |

## Non-Goals

This phase must not implement:

- normalized cloud persistence beyond the `project_data` blob
- automatic sync
- local-to-cloud import
- local/cloud workspace coexistence for the same user
- local/cloud merge
- conflict resolution
- realtime
- collaboration
- autosave
- global state
- broad hooks extraction
- controller-layer rewrites
- normalized `projectDataRepository` split migration
- document migration
- asset or Supabase Storage migration
- editor save semantic changes
- silent upload of local data

## Open Questions

- What exact UI copy should indicate an authenticated cloud workspace once project persistence exists?
- Should authenticated users see an empty cloud dashboard by default, or a product starter/sample project created in cloud?
- Which repository operations should replace whole-list saves for cloud project persistence?
- How should the async bootstrap avoid local fallback writes before cloud loading completes?
