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

The context exists to keep anonymous/unconfigured local behavior explicit while Supabase-backed repositories are introduced incrementally for authenticated cloud workspaces.

## Core Rule

Current runtime behavior has not changed: login does not yet enable cloud persistence.

During the Cloud Product Foundation phase, the planned cloud path is a fresh authenticated cloud workspace. Existing local projects do not need to be imported, merged, or preserved as cloud data.

The future switch to cloud persistence should be explicit in implementation and UX, but it should not depend on local-to-cloud import.

## States

### `local`

Used when the app is anonymous or Supabase is unconfigured.

- Auth status: anonymous or unconfigured
- Authoritative source: localStorage
- Domain cloud reads allowed: no
- Domain cloud writes allowed: no
- Expected UI behavior: show local workspace behavior; do not show cloud project data; do not upload local data

### `cloud`

Used when Supabase is configured, the user is authenticated, and the runtime has intentionally enabled cloud-backed repositories for the authenticated workspace.

- Auth status: authenticated
- Authoritative source: Supabase for migrated repositories
- Domain cloud reads allowed: yes
- Domain cloud writes allowed: yes, only for repositories that have been intentionally migrated
- Expected UI behavior: indicate authenticated cloud workspace; avoid implying automatic sync with localStorage

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
      mode: "cloud";
      authStatus: "authenticated";
      userId: string;
      authoritativeSource: "supabase";
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
- silently switch backing stores before the cloud persistence path is intentionally wired

Explicit context keeps repository behavior testable and makes local/cloud boundaries visible at call sites.

## UI Usage

The UI can use `PersistenceContext` to:

- indicate whether the active workspace is local or cloud-backed
- keep local workspace behavior for anonymous or unconfigured usage
- move authenticated users into a fresh cloud workspace once cloud project persistence exists
- return to local behavior after logout without mutating local data

Until cloud persistence is implemented, the UI should not present authentication alone as cloud persistence.

## Transitions

### Login

Current runtime: login does not change repository behavior.

Planned Cloud Product Foundation behavior: login may resolve to `cloud` only after authenticated cloud project persistence is intentionally implemented.

### Cloud Workspace Activation

`local` may become `cloud` for an authenticated user when the app has a configured Supabase client and the cloud-backed repository path is active.

Supabase becomes authoritative only for repositories that have been intentionally migrated. In this phase, the first target is `projectRepository`.

### Logout

`cloud` becomes `local`.

Logout must not delete, overwrite, sync, or otherwise mutate local data.

### Another User Login

When another user logs in, the context should be resolved for that user independently.

Cloud workspace state must not be reused across users.

## Non-Goals

`PersistenceContext` must not introduce:

- automatic sync
- local/cloud merge
- local-to-cloud import requirements
- conflict resolution
- realtime
- collaboration
- autosave
- global state
- broad hooks or controller extraction
- `projectDataRepository` migration
- document migration
- editor draft state persistence
- persistence of `activeDoc`, `editContent`, `hasUnsaved`, modal state, loading state, or view state
