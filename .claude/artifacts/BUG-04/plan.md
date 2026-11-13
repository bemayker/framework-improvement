# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m has an empty description. The acceptance criteria below are derived from the title; see `## Re-Plan Feedback` for the assumption.)

## Acceptance Criteria
- [ ] 1. Submitting the note form a second time (a second click on "Save note", or pressing Enter in the field) while the first save of that note is still in flight sends no second `POST /api/notes`: the note is stored once and appears once in the on-page list.
- [ ] 2. Once the in-flight save has finished, whether it succeeded or failed, the form accepts the next submission again: a new note can be saved after a success, and the same note can be retried after a failure.

## Re-Plan Feedback
- Comment (tracker): 40 comments on the ClickUp task, all mayker-dev bot notices from earlier runs (per the dispatch) → not acted on because none states a requirement, a correction or a reproduction.
- Assumption (no description): the defect is a client-side double submit. `NoteForm.handleSubmit` has no in-flight guard, so every submit event that arrives before the first `createNote` resolves issues its own `POST /api/notes`, and the backend (correctly) stores each one. The fix therefore lives in `NoteForm.tsx`. Server-side de-duplication (rejecting identical text, or an idempotency key) is not planned: the title describes one user action producing two rows, two identical notes saved deliberately are legitimate, and an idempotency-key API is scope the item does not ask for (`user_story_alignment.md` Section 3).
- Assumption (criterion 2): the fix must not lock the form permanently; criterion 2 is derived from the title as the boundary of the fix, not as a new feature.

