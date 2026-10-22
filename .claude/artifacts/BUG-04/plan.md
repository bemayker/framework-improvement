# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (Defect item, ClickUp 123k99cx47m. The tracker item carries no description and no acceptance criteria; the criteria below are derived from the title and recorded as assumptions under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] While a note is being saved, a second submit of the note form (a second click on "Save note" or a second Enter in the field) sends no further save request, so a rapid double submit stores exactly one note and the list shows it once.
- [ ] Once the save finishes, successfully or with an error, the form accepts the next submit again: a new note can be saved after a success, and the same text can be retried after a failure.

## Re-Plan Feedback
- Comment (tracker): none actionable. The item carries only prior run PR notices, no stakeholder comment → Addressed by: nothing to act on; recorded so the count is visible.
- Assumption (no description on the item, `user_story_alignment.md` Section 4, autonomous): "twice quickly" is read as a rapid double click on "Save note" or a double Enter in the note field on the landing page, while the first `POST /api/notes` is still in flight. Today `NoteForm.handleSubmit` has no in-flight guard, so each submit issues its own POST and each one inserts a row → Addressed by: a client-side in-flight guard in `NoteForm.tsx` (criterion 1).
- Assumption: the fix is frontend-only. Server-side deduplication (rejecting a second identical text) is not planned: the item does not ask for it, it would change the API contract for a user who deliberately saves the same text twice later, and it would collide with TEST-12's edits to the notes router, service and repository (`feature_map.md`) → Addressed by: Backend Plan says no backend changes; recorded so a reviewer can overrule it.
- Assumption: criterion 2 is part of the fix rather than gold plating, because an in-flight guard that never releases would break TEST-03's existing behaviour (save the next note, retry after an error) → Addressed by: criterion 2, unit-covered.
- Merged since the last plan: n/a (fresh plan, base ab1d1ad, no `[merged-since]` lines in the dispatch).
- Repro classification (`/fix` Section R1): `- Repro: local-automated: npm --prefix frontend test -- src/components/NoteForm.test.tsx (source: item)`. The new double-submit test in `NoteForm.test.tsx` holds `createNote` on an unresolved promise, submits twice, and asserts one call; it fails on ab1d1ad (two calls) and passes once the guard lands.

## Plan Overview
Frontend-only defect fix in the note form. `NoteForm` gains an in-flight guard: a `useRef<boolean>` checked and set synchronously at the top of `handleSubmit` (so two submits dispatched in the same tick cannot both pass it), mirrored into a `useState<boolean>` `isSaving` that sets the native `disabled` attribute on the "Save note" button for the duration of the request. Both are released in a `finally` block, whatever the outcome. No backend, API contract, dependency or route change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard, disabled submit button while saving, release in `finally`); `frontend/src/components/NoteForm.test.tsx` (reproduction test plus guard-release tests). `LandingPage.tsx`, `AppFooter.tsx`, `NoteList.tsx` and every file under `frontend/src/api/` are untouched.
- Routes: none (landing page `/` only).
- State management: local component state in `NoteForm`: an `isSubmittingRef` (`useRef(false)`) as the authoritative guard, and `isSaving` (`useState(false)`) driving `disabled` on the button. The whitespace validation path returns before the guard is taken, so an empty submit never locks the form.
- Design reference notes: AI freestyle. Disabled "Save note" button: native `disabled` attribute, `cursor: not-allowed`, `opacity: 0.6`; every other value of `buttonStyle` unchanged. The button label stays "Save note" (no new copy).

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form keeps calling the existing endpoint once per accepted submit.
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard: chose React's own `useRef` plus `useState` (installed dependency `react`) and the native `<button disabled>` attribute over a debounce/throttle helper or a new library, because a disabled native button already blocks further clicks and form submission by Enter, and the ref closes the same-tick window a state update alone leaves open. No new component, module or dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser spec, a double click and a double Enter on a delayed save each send one POST and store one note
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard, `isSaving` state, `disabled` and disabled styling on the submit button, release in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: reproduction test (two submits while the first save is pending call `createNote` once) and guard-release tests (button disabled while pending, re-enabled after success and after failure)

