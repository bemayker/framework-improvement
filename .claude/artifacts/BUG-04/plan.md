# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m carries the title only: its description is empty, and its 49 comments are all automated mayker-dev notices. The defect statement below is derived from the title and from the code on main at 035c4d4b.)
>
> Defect: `frontend/src/components/NoteForm.tsx` sends `POST /api/notes` on every form submit and has no in-flight guard. A second click on "Save note" (or a second Enter in the field) before the first request has answered sends a second `POST` with the same text, the backend stores both, and both appear in the list.

## Acceptance Criteria
- [ ] Submitting the note form twice in quick succession (double click on "Save note", or a second click or Enter while the first save is still in progress) sends exactly one `POST /api/notes` and stores and lists the note exactly once.
- [ ] While a save is in progress, the "Save note" button is disabled.
- [ ] When the save finishes, successfully or with an error, the "Save note" button is enabled again, so a next note can be saved or a failed save retried.

## Re-Plan Feedback
- Comment (tracker): 49 comments read over 2 pages, all automated "mayker-dev:" notices from earlier runs → Addressed by: not acted on because none states a requirement or a correction for this item.
- Comment (tracker): none; assumption recorded because the task has no description → Addressed by: the three criteria above are derived from the title. Assumption: the fix is client-side (an in-flight guard in the note form). A server-side dedupe of identical texts is out of scope, because two notes with the same text are legitimate content and the title describes a double submit, not a duplicate-content rule (`user_story_alignment.md` Section 3, no gold plating). This also keeps the item disjoint from TEST-12's notes router, service and repository.