## Plan Overview
One frontend component change. `NoteForm` gains an in-flight guard: a synchronous `useRef<boolean>` flag checked and set at the top of `handleSubmit` (a ref, not only state, because two submit events dispatched in the same tick both read the pre-render state), plus an `isSaving` state that sets the native `disabled` attribute on the "Save note" button while the request is in flight. The flag and the state are cleared in a `finally` block, so success and failure both re-open the form. No backend, API client, routing or page-composition change. Tests: Vitest unit tests in the existing `NoteForm.test.tsx`, and one Playwright spec that reproduces the double submit through the UI against the real backend.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify only).
  - Add `const isSubmittingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`.
  - In `handleSubmit`, after `event.preventDefault()`: if `isSubmittingRef.current` is true, return immediately (no request, no error message change). Keep the existing empty and whitespace-only validation before the guard is set, so a rejected empty submit never locks the form.
  - Set `isSubmittingRef.current = true` and `setIsSaving(true)` immediately before `createNote(trimmedText)`; wrap the existing try/catch in `try { ... } finally { isSubmittingRef.current = false; setIsSaving(false); }`.
  - Button: `disabled={isSaving}`; the existing `data-testid="note-submit"`, label "Save note" and styles stay. The input is not disabled (the user's text must stay visible and the ref already stops a submit from Enter).
  - Existing behaviour unchanged: trimmed text is sent, input clears and `onCreated` fires on success, the error message shows and the text is kept on failure.
- Routes: none.
- State management: local component state plus one ref, inside `NoteForm`. `LandingPage.tsx` is not touched.
- Design reference notes: AI freestyle (Design Reference mode NONE). The disabled button keeps the existing button style; add `cursor: "not-allowed"` and `opacity: 0.6` only while `isSaving`, so the in-flight state is visible. No other visual change.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; the existing internal contract is consumed exactly once per user save.
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight submit guard: chose React's own `useRef` and `useState` (already installed) plus the native `disabled` attribute on the submit button, over a debounce/throttle helper or a form library such as react-hook-form, because a boolean flag cleared in `finally` covers the need exactly and HTML already blocks both click and implicit (Enter) submission through a disabled default button. No new dependency.
- No other net-new component, module or dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec reproducing the double submit through the UI (POST held open by `page.route`), asserting one request and one list item
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual step-by-step UAT clickthrough expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus `isSaving` state), `disabled` submit button while saving, guard cleared in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: Vitest tests for the single request on a double submit, the disabled button while saving, and re-enabling after success and after failure

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` submit guard, with `createNote` mocked as a deferred promise the test resolves or rejects by hand (existing `vi.mock("../api/notes")` pattern).
  - Directory: frontend/src/components/ (co-located Vitest files, the existing frontend convention; `backend/tests/unit/` is the backend directory)
  - Naming: `{Component}.test.tsx`, extending the existing `NoteForm.test.tsx`
  - Use `fireEvent.submit(screen.getByTestId("note-form"))` twice for the double-submit test, so it exercises the ref guard and not only the disabled button.
- Integration tests: not warranted. Integration Tests are ENABLED, but no repository, model, migration or router changes (`testing_standards.md` Section 6); the backend storing every POST it receives is correct behaviour.
  - Directory: backend/tests/integration/ (no file added)
- E2E tests: one spec reproducing the bug through the browser against the real stack. In the test, `page.route("**/api/notes", ...)` holds the `POST` (continue only after the second submit has been attempted) and passes `GET` through; fill a unique note, press Enter in `note-input` twice (and attempt a second click with `dblclick` in a second test), then release the request; assert exactly one recorded `POST /api/notes`, exactly one list item with that text, and the button enabled again afterwards. Reuse the TEST-03 spec's exact-path request matcher shape (pathname equals `/api/notes`), never a substring matcher.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (submit after a failed save).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A second submit while the first save is in flight sends no second POST; the note is stored and listed once | E2E | `stores a note once when Enter is pressed twice before the save finishes`, `stores a note once when Save note is double-clicked`, `sends a single save request when the note is submitted twice before the first save finishes` | — |
| 2 | After the in-flight save finishes (success or failure) the form accepts the next submission | Unit | `disables the save button while a save is in flight`, `accepts a new note once the previous save has finished`, `accepts a retry after a failed save` | verifying it needs no navigation: it is the component's own state transition on promise settle, fully observable with the API client mocked |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Second submit in flight sends no second POST; stored and listed once | Hold the POST with `page.route`, press Enter twice (and double-click in a second test), release, count POSTs and list items | Given the landing page is open, When I type a note and click Save note twice quickly, Then the note appears once in the list and once after a reload |
| 2 | Form accepts the next submission after the save finishes | covered at Unit, see Criterion coverage | Given a note was just saved, When I type a second note and click Save note, Then the second note is added to the list |

## Manual verification plan
### Criterion 1: A second submit while the first save is in flight stores the note once
Prerequisites: the stack is running (backend on its configured port, frontend at http://localhost:5183), the browser DevTools Network tab is open and filtered to `notes`, and throttling is set to "Slow 3G" so the save stays in flight long enough to click again.
1. Navigate to `http://localhost:5183/` → the "Task Notes" title, the "New note" field and the "Save note" button are shown, with the existing notes listed below.
2. Type `Double click check 1` in the "New note" field → the text is shown in the field.
3. Click "Save note", then click it again immediately → after the first click the button turns greyed out and cannot be clicked; the Network tab shows exactly one `POST /api/notes` request.
4. Wait for the request to finish → `Double click check 1` appears exactly once at the end of the list, the field is empty, and the button is enabled again.
5. Type `Enter key check 1` in the field and press Enter twice quickly → the Network tab shows exactly one new `POST /api/notes`, and `Enter key check 1` appears once in the list.
6. Turn throttling off and reload the page → `Double click check 1` and `Enter key check 1` are each listed exactly once.

### Criterion 2: The form accepts the next submission after the save finishes
Prerequisites: as for Criterion 1, with throttling off.
1. Navigate to `http://localhost:5183/`, type `First after fix` and click "Save note" → `First after fix` appears in the list and the button is enabled.
2. Type `Second after fix` and click "Save note" → `Second after fix` is appended below `First after fix`.
3. Stop the backend container (or set DevTools Network to "Offline"), type `Retry after failure` and click "Save note" → the red message "The note could not be saved. Please try again." appears, the field keeps `Retry after failure`, and the button is enabled again.
4. Start the backend again (or set the Network back to "No throttling") and click "Save note" → the error message disappears, `Retry after failure` appears once in the list and the field is empty.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → expected `0 failed` for `frontend/src/components/NoteForm.test.tsx`.
