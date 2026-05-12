# Editor Orchestration Note

## Purpose

This note maps the editor-related orchestration currently living in `GameDesignTool.tsx` and records accepted orchestration decisions for the Document Product Decisions Pass.

Use `docs/architecture/document-semantics.md` as the companion note for current document, draft, save, export, and navigation semantics.

This document describes current responsibility boundaries and future direction. It does not implement a new architecture.

## Current Orchestration Load

| Responsibility | Current role | Current owner | Classification |
| --- | --- | --- | --- |
| `activeDoc` | Tracks the currently opened operational document snapshot for header state, identity, chat context, delete modal behavior, and active editor/FlowBuilder rendering. It is not canonical content. | `GDDHubInner` in `GameDesignTool.tsx` | Selection + UI coordination |
| `editContent` | Holds the single active textual editor draft while a textual document is open. It may diverge from saved `pData.docs` until manual content save. | `GDDHubInner` in `GameDesignTool.tsx` | Editor draft logic |
| `hasUnsaved` | Drives the unsaved indicator and save button state. It is a session dirty flag, not a reliable diff proof, and must not be persisted. | `GDDHubInner` in `GameDesignTool.tsx` | UI coordination + editor draft logic |
| `openDoc` | Selects a document, initializes `editContent` from saved `doc.content`, clears `hasUnsaved`, and enters the document view. | `GDDHubInner` in `GameDesignTool.tsx` | Mixed/unclear |
| `saveDoc` | Manually writes textual `editContent` into the matching document in `pData.docs`, updates the active snapshot, and clears `hasUnsaved`. | `GDDHubInner` in `GameDesignTool.tsx` with `documentMutations` helpers | Persistence interaction + editor draft logic |
| Metadata mutations | Rename and status changes may persist immediately through separate mutation paths. These are distinct from manual textual content save. | `GDDHubInner` in `GameDesignTool.tsx` with `documentMutations` helpers | Persistence interaction + UI coordination |
| Document navigation | Switches between project, module, document, guide, and FlowBuilder views. Opening another document replaces the current draft with that document's saved content. Future direction is manual save plus navigation guard. | `GDDHubInner` in `GameDesignTool.tsx` | UI coordination + draft lifecycle |
| Export interaction | Opens export UI and exports saved documents from `pData.docs`. It must not read `editContent` or the editor DOM directly. Future UX should warn or offer save-before-export when the active textual draft is dirty. | `GDDExporter` in `GameDesignTool.tsx`, `exportToPDF` in `gddExport.ts` | UI coordination + persistence interaction |
| `DocEditor` props/callbacks | Receives `value`, `color`, `onChange`, and `insertRef`; reports DOM content changes back to `editContent`. It is remounted by `key={activeDoc.id}`. | Parent: `GDDHubInner`; DOM behavior: `DocEditor` | DOM coordination + editor draft logic |
| `send` / assistant response flow | Captures current project/module/document ids and `editContent` snapshot, persists chat messages to the captured document, and allows assistant output to be inserted into the editor draft through `insertRef`. Global loading remains a known limitation. | `GDDHubInner`, `documentMessageMutations`, `aiMessageService`, `DocEditor` insert ref | Async orchestration + mixed/unclear |
| Document mutations | Provide pure document updates for add, content update, rename, status toggle, and delete. | `src/domain/documentMutations.ts` | Persistence interaction |

## Accepted Product Decisions

- `pData.docs` remains the persisted source of truth for saved document content.
- `editContent` remains the single active textual draft.
- Textual document content uses manual save.
- Metadata mutations such as title and status may remain immediate and should be documented separately from content saving.
- `DocEditor` remains DOM-first and React-later for now.
- `activeDoc` remains an operational snapshot for this phase, not canonical document data.
- Future preferred direction is `activeDocId` plus a selected document derived from canonical project data.
- Export continues to use persisted `pData.docs` content and should not read the active editor draft or DOM.
- Future navigation/export UX should guard against unsaved textual drafts, but no guard is implemented in this phase.
- Autosave, routing, global state, Supabase, controller layers, and broad hook extraction remain out of scope.

## Extraction Readiness

| Responsibility | Readiness | Reason |
| --- | --- | --- |
| `activeDoc` | Do not migrate now | Its snapshot role is accepted for this phase. Future migration to `activeDocId` should wait until draft and navigation semantics are stable. |
| `editContent` | Too risky now | It is tied to `contentEditable`, `DocEditor` callbacks, manual save behavior, assistant insertion, and navigation guard semantics. |
| `hasUnsaved` | Do not strengthen now | It is accepted as a session dirty flag. Derived dirty state may come later after DOM synchronization improves. |
| `openDoc` / `saveDoc` | Do not extract now | These functions cross view state, draft state, active snapshot state, and persistence. Extraction could imply new navigation or save semantics. |
| Document navigation | Needs future UX implementation | Product direction is manual save plus guard, but the guard is not implemented in this phase. |
| Export interaction | Needs future UX implementation | Export should continue reading saved data. Future UX should handle dirty active drafts before export. |
| Document mutations | Ready now | These are already extracted as pure helpers, so no near-term architectural move is needed here. |
| Async send/messages | Too risky now | Persistence is scoped by captured ids, but loading state remains global and request lifecycle is not document-scoped. |

## Recommended Near-Term Direction

The near-term direction should remain documentation-first and behavior-preserving.

Before extracting editor ownership, preserve these accepted decisions:

- Manual content save remains the current model.
- Unsaved textual drafts should eventually be protected by navigation/export UX.
- Export continues to use saved `pData.docs` content.
- `hasUnsaved` remains a session dirty flag for now.
- `activeDoc` remains an operational snapshot for now.
- AI/message writes should remain scoped to captured project, module, and document ids.
- `DocEditor` remains DOM-first until synchronization risks are addressed.

Avoid extracting draft ownership until DOM-to-React behavior is clearer.

## Future Direction

- Navigation guard: any action that hides, replaces, or discards the active textual draft should eventually warn or block when `hasUnsaved` or future dirty state indicates unsaved changes.
- Export guard: export should eventually warn, block, or offer save-before-export when the active textual draft is dirty.
- Active document selection: prefer a future `activeDocId` with selected document derived from `pData.docs`.
- Async requests: prefer future request state by document id instead of a single global `loading` flag.
- Draft state: consider focused draft ownership only after product semantics and DOM sync are stable.

## Future Refactor Candidates

- Focused `useDocumentDraft` hook: plausible because `editContent`, `hasUnsaved`, open, save, and delete cleanup form a visible cluster. Premature because the draft lifecycle still depends on DOM behavior and product decisions.
- Explicit document session model: plausible because `activeDoc`, saved content, draft content, and dirty state are currently separate. Premature because it could redefine navigation and save semantics.
- Narrower save/navigation helper extraction: plausible because `openDoc` and `saveDoc` are compact. Premature until their side effects are documented as intentional.
- Editor adapter boundary around `DocEditor`: plausible because contentEditable DOM behavior is specialized. Premature because it risks changing the current DOM contract.

## Stop Conditions

Return to architectural planning instead of implementation if the next change would:

- Implement or change navigation guard behavior.
- Implement or change export dirty-draft behavior.
- Redefine `hasUnsaved` beyond a session dirty flag.
- Migrate `activeDoc` to a different ownership model.
- Introduce autosave.
- Introduce controllers, global state, routing, Supabase, or new dependencies.
- Change the `contentEditable` contract.
