# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task [BUG-04: Saving a note twice quickly stores it twice](https://app.clickup.com/t/123k99cx47m) has an empty description. The acceptance criteria below are derived from the title alone; see Re-Plan Feedback for the assumptions.)

## Acceptance Criteria
- [ ] Submitting the same note twice in quick succession (double-clicking "Save note", or clicking it again before the first save has finished) stores exactly one note and shows it exactly once in the list.
- [ ] Once a save has finished, successfully or not, the form accepts the next submit: a new note can be saved after a success, and the same note can be retried after a failure.

## Re-Plan Feedback
- Comment (tracker): 21 comments read by the dispatching session, all framework PR-opened notes from earlier runs → not acted on because none carries feedback on this item's behaviour or scope.
- Comment (tracker): task description is empty → Addressed by: deriving both criteria from the title. Assumption: "twice quickly" means a second submit fired while the first `POST /api/notes` is still in flight (double-click, or a second click or Enter before the response). Criterion 2 is the non-regression guard that the fix must not lock the form permanently.
- Assumption (scope): the fix is client-side only, in `NoteForm`. Two notes with the same text submitted deliberately, one after the other, are legitimate separate notes in this app, so no server-side dedupe (unique constraint, idempotency key) is added: that would change the API contract and is not asked for (`user_story_alignment.md` Section 3). This also keeps BUG-04 disjoint from TEST-12's backend notes files.
- Merged since the last plan: n/a (fresh plan, plan base d86341c is current main).

## Plan Overview
Defect, reproduction class: **frontend unit (Vitest, component level)**. Root cause, read in `frontend/src/components/NoteForm.tsx`: `handleSubmit` has no in-flight guard, so every submit event that arrives before `createNote` resolves sends another `POST /api/notes`, and each 201 is appended to the list by `LandingPage`'s `onCreated`. The backend correctly stores every request it receives.

Fix: `NoteForm` tracks an in-flight save. A `useRef` boolean is checked and set synchronously at the top of `handleSubmit` (after the empty-text check), so a second submit event in the same tick is dropped even before React re-renders; a `isSaving` state mirrors it to set `disabled` on the submit button for the user. Both are cleared in a `finally` so success and failure each re-open the form. Only `NoteForm.tsx` and its tests change. `LandingPage.tsx` is not touched.

Reproduction test (written first, red on current main): render `NoteForm` with `createNote` mocked to a promise that never resolves until released, click `note-submit` twice, assert `createNote` was called exactly once.
Command: `npm --prefix frontend test -- src/components/NoteForm.test.tsx` (expect the new test to fail before the fix, then `0 failed`).

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard via `useRef`, `isSaving` state, `disabled={isSaving}` on the `note-submit` button, guard released in `finally`). The button keeps its label "Save note"; no new text.
- Routes: none.
- State management: local component state plus one ref inside `NoteForm`; no change to `LandingPage` state.
- Design reference notes: AI freestyle (Design Reference mode NONE). The disabled button reuses the existing `buttonStyle` with `cursor: "not-allowed"` and `opacity: 0.6` while disabled.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The existing internal contract is used as is:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard in NoteForm: chose React's built-in `useRef` and `useState` plus the native `disabled` attribute on the submit button over a debounce utility or a request-dedupe library, because the project already has React and a disabled default button also blocks implicit (Enter-key) form submission natively; no new dependency.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser reproduction, double-click "Save note" stores and lists the note once
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard, disabled submit button while saving, guard released on success and failure
- [A] frontend/src/components/NoteForm.test.tsx: reproduction test (two quick submits, one createNote call), disabled-while-saving test, re-enable after success and after failure tests

No dependency changes, so no lockfile is regenerated. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (Vitest + Testing Library, the existing pattern in `NoteForm.test.tsx`): two submits while the first save is pending call `createNote` once and `onCreated` once; the submit button is disabled while pending; it is enabled again after the save resolves (a second note can be saved, `createNote` called twice in total) and after it rejects (retry calls `createNote` again, error shown, text kept).
  - Directory: frontend/src/components/ (colocated, the project's existing frontend convention; backend/tests/unit/ is the backend's directory)
  - Naming: NoteForm.test.tsx (existing file)
- Integration tests: none added. The backend is unchanged and `backend/tests/integration/test_notes_integration.py` already covers `POST /api/notes`; a backend test cannot observe a client-side double submit.
  - Directory: backend/tests/integration/
- E2E tests: on the landing page, fill a unique note text, `dblclick()` the "Save note" button, wait for the 201, assert exactly one `POST /api/notes` was sent, exactly one list item carries the text, and after a reload still exactly one list item carries it.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: double-click stores one note; a second, different note can be saved afterwards; edge case: a failed save can be retried.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Submitting the same note twice in quick succession stores exactly one note and shows it once | E2E (plus the unit reproduction test) | — |
| 2 | Once a save has finished, successfully or not, the form accepts the next submit | Unit | verifying it needs no navigation: it is the component's guard release after resolve and reject, deterministic only with a mocked `createNote` (a real backend cannot be made to fail on demand in the browser spec) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Two quick submits store one note | `dblclick()` on `note-submit` after filling a unique text; count POST requests (1), count `note-list` items with that text (1), reload and count again (1) | Given the landing page is open, When I type a note and double-click "Save note", Then the note appears once in the list and once after reload |
| 2 | Form accepts the next submit after a save finishes | covered at Unit, see Criterion coverage | Given a note was just saved, When I type a different note and click "Save note", Then both notes are listed once each |

## Manual verification plan
### Criterion 1: Submitting the same note twice in quick succession stores exactly one note and shows it exactly once
Prerequisites: the stack is running (`docker compose up`), the frontend is reachable at http://localhost:5183, and the browser devtools Network tab is open filtered on `notes`.
1. Navigate to `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the current note list.
2. Enter `BUG-04 double click check` in the "New note" field → the text appears in the field.
3. Double-click "Save note" as fast as you can → the button greys out briefly, the field clears, and `BUG-04 double click check` appears once at the bottom of the list.
4. Look at the Network tab → exactly one `POST /api/notes` with status 201 was sent.
5. Reload the page → `BUG-04 double click check` is still listed exactly once.

### Criterion 2: Once a save has finished, successfully or not, the form accepts the next submit
Prerequisites: same as Criterion 1, with the note from Criterion 1 already saved.
1. On `http://localhost:5183/`, enter `BUG-04 second note` and click "Save note" once → the button is enabled again after the save, the field clears, and `BUG-04 second note` appears once in the list below `BUG-04 double click check`.
2. Stop the backend (`docker compose stop backend`), enter `BUG-04 retry note` and click "Save note" → the message "The note could not be saved. Please try again." appears, the field still holds `BUG-04 retry note`, and the "Save note" button is enabled.
3. Start the backend again (`docker compose start backend`), wait until `http://localhost:8010/health` answers, then click "Save note" → the error message disappears and `BUG-04 retry note` appears once in the list.
4. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → `0 failed`, covering the NoteForm tests in that file, including the re-enable after success and after failure cases.
