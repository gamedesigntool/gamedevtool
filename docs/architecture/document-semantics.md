# Document Semantics Map

## 1. Purpose

This document records the current mental contract of the document system so future refactors, hooks extraction, autosave design, and Supabase migration can happen safely.

It describes the current architecture semantics, not an ideal future architecture.

## 2. Scope

This document covers the current behavior of:

- Textual documents stored in project modules.
- The active document editor state.
- Document creation, selection, editing, saving, renaming, deletion, and export.
- Guide-generated documents.
- FlowBuilder documents.
- Canvas data.
- Document AI messages and AI-assisted insertion into editor content.

It does not define a future persistence model, remote schema, hook API, or migration plan.

## 3. Core Concepts

### `pData`

`pData` is the main in-memory project/module store.

It contains project-scoped module data, including textual documents, FlowBuilder documents, Canvas data, and production tasks. It is also the state object persisted to localStorage.

### `pData.docs`

`pData[projectId][moduleId].docs` is the canonical saved source for textual documents in a module.

Document lists, saved document content, saved document metadata, export flows, and AI project context are based on this saved data.

### `activeDoc`

`activeDoc` is navigation/selection plus an operational snapshot of the currently opened document.

It is not canonical. It mirrors selected document data enough for the editor header, current document identity, status, title, and active view behavior.

### `editContent`

`editContent` is a volatile editor draft.

It holds the current editable HTML content while the user is editing a textual document. It may intentionally diverge from `pData.docs` until the user saves.

### `hasUnsaved`

`hasUnsaved` tracks whether `editContent` has diverged from the saved document content.

It is UI/editor session state, not persisted document data.

### `project`, `module`, and `view`

`project`, `module`, and `view` are navigation and operational context.

They determine which project/module/document flow is currently active, but they are not document data themselves.

## 4. Source Of Truth

The canonical saved source for textual documents is `pData.docs`.

The canonical in-memory project/module store is `pData`.

The transient editor source is `editContent`.

`activeDoc` is an operational snapshot and should not be treated as the source of truth for saved document content.

Content changes are save-gated:

- Editing updates `editContent`.
- Saving writes `editContent` into `pData.docs`.
- Until saving, export and saved document lists still reflect `pData.docs`.

Metadata changes are currently more immediate:

- Rename updates document title in `pData.docs` and `activeDoc`.
- Status toggle updates document status in `pData.docs` and `activeDoc`.

## 5. State Ownership Map

| Concept | Owner | Responsibilities | Reads | Writes | Persistence |
| --- | --- | --- | --- | --- | --- |
| `pData` | `GDDHubInner` | Project/module data store | Dashboard, modules, editor, guides, FlowBuilder, Canvas, export, AI context | Main handlers, guides, FlowBuilder, Canvas, Kanban | Persisted via localStorage |
| `pData.docs` | Module data inside `pData` | Saved documents per module | Module lists, editor load, export, AI context, reference picker | Create, save, rename, status, delete, guides, FlowBuilder save | Persisted via `pData` |
| `activeDoc` | `GDDHubInner` | Current document selection and operational snapshot | Editor header, document view, chat, delete modal, FlowBuilder | Open document, guide callbacks, rename/status sync, delete cleanup | Transient |
| `editContent` | `GDDHubInner` | Current textual editor draft | Editor, save flow, current-doc AI prompt | Open document, editor changes, AI insertion, delete cleanup | Transient until saved |
| `hasUnsaved` | `GDDHubInner` | Draft divergence flag | Header, save button | Open document, editor changes, save, delete cleanup | Transient |
| `project/module/view` | `GDDHubInner` | Navigation and active workflow context | Render branches and handlers | Navigation actions, guide callbacks, fallbacks | Transient |
| `doc.messages` | Documents inside `pData.docs` | Saved AI conversation for textual documents | Document chat panel | Document AI send/response flow | Persisted via `pData` |

## 6. Document Lifecycle

### Create

A blank textual document is created with an id, title, empty content, empty messages, status, and timestamps.

It is immediately added to `pData.docs`, then opened through the normal document selection flow.

### Select

Selecting a textual document from a module calls the document open flow.

For FlowBuilder documents, selection opens the FlowBuilder view instead of the textual editor.

### Load Into Editor

Opening a textual document sets:

- `activeDoc` to the selected document snapshot.
- `editContent` to the saved document content.
- `hasUnsaved` to `false`.
- `view` to the document view.

### Edit

Textual editor changes update `editContent` and set `hasUnsaved` to `true`.

The saved document in `pData.docs` is not updated during normal text editing.

### Save

Saving writes `editContent` into the matching document in `pData.docs` and updates `updatedAt`.

