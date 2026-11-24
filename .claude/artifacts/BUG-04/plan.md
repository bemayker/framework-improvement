# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (ClickUp task 123k99cx47m. The tracker description is empty; the title is the whole report. The acceptance criteria below are derived from the title and recorded as assumptions in `## Re-Plan Feedback`.)

## Acceptance Criteria
- [ ] 1. Double-clicking "Save note" (or submitting the form again while a save is still in flight) stores the note exactly once: one `POST /api/notes` is sent, and the note appears once in the list, before and after a page reload.
- [ ] 2. While a save is in flight the "Save note" button is disabled, and it is enabled again once that save succeeds or fails, so the next note can be saved and a failed save can be retried.

## Re-Plan Feedback
- Comment (tracker): 51 comments on the task, all earlier runs' bot notes (decisions.md, run=deliver-20261124T101411Z) → not acted on because none is stakeholder feedback on the defect.
- Comment (tracker): description empty → Addressed by: criteria derived from the title. Assumption 1: the defect is the client sending a second `POST /api/notes` while the first is in flight (NoteForm.handleSubmit has no in-flight guard and the submit button is never disabled; verified in frontend/src/components/NoteForm.tsx on b9225d4d). Assumption 2: the fix is client-side only. No server-side deduplication (no idempotency key, no unique constraint on note text): two separate, deliberate saves of the same text remain two notes, which is existing behaviour TEST-03 established and nothing in the item asks to change. This is the same assumption earlier runs recorded, and it keeps BUG-04 off the notes router, service and repository that TEST-12 and its successors edit. Assumption 3: the button keeps its "Save note" label while disabled; no spinner or "Saving..." text, since the item asks for none.
- Merged since the last plan: n/a (first plan, branched from current main b9225d4d after BUG-01 and TEST-09 merged; neither touches the frontend).

