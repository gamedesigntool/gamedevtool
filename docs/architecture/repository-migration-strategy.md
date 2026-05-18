# Repository Migration Strategy

## Purpose

This document records the planning decision for incrementally migrating the current localStorage-backed repositories to Supabase.

The goal is to preserve the existing local-first product behavior while defining a safe path toward cloud-backed persistence. This document is architectural planning only. It does not implement runtime cloud persistence, sync, merge, realtime collaboration, autosave, global state, or repository behavior changes.

## Current State

Persistence is still localStorage-backed.

Supabase foundations already exist:

- nullable Supabase client
- environment configuration
- migration infrastructure
- optional authentication
- auth session reading and observation
- minimal login/logout UI

There is no active runtime cloud persistence yet.

Login and logout do not currently alter local projects, project data, or settings. Authenticated identity exists only as a foundation for future cloud persistence.

## Repository Inventory

| Repository | Responsibility | Migration value | Migration risk | Recommendation |
| --- | --- | --- | --- | --- |
| `settingsRepository` | Stores user interface preferences such as language and theme. | Low. Useful later for account-level preferences, but not central to project ownership. | Low. Small data shape and low product impact. | Keep local for now. Consider cloud settings only after project persistence is stable. |
| `projectRepository` | Stores the top-level `Project[]`: project identity, name, genre, platform, color, emoji, and progress. | High. Establishes the project ownership boundary required for future cloud persistence. | Medium. Project IDs must transition from local IDs to cloud UUIDs without breaking local data. | First real migration target. |
| `projectDataRepository` | Stores the `ProjectData` blob: documents, document messages, production tasks, canvas data, flow data, and embedded image references. | Very high, because it contains the most valuable user content. | Very high. It mixes multiple product areas and is tightly coupled to editor, export, AI message, guide, canvas, and Kanban flows. | Do not migrate first. Keep as local snapshot until narrower boundaries are designed. |

## First Migration Target

`projectRepository` should be the first real repository migration target.

It is better than `settingsRepository` because projects define the core ownership boundary. Cloud persistence needs a user-owned project row before documents, tasks, canvas boards, assets, or messages can safely belong to anything. Migrating settings first would be technically simple but strategically shallow: it would not validate the most important cloud model.

`projectDataRepository` must not be first because it is currently a synchronous blob repository. It contains several distinct persistence concerns in one nested object:

- saved documents
- document HTML content
- document AI messages
- production tasks
- canvas elements and strokes
- flow builder data
- embedded image references or base64 image data

Migrating this blob directly would preserve the wrong boundary and increase the risk of data loss, stale editor state, accidental overwrites, and future merge complexity.

## Local-First + Cloud Coexistence Model

### Anonymous / Local Mode

Anonymous users remain fully local-first.

Authoritative source:

- localStorage for projects
- localStorage for project data
- localStorage for settings

No cloud reads or writes should occur.

### Authenticated Before Import Mode

A signed-in user may still have only local data.

Authoritative source:

- localStorage remains authoritative
- Supabase auth identity is available
- cloud persistence is not active for local projects yet

The app may offer an explicit import option, but must not silently upload, replace, merge, or delete data.

### Authenticated After Import Mode

After a confirmed local-to-cloud import, cloud projects for that user become authoritative for the imported cloud workspace.

Authoritative source:

- Supabase for imported cloud projects
- localStorage remains preserved as local fallback/history
- localStorage must not be silently deleted
- local data and cloud data must remain clearly separated unless a future sync/merge model is explicitly designed

No automatic bidirectional sync should be implied.

## Explicit Local-to-Cloud Import UX

Import should be offered only when all conditions are true:

- Supabase is configured
- the user is authenticated
- local projects exist
- the current user has not already completed an import for the same local dataset
- cloud persistence UX is ready to explain the behavior clearly

The user should understand:

- import creates a cloud copy of local projects
- local data remains on the device
- import is not sync
- import is not merge
- import is not backup unless explicitly communicated as such
- future edits may belong to either local or cloud mode depending on the active persistence context

Import behavior should be conservative:

- copy-only
- no deletion of local data
- no automatic merge
- no silent upload
- no overwrites of existing cloud rows
- no reuse of local IDs as durable cloud IDs
- repeat imports prevented through migration metadata

After import succeeds, the UI should clearly indicate that the authenticated cloud workspace is active.

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

Logout must not mutate local data. It should only remove access to the authenticated cloud context. Local projects, project data, and settings should remain intact.

## Incremental Implementation Order

1. Document the repository migration strategy.
2. Define a small persistence context model:
   - local anonymous
   - authenticated before import
   - authenticated after import
3. Design the local-to-cloud import service contract without wiring runtime persistence.
4. Define import metadata and ID mapping strategy.
5. Migrate `projectRepository` later, once import UX and ownership rules are explicit.
6. Validate key scenarios:
   - anonymous local usage
   - authenticated user before import
   - successful import
   - repeat import prevention
   - logout after import
   - login as a different user
   - localStorage still present after import
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
| Accidental overwrite | Use copy-only import. Never update existing cloud rows during first import without explicit future UX. |
| Stale local data | Treat local and cloud as separate modes. Do not imply sync. |
| Cloud/local confusion | Surface the active persistence context in UX before cloud writes exist. |
| Partial import | Use import batches, status tracking, and idempotent operations. Preserve localStorage until import completion is confirmed. |
| ID mapping | Generate cloud UUIDs and keep local-to-cloud ID mapping as migration metadata. Do not expose local IDs as durable cloud IDs. |
| `projectDataRepository` blob complexity | Do not migrate the blob directly. Split into narrower future repositories first. |
| Editor unsaved state | Never migrate `activeDoc`, `editContent`, `hasUnsaved`, DOM draft state, modal state, loading state, or view state. Only saved document data should be considered for future migration. |

## Non-Goals

This phase must not implement:

- runtime cloud persistence
- Supabase reads or writes from repositories
- automatic sync
- local/cloud merge
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
- localStorage deletion after import
- silent upload of local data

## Open Questions

- What exact UI surface should present the import offer after login?
- Should users be able to explicitly switch between local mode and cloud mode after import?
- What metadata should identify that a local dataset was already imported for a user?
- Should import initially include only `Project[]`, or should it wait until the first project data sub-boundary is ready?
- How should the app communicate that local data remains preserved but is no longer the active cloud source after import?
- What validation report should be shown after import succeeds or partially fails?
