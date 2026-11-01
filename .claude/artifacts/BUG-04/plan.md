# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The tracker description is empty, read 2026-11-01 from ClickUp task 123k99cx47m. The acceptance criteria below are derived from the title and are recorded as assumptions, per the autonomous-mode ambiguity rule in `user_story_alignment.md` Section 4.)

## Acceptance Criteria
- [ ] Submitting the same note twice in quick succession (two clicks on "Save note", or Enter pressed twice, before the first save has answered) sends one `POST /api/notes`, stores one note, and shows that note once in the list, also after a page reload.
- [ ] Once a save has finished, successfully or with an error, the form accepts the next submission again (the double-submit guard never leaves the form stuck).

## Re-Plan Feedback
- Comment (tracker): 17 comments read, 0 actionable (all framework PR-opened notes, per `.claude/artifacts/BUG-04/decisions.md`) → Addressed by: not acted on because none carries product feedback.
- Assumption (empty tracker description): the defect is a client-side double submit from `frontend/src/components/NoteForm.tsx`, whose `handleSubmit` has no in-flight guard and whose "Save note" button stays enabled while `createNote` is pending, so every extra click or Enter issues its own `POST /api/notes` → Addressed by: an in-flight guard in `NoteForm.tsx` only. A server-side deduplication (idempotency key, uniqueness constraint on note text) is deliberately out of scope: two identical notes saved on purpose are legitimate, and the title names only the "twice quickly" double submit.
- Assumption: criterion 2 is not in the title; it is recorded because a guard that is not released on failure would turn this fix into a new defect (the form could never save again after one error), so it is the regression edge of criterion 1, not new scope.
- Assumption: no visible "Saving..." label or spinner is added; the button is only `disabled` while the save is pending (the native attribute, which also makes the in-flight state observable to a person and a test). A changed label would be gold plating.

## Plan Overview
Frontend-only defect fix in `NoteForm`. `handleSubmit` gains a synchronous in-flight guard (a `useRef` flag, checked and set before the `await`, released in a `finally`), so a second submit event that arrives before the first `createNote` settles returns without a request. A mirrored `isSaving` state sets `disabled` on the "Save note" button for the same window. `LandingPage.tsx` is not modified: the guard lives entirely inside `NoteForm`, and the `onCreated` wiring is unchanged. No backend, API or schema change.

Reproduction (deliver 6.2 / `/fix` Section R1): on the current code, the new unit test "sends one create request when submitted twice before the first save answers" fails with `createNote` called 2 times, and the new E2E spec, which delays the `POST /api/notes` response with `page.route` and clicks "Save note" twice, records 2 POST requests and two list items. Both pass after the fix.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard: `const isSavingRef = useRef(false)` checked first in `handleSubmit` after the empty-text check, set to `true` before `await createNote(...)`, reset in `finally`; `const [isSaving, setIsSaving] = useState(false)` set alongside it, and `disabled={isSaving}` on the `note-submit` button). The empty-note validation path is unchanged and does not touch the guard. `frontend/src/components/NoteForm.test.tsx` (new unit cases, see Testing Strategy).
- Routes: none.
- State management: local component state plus one ref; the ref is the guard because React state set in the first handler is not yet visible to a second handler fired in the same tick, and the state only drives the `disabled` attribute.
- Design reference notes: AI freestyle (Design Reference mode NONE). No visual change beyond the browser's native disabled rendering of the existing button; the existing `buttonStyle` is kept as is.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; the fix only changes how often the client calls it.
- Method: POST
- URL: /api/notes
- Request: JSON body with one field, `text` (string, trimmed, 1 to 500 characters)
- Response: 201 with the stored note, e.g. `{"id": 12, "text": "Buy milk"}`

## Technology Selection
- In-flight guard in `NoteForm`: chose React's built-in `useRef` and `useState` (already installed) plus the native `disabled` attribute on the existing `<button>` over a debounce or throttle helper or a new dependency (lodash, a form library), because a debounce only narrows the window instead of closing it and nothing new is needed for a boolean flag.
- No other net-new component, module or dependency.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: reproduction spec, delays the create response and double-clicks "Save note", asserts one POST and one list item, before and after a reload
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: synchronous in-flight guard in handleSubmit, released in finally; submit button disabled while saving
- [A] frontend/src/components/NoteForm.test.tsx: unit cases for the double submit, the disabled state, and the guard release on success and on failure

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit. frontend/src/components/LandingPage.tsx is deliberately not touched.

