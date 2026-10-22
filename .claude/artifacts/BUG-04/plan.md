# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice
>
> (ClickUp task 123k99cx47m. The tracker item carries no description; the title is the whole feature text. The acceptance criteria below are derived from it and recorded as assumptions under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] Clicking "Save note" twice in quick succession (or submitting the form again while the first save is still in flight) sends exactly one `POST /api/notes`, stores the note once, and shows it once in the saved-notes list.
- [ ] While a save is in flight the "Save note" button is disabled, and it is enabled again once the save succeeds or fails.
- [ ] After a failed save the user can submit the same note again and it is stored (the guard never leaves the form stuck), and the existing TEST-03 behaviour is unchanged: an empty or whitespace-only note is rejected with a validation message and no API call, text is trimmed, and a failed save keeps the text and shows the error.

## Re-Plan Feedback
- Comment (tracker): 6 comments read on the item, all mayker-dev PR and status notices from earlier runs → not acted on because none carries product feedback or a correction to the feature text.
- Assumption (derived criterion 1): "twice quickly" is read as a second submit of the same form while the first `POST /api/notes` has not yet returned (double click, or click then Enter). Two deliberate saves of the same text after the first has completed are two notes and stay allowed: the item asks to stop the accidental duplicate, not to forbid duplicate text.
- Assumption (derived criterion 2): the fix is a client-side in-flight guard in `NoteForm.tsx` plus a disabled button. No server-side deduplication (idempotency key, unique constraint on text, time-window dedupe) is planned: CLAUDE.md Architecture Notes ask for the smallest change, the defect is the form issuing two requests, and a server rule would change TEST-03's API contract and collide with TEST-12's edits to the notes router, service and repository (feature_map.md).
- Assumption (derived criterion 3): the guard must release on failure as well as success, so a failed save stays retryable; the TEST-03 behaviours are restated as a regression criterion so the change is graded against them.
- Assumption (UI): the button keeps its "Save note" label while disabled. A "Saving…" label or spinner is not asked for and is not added.
- Merged since the last plan: n/a (fresh plan, branched from current main at 0e69780).

## Defect reproduction
Repro class: local automated test. The reproduction is a Vitest component test in `frontend/src/components/NoteForm.test.tsx`: mock `createNote` to return a promise that is held unresolved, type "Buy milk", submit the form twice (`fireEvent.submit` on `note-form` twice, which also covers the Enter-key path a disabled button does not block in jsdom), and assert `createNote` was called exactly once. On main at 0e69780 `handleSubmit` has no in-flight guard, so the second submit calls `createNote` a second time and the assertion fails (called 2 times); after the fix it passes. Command: `npm --prefix frontend test -- src/components/NoteForm.test.tsx`, expected `0 failed` after the fix and at least one failure on the unfixed code. The browser-level reproduction is the E2E spec below (POST delayed by a route handler, double click, one POST and one list item).

