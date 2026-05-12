# Document Semantics Note

This note documents the accepted document semantics for the Document Product Decisions Pass.
It formalizes product and architecture decisions for the current document system without defining an implementation plan.

## Content Ownership

- Persisted document content lives in `pData[projectId][moduleId].docs`.
- `pData.docs` remains the canonical persisted source of truth.
- The current textual draft lives in `editContent`.
- `editContent` is the single active textual draft for the currently opened textual document.
- The immediate editable DOM state lives inside `DocEditor`, in the `contentEditable` element.
- `DocEditor` remains DOM-first for now: user and toolbar actions mutate the DOM before React state is updated.
- `activeDoc` is an operational snapshot used for selection, header state, identity, delete behavior, and active-view behavior. It is not canonical document content.

During editing, effective working state is split between the `contentEditable` DOM and `editContent`. After manual content save, the saved source of truth is `pData.docs`.

## Draft Lifecycle

- Opening a textual document initializes `editContent` from `doc.content`.
- Opening also sets `activeDoc`, resets `hasUnsaved`, and renders the document view.
- User edits change the DOM first.
- `DocEditor` then reports changes through `onChange`, and the parent updates `editContent`.
- The draft is volatile until the user saves.
- There is currently no multi-document textual draft preservation.

Unsaved draft content is session/editor state. It is not persisted as document content until the save action runs.

## Save Semantics

- Content save is manual.
- Manual content save writes the current `editContent` into the matching document in `pData.docs`.
- After `pData` changes, localStorage persistence happens through the existing `pData` persistence effect.
- Save also updates the active document snapshot enough for the current editor session.
- Metadata changes such as document title and status may persist through separate immediate mutation paths. These metadata paths are separate from textual content save.

The current product model is manual save for textual document content, not autosave.

## Dirty State Semantics

- `hasUnsaved` is currently an editor-session dirty flag.
- It is set by known editor change paths and cleared by open, save, and delete flows.
- It is not a reliable diff proof between `editContent`, DOM state, and saved `pData.docs` content.
- It must not be persisted to localStorage or future Supabase storage.
- It may later be replaced or complemented by derived dirty state after draft boundaries and DOM synchronization are stronger.

`hasUnsaved` should be treated as a session signal that the current textual editor has unsaved work, not as a canonical data field.

## Export Semantics

- Export reads persisted documents from `pData.docs`.
- Export uses saved `doc.content`.
- Export must not read directly from `editContent` or the `DocEditor` DOM.
- Unsaved textual draft content is not exported under the current runtime behavior.
- Intended future UX: when the active textual document has unsaved draft changes, export should warn, block, or offer a save-before-export path.
- This warning or save-before-export path is not implemented in this phase.

A user can currently see unsaved content in the editor while export still uses the older saved version.

## Navigation Semantics

- Opening another textual document replaces `editContent` with that document's saved `doc.content`.
- Any unsaved draft for the previously opened document may currently be discarded or hidden implicitly.
- There is currently no navigation guard, autosave behavior, or confirmation flow for unsaved textual drafts.
- Accepted product direction: manual save plus navigation guard.
- Any future action that hides, replaces, or discards the active textual draft should warn or block when there are unsaved changes.
- No autosave and no multi-document draft preservation should be introduced in this phase.

The guard is an intended product direction, not a current implementation.

## Active Document Snapshot

- `activeDoc` is an operational snapshot for the active editor UI.
- It must not be treated as the canonical document source.
- `pData.docs` remains canonical for saved document data.
- Future preferred direction: store an `activeDocId` and derive the selected document from canonical project data.
- Do not migrate to `activeDocId` during this phase.

This distinction matters because `activeDoc` can become stale when document data changes through separate mutation paths.

## Autosave Assumptions

Autosave remains a non-goal for this phase.

Future autosave should only be considered after:

- Document-scoped drafts exist or are explicitly rejected.
- Dirty state is reliable enough for save/export/navigation decisions.
- DOM-to-state flush and synchronization are safe.
- Async requests are scoped to document identity.
- A conflict/version strategy exists for future Supabase persistence.
- Export policy for unsaved drafts is explicit.

## Known Risks And Future Decisions

- `DocEditor` and React state currently share ownership of editor content: the DOM changes immediately, while `editContent` is updated through callbacks.
- Some toolbar or `contentEditable` mutations may not synchronize immediately unless they trigger an `onChange` path.
- Export can diverge from the visible editor when there are unsaved changes.
- Navigation can discard unsaved draft content without a guard.
- `activeDoc` can become stale if treated as persisted document data instead of an operational snapshot.
- Future hooks or editor abstractions should preserve these accepted semantics unless a later product decision intentionally changes them.

Do not introduce autosave, routing, global state, controller layers, Supabase, or broad hook extraction as part of this phase.
