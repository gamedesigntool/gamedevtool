# Editor Orchestration Note

## Purpose

This note maps the editor-related orchestration currently living in `GameDesignTool.tsx` as part of the Editor Orchestration Pass.

Use `docs/architecture/document-semantics.md` as the companion note for current document, draft, save, export, and navigation semantics.

This document describes current responsibility boundaries only. It does not decide or implement a new architecture.

## Current Orchestration Load

| Responsibility | Current role | Current owner | Classification |
| --- | --- | --- | --- |
| `activeDoc` | Tracks the currently opened document snapshot for header state, identity, chat context, delete modal behavior, and active editor/FlowBuilder rendering. | `GDDHubInner` in `GameDesignTool.tsx` | Mixed/unclear |
| `editContent` | Holds the current textual editor draft while the document is open. It may diverge from saved `pData.docs` until save. | `GDDHubInner` in `GameDesignTool.tsx` | Editor draft logic |
| `hasUnsaved` | Drives the unsaved indicator and save button state. It is set by editor callbacks and cleared by open/save/delete flows. | `GDDHubInner` in `GameDesignTool.tsx` | UI coordination + editor draft logic |
| `openDoc` | Selects a document, initializes `editContent` from saved `doc.content`, clears `hasUnsaved`, and enters the document view. | `GDDHubInner` in `GameDesignTool.tsx` | Mixed/unclear |
| `saveDoc` | Writes `editContent` into the matching document in `pData.docs`, updates the active snapshot, and clears `hasUnsaved`. | `GDDHubInner` in `GameDesignTool.tsx` with `documentMutations` helpers | Persistence interaction + editor draft logic |
| Document navigation | Switches between project, module, document, guide, and FlowBuilder views. Opening another document replaces the current draft with that document's saved content. | `GDDHubInner` in `GameDesignTool.tsx` | UI coordination + mixed/unclear |
| Export interaction | Opens export UI and exports saved documents from `pData.docs`. It does not read `editContent`. | `GDDExporter` in `GameDesignTool.tsx`, `exportToPDF` in `gddExport.ts` | UI coordination + persistence interaction |
| `DocEditor` props/callbacks | Receives `value`, `color`, `onChange`, and `insertRef`; reports DOM content changes back to `editContent`. It is remounted by `key={activeDoc.id}`. | Parent: `GDDHubInner`; DOM behavior: `DocEditor` | DOM coordination + editor draft logic |
| `send` / assistant response flow | Captures current project/module/document ids and `editContent` snapshot, persists chat messages, and allows assistant output to be inserted into the editor draft through `insertRef`. | `GDDHubInner`, `documentMessageMutations`, `aiMessageService`, `DocEditor` insert ref | Async orchestration + mixed/unclear |
| Document mutations | Provide pure document updates for add, content update, rename, status toggle, and delete. | `src/domain/documentMutations.ts` | Persistence interaction |

## Extraction Readiness

| Responsibility | Readiness | Reason |
| --- | --- | --- |
| `activeDoc` | Needs more documentation | It acts as both selection state and operational snapshot. Its non-canonical role should stay explicit before extraction. |
| `editContent` | Too risky now | It is tied to `contentEditable`, `DocEditor` callbacks, save behavior, assistant insertion, and navigation discard semantics. |
| `hasUnsaved` | Needs product decision | It is currently a UI flag, not a derived comparison. Changing or extracting it could imply stronger semantics than exist today. |
| `openDoc` / `saveDoc` | Needs more documentation | These functions are small, but they cross view state, draft state, active snapshot state, and persistence. |
| Document navigation | Needs product decision | Current navigation may discard unsaved drafts. That behavior should be accepted or revised before extraction. |
| Export interaction | Needs more documentation | Export clearly reads saved data, but the mismatch with visible unsaved drafts should remain explicit. |
| Document mutations | Ready now | These are already extracted as pure helpers, so no near-term architectural move is needed here. |
| Async send/messages | Too risky now | The flow captures snapshots, persists messages, depends on current draft content, and can complete after navigation or deletion. |

## Recommended Near-Term Direction

The near-term direction should remain analysis-first.

Before extracting editor ownership, clarify and either accept or revise:

- Current document semantics in `docs/architecture/document-semantics.md`.
- Whether unsaved textual drafts may be discarded on document navigation.
- Whether export should continue to use only saved `pData.docs` content.
- Whether `hasUnsaved` remains a UI flag or becomes a derived comparison.
- How `DocEditor` DOM state and React draft state should be treated during synchronization.

Avoid extracting draft ownership until DOM-to-React behavior is clearer.

## Future Refactor Candidates

- Focused `useDocumentDraft` hook: plausible because `editContent`, `hasUnsaved`, open, save, and delete cleanup form a visible cluster. Premature because the draft lifecycle still depends on DOM behavior and product decisions.
- Explicit document session model: plausible because `activeDoc`, saved content, draft content, and dirty state are currently separate. Premature because it could redefine navigation and save semantics.
- Narrower save/navigation helper extraction: plausible because `openDoc` and `saveDoc` are compact. Premature until their side effects are documented as intentional.
- Editor adapter boundary around `DocEditor`: plausible because contentEditable DOM behavior is specialized. Premature because it risks changing the current DOM contract.

## Stop Conditions

Return to architectural planning instead of implementation if the next change would:

- Change navigation semantics.
- Change export semantics.
- Redefine `hasUnsaved`.
- Change `activeDoc` ownership.
- Introduce autosave.
- Introduce controllers, global state, routing, Supabase, or new dependencies.
- Change the `contentEditable` contract.