## Plan Overview
A frontend-only fix in `frontend/src/components/NoteForm.tsx`. The form gets an in-flight guard: a `useRef<boolean>` flag that is checked and set synchronously at the top of `handleSubmit` (so a second submit in the same tick is dropped before React re-renders), mirrored by an `isSaving` state that disables the submit button for the duration of the request. A disabled default button also blocks implicit submission by pressing Enter in the input. Both are reset in a `finally` block, so success and failure both re-enable the form. The existing behaviour (empty and whitespace-only notes rejected without a request, trimmed text sent, input cleared on success, text kept with an error message on failure) is unchanged and its existing NoteForm unit tests and TEST-03 E2E specs must keep passing unmodified. No backend, API client or LandingPage change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify). Add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`, after `event.preventDefault()`: return immediately when `isSavingRef.current` is true. Keep the existing empty-text validation next (it returns before any request, so it never sets the flag). Before `await createNote(...)`, set `isSavingRef.current = true` and `setIsSaving(true)`; wrap the existing try/catch in `try { ... } finally { isSavingRef.current = false; setIsSaving(false); }`. On the submit button add `disabled={isSaving}` and a disabled visual state: merge `{ cursor: "not-allowed", opacity: 0.6 }` into `buttonStyle` when `isSaving` (a `disabledButtonStyle` constant beside `buttonStyle`). Keep `data-testid="note-submit"`, the label and every other attribute unchanged. A short comment says why the ref exists alongside the state (state updates are not visible to a second event in the same tick).
- Routes: none.
- State management: local component state plus one ref in NoteForm; LandingPage's `onCreated` wiring is untouched.
- Design reference notes: AI freestyle (Design Reference mode NONE). The one new visual state is the disabled submit button: same colours as the enabled button (`#ffffff` on `#1a1a1a`), opacity 0.6, cursor not-allowed.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The fix changes how often the client calls the existing endpoint, not the endpoint.
- Method: POST
- URL: /api/notes
- Request: JSON body with one field, `text` (string, 1 to 500 characters after trimming)
- Response: 201 with the stored note, for example `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight submit guard: chose React's own `useRef` and `useState` (already installed) plus the native `disabled` attribute on the submit button over a debounce or throttle utility (lodash or a hand-written timer), because a time window either still lets a slow request through twice or blocks a legitimate second note; the in-flight flag covers exactly the duration of the request. No new dependency.
- Duplicate prevention on the server (idempotency key or a database constraint): not chosen, per Assumption 2; a unique constraint on note text would also reject two deliberate notes with the same text, which is behaviour nothing asks to change.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec that double-clicks "Save note" against the running app and asserts one POST and one list entry, before and after reload
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script build-feature writes alongside it

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard and `isSaving` state, submit button disabled while saving, reset in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the guard and the disabled state (deferred `createNote` promise)

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: NoteForm component behaviour with `createNote` mocked (Vitest and Testing Library, matching the existing file). Use a deferred promise for `createNote` so the save stays in flight while the test acts: submit twice, assert one call; assert the button is disabled while pending; resolve or reject it, assert the button is enabled again and, after a rejection, that a retry sends a second call.
  - Directory: frontend/src/components/ (tests beside the component, per project-standards.md Layout)
  - Naming: NoteForm.test.tsx (existing file, extended)
- Integration tests: not warranted. No backend, repository or router code changes; the endpoint's contract is unchanged and already covered by backend/tests/integration/test_notes_integration.py.
- E2E tests: one spec reproducing the reported defect in a real browser: open `/`, wait for the mount load, fill a unique note text, `dblclick()` on `note-submit`, wait for the 201, then assert exactly one recorded `POST /api/notes` (match on exact path and method, as the TEST-03 spec's `isNotesApiRequest` does, because the Vite module URL `src/api/notes.ts` contains the same substring) and exactly one list item carrying the text; reload and assert still one. Second spec (edge case): submit one note, then a second note with different text, both stored, proving the button re-enables after a save.
  - Directory: e2e/tests/
  - File: e2e/tests/BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (re-enabled after a failed save).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A double-click or repeated submit while a save is in flight stores the note once | E2E | `stores a double-clicked note only once`, `ignores a second submit while the first save is still in flight` | — (the defect is a duplicate stored row after a real browser double-click; jsdom's synthetic events do not reproduce the browser's event timing against React's flush, so the unit test backs the mechanism and the E2E spec proves the reported outcome) |
| 2 | The button is disabled while saving and enabled again after success or failure | Unit | `disables the save button while a save is in flight`, `re-enables the save button after a successful save`, `re-enables the save button after a failed save so the note can be retried` | Verifying it needs no navigation: it is a component state rule, fully observable on the rendered button with a deferred `createNote` mock, including the failure path a browser test cannot trigger without stubbing the backend |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double-click stores the note once | `dblclick()` on `note-submit` with a unique text, count `POST /api/notes` requests and list items with that text, reload, count again | Given the landing page is open, When I type a note and double-click "Save note", Then the note appears once in the list, And it still appears once after reloading |
| 2 | Button disabled while saving, re-enabled after | covered at Unit, see Criterion coverage; the E2E edge-case spec saves two different notes in a row as a smoke check | Given a slow connection, When I click "Save note", Then the button is disabled until the note appears, And I can save another note afterwards |

## Manual verification plan
### Criterion 1: Double-clicking "Save note" stores the note exactly once
Prerequisites: the app stack is running (frontend at http://localhost:5183, backend reachable from it); a desktop browser with developer tools.
1. Open http://localhost:5183/ → the "Task Notes" page shows the "New note" field, the "Save note" button and the list of saved notes.
2. Open the browser developer tools, Network tab, and type `api/notes` in its filter box → only notes API requests will be listed.
3. Type `BUG-04 double click check` in the "New note" field → the text appears in the field.
4. Double-click "Save note" as fast as you can → the Network tab shows exactly one `POST` request to `/api/notes` with status 201, the field is cleared, and `BUG-04 double click check` appears exactly once in the list.
5. Reload the page → after the list loads, `BUG-04 double click check` is still listed exactly once.
6. Type `BUG-04 enter key check` in the field, click into it, and press Enter twice quickly → one new `POST /api/notes` (201) in the Network tab and the note appears exactly once.
7. Run `npm --prefix frontend test` from the repository root → the summary line reports no failed test and the command exits 0 (this runs frontend/src/components/NoteForm.test.tsx among the others).

### Criterion 2: "Save note" is disabled while a save is in flight and enabled again afterwards
Prerequisites: as for Criterion 1; in the Network tab, set throttling to "Slow 3G" so a save takes a few seconds.
1. Open http://localhost:5183/ → the page loads (slowly) and the "Save note" button looks enabled (solid dark background, normal cursor).
2. Type `BUG-04 slow save` in the "New note" field and click "Save note" once → the button turns faded (reduced opacity) and the cursor over it shows "not allowed"; clicking it again does nothing and no second `POST /api/notes` appears in the Network tab.
3. Wait for the request to finish → `BUG-04 slow save` appears once in the list, the field is cleared and the button is back to its solid, clickable look.
4. Type `BUG-04 second note` and click "Save note" → it is saved and listed, proving the button re-enabled after a success.
5. Set throttling to "Offline", type `BUG-04 offline save` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again.
6. Set throttling back to "No throttling" and click "Save note" → the note is saved once and listed, and the error message disappears.