## Plan Overview
Frontend-only fix in one component. `NoteForm` gets an in-flight guard: a `useRef<boolean>` flag that is checked and set synchronously at the top of the submit handler (so a second submit dispatched before React re-renders is still rejected), mirrored by an `isSaving` state that sets the native `disabled` attribute on the submit button for the duration of the request. The flag and state are cleared in a `finally` block, so both success and failure re-enable the button. No backend, API client or LandingPage change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` only.
  1. Add `const isSavingRef = useRef(false);` and `const [isSaving, setIsSaving] = useState(false);`.
  2. In `handleSubmit`, after `event.preventDefault()`: if `isSavingRef.current` is true, return immediately (no request, no error message change). The empty and whitespace validation stays before the guard is set, so an empty submit never disables the button.
  3. Before `await createNote(trimmedText)`: set `isSavingRef.current = true` and `setIsSaving(true)`. Wrap the existing try/catch in `try { ... } finally { isSavingRef.current = false; setIsSaving(false); }`. Existing success and error behaviour (clear text and error, call `onCreated`; or show `SAVE_FAILED_MESSAGE` and keep the text) is unchanged.
  4. Submit button: `disabled={isSaving}` and `aria-busy={isSaving}`; label stays `Save note` (existing tests and the TEST-03 spec locate it by test id and label).
  5. Disabled styling: spread `buttonStyle` with `opacity: 0.6, cursor: "not-allowed"` when `isSaving`; otherwise `buttonStyle` unchanged.
  6. Comment on the ref, one line: why a ref and not only state (two submits in the same tick both read the stale `isSaving` from the closure).
- Routes: none.
- State management: local component state plus one ref; no shared state.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form keeps calling the existing endpoint, at most once per pending save:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard: chose a React `useRef` flag plus `useState` (already installed React) over a debounce utility or a new dependency such as lodash, because the need is "ignore submits while one is pending", not timing-based throttling, and a ref covers it in a few lines.
- Blocking the button: chose the native `disabled` attribute over a JS click-swallowing handler alone, because a disabled default button also blocks implicit form submission by Enter (HTML platform behaviour); the ref stays as the guard for the window before the re-render.
- E2E request holding: chose Playwright's built-in `page.route` over a test-only backend delay, because the installed runner can hold and release the POST deterministically with no hardcoded wait.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: E2E spec, double click stores the note once
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus isSaving state), disabled submit button while saving, cleared in finally
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the guard, the disabled state and the re-enable on success and failure

No dependency changes, so no lockfile. README.md and docs/DEVELOPMENT.md need no edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (Vitest plus Testing Library, existing `vi.mock("../api/notes")`). Use a manually resolved promise (`new Promise` with the resolver captured) so the save stays pending while the test submits again and asserts on the button.
  - Directory: frontend/src/components/ (test beside the component, per project standards)
  - Naming: NoteForm.test.tsx
  - New tests: `sends one create request when the form is submitted twice while saving`, `disables the save button while the note is being saved`, `re-enables the save button after the save succeeds`, `re-enables the save button after the save fails`. Existing six tests must still pass unchanged.
- Integration tests: not warranted. No repository, model, migration or endpoint changes (`testing_standards.md` Section 6).
- E2E tests: one spec, two tests.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
  - `stores a note once when Save note is clicked twice quickly`: open `/`, wait for the mount `GET /api/notes`; install `page.route` on the exact `POST /api/notes` path that holds the request until the test releases it (a deferred promise, not a timeout); record POST requests with `page.on("request")` using the exact-path matcher from the TEST-03 spec (a substring match catches the Vite module `src/api/notes.ts`); fill a unique text (`BUG-04 <label> <uuid8>`); `dblclick()` the `note-submit` button; assert `note-submit` is disabled; release the held request with `route.continue()`; wait for the 201; assert exactly one POST recorded and `note-list` contains exactly one item with that text; assert `note-submit` is enabled again.
  - Edge case `pressing Enter again while saving does not store the note twice`: same hold; fill the unique text, press Enter in `note-input` twice; release; assert one POST and one list item.
- UAT scenarios: one scenario per criterion plus the Enter edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A double submit sends one POST and stores and lists the note once | E2E | `stores a note once when Save note is clicked twice quickly`, `pressing Enter again while saving does not store the note twice`, `sends one create request when the form is submitted twice while saving` | (E2E tier: the defect is a real browser double click against the real backend, so only the browser run proves one stored row) |
| 2 | The Save note button is disabled while a save is in progress | Unit | `disables the save button while the note is being saved` | verifying it needs no navigation: it is a rendered attribute of one component while a mocked promise is pending |
| 3 | The button is enabled again after success or failure | Unit | `re-enables the save button after the save succeeds`, `re-enables the save button after the save fails` | verifying it needs no navigation: it is component state after a mocked promise settles, and the failure path is only reachable deterministically with a mock |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double submit stores once | Hold the POST with `page.route`, double click (and in the edge test press Enter twice), release, assert one POST and one list item | Given the landing page is open, When I type a note and double click "Save note", Then the note appears once in the list and once after a reload |
| 2 | Button disabled while saving | covered at Unit, see Criterion coverage (the E2E spec also asserts it in passing) | Given a save is in progress, When I look at "Save note", Then it is greyed out and cannot be clicked |
| 3 | Button enabled again after success or failure | covered at Unit, see Criterion coverage | Given a save just finished, When I type another note, Then "Save note" can be clicked again |

## Manual verification plan
### Criterion 1: Submitting twice in quick succession stores the note once
Prerequisites: the stack is running (backend on http://localhost:8010, frontend on http://localhost:5183) and the database is reachable. To make the window visible, open browser DevTools, Network tab, and set throttling to "Slow 3G".
1. Open `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the notes list.
2. Type `BUG-04 double click check` in the "New note" field → the text is in the field.
3. Double click "Save note" quickly → in the Network tab exactly one `POST /api/notes` request appears.
4. Wait for the request to finish → the list shows `BUG-04 double click check` exactly once and the field is empty.
5. Reload the page → after the list loads, `BUG-04 double click check` is still shown exactly once (one row stored).
6. Type `BUG-04 enter check`, click in the field and press Enter twice quickly → one `POST /api/notes` in the Network tab, and after it finishes the note is listed exactly once.

### Criterion 2: The Save note button is disabled while saving
Prerequisites: as for Criterion 1, with "Slow 3G" throttling on.
1. Open `http://localhost:5183/` → the "Save note" button is dark and clickable.
2. Type `BUG-04 disabled check` and click "Save note" once → while the `POST /api/notes` is pending, the button turns semi-transparent, the cursor over it shows "not allowed", and clicking it again does nothing (no second POST appears).
3. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → the run reports no failed or errored test and exits 0.

### Criterion 3: The button is enabled again after success or failure
Prerequisites: as for Criterion 1; throttling may be off.
1. Open `http://localhost:5183/`, type `BUG-04 first`, click "Save note" → the note appears in the list and the button is dark and clickable again.
2. Type `BUG-04 second`, click "Save note" → the second note is saved and listed; no reload was needed.
3. Stop the backend (`docker compose stop backend`), type `BUG-04 offline`, click "Save note" → the red message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is clickable again.
4. Start the backend (`docker compose start backend`), click "Save note" again → the note `BUG-04 offline` is saved, listed once, and the error message disappears.
