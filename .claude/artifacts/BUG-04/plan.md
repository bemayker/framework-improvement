# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task's description is empty, read via MCP on 2026-11-17 in workspace 30307190. The acceptance criteria below are derived from the title and from the current note form introduced by TEST-03; see Re-Plan Feedback for the assumptions.)

## Acceptance Criteria
- [ ] 1. Clicking "Save note" twice in quick succession (before the first save has returned) on a non-empty note sends exactly one create request and stores the note exactly once; the note list shows it once, also after a page reload.
- [ ] 2. While a save is in flight the "Save note" button is disabled, so the note cannot be resubmitted, and a second submit of the form (Enter or click) during that window sends no request.
- [ ] 3. Once the save finishes, successfully or not, the "Save note" button is enabled again; after a failed save the text is kept and the user can retry (TEST-03 behaviour preserved).

## Re-Plan Feedback
- Comment (tracker): the item carries about 43 comments, all of them mayker-dev's own "PR opened" notes from earlier runs (per the dispatch; none is stakeholder feedback) → not acted on because none states a requirement or a correction.
- Comment (tracker): description is empty → Addressed by: assumption A1, the criteria above are derived from the title. The bug is a client-side double submit: `NoteForm.handleSubmit` has no in-flight guard, so a second click before `createNote` resolves fires a second POST.
- Assumption A2 (scope): the fix is client-side only. A server-side dedupe (rejecting a second identical note) is not planned: two notes with the same text are legitimate data in this app, nothing in the item asks to forbid them, and it would touch notes.py, note_service.py and note_repository.py, which TEST-12 also edits (user_story_alignment.md Section 3, no gold plating).
- Assumption A3: the map row's shared-risk flag on `frontend/src/components/LandingPage.tsx` does not apply to this plan: the guard lives entirely in `NoteForm.tsx`, and `LandingPage.tsx` is not modified.
- Merged since the last plan: n/a (fresh plan, branched from current main f875d1d3).

## Plan Overview
Frontend-only bug fix in the note form. `NoteForm` gains an in-flight guard: a `useRef<boolean>` checked and set synchronously at the top of `handleSubmit` (so two submit events in the same tick cannot both pass, which a `useState` flag alone would allow because state updates are not visible until the next render), plus an `isSaving` state that drives `disabled` on the submit button. The guard is released in a `finally` after `createNote` settles. No backend, API or LandingPage change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (add `isSavingRef` (useRef) and `isSaving` (useState); in `handleSubmit`, return early when `isSavingRef.current` is true; after the empty-text validation, set both to true before `await createNote(...)`, reset both in `finally`; render the submit button with `disabled={isSaving}` and `aria-disabled` implied by the native attribute; disabled style below). `frontend/src/components/NoteForm.test.tsx` (new unit tests).
- Routes: none.
- State management: local component state plus a ref; no new context or store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Disabled "Save note" button: same `buttonStyle` with `opacity: 0.6` and `cursor: "not-allowed"`; label text unchanged ("Save note"). No other visual change.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; the existing internal endpoint is called at most once per submitted note.
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard: chose React's built-in `useRef` and `useState` plus the native `disabled` attribute on the submit button over a debounce utility or a new dependency (for example lodash.debounce), because a debounce is time-based and still lets a slow second request through, while a ref flag closes the window exactly for the duration of the request; the native `disabled` attribute also blocks the form's implicit Enter submission.
- No net-new module, component or dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec, double submit stores one note
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight submit guard (ref plus state), disabled submit button while saving
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the guard and the button's disabled state
No dependency changes, so no lockfile entry. Neither README.md nor docs/DEVELOPMENT.md needs an edit: no project structure, run configuration, dependency or test-infrastructure change.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (an unresolved promise held open to simulate an in-flight save): one request on two submits, button disabled while pending, button re-enabled after success and after failure.
  - Directory: co-located in frontend/src/components/ (project convention, Vitest)
  - Naming: NoteForm.test.tsx
- Integration tests: none warranted; no repository, model, migration or endpoint changes (testing_standards.md Section 6).
- E2E tests: criterion 1 only, because the defect is a real browser double click against the real backend. The spec delays the POST /api/notes response with `page.route` (continue after a short hold) so the second click deterministically lands while the first save is in flight, counts POST requests (exactly one), checks the note appears once in `note-list`, then reloads and checks it is still listed once. Unique note text per test (randomUUID) as in the TEST-03 spec.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (failed save then retry stores once).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | Two quick clicks send one request and store the note once | E2E | `stores a note once when Save note is clicked twice before the save returns` | — |
| 2 | Button disabled while a save is in flight; a second submit sends no request | Unit | `sends one create request when the form is submitted twice before the first save completes`, `disables the save button while a save is in flight` | verifying it needs no navigation: it is the form's own submit guard and button state, observable with a pending mocked createNote |
| 3 | Button re-enabled after success or failure; retry after failure works | Unit | `re-enables the save button after the save succeeds`, `re-enables the save button and keeps the text after the save fails` | verifying it needs no navigation: it is component state after a resolved or rejected createNote |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Two quick clicks store the note once | Delay POST via page.route, click note-submit twice, assert one POST, one list item, still one after reload | Given the landing page, When I type a note and click Save note twice quickly, Then the note appears once and once after reload |
| 2 | Button disabled while saving | covered at Unit, see Criterion coverage | Given a save in progress, When I look at Save note, Then it is disabled and pressing Enter adds nothing |
| 3 | Button re-enabled after save or failure | covered at Unit, see Criterion coverage | Given a save that failed, When it returns, Then Save note is enabled, my text is kept, and retrying stores the note once |

## Manual verification plan
### Criterion 1: Two quick clicks send one request and store the note once
Prerequisites: the stack is running (backend on its configured port, frontend at http://localhost:5183); browser DevTools open on the Network tab, filtered to `notes`; optionally set Network throttling to "Slow 3G" to widen the window.
1. Open `http://localhost:5183/` → the "Task Notes" landing page shows the "New note" field, the "Save note" button and the note list.
2. Type `Double click check 1` in the "New note" field → the text appears in the field.
3. Double-click "Save note" quickly → the Network tab shows exactly one `POST /api/notes` with status 201.
4. Look at the note list → `Double click check 1` appears exactly once, and the field is empty.
5. Reload the page → `Double click check 1` is still listed exactly once.

### Criterion 2: Button disabled while a save is in flight
Prerequisites: as for Criterion 1, with Network throttling set to "Slow 3G" so the save takes a few seconds.
1. On `http://localhost:5183/`, type `Slow save check` in the "New note" field.
2. Click "Save note" once → while the `POST /api/notes` is still pending in the Network tab, the button is greyed out (reduced opacity) and the cursor over it shows "not allowed".
3. While still pending, click the field and press Enter, then click "Save note" again → no second `POST /api/notes` appears in the Network tab.
4. Wait for the request to finish → `Slow save check` appears once in the list.

### Criterion 3: Button re-enabled after the save finishes, retry after failure
Prerequisites: as for Criterion 1; ability to stop the backend (for example stop its container) and start it again.
1. On `http://localhost:5183/`, type `After success` and click "Save note" → once the note appears in the list, the "Save note" button is fully opaque and clickable again.
2. Stop the backend, type `Retry after failure`, click "Save note" → the message "The note could not be saved. Please try again." appears under the field, the text `Retry after failure` is still in the field, and the button is enabled again.
3. Start the backend again, click "Save note" → `Retry after failure` appears exactly once in the list and the error message disappears.
4. Run the unit tests: `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → the run passes: no failed or errored test on its summary line, exit code 0.
