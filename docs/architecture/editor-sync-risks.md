# Editor Sync Risks Note

## Purpose

This note maps current `DocEditor` DOM-to-React synchronization behavior and editor-related async risks.

Use these companion notes for the broader context:

- `docs/architecture/document-semantics.md`
- `docs/architecture/editor-orchestration.md`

This is factual documentation plus accepted risk framing for the Document Product Decisions Pass. It does not propose or implement runtime changes.

## Current Sync Model

- `DocEditor` receives `value` from parent state.
- The editable surface is a `contentEditable` element.
- User edits mutate the DOM first.
- `DocEditor` reports content changes upward through `onChange`.
- The parent stores the textual draft in `editContent`.
- `hasUnsaved` is set through the parent editor change path.
- `key={activeDoc.id}` remounts `DocEditor` when switching textual documents.
- `insertRef` allows external flows, such as assistant insertion, to imperatively insert HTML into the editor.

The accepted current contract is DOM-first and React-later. React stores the draft after `DocEditor` reports the DOM content back to the parent.

This is an accepted current constraint, not the desired final architecture. Stronger save, export, navigation guard, or autosave behavior should not be built on top of this model until DOM-to-state synchronization risks are addressed.

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

## Dirty State Risks

- `hasUnsaved` is currently a session dirty flag, not a reliable diff proof.
- It may miss DOM mutations that do not trigger a known `onChange` path.
- It may remain true even if the user manually returns content to the saved value.
- It must not be persisted to localStorage or future Supabase storage.
- Future derived dirty state should wait until DOM-to-state synchronization and draft ownership are stronger.

## Async Editor Risks

| Risk | Current behavior or mitigation | Remaining risk | Blocks refactor? |
| --- | --- | --- | --- |
| Assistant response completes after user navigates to another document | The request captures project, module, and document ids at send time. Message writes target the captured document id. | Global `loading` may affect the current visible editor context, and the response may no longer match what the user is looking at. | Yes, for async extraction. |
| Assistant response completes after document deletion | Message mutation helpers ignore writes when the target document no longer exists. | Loading state and user feedback are still global to the current editor flow. | Partially. |
| Assistant response uses stale `editContent` snapshot | The prompt captures `editContent` at send time. | Later draft edits are not included in that in-flight response context. | Yes, for draft/session extraction. |
| Global `loading` state affects editor flows | `loading` is owned by `GDDHubInner`, not by a document-scoped request object. | A request can outlive the user-visible document context. | Yes, for async orchestration changes. |
| Messages persist while editor draft remains unsaved | Chat messages are persisted into `pData.docs`; inserted assistant output only becomes document content after save. | Conversation history and document content can represent different states. | Yes, unless this remains an accepted semantic. |
| Image generation or upload completes after editor context changes | Image insertion calls back into the mounted `DocEditor` instance when available. | There is no explicit cancellation or document-scoped async boundary. | Partially. |

## Accepted Async Direction

- AI/message persistence is intended to be scoped by captured `projectId`, `moduleId`, and `docId`.
- Message writes should target the document captured when the request was sent.
- Missing/deleted target documents may ignore response writes.
- The single global `loading` flag is a known limitation.
- Future direction may use request state keyed by document id.
- No controller or hook extraction should happen in this phase.

## Export And Navigation Sync Risks

- Export intentionally reads persisted content from `pData.docs`.
- Export should not read directly from `editContent` or the editor DOM.
- Current export can diverge from the visible editor when the active textual draft is dirty.
- Future UX should warn, block, or offer save-before-export when dirty textual draft changes exist.
- Current navigation can hide, replace, or discard active textual drafts without a guard.
- Future UX should warn or block before actions that hide, replace, or discard the active textual draft.

These are product directions, not current runtime behavior.

## Autosave Preconditions

Autosave remains a non-goal.

Future autosave should only be considered after:

- Document-scoped drafts exist or are explicitly rejected.
- Dirty state is reliable.
- DOM-to-state flush and synchronization are safe.
- Async requests are scoped to document identity.
- A conflict/version strategy exists for future Supabase persistence.
- Export policy for unsaved drafts is explicit.

## What This Does Not Implement

This note does not implement:

- Replacing `contentEditable`.
- Adding autosave.
- Adding navigation guards.
- Making export include unsaved drafts.
- Changing `hasUnsaved` into a derived comparison now.
- Introducing hooks, controllers, session models, routing, Supabase, global state, or new dependencies.

## Future Implications

Any future `useDocumentDraft`, editor adapter, or document session model should either preserve these sync rules or intentionally redefine them.

In particular, future work should be explicit about:

- Whether DOM-first editing remains the contract or is replaced.
- Whether draft state remains parent-owned.
- Whether async assistant requests are document-scoped.
- Whether export continues to use only persisted content from `pData.docs`.
- Whether navigation guard and export guard should use `hasUnsaved` or future derived dirty state.
- Whether `activeDoc` remains an operational snapshot or is replaced by `activeDocId`.
