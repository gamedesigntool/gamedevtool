# Persistence Context

## Purpose

`PersistenceContext` defines the active workspace and persistence mode for repository migration.

It answers one narrow question: should domain data be treated as local-only or cloud-backed for the current user/session?

It is not:

- a sync engine
- a merge strategy
- a cache layer
- import progress management
- editor draft persistence

The context exists to keep local-first behavior explicit while Supabase-backed repositories are introduced incrementally.

## Core Rule

Login does not change the authoritative data source.

Only an explicit, confirmed local-to-cloud import may change the active source from localStorage to Supabase.

This preserves current behavior: users can authenticate without silently uploading, replacing, merging, deleting, or reclassifying local data.

## States

### `local`

Used when the app is anonymous, Supabase is unconfigured, or no authenticated cloud workspace is active.

- Auth status: anonymous or unconfigured
- Authoritative source: localStorage
- Domain cloud reads allowed: no
- Domain cloud writes allowed: no
- Expected UI behavior: show local workspace behavior; do not show cloud project data; do not upload local data

### `authenticated-local`

Used when a user is authenticated but has not completed an explicit import for the active local dataset.

- Auth status: authenticated
- Authoritative source: localStorage
- Domain cloud reads allowed: no
- Domain cloud writes allowed: no
- Expected UI behavior: continue showing local data; offer explicit import when eligible; clearly avoid implying sync

This state may allow a dedicated import-coordination service to check import metadata, but domain repositories should still treat localStorage as authoritative.

### `cloud`

Used after a successful explicit import activates the authenticated cloud workspace.

- Auth status: authenticated
- Authoritative source: Supabase for migrated repositories
- Domain cloud reads allowed: yes
- Domain cloud writes allowed: yes, only for repositories that have been intentionally migrated
- Expected UI behavior: indicate cloud workspace; keep local data preserved; avoid implying automatic local/cloud sync

## Proposed Type Shape

This TypeScript shape is documentation only. It records the intended contract, not an implementation requirement for this phase.

```ts
type PersistenceContext =
  | {
      mode: "local";
      authStatus: "anonymous" | "unconfigured";
      authoritativeSource: "localStorage";
      domainCloudReadsAllowed: false;
      domainCloudWritesAllowed: false;
    }
  | {
      mode: "authenticated-local";
      authStatus: "authenticated";
      userId: string;
      authoritativeSource: "localStorage";
      importStatus: "not-imported" | "unknown";
      domainCloudReadsAllowed: false;
      domainCloudWritesAllowed: false;
    }
  | {
      mode: "cloud";
      authStatus: "authenticated";
      userId: string;
      authoritativeSource: "supabase";
      importStatus: "imported";
      importBatchId: string;
      domainCloudReadsAllowed: true;
      domainCloudWritesAllowed: true;
    };
```

## Repository Usage

Repositories should receive `PersistenceContext` explicitly through their construction or operation boundary.

Repositories must not:

- read auth state directly
- call auth session services directly
- infer cloud mode only from the presence of an authenticated user
- silently switch backing stores after login

Explicit context keeps repository behavior testable and makes local/cloud boundaries visible at call sites.

## UI Usage

The UI can use `PersistenceContext` to:

- show an import prompt in `authenticated-local`
- indicate whether the active workspace is local or cloud-backed
- keep local workspace behavior after login but before import
- move to cloud workspace behavior only after confirmed import
- return to local behavior after logout without mutating local data

The UI should not present authentication alone as cloud persistence.

## Transitions

### Login

`local` becomes `authenticated-local` when a user signs in.

localStorage remains authoritative. The app may offer import, but no domain cloud reads or writes should occur.

### Successful Import

`authenticated-local` becomes `cloud` after the user explicitly confirms import and the import completes successfully.

Supabase becomes authoritative only for repositories that have been migrated. localStorage remains preserved.

### Logout

`authenticated-local` or `cloud` becomes `local`.

Logout must not delete, overwrite, sync, or otherwise mutate local data.

### Another User Login

When another user logs in, the context should be resolved for that user independently.

Import status, import batch metadata, and cloud workspace state must not be reused across users.

## Non-Goals

`PersistenceContext` must not introduce:

- automatic sync
- local/cloud merge
- realtime
- collaboration
- autosave
- global state
- broad hooks or controller extraction
- `projectDataRepository` migration
- document migration
- editor draft state persistence
- persistence of `activeDoc`, `editContent`, `hasUnsaved`, modal state, loading state, or view state
