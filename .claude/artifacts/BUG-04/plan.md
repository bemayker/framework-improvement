# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m has an empty description and no tags. The criteria below are derived from the title; see Re-Plan Feedback for the assumptions.)

## Acceptance Criteria
- [ ] 1. Clicking "Save note" twice in quick succession (double click, or a second click or Enter before the first save has answered) sends exactly one `POST /api/notes` and the note appears exactly once in the list, also after a page reload.
- [ ] 2. While a save is pending, the "Save note" button is disabled, and it is enabled again once the save has succeeded or failed.
- [ ] 3. After a failed save the form can be submitted again: the error message and the typed text stay, and the retry sends exactly one new `POST /api/notes`.
- [ ] 4. A deliberate second save, made after the first one has completed, is still stored, even with the same text (the fix blocks only overlapping submits, it does not de-duplicate notes).

## Re-Plan Feedback
- Comment (tracker): none actionable. 55 comments read by the dispatching session, all framework PR notices from earlier runs. Not acted on because none carries product feedback for this item.
- Assumption (tracker description empty): the defect is a client-side double submit. Current code confirms it: `frontend/src/components/NoteForm.tsx` `handleSubmit` has no in-flight guard and the submit button is never disabled, so a second click or Enter while `createNote` is pending sends a second `POST /api/notes`, and the backend (`backend/app/routers/notes.py`, `note_service.create_note`) stores every POST as a new row by design. Addressed by: an in-flight guard in `NoteForm.tsx` only.
- Assumption: no server-side de-duplication (no idempotency key, no unique constraint on `text`). Two notes with the same text are legitimate (criterion 4), and an idempotency key would change the API contract TEST-03 defined and touch the router, service and repository that TEST-12 edits. Recorded as a scope decision, `user_story_alignment.md` Section 3.
- Assumption: no visible "Saving..." label or spinner. The button keeps its "Save note" label and only takes the native `disabled` state; anything more is gold plating for a defect fix.
- Merged since the last plan: n/a (fresh plan, branched from current main ee0d3429).

## Plan Overview
Frontend-only defect fix in the note form. `NoteForm` gets an in-flight guard: a `useRef` flag that makes a second `handleSubmit` return before calling `createNote` while the first is pending, plus a `saving` state that sets the native `disabled` attribute on the submit button (which also stops implicit Enter submission per the HTML form rules). Both are released in a `finally`, so success and failure re-enable the form. No backend, API client or LandingPage change. Covered by new component unit tests (the reproduction) and one Playwright spec that holds the first POST open while double clicking.

