# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The tracker task carries no description; the acceptance criteria below are derived from the title. See `## Re-Plan Feedback`.)

## Acceptance Criteria
- [ ] Clicking "Save note" twice in quick succession, before the first save has completed, stores the note exactly once: one `POST /api/notes` is sent and the note appears once in the list, also after a page reload.
- [ ] While a save is in progress the "Save note" button is disabled, and a second submit of the form (button click or Enter in the note field) sends no further request.
- [ ] Once the save has finished, successfully or with an error, the "Save note" button is enabled again, so the next note can be saved and a failed save can be retried.

## Re-Plan Feedback
- Comment (tracker): 50 comments read, all framework "PR opened" notices from earlier runs, none about this defect → not acted on because none carries product feedback.
- Comment (tracker): the task description is empty → Addressed by: acceptance criteria derived from the title "Saving a note twice quickly stores it twice", recorded here as an assumption (`user_story_alignment.md` Section 2 step 3).
- Assumption: the fix is client-side only (an in-flight guard in `NoteForm`). The reported symptom is a double submit from one browser tab; a server-side idempotency key or duplicate-text constraint would change the API contract and forbid two genuinely identical notes, which no criterion asks for (`user_story_alignment.md` Section 3). This also keeps the item disjoint from TEST-12's backend notes files.
- Merged since the last plan: n/a (fresh plan, branched from current main 7cb167b6fa39b623de3c8ca42b98e8d7413b0715).

