# Repository Migration Strategy

## Purpose

This document records the planning decision for incrementally introducing Supabase-backed repositories.

The Cloud Product Foundation goal is to support fresh authenticated cloud workspaces where users can create projects and reopen them from another browser or device. Existing local projects do not need to be imported or migrated in this phase.

This document records the planning direction and current partial implementation. Runtime cloud persistence is active only for the top-level authenticated project list. It does not implement project data cloud persistence, sync, merge, realtime collaboration, autosave, global state, or broad repository replacement.

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

Authenticated users use Supabase for the top-level project list. Anonymous users and Supabase-unconfigured environments remain localStorage-backed.

Login and logout do not import, merge, delete, or upload local project data. `projectDataRepository`, documents, tasks, canvas data, chats, settings, and assets remain local-only.

## Repository Inventory

| Repository | Responsibility | Migration value | Migration risk | Recommendation |
| --- | --- | --- | --- | --- |
| `settingsRepository` | Stores user interface preferences such as language and theme. | Low. Useful later for account-level preferences, but not central to project ownership. | Low. Small data shape and low product impact. | Keep local for now. Consider cloud settings only after project persistence is stable. |
| `projectRepository` | Stores the top-level `Project[]`: project identity, name, genre, platform, color, emoji, and progress. | High. Establishes the project ownership boundary required for future cloud persistence. | Medium. Runtime bootstrap and save behavior must avoid mixing local defaults with authenticated cloud rows. | First cloud persistence target. |
| `projectDataRepository` | Stores the `ProjectData` blob: documents, document messages, production tasks, canvas data, flow data, and embedded image references. | Very high, because it contains the most valuable user content. | Very high. It mixes multiple product areas and is tightly coupled to editor, export, AI message, guide, canvas, and Kanban flows. | Do not migrate first. Keep as local snapshot until narrower boundaries are designed. |

## First Migration Target

`projectRepository` should be the first cloud persistence target.

It is better than `settingsRepository` because projects define the core ownership boundary. Cloud persistence needs a user-owned project row before documents, tasks, canvas boards, assets, or messages can safely belong to anything. Migrating settings first would be technically simple but strategically shallow: it would not validate the most important cloud model.

`projectDataRepository` must not be first because it is currently a synchronous blob repository. It contains several distinct persistence concerns in one nested object:

- saved documents
- document HTML content
- document AI messages
- production tasks
- canvas elements and strokes
- flow builder data
- embedded image references or base64 image data

Migrating this blob directly would preserve the wrong boundary and increase the risk of data loss, stale editor state, accidental overwrites, and future complexity.

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
- localStorage remains the fallback only for anonymous or Supabase-unconfigured usage
- cloud project rows belong to the authenticated user
- localStorage remains authoritative for internal project data until those repositories are migrated

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
7. Only later split `projectDataRepository` into narrower boundaries.
8. Migrate project data areas incrementally after project identity is stable:
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
| `projectDataRepository` blob complexity | Do not migrate the blob directly. Split into narrower future repositories first. |
| Editor unsaved state | Never migrate `activeDoc`, `editContent`, `hasUnsaved`, DOM draft state, modal state, loading state, or view state. Only saved document data should be considered for future migration. |

## Non-Goals

This phase must not implement:

- cloud persistence beyond the top-level project list
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
- `projectDataRepository` migration
- document migration
- asset or Supabase Storage migration
- editor save semantic changes
- silent upload of local data

## Open Questions

- What exact UI copy should indicate an authenticated cloud workspace once project persistence exists?
- Should authenticated users see an empty cloud dashboard by default, or a product starter/sample project created in cloud?
- Which repository operations should replace whole-list saves for cloud project persistence?
- How should the async bootstrap avoid local fallback writes before cloud loading completes?