Reproduction (fix Section R1): `local-automated`, command `npm --prefix frontend test -- src/components/NoteForm.test.tsx` (run from the worktree root). The new test `sends one create request when the form is submitted twice while the first save is pending` fails on the base (createNote called twice, vitest exit 1) and passes on the fix.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard, disabled submit button while saving); `frontend/src/components/NoteForm.test.tsx` (new unit tests for criteria 1 to 4).
- Routes: none.
- State management: local to `NoteForm`. `const isSubmittingRef = useRef(false)` is the guard read synchronously at the top of `handleSubmit` (after `preventDefault`, before validation-independent work: check it right after the empty-text check passes and set it to `true` before `await createNote`), because a state value read in the same tick as the first submit would still be `false`. `const [saving, setSaving] = useState(false)` drives `disabled={saving}` on `note-submit`. Both reset in a `finally` block around the `createNote` call. Existing behaviour stays: empty or whitespace text shows the validation message and sends nothing; success clears the input and calls `onCreated`; failure shows `SAVE_FAILED_MESSAGE` and keeps the text.
- Design reference notes: AI freestyle. Design Reference mode is NONE. The existing `buttonStyle` is kept; the disabled state uses the browser's native disabled rendering plus `cursor: "not-allowed"` and `opacity: 0.6` while `saving` is true, so a person can see the button is inactive.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The fix relies on the existing contract from TEST-03:
- Method: POST
- URL: /api/notes
- Request: JSON body with one string field `text` (1 to 500 characters after trimming)
- Response: 201 with the stored note, for example `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard: chose React's built-in `useRef` and `useState` (already installed, `react ^18.3.1`) over a debounce or throttle helper (lodash or a custom timer), because a debounce delays every save and still allows a second request once its window expires, while a pending flag blocks exactly the overlap.
- Blocking the button: chose the native `disabled` attribute on the existing `<button type="submit">` (platform feature, rung 2), which also suppresses implicit Enter submission, over a custom click-swallowing handler.
- Server-side idempotency: not chosen. A database unique constraint (rung 2) would reject two legitimate notes with the same text (criterion 4), and an idempotency key is a new API contract nobody asked for.
- No new dependency is added.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec, double click on Save note while the first POST is held open, asserts one POST and one list item, also after reload
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the `useRef` in-flight guard and the `saving` state, `disabled={saving}` on the submit button, release both in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: add unit tests for the overlapping submit, the disabled state, the retry after failure and the deliberate second save

No dependency is added or changed, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure. `frontend/src/components/LandingPage.tsx`, `LandingPage.test.tsx` and `frontend/src/api/notes.ts` are deliberately untouched, so this item shares no path with TEST-08.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (Vitest plus Testing Library, the existing pattern in `NoteForm.test.tsx`). The overlap is made deterministic by giving `createNoteMock` a promise the test resolves or rejects by hand, and submitting with `fireEvent.submit(screen.getByTestId("note-form"))` twice, which bypasses the disabled button and so exercises the ref guard itself.
  - Directory: `frontend/src/components/` (tests beside the component, per project standards)
  - Naming: `NoteForm.test.tsx` (existing file)
- Integration tests: none added. The backend is unchanged; storing one row per POST is TEST-03's existing, correct behaviour, already covered in `backend/tests/integration/test_notes_integration.py`.
  - Directory: backend/tests/integration/
- E2E tests: one spec for criterion 1. It registers `page.route` on the notes URL for POST and holds the first request (no `route.continue()` until after the double click), records every POST via `page.on("request")`, double clicks `note-submit` with `dblclick()`, then releases the held route, waits for the 201, asserts exactly one recorded POST and exactly one `note-list` item with the unique text, reloads and asserts the count is still one. No fixed timeouts. Reuses the exact-path request matcher pattern from `e2e/tests/TEST-03_simple_note_form.spec.ts` (copied locally, not imported, since that file exports nothing).
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (Enter pressed twice).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | Two quick clicks on Save note send one POST and the note appears once, also after reload | E2E | `stores a note once when Save note is double clicked while the first save is pending`, `sends one create request when the form is submitted twice while the first save is pending` | E2E chosen: the defect is a real-browser click timing against the real backend and list, which only the browser tier observes end to end |
| 2 | Save note is disabled while a save is pending and enabled again after success or failure | Unit | `disables the save button while a save is pending and re-enables it after success`, `re-enables the save button after a failed save` | verifying it needs no navigation: it is the button's disabled attribute in one component, observable with a mocked pending promise |
| 3 | After a failed save the form can be submitted again, text and error kept, one new POST | Unit | `allows a retry after a failed save and sends one new create request` | verifying it needs no navigation: it is the guard release in the component's failure path, with the API mocked to reject |
| 4 | A deliberate second save after the first completed is still stored, same text allowed | Unit | `saves a second note with the same text once the first save has completed` | verifying it needs no navigation: it asserts the guard does not block sequential submits, a component behaviour with the API mocked |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double click stores once | Hold the first POST via `page.route`, `dblclick()` on `note-submit`, release, assert one POST and one list item, reload, assert one | Given the landing page is open, When I type a note and double click Save note, Then the note is listed once and is still listed once after reload |
| 2 | Button disabled while pending | covered at Unit, see Criterion coverage | Given a save is in progress, When I look at Save note, Then it is disabled until the save finishes |
| 3 | Retry after failure | covered at Unit, see Criterion coverage | Given the backend is stopped, When I save a note and it fails, Then the error shows and Save note is clickable again |
| 4 | Deliberate second save stored | covered at Unit, see Criterion coverage | Given I saved "Buy milk", When I save "Buy milk" again after the first appeared, Then two "Buy milk" notes are listed |

## Manual verification plan
### Criterion 1: Two quick clicks on Save note send one POST and the note appears once, also after reload
Prerequisites: app stack running (`docker compose up`), frontend at http://localhost:5183, browser DevTools open on the Network tab filtered to `notes`, throttling set to "Slow 3G" so the first save stays pending long enough to click again.
1. Navigate to `/` → the "Task Notes" title, the "New note" field and the "Save note" button are visible.
2. Type `BUG-04 double click check` in the "New note" field → the text shows in the field.
3. Double click "Save note" quickly → the Network tab shows exactly one `POST /api/notes`.
4. Wait for the POST to finish (201) → `BUG-04 double click check` appears once in the list and the field is empty.
5. Set throttling back to "No throttling" and reload the page → `BUG-04 double click check` is still listed exactly once.

### Criterion 2: Save note is disabled while a save is pending and enabled again after success or failure
Prerequisites: as for criterion 1, throttling on "Slow 3G".
1. Navigate to `/` → "Save note" is enabled.
2. Type `BUG-04 disabled check` and click "Save note" once → while the POST is pending the button looks faded and the pointer shows "not allowed" when hovering it; clicking it again sends no second POST.
3. Wait for the 201 → the note is listed and "Save note" is enabled again (normal look and pointer).

### Criterion 3: After a failed save the form can be submitted again, text and error kept, one new POST
Prerequisites: app stack running, then stop only the backend (`docker compose stop backend`), frontend still at http://localhost:5183.
1. Navigate to `/` → the form is visible.
2. Type `BUG-04 retry check` and click "Save note" → the message "The note could not be saved. Please try again." appears, the field still holds `BUG-04 retry check`, and "Save note" is enabled.
3. Start the backend again (`docker compose start backend`) and click "Save note" once → the Network tab shows exactly one new `POST /api/notes` answered 201, the error disappears and `BUG-04 retry check` is listed once.

### Criterion 4: A deliberate second save after the first completed is still stored, same text allowed
Prerequisites: app stack running, no throttling.
1. Navigate to `/`, type `BUG-04 same text` and click "Save note" → `BUG-04 same text` appears once in the list and the field is empty.
2. Type `BUG-04 same text` again and click "Save note" → `BUG-04 same text` now appears twice in the list.
3. Reload the page → both `BUG-04 same text` notes are still listed.

Automated check for all four: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` and `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` from the repository root → each run's summary line reports no failed or errored test and the command exits 0.