## Plan Overview
Root cause: `frontend/src/components/NoteForm.tsx` `handleSubmit` has no in-flight state, so every submit event while `createNote` is pending issues another `POST /api/notes`, and each one inserts a row. The fix adds a saving guard to `NoteForm`: a `useRef` flag checked synchronously at the top of `handleSubmit` (a ref, not only state, so two submit events dispatched before React re-renders still see the guard), plus an `isSaving` state that sets `disabled` on the submit button for the visible cue. Both are cleared in a `finally` after the request settles. Frontend only; no backend, API or schema change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (add the in-flight guard and disabled button state); `frontend/src/components/NoteForm.test.tsx` (unit tests for the guard).
- Routes: none.
- State management: local component state. `const savingRef = useRef(false)` guards `handleSubmit`: return immediately when `savingRef.current` is true; set it true before `await createNote(...)`; reset it to false in `finally`. `const [isSaving, setIsSaving] = useState(false)` mirrors it for rendering: `<button ... disabled={isSaving}>`. The empty or whitespace-only validation path stays before the guard is set, so it never disables the button. Success and failure behaviour (clear input and call `onCreated`, or show `SAVE_FAILED_MESSAGE` and keep the text) is unchanged.
- Design reference notes: AI freestyle (Design Reference mode NONE). Disabled state of the existing submit button: keep `buttonStyle` and, while `isSaving`, add `opacity: 0.6` and `cursor: "not-allowed"`; button label stays "Save note".

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The existing internal contract the fix relies on:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201 `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight submit guard: chose React's own `useRef` plus `useState` (already installed) and the native `disabled` attribute on the `<button type="submit">` (which also blocks implicit Enter submission of the form) over a debounce helper or a form library, because a ref and a native attribute cover the need with no new dependency.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright specs proving a double click and a double Enter store the note once
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the `savingRef` guard, `isSaving` state, `finally` reset and `disabled={isSaving}` on the submit button with its disabled style
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the single request, the disabled button and its re-enabling after success and failure

No dependency changes, so no lockfile entry. No project structure, run configuration, dependency or test infrastructure change, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: `NoteForm` behaviour with `createNote` mocked to a pending promise the test resolves or rejects by hand (no timers): two submits before resolution produce one `createNote` call; the button is disabled while pending; it is enabled again after resolve and after reject; the existing six tests keep passing unchanged.
  - Directory: frontend/src/components/ (Vitest, test beside the component, per project standards)
  - Naming: NoteForm.test.tsx
- Integration tests: not warranted: no repository, model, migration or endpoint changes (`testing_standards.md` Section 6).
- E2E tests: double click on "Save note" and double Enter in the note field, each with the `POST /api/notes` held by a `page.route` handler gated on a promise (no fixed timeout) so the second submit lands while the first is in flight; assert exactly one POST request, one list item with the unique text, and one item after reload.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus the Enter-key edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A quick double click on Save note stores the note once, also after reload | E2E | `stores a note only once when Save note is double-clicked`, `sends one create request when the form is submitted twice before the save completes` | Covered at E2E (the unit test adds the cheap regression guard) |
| 2 | Save note is disabled while saving; a second submit (click or Enter) sends no request | Unit | `disables the save button while a save is in progress`, `stores a note only once when Enter is pressed twice quickly` | The disabled state is component behaviour verified in jsdom without navigation; the Enter path also has the E2E edge-case spec |
| 3 | Save note is enabled again after the save finishes, success or error | Unit | `re-enables the save button after the note is saved`, `re-enables the save button after a failed save so the note can be retried` | Verifying it needs no navigation: it is the component's state reset after a mocked request settles |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double click stores once | Hold the POST with `page.route`, `dblclick` the submit button, release, count POST requests (1), count list items with the text (1), reload and count again (1) | Given the landing page with a slow network, When I double-click Save note with "Buy milk", Then "Buy milk" is listed once, also after reload |
| 2 | Disabled while saving | Edge-case spec: press Enter twice in the note field while the POST is held, assert one POST; disabled state covered at Unit, see Criterion coverage | Given a save in progress, Then Save note is disabled and pressing Enter sends nothing |
| 3 | Re-enabled afterwards | Covered at Unit, see Criterion coverage | Given a save that failed, When I click Save note again, Then the note is saved |

## Manual verification plan
### Criterion 1: Clicking Save note twice quickly stores the note exactly once
Prerequisites: the stack is running (backend on http://localhost:8010, frontend on http://localhost:5183), Chrome with DevTools open on the Network tab, throttling set to "Slow 3G" so a save takes a few seconds.
1. Open `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the notes list.
2. Type `BUG-04 double click check` in the "New note" field → the text is in the field.
3. Double-click "Save note" as fast as you can → the Network tab shows exactly one `POST` to `/api/notes`.
4. Wait for the request to finish → `BUG-04 double click check` appears once in the list and the field is empty.
5. Set throttling back to "No throttling" and reload the page → `BUG-04 double click check` is still listed exactly once.

### Criterion 2: Save note is disabled while a save is in progress
Prerequisites: as for Criterion 1, throttling on "Slow 3G".
1. Open `http://localhost:5183/` and type `BUG-04 disabled check` in the "New note" field → the text is in the field.
2. Click "Save note" once → the button turns faded (reduced opacity) and the mouse pointer over it shows the not-allowed cursor while the request is pending.
3. While it is still pending, click the field and press Enter twice → the Network tab still shows only the one `POST` to `/api/notes`.
4. Wait for the request to finish → `BUG-04 disabled check` is listed once.

### Criterion 3: Save note is enabled again after the save finishes
Prerequisites: as for Criterion 1, throttling on "No throttling".
1. Open `http://localhost:5183/`, type `BUG-04 next note one`, click "Save note" → the note is listed and the button is back to full opacity and clickable.
2. Type `BUG-04 next note two` and click "Save note" → the second note is listed below the first.
3. In DevTools set the network to "Offline", type `BUG-04 retry check` and click "Save note" → the red message "The note could not be saved. Please try again." appears, the text stays in the field and the button is enabled.
4. Set the network back to "No throttling" and click "Save note" again → `BUG-04 retry check` is listed once and the error message is gone.
5. Run `npm --prefix frontend test` → the run reports no failed or errored test and the command exits 0.