No dependency changes, so no lockfile entry. No project structure, run configuration, dependency or test infrastructure change, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour in Vitest + Testing Library with `createNote` mocked (existing file pattern): a pending `createNote` (a promise resolved by the test) with two `submitForm()` calls, and two `fireEvent.submit` on the form, each asserting one call; the button reports `disabled` while pending; after resolve the button is enabled and a second note saves; after reject the error shows, the text is kept, the button is enabled and a retry calls `createNote` again.
  - Directory: frontend/src/components/ (co-located, as the existing frontend tests are)
  - Naming: {Component}.test.tsx (existing frontend convention)
- Integration tests: not warranted. No repository, model, migration or endpoint changes (`testing_standards.md` Section 6 rows 2 and 3 answer no).
  - Directory: backend/tests/integration/
- E2E tests: one spec. The POST is delayed with `page.route` (continue after a short hold) so the first save is still in flight; then a `dblclick()` on `note-submit`, and in a second test two `press("Enter")` on `note-input`. Each asserts exactly one recorded `POST /api/notes` (exact path and method matcher, as in TEST-03's spec) and, after `page.reload()`, exactly one `note-list` item with the unique text. Unique text per test via `randomUUID`.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus the double-Enter edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A second submit while a save is in flight sends no further request; one note stored and listed once | E2E (plus the Unit reproduction test) | — |
| 2 | After the save finishes, successfully or with an error, the form accepts the next submit | Unit | verifying it needs no browser navigation: it is the component's guard release on resolve and on reject, driven by a mocked `createNote` in jsdom, and TEST-03's existing E2E specs already exercise consecutive saves |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Second submit during a save sends nothing; one note stored | Delay the POST with `page.route`, `dblclick()` the Save button (and, separately, press Enter twice), count POSTs = 1, reload, one list item with the text | Given the landing page with a slow save, When I double-click "Save note" with "Buy milk BUG-04", Then one "Buy milk BUG-04" note is listed, also after a reload |
| 2 | Form accepts the next submit after success or failure | covered at Unit, see Criterion coverage | Given a note was just saved, When I save "Walk dog BUG-04", Then both notes are listed; Given the backend is stopped and a save failed, When it is back and I click "Save note" again, Then the note is saved |

## Manual verification plan
### Criterion 1: a rapid double submit stores exactly one note
Prerequisites: the stack is running (`docker compose up`), the app is open at http://localhost:5183, and the browser DevTools Network tab is open, filtered to `notes`, with throttling set to "Slow 3G" so the save stays in flight long enough to click twice.
1. Open `/` → the "Task Notes" landing page shows the "New note" field and the "Save note" button.
2. Type `Buy milk BUG-04` in the "New note" field → the text is in the field.
3. Double-click "Save note" as fast as you can → the button turns greyed out and unclickable while the save runs; the Network tab shows exactly one `POST /api/notes` request.
4. Wait for the request to finish → one "Buy milk BUG-04" item appears in the list, the field is empty and the button is active again.
5. Reload the page → the list still shows "Buy milk BUG-04" exactly once.
6. Type `Walk dog BUG-04` in the field, then press Enter twice quickly → the Network tab shows exactly one new `POST /api/notes`, and after it finishes "Walk dog BUG-04" is listed once, also after a reload.
7. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → the run reports `0 failed`.

### Criterion 2: the form accepts the next submit after the save finishes
Prerequisites: the stack is running, the app is open at http://localhost:5183, network throttling is off.
1. Type `Call Anna BUG-04` in the "New note" field and click "Save note" once → "Call Anna BUG-04" is listed and the "Save note" button is active again.
2. Type `Pay rent BUG-04` and click "Save note" → "Pay rent BUG-04" is listed below "Call Anna BUG-04"; both appear once.
3. Stop the backend (`docker compose stop backend`), type `Water plants BUG-04` and click "Save note" → the red message "The note could not be saved. Please try again." appears, the field still holds `Water plants BUG-04`, and the "Save note" button is active (not greyed out).
4. Start the backend again (`docker compose start backend`), wait until http://localhost:8010/api/health answers, then click "Save note" → the error message disappears, "Water plants BUG-04" is listed once and the field is empty.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → the run reports `0 failed`.