## Testing Strategy
- Unit tests (Vitest, React Testing Library, `createNote` mocked as in the existing file): in `NoteForm.test.tsx`, add
  - `sends one create request when submitted twice before the first save answers`: `createNote` returns a pending promise, two `fireEvent.click` on `note-submit`, assert `createNote` called once; then resolve and assert `onCreated` called once (this is the reproduction, it fails on the current code).
  - `ignores Enter-key resubmits while a save is pending`: two `fireEvent.submit` on `note-form`, same assertion.
  - `disables the save button while a save is pending and re-enables it after`: assert `note-submit` is disabled while pending and enabled after the promise resolves.
  - `accepts a new submission after a failed save`: first `createNote` rejects, error shown, second submit calls `createNote` again (called twice in total, once per settled submit).
  - Directory: frontend/src/components/ (co-located, the existing frontend convention; CLAUDE.md's unit directory is the backend's)
  - Naming: {Component}.test.tsx (existing frontend convention)
- Integration tests: not warranted; no repository, model, migration or endpoint changes (`testing_standards.md` Section 6). The existing `backend/tests/integration/test_notes_integration.py` stays as it is.
  - Directory: backend/tests/integration/
- E2E tests: criterion 1, through the browser: `page.route` on the exact `POST /api/notes` path holds the request until both clicks have happened, then continues it; a request listener counts POSTs. Reuse the exact-path matcher pattern of `TEST-03_simple_note_form.spec.ts` (path and method, not substring) and a unique note text per test.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one per criterion plus one edge case (Enter pressed twice).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Submitting the same note twice in quick succession sends one POST, stores one note, shows it once, also after a reload | E2E | — |
| 2 | Once a save has finished, successfully or with an error, the form accepts the next submission again | Unit | verifying it needs no navigation: it is the release of a component-local guard, and a mocked rejecting `createNote` reaches the failure branch that a real backend cannot be made to produce on demand |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double submit stores one note | Hold `POST /api/notes` with `page.route`, double-click `note-submit`, release, assert 1 POST, exactly one `note-list-item-*` with the text, reload, still one | Given the landing page is open and the save is slow, When I click "Save note" twice, Then one note with my text is listed |
| 2 | Form usable again after a save finishes | covered at Unit, see Criterion coverage | Given a save has just finished, When I save another note, Then it is stored and listed |

## Manual verification plan
### Criterion 1: Submitting the same note twice in quick succession stores it once
Prerequisites: the stack is running (frontend on http://localhost:5183, backend reachable at its configured API URL), Chrome with DevTools available.
1. Open http://localhost:5183/ and open DevTools → Network, set throttling to "Slow 3G", filter on `notes` → the "Task Notes" page shows the "New note" field and the "Save note" button.
2. Type `Double click check 1` in the "New note" field → the text appears in the field.
3. Click "Save note" twice, quickly (a double click) → the button turns disabled (greyed, not clickable) after the first click.
4. Wait for the request to finish → the Network panel shows exactly one `POST /api/notes` row with status 201, the field is empty, and the list shows `Double click check 1` once.
5. Set throttling back to "No throttling" and reload the page → the list still shows `Double click check 1` exactly once.
6. Repeat steps 1 to 4 with `Double enter check 1`, pressing Enter twice in the field instead of clicking → one `POST /api/notes` row, the note listed once.
7. From the repository root run `npm --prefix frontend test` → `NoteForm.test.tsx` runs, `0 failed`.

### Criterion 2: The form accepts the next submission after a save finishes
Prerequisites: as for criterion 1, throttling "No throttling".
1. On http://localhost:5183/ type `After success 1` and click "Save note" once → the note is listed and the button is enabled again.
2. Type `After success 2` and click "Save note" → the second note is listed below the first, one `POST /api/notes` per save in the Network panel.
3. In DevTools → Network, right-click the `POST /api/notes` request and choose "Block request URL", then type `After failure 1` and click "Save note" → the red message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again.
4. Unblock the URL (DevTools → Network request blocking, untick the entry) and click "Save note" again → the message disappears, `After failure 1` is listed once.
5. From the repository root run `npm --prefix frontend test` → the `NoteForm.test.tsx` cases "accepts a new submission after a failed save" and "disables the save button while a save is pending and re-enables it after" run, `0 failed`.