## Plan Overview
Frontend-only fix in the note form. `NoteForm` gains an in-flight guard: a `useRef<boolean>` checked and set synchronously at the top of `handleSubmit` (so two submits dispatched before React re-renders cannot both pass), mirrored by an `isSaving` state that disables the submit button while the request is outstanding. Both are released in a `finally`, so success and failure each re-enable the form. No backend, API contract, LandingPage, or NoteList change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify). Add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`, after `event.preventDefault()`, return immediately when `isSavingRef.current` is true. Keep the existing empty/whitespace validation unchanged (it sends no request, so it does not take the guard). Before `createNote`, set `isSavingRef.current = true` and `setIsSaving(true)`; wrap the existing try/catch with `finally { isSavingRef.current = false; setIsSaving(false); }`. Pass `disabled={isSaving}` to the `note-submit` button and give it a disabled style. `frontend/src/components/LandingPage.tsx` is NOT modified: its `onCreated` append is correct once the form calls it once.
- Routes: none.
- State management: component-local (`useRef` for the synchronous guard, `useState` for the rendered disabled state). The ref is required, not redundant: state set in the first submit is not visible to a second submit dispatched in the same tick.
- Design reference notes: AI freestyle (Design Reference mode NONE). Disabled "Save note" button: keep the existing button values (padding 0.5rem 1rem, 1rem/600, color #ffffff, background #1a1a1a, radius 0.375rem) and add opacity 0.6 and cursor not-allowed while disabled; enabled state unchanged.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged from TEST-03; listed so the builder does not touch it.
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight submit guard: chose React's own `useRef` and `useState` (already installed) plus the native `disabled` attribute on the submit button over a debounce/throttle utility or a new form library, because a boolean flag released in `finally` covers the need exactly and a debounce would still allow a second request after its window.
- No net-new dependency, module or component is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser spec for criterion 1 (delayed POST, double click, exactly one POST, one list item, still one after reload) plus the edge case that the button is disabled during the save.
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan.
- [G] .claude/artifacts/BUG-04/uat_script.md: the artifact copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus state), disabled submit button with disabled style, guard released in finally.
- [A] frontend/src/components/NoteForm.test.tsx: repro test (two submits while pending, createNote called once), disabled-while-pending and re-enabled-after-success test, re-enabled-after-failure and retry-stores test.

No dependency changes, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md changes: project structure, run configuration, dependencies and test infrastructure are untouched.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour under Vitest with `createNote` mocked (frontend unit tier): a held promise and two submits call `createNote` once; the button is disabled while pending and enabled after resolve; after a rejection the button is enabled and a second submit calls `createNote` again and reports the note. The six existing TEST-03 tests stay and must still pass.
  - Directory: frontend/src/components/ (co-located Vitest tests, the project's existing frontend convention; CLAUDE.md's backend/tests/unit/ applies to pytest)
  - Naming: NoteForm.test.tsx (existing file)
- Integration tests: not warranted: no repository, model, migration, or endpoint changes (testing_standards.md Section 6). The existing backend/tests/integration/test_notes_integration.py still runs in the gate unchanged.
  - Directory: backend/tests/integration/
- E2E tests: criterion 1 in the browser against the real backend: route-delay the `POST /api/notes` (Playwright `page.route`, continue after a short hold released by the test, no fixed sleep), double-click `note-submit`, assert exactly one POST request recorded, exactly one `note-list` item with the unique text, and still exactly one after reload. Edge case: `note-submit` is disabled while the POST is held and enabled after it completes.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus the edge case of a double click with a slow network.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A rapid second submit sends one POST, stores the note once, shows it once | E2E (plus the Unit repro test) | — |
| 2 | Button disabled while a save is in flight, enabled after success or failure | Unit | verifying it needs no navigation: it is the component's rendered `disabled` attribute against a mocked pending, resolved and rejected `createNote`, deterministic in jsdom; the E2E edge case additionally observes it once |
| 3 | A failed save is retryable, and TEST-03 behaviour is unchanged | Unit | verifying it needs no navigation: a rejected then resolved mock exercises the guard release, and the TEST-03 behaviours are already covered by the existing NoteForm unit tests and the TEST-03 E2E spec, which keep running |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | A rapid second submit sends one POST, stores the note once, shows it once | Hold POST /api/notes with page.route, fill a unique text, dblclick note-submit, release, assert one POST, one matching list item, and one after reload | Given the notes page with a slow save, When I click Save note twice quickly, Then the note appears once and once after reload |
| 2 | Button disabled while saving, enabled after | covered at Unit, see Criterion coverage (the E2E edge case asserts disabled during the held POST) | Given a save in flight, When I look at Save note, Then it is disabled, and enabled once the save finishes |
| 3 | Failed save retryable, TEST-03 unchanged | covered at Unit, see Criterion coverage | Given the backend is unavailable, When I save a note, Then I see the error and the button is enabled, and When the backend is back and I save again, Then the note is stored |

## Manual verification plan
### Criterion 1: A rapid second submit sends one POST, stores the note once, shows it once
Prerequisites: the app stack is running (frontend at http://localhost:5183, backend and database up); browser DevTools open on the Network tab, with throttling set to "Slow 3G" so the save stays in flight long enough to click twice.
1. Navigate to `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the saved-notes list.
2. Type `BUG-04 double click check` in the "New note" field → the text is in the field.
3. Double-click "Save note" as fast as you can → the Network tab shows exactly one `POST /api/notes` request.
4. Wait for the request to finish → `BUG-04 double click check` appears once in the saved-notes list and the field is cleared.
5. Set throttling back to "No throttling" and reload the page → `BUG-04 double click check` is still listed exactly once.
6. Type `BUG-04 enter key check`, click "Save note" and immediately press Enter in the field (throttling "Slow 3G") → one `POST /api/notes` in the Network tab, and the note appears once.

### Criterion 2: Button disabled while saving, enabled after
Prerequisites: as Criterion 1, throttling "Slow 3G".
1. Navigate to `http://localhost:5183/`, type `BUG-04 disabled check` and click "Save note" once → while the `POST /api/notes` is pending, the "Save note" button is greyed out (reduced opacity, not-allowed cursor) and clicking it does nothing.
2. Wait for the request to finish → the button returns to its normal dark style and is clickable; the note is listed once.
3. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → NoteForm.test.tsx runs, expected `0 failed`.

### Criterion 3: A failed save is retryable, and TEST-03 behaviour is unchanged
Prerequisites: the app stack is running; you can stop and start the backend service (for example its compose service).
1. Navigate to `http://localhost:5183/` and stop the backend → the page stays open.
2. Type `BUG-04 retry check` and click "Save note" → the message "The note could not be saved. Please try again." appears, the field still holds `BUG-04 retry check`, and the "Save note" button is enabled again.
3. Start the backend again and click "Save note" → `BUG-04 retry check` appears once in the list and the error message disappears.
4. With the field empty, click "Save note" → "Enter a note before saving." appears and the Network tab shows no `POST /api/notes`.
5. Type three spaces and click "Save note" → the same validation message, and no `POST /api/notes`.
6. Type `  BUG-04 trim check  ` (leading and trailing spaces) and click "Save note" → the list shows `BUG-04 trim check` without the surrounding spaces.
