# Local-to-Cloud Import Service

## Purpose

`LocalToCloudImportService` is the planned boundary for explicitly copying local data into an authenticated cloud workspace.

It exists to keep repository migration safe and user-controlled. Authentication alone must not upload local data, change the authoritative source, or activate cloud-backed persistence.

The service does not implement sync, merge, autosave, realtime collaboration, conflict resolution, cache behavior, or localStorage cleanup.

## Core Principles

- Import is explicit and user-confirmed.
- Import is copy-only.
- localStorage is preserved after import.
- No local data is silently uploaded.
- No cloud data is overwritten by default.
- Login does not change the authoritative source.
- Only a successful confirmed import may move the active workspace from `authenticated-local` to `cloud`.
- `projectRepository` is the first planned migration target.
- `projectDataRepository` must not be migrated first.

## Preconditions

Import may start only when all conditions are true:

- Supabase is configured.
- The user is authenticated.
- `PersistenceContext.mode` is `authenticated-local`.
- The active user id is available.
- Local projects exist.
- The user has explicitly confirmed import.
- The same local dataset has not already been imported for the same user.
- A stable local snapshot has been captured.
- No editor draft state is included in the import.

## Proposed Input Contract

This TypeScript shape is documentation only. It records the intended service contract, not an implementation requirement for this phase.

```ts
type LocalToCloudImportInput = {
  context: Extract<PersistenceContext, { mode: "authenticated-local" }>;
  localProjects: Project[];
  localProjectData?: ProjectData;
  options: {
    scope: "projects-only" | "projects-and-project-data";
    confirmedByUser: true;
    dryRun?: boolean;
  };
};
```

For the first implementation, `options.scope` should be `"projects-only"`.

`localProjectData` is present only to keep the future contract visible. It should not be imported during the first `projectRepository` migration.

## Proposed Output Contract

```ts
type LocalToCloudImportResult =
  | {
      status: "success";
      importBatchId: string;
      importedProjectCount: number;
      projectIdMap: Record<string, string>;
      warnings: string[];
    }
  | {
      status: "failure";
      importBatchId?: string;
      importedProjectCount: number;
      projectIdMap: Record<string, string>;
      errors: string[];
      warnings: string[];
    };
```

`projectIdMap` maps local project ids to generated cloud project ids.

Local ids must not become durable cloud ids.

## Import Steps

1. Validate the `PersistenceContext`.
2. Validate explicit user confirmation.
3. Capture or receive an immutable local snapshot.
4. Compute a dataset fingerprint for the local snapshot.
5. Check import metadata for an existing completed import.
6. Create an `importBatchId`.
7. Generate cloud UUIDs for imported projects.
8. Build the local-to-cloud id mapping.
9. Insert cloud projects owned by the authenticated user.
10. Record import metadata and mapping.
11. Return a success or failure report.
12. Let the UI or orchestration layer decide whether to activate the `cloud` context.

The service should coordinate import. It should not become a general-purpose repository.

## Atomicity Strategy

For `projects-only`, import should behave as all-or-nothing.

If any project insert fails, the import should not be marked as completed and the app should remain in `authenticated-local`.

If physical rollback is not available, partial rows should be associated with the `importBatchId` and marked with a failed or abandoned batch status. A failed or abandoned batch must not activate the `cloud` workspace.

localStorage remains authoritative unless the import completes successfully.

## Idempotency Strategy

Repeat imports should be prevented through import metadata.

The idempotency key should include:

- user id
- import scope
- dataset fingerprint
- import status

If a completed import already exists for the same user and dataset, the service should not create duplicate cloud projects.

It may return the existing import result or a clear blocked result, depending on the eventual UX decision.

## Metadata Strategy

Minimum planned metadata:

```ts
type ImportMetadata = {
  importBatchId: string;
  userId: string;
  source: "localStorage";
  scope: "projects-only" | "projects-and-project-data";
  datasetFingerprint: string;
  status: "started" | "completed" | "failed" | "abandoned";
  projectIdMap: Record<string, string>;
  createdAt: string;
  completedAt?: string;
};
```

Metadata should support:

- repeat import prevention
- partial import diagnosis
- local-to-cloud id mapping
- future migration of narrower project data boundaries

## Scope Decision

### `projects-only`

Benefits:

- aligns with `projectRepository` as the first planned migration target
- avoids migrating the current `ProjectData` blob
- validates ownership and UUID mapping with lower risk
- keeps the first cloud persistence step small and reversible

Risks:

- users may assume all project content was imported
- UI must clearly explain the limited scope

### `projects-and-project-data`

Benefits:

- imports more user-visible content
- better matches user expectation of a complete project import

Risks:

- migrates the highest-risk blob first
- preserves the wrong persistence boundary
- mixes documents, messages, tasks, canvas, flow data, and embedded images
- increases risk of partial import, stale editor state, and future merge complexity

Recommendation: first import should be `projects-only`.

`projectDataRepository` should remain local until it is split into narrower future repositories.

## UI Integration

The UI should trigger import only from `authenticated-local`.

The import prompt should explain:

- local projects were found on this device
- import creates a cloud copy
- local data remains preserved
- import is not sync
- import is not merge
- no local data will be deleted
- the first import scope is project metadata only, if that remains the implementation scope

After success, the UI should show:

- imported project count
- whether the cloud workspace is now active
- any warnings

After failure, the UI should show:

- that local data is still safe
- that the workspace remains local
- a concise failure message
- whether retry is safe

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Partial imports | Use import batches and do not mark failed batches as completed. Keep `authenticated-local` active on failure. |
| Duplicate imports | Use dataset fingerprint and completed import metadata to block repeat imports. |
| ID mismatches | Generate cloud UUIDs and record local-to-cloud id mapping. Never reuse local ids as durable cloud ids. |
| Large datasets | Start with `projects-only`; defer `ProjectData` and assets until narrower repositories exist. |
| User confusion | Use explicit UI copy: import is copy-only, not sync or merge. |
| Local data loss | Never delete localStorage as part of import. |
| Editor unsaved state | Do not include `activeDoc`, `editContent`, `hasUnsaved`, DOM draft state, view state, modal state, or loading state. |

## Non-Goals

This service must not introduce:

- runtime cloud persistence wiring during the planning phase
- repository behavior changes during the planning phase
- automatic sync
- local/cloud merge
- realtime
- collaboration
- autosave
- global state
- broad hooks or controller extraction
- `projectDataRepository` migration
- document migration
- asset or Supabase Storage migration
- localStorage deletion
- silent upload of local data
- editor draft state persistence

## Final Recommendation

The first implementation should use the simplest safe contract:

- accept `PersistenceContext` explicitly
- run only in `authenticated-local`
- require explicit user confirmation
- import `Project[]` only
- create cloud projects as copies owned by the authenticated user
- generate cloud UUIDs
- store `importBatchId`, dataset fingerprint, and id mapping
- preserve localStorage
- keep `projectDataRepository` local
- activate `cloud` context only after successful import
