# Document Semantics Note

This note documents the current editor semantics for the Editor Orchestration Pass.
It describes existing behavior only. It does not define a final product policy or an implementation plan.

## Content Ownership

- Saved document content lives in `pData[projectId][moduleId].docs`.
- The current textual draft lives in `editContent`.
- The immediate editable DOM state lives inside `DocEditor`, in the `contentEditable` element.
- `activeDoc` is an operational snapshot used for selection, header state, identity, and active-view behavior. It is not the canonical persisted source.

The saved source of truth after save is `pData.docs`. During editing, the effective working state is split between the `contentEditable` DOM and `editContent`.

## Draft Lifecycle

- Opening a textual document initializes `editContent` from `doc.content`.
- Opening also sets `activeDoc`, resets `hasUnsaved`, and renders the document view.
- User edits change the DOM first.
- `DocEditor` then reports changes through `onChange`, and the parent updates `editContent`.
- The draft is volatile until the user saves.

Unsaved draft content is session/editor state. It is not persisted as document content until the save action runs.

## Save Semantics

- Save is manual.
- Save writes the current `editContent` into the matching document in `pData.docs`.
- After `pData` changes, localStorage persistence happens through the existing `pData` persistence effect.
- Save also updates the active document snapshot enough for the current editor session.
- `hasUnsaved` is a UI flag. It is not a deep comparison between `editContent`, DOM state, and saved content.

`hasUnsaved` should be treated as an editor-session signal, not as a guaranteed proof of data divergence.

## Export Semantics

- Export reads saved documents from `pData.docs`.
- Export uses saved `doc.content`.
- Unsaved `editContent` draft content is not exported.
- This is current behavior, not necessarily final product policy.

A user can currently see unsaved content in the editor while export still uses the older saved version.

## Navigation Semantics

- Opening another textual document replaces `editContent` with that document's saved `doc.content`.
- Any unsaved draft for the previously opened document may be discarded.
- There is currently no navigation guard, autosave behavior, or confirmation flow for unsaved textual drafts.

This behavior should be made explicit before any editor refactor changes draft ownership or navigation flow.

## Known Risks And Future Decisions

- `DocEditor` and React state currently share ownership of editor content: the DOM changes immediately, while `editContent` is updated through callbacks.
- Some toolbar or `contentEditable` mutations may not synchronize immediately unless they trigger an `onChange` path.
- Export can diverge from the visible editor when there are unsaved changes.
- Navigation can discard unsaved draft content without a guard.
- `activeDoc` can become stale if treated as persisted document data instead of an operational snapshot.
- Future hooks, controllers, or editor abstractions should wait until these semantics are accepted.

Do not introduce autosave, routing, global state, controller layers, or broad hook extraction as part of this note.