After save, `activeDoc` is synchronized with the saved content and `hasUnsaved` is reset to `false`.

### Rename

Renaming is an immediate-persisted metadata operation.

It updates the matching document title in `pData.docs` and synchronizes `activeDoc.title`.

### Status Toggle

Status changes are immediate-persisted metadata operations.

They update the matching document status in `pData.docs` and synchronize `activeDoc.status` when the active document is affected.

### Delete

Deleting removes the document from `pData.docs`.

If the deleted document is active, the active editor state is cleared and navigation returns to the module view.

### Export

Export reads saved `pData`.

Unsaved `editContent` draft content is not included unless it has been saved into `pData.docs`.

### AI Mutation

Document AI chat messages are persisted in `doc.messages`.

When AI output is inserted into the editor, it only updates `editContent`. It becomes saved document content only after the user saves.

## 7. Special Flow Semantics

### Guide-Generated Documents

Guides maintain their own local form and AI helper state while the user works through the guided flow.

When compiled, a guide creates a persisted document in `pData.docs` from generated HTML output. The intermediate guide state is not part of the saved document model.

### FlowBuilder Documents

FlowBuilder documents are stored as documents with `framework: "flowbuilder"` and `flowData`.

FlowBuilder keeps local `nodes`, `edges`, and `title` state while editing. These local values are written to `pData.docs` only when the FlowBuilder save action runs.

A new FlowBuilder document may exist only as local FlowBuilder state until the first save.

### Canvas Data

Canvas is not a textual document.

It persists through its own module path in `pData`, using Canvas-specific data such as elements and strokes. It does not use `activeDoc`, `editContent`, or `hasUnsaved`.

### Export

Export is based on saved module documents from `pData`.

Textual documents export their saved HTML content. FlowBuilder documents export saved flow metadata/content summary rather than the live unsaved canvas state.

### AI Messages

Textual document AI messages persist in `doc.messages`.

Guide AI helper chats and Canvas benchmarking chat are local workflow state unless explicitly compiled or inserted into a saved document flow.

## 8. Synchronization Points

Current synchronization points are:

- Document open: `pData.docs` to `activeDoc` and `editContent`.
- Textual save: `editContent` to `pData.docs`, then sync `activeDoc`.
- Rename: title update to `pData.docs`, then sync `activeDoc`.
- Status toggle: status update to `pData.docs`, then sync `activeDoc`.
- Delete: remove from `pData.docs`, then clear active editor state if needed.
- Guide compile/create: guide local state to a new document in `pData.docs`.
- FlowBuilder save: local FlowBuilder state to a document in `pData.docs`.
- Document AI send/response: chat messages to `doc.messages`.
- AI insert into editor: AI output to `editContent`, requiring save before persistence as document content.

## 9. Known Conflict Areas

### Unsaved Draft Versus Saved Data

`editContent` can be newer than `pData.docs`.

This is intentional, but export and saved document previews read the saved version.

### `activeDoc` Snapshot Staleness

`activeDoc` may not always represent the latest saved document object in `pData.docs`.

It should be treated as an operational snapshot, not canonical storage.

### Navigation With Unsaved Changes

Unsaved textual edits are session-local.

Current behavior does not define a broader navigation guard, autosave policy, or draft persistence contract.

### Async AI Responses

AI requests capture project, module, document, and content context at send time.

Responses may arrive after navigation or after document state has changed. Document message writes target the captured document id and are ignored if the document no longer exists.

### Delete While Editing

Deleting the active document removes it from `pData.docs` and clears the active editor state.

Any unsaved draft content for that document is discarded.

### FlowBuilder Unsaved State

FlowBuilder edits are local until saved.

Leaving a new or modified flow before saving can leave `pData.docs` unchanged.

## 10. Current Non-Goals

This document intentionally does not define:

- A Supabase schema.
- A remote persistence strategy.
- Autosave behavior.
- Conflict resolution behavior.
- Hook or controller APIs.
- A normalized document store.
- A migration sequence.
- A redesigned `activeDoc` model.
- Changes to current runtime behavior.

## 11. Future Questions

- Should textual drafts become persistable independent of saved document content?
- Should export warn when the active document has unsaved draft content?
- Should navigation guard against unsaved edits?
- Should document AI messages and document content share a stronger transaction boundary?
- Should FlowBuilder new documents be created immediately or only on first save?
- Should Canvas be treated as a document-like artifact or remain separate module data?
- What timestamp semantics should distinguish created, edited, saved, and AI-updated states?
- What minimum document identity model is needed before remote persistence?
- How should stale async writes be handled when remote persistence is introduced?
