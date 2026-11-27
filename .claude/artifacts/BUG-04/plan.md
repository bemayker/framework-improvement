# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice
>
> (Defect item, ClickUp task 123k99cx47m. The tracker item carries no description: the title above is the whole feature text. The acceptance criteria below are derived from the title and recorded as an assumption under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] Clicking "Save note" twice in quick succession, while the first save is still in flight, sends exactly one `POST /api/notes`, and the note is stored and shown in the list exactly once (also after a page reload).
- [ ] Submitting the form again by keyboard (Enter in the note field) while a save is in flight sends no second request.
- [ ] While a save is in flight the "Save note" button is disabled, and it is enabled again once the save finishes, whether it succeeded or failed, so a failed save can be retried with the text that was kept.

## Re-Plan Feedback
- Comment (tracker): 50+ comments on the item, all framework "PR opened" notices from earlier runs whose code was reset off main → not acted on because none carries feedback on the defect; no comment amends the (empty) description.
- Assumption (no description on the tracker item): the criteria above are derived from the title. "Twice quickly" is read as a repeated submit from the same note form before the first save has returned, which is what the current code allows: `frontend/src/components/NoteForm.tsx` `handleSubmit` has no in-flight guard and the submit button is never disabled, so every click or Enter issues its own `createNote` call.
- Assumption (fix location): the fix is client-side, in `NoteForm.tsx`. A server-side duplicate check or idempotency key is not added: it would need a request-key contract, a schema change and a policy for two legitimately identical notes, none of which the title asks for (`user_story_alignment.md` Section 3). Two identical notes saved deliberately, one after the other, remain allowed.
- Assumption (visible feedback): disabling the button is the only UI change; no "Saving..." label or spinner is added.
- Merged since the last plan: n/a (fresh plan, no earlier plan for BUG-04; base main at 24ace3c1).

## Plan Overview
Add an in-flight guard to the note form so one save can be pending at a time. `NoteForm.tsx` gets a synchronous ref guard (so two submit events dispatched before React re-renders still produce one request) plus an `isSaving` state that disables the "Save note" button while the request is pending; both reset in a `finally` so success and failure re-enable the form. Frontend only: no backend, API contract, or `LandingPage.tsx` change. Covered by Vitest unit tests on `NoteForm` and one Playwright spec that double-clicks the real button against the running stack while the save request is held.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify).
  - Add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`.
  - In `handleSubmit`, after `event.preventDefault()`: if `isSavingRef.current` is true, return immediately (no validation message, no request). Keep the existing empty and whitespace validation exactly as it is, before the guard is set, so an empty submit never locks the form.
  - Set `isSavingRef.current = true` and `setIsSaving(true)` immediately before `createNote(trimmedText)`; reset both in a `finally` block after the existing `try`/`catch`, so success and failure both re-enable the form. Existing success behaviour (clear the text, clear the error, call `onCreated`) and failure behaviour (keep the text, show `SAVE_FAILED_MESSAGE`) are unchanged.
  - Render the button with `disabled={isSaving}` and merge a disabled style when `isSaving` is true.
  - The ref is the guard and the state is the visible feedback; a comment states why both exist (the state alone is read from the render that dispatched the event, so a second event in the same tick would see the stale value).
- Routes: none.
- State management: local component state plus one ref inside `NoteForm`; `LandingPage`'s `onCreated` wiring is untouched.
- Design reference notes: AI freestyle. Disabled "Save note" button: same `buttonStyle` plus `opacity: 0.6` and `cursor: "not-allowed"`; no other visual change.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- No change. The form keeps calling the existing endpoint through `frontend/src/api/notes.ts` `createNote`:
- Method: POST
- URL: `/api/notes`
- Request: JSON body with one field, `text` (string, trimmed, 1 to 500 characters).
- Response: 201 with the stored note, for example `{"id": 7, "text": "Buy milk"}`. The fix changes how often the client calls it (once per pending save), never its shape.

## Technology Selection
- In-flight submit guard: chose React's own `useRef` plus `useState` (already installed) over a debounce or throttle helper or a new dependency, because a debounce delays every legitimate save and still allows a second request once its window passes during a slow save, whereas a pending-request flag blocks exactly the overlapping submit.
- Disabled state: chose the native `disabled` attribute on the existing `<button type="submit">` over a custom click-blocking overlay or handler, because the platform already suppresses clicks and implicit (Enter) submission on a disabled default button and announces the state to assistive technology.
- No net-new module or dependency is introduced; no lockfile changes.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec that double-clicks "Save note" while the POST is held and asserts one request and one stored note
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard, `isSaving` state, disabled button and disabled style, reset in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the double submit, the keyboard resubmit and the disabled and re-enabled button

No dependency manifest changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (the existing `vi.mock("../api/notes")` pattern in `NoteForm.test.tsx`), using a manually resolved promise to hold the save pending. Cases: two clicks while pending give one call; two form submits while pending give one call; button disabled while pending and enabled after success; button enabled after failure and a retry sends a second call. The six existing `NoteForm` tests must keep passing unchanged (validation, trimming, failure message).
  - Directory: `frontend/src/components/` (tests beside the component, per project standards; the CLAUDE.md unit directory `backend/tests/unit/` is backend-only)
  - Naming: `NoteForm.test.tsx` (existing file)
- Integration tests: not warranted. No router, service, repository, model or migration changes (`testing_standards.md` Section 6); the existing `backend/tests/integration/test_notes_integration.py` is untouched.
  - Directory: `backend/tests/integration/`
- E2E tests: one spec for criterion 1, the user interaction the defect is about, plus an edge-case spec that a failed-then-retried save still stores exactly one note. The POST is held with `page.route` on the exact `/api/notes` path until both clicks have been dispatched, then released with `route.continue()`; no fixed timeouts. Matches requests on exact pathname and method, like `TEST-03_simple_note_form.spec.ts`, and uses unique note text per test.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/BUG-04_double_submit_note.spec.ts`
- UAT scenarios: one scenario per criterion plus the retry-after-failure edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | Double click on "Save note" while the first save is in flight sends one POST and the note is stored and shown once, also after reload | E2E | `stores a note once when Save note is double-clicked during a pending save`, `sends one save request when Save note is clicked twice while the first save is pending` | — |
| 2 | Enter in the note field while a save is in flight sends no second request | Unit | `ignores a second form submit while the first save is pending` | verifying it needs no navigation: it is the component's submit guard, exercised by firing the form's submit event twice against a mocked pending `createNote` |
| 3 | Button disabled while saving, enabled again after success or failure, retry possible with the kept text | Unit | `disables Save note while a save is pending and enables it again after it succeeds`, `enables Save note again after a failed save so the note can be retried` | verifying it needs no navigation: it is the button's `disabled` state across the component's own save lifecycle, observable in the rendered component |

