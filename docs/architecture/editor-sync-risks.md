# Editor Sync Risks Note

## Purpose

This note maps current `DocEditor` DOM-to-React synchronization behavior and editor-related async risks.

Use these companion notes for the broader context:

- `docs/architecture/document-semantics.md`
- `docs/architecture/editor-orchestration.md`

This is factual documentation only. It does not propose an implementation change.

## Current Sync Model

- `DocEditor` receives `value` from parent state.
- The editable surface is a `contentEditable` element.
- User edits mutate the DOM first.
- `DocEditor` reports content changes upward through `onChange`.
- The parent stores the textual draft in `editContent`.
- `hasUnsaved` is set through the parent editor change path.
- `key={activeDoc.id}` remounts `DocEditor` when switching textual documents.
- `insertRef` allows external flows, such as assistant insertion, to imperatively insert HTML into the editor.

The current model is DOM-first and React-later. React stores the draft after `DocEditor` reports the DOM content back to the parent.

## Mutation Paths

| Path | What changes first | Is `editContent` updated immediately? | Is `hasUnsaved` updated? | Risk |
| --- | --- | --- | --- | --- |
| Normal typing/input | `contentEditable` DOM | Yes, through `onInput` -> `onChange` | Yes, through parent `onChange` | Low |
| Toolbar formatting actions | `contentEditable` DOM via `execCommand` | Not always directly; may depend on a later input/change path | Not always directly | Medium |
| Image upload/insertion | `contentEditable` DOM after file load | Yes, explicit `onChange` is called after insertion | Yes, through parent `onChange` | Medium |
| Assistant insertion through `insertRef` | `contentEditable` DOM via imperative insert | Yes, explicit `onChange` is called after insertion | Yes, through parent `onChange` | Medium |
| Document switching/remount | Parent state: `activeDoc`, `editContent`, `hasUnsaved`, then remounted editor DOM | Yes, `editContent` is replaced with saved `doc.content` | Reset to false | Medium |
| Save action | Saved document data in `pData.docs` | No new draft update; it writes current `editContent` to saved data | Reset to false | Low |
| Export action | Export overlay/output based on saved `pData.docs` | No | No | Medium |

## Async Editor Risks

| Risk | Current behavior or mitigation | Remaining risk | Blocks refactor? |
| --- | --- | --- | --- |
| Assistant response completes after user navigates to another document | The request captures project, module, and document ids at send time. Message writes target the captured document id. | Global `loading` may affect the current visible editor context, and the response may no longer match what the user is looking at. | Yes, for async extraction. |
| Assistant response completes after document deletion | Message mutation helpers ignore writes when the target document no longer exists. | Loading state and user feedback are still global to the current editor flow. | Partially. |
| Assistant response uses stale `editContent` snapshot | The prompt captures `editContent` at send time. | Later draft edits are not included in that in-flight response context. | Yes, for draft/session extraction. |
| Global `loading` state affects editor flows | `loading` is owned by `GDDHubInner`, not by a document-scoped request object. | A request can outlive the user-visible document context. | Yes, for async orchestration changes. |
| Messages persist while editor draft remains unsaved | Chat messages are persisted into `pData.docs`; inserted assistant output only becomes document content after save. | Conversation history and document content can represent different states. | Yes, unless this remains an accepted semantic. |
| Image generation or upload completes after editor context changes | Image insertion calls back into the mounted `DocEditor` instance when available. | There is no explicit cancellation or document-scoped async boundary. | Partially. |

## What This Does Not Decide

This note does not decide:

- Replacing `contentEditable`.
- Adding autosave.
- Adding navigation guards.
- Making export include unsaved drafts.
- Changing `hasUnsaved` into a derived comparison.
- Introducing hooks, controllers, session models, routing, Supabase, global state, or new dependencies.

## Future Implications

Any future `useDocumentDraft`, editor adapter, or document session model should either preserve these sync rules or intentionally redefine them.

In particular, future work should be explicit about:

- Whether DOM-first editing remains the contract.
- Whether draft state remains parent-owned.
- Whether async assistant requests are document-scoped.
- Whether export and navigation continue to ignore unsaved draft content.
- Whether `hasUnsaved` remains a UI flag or becomes derived state.