Edge-case E2E spec (Section 4's one per feature): `stores a single note when a failed save is retried`, which fails the first held POST with `route.fulfill` status 500, retries through the re-enabled button, and asserts the note appears once.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double click stores the note once | Open `/`, wait for the mount GET, fill unique text, hold the POST via `page.route`, `dblclick()` the `note-submit` button, assert one recorded POST, release it, assert exactly one `note-list-item-*` with the text, reload, assert still one | Given the landing page is open, When I type a note and click "Save note" twice quickly, Then the note appears once in the list and once after reload |
| 2 | Enter resubmit sends no second request | covered at Unit, see Criterion coverage | Given a save is in progress, When I press Enter in the note field, Then no second note is saved |
| 3 | Button disabled while saving, re-enabled after | covered at Unit, see Criterion coverage | Given I clicked "Save note", When the save is still in progress, Then the button is disabled, and When it finishes, Then the button is enabled |

## Manual verification plan
### Criterion 1: Double click on "Save note" while the first save is in flight stores the note once
Prerequisites: the stack is running (backend and database up, frontend at http://localhost:5183); a Chromium-based browser with DevTools.
1. Open http://localhost:5183/ → the "Task Notes" page shows the "New note" field, the "Save note" button and the notes list.
2. Open DevTools, Network tab, set throttling to "Slow 3G" → a save now takes a couple of seconds, so the double click lands while it is pending.
3. Type `BUG-04 double click check` in the "New note" field → the text is in the field.
4. Double-click "Save note" quickly → the Network tab shows exactly one `POST /api/notes` request.
5. Wait for that request to finish → `BUG-04 double click check` appears exactly once in the list and the field is empty.
6. Set throttling back to "No throttling" and reload the page → `BUG-04 double click check` is listed exactly once.

### Criterion 2: Enter in the note field while a save is in flight sends no second request
Prerequisites: as for criterion 1, DevTools throttling set to "Slow 3G".
1. Open http://localhost:5183/ → the note form is visible.
2. Type `BUG-04 enter check` in the "New note" field and press Enter → one `POST /api/notes` appears in the Network tab, still pending.
3. While it is pending, click into the field and press Enter twice more → no further `POST /api/notes` request appears.
4. Wait for the request to finish, reset throttling and reload → `BUG-04 enter check` is listed exactly once.

### Criterion 3: Button disabled while saving, enabled again after success or failure
Prerequisites: as for criterion 1, DevTools throttling set to "Slow 3G".
1. Open http://localhost:5183/, type `BUG-04 disabled check` and click "Save note" → while the request is pending the button is greyed out (dimmed) and shows a not-allowed cursor on hover.
2. Wait for the request to finish → the button is back to its normal dark style and the note is in the list.
3. Stop the backend container (or, in DevTools Network tab, enable "Offline"), type `BUG-04 retry check` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text `BUG-04 retry check` is still in the field, and the button is enabled.
4. Start the backend again (or disable "Offline") and click "Save note" → `BUG-04 retry check` appears exactly once in the list and the field is empty.

### Automated check
1. Run `npm --prefix frontend test` → the run passes: its summary reports no failed or errored test, including the new tests in `frontend/src/components/NoteForm.test.tsx`, and the command exits 0.
2. With the stack running, run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` from the repository root → both specs pass, no failed test on the summary line, exit code 0.
