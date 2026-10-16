# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice
>
> (The tracker item carries a title only; its description is empty. The defect and the acceptance criteria below are derived from the title and from the existing TEST-03 note form code, and are recorded as assumptions under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] 1. While a note save is in flight, a second submit of the note form (a fast double click on "Save note", or pressing Enter again) sends no additional POST /api/notes request, so a fast double submit stores the note exactly once and the list shows it once.
- [ ] 2. The "Save note" button is disabled while a save is pending, and is enabled again once that save succeeds, so the next note can be saved.
- [ ] 3. When a pending save fails, the existing error message is shown, the typed text is kept, and the button is enabled again, so a retry sends exactly one new save request.

## Re-Plan Feedback
- Comment (tracker): two bot notices of earlier, unmerged PRs on this item → not acted on because neither describes the defect or a requirement; they are automation notices, not stakeholder input.
- Assumption (empty description): the defect is the client-side double submit in frontend/src/components/NoteForm.tsx. handleSubmit awaits createNote with no in-flight guard, and the input is cleared only after the request resolves, so a second click or Enter during the request re-submits the same text and POST /api/notes stores a second row. Criteria 1 to 3 are derived from that reading of the title.
- Assumption (fix scope): the fix is a client-side in-flight guard in NoteForm.tsx only: a synchronous ref flag that drops a submit while one is pending, plus a disabled "Save note" button for visible feedback. No server-side idempotency key, no backend dedupe, no unique constraint: the backend notes router (backend/app/routers/notes.py) legitimately accepts two notes with the same text, since a user may save the same text twice on purpose, and the defect named by the title is the accidental fast repeat that the client guard removes. Server dedupe would be gold plating (user_story_alignment.md Section 3).
- Assumption (why a ref and not state alone): a React state flag is read from the render closure, so two submit events delivered before React re-renders could both read false. The ref is updated synchronously inside the handler and closes that window; the state flag exists only to render the disabled button.
- Assumption (no pending label): the button keeps its "Save note" label while disabled. A "Saving..." label or spinner is not asked for by the title and is left out.
- Reproduction: locally reproducible. A fast double click on "Save note" with a non-empty note on / sends two POST /api/notes and renders two identical list items. The reproduction test is the unit test in frontend/src/components/NoteForm.test.tsx named "sends one save request when the form is submitted twice while the first save is pending" (createNote mocked with a promise that stays pending; two submits; expect one call). It fails on main at ecf26aa (two calls) and passes after the fix, so a phase can run it before and after with npm --prefix frontend test. The E2E spec e2e/tests/BUG-04_double_submit_note.spec.ts reproduces the same defect end to end in the browser.
- Serialization context (TEST-08, in flight): TEST-08 edits frontend/src/api/notes.ts, frontend/src/components/AppFooter.tsx and frontend/src/components/LandingPage.test.tsx. This plan touches none of them: the guard lives entirely in NoteForm.tsx and its own test file, and LandingPage.tsx is not modified either, because the onCreated wiring there is already correct.

## Plan Overview
A frontend-only defect fix on the TEST-03 note form. NoteForm.tsx gains an in-flight guard: a ref set before createNote is awaited and cleared in a finally block, which makes handleSubmit return early while a save is pending, and an isSaving state that disables the submit button for the same window. Empty-note validation, trimming, error display and the onCreated callback are unchanged. Covered by unit tests in NoteForm.test.tsx (including the reproduction test), one Playwright E2E spec for the browser double click, and the UAT artifacts. No backend, API contract or dependency change.

## Frontend Plan
- Components to create/modify: frontend/src/components/NoteForm.tsx (modify only). Add a useRef boolean (saveInFlight) and a useState boolean (isSaving). In handleSubmit, after preventDefault: if saveInFlight.current is true, return immediately (no validation message, no request). Keep the existing empty and whitespace-only check before the guard is armed, so an empty submit still shows the validation message and arms nothing. Then set saveInFlight.current = true and isSaving to true, await createNote inside the existing try/catch, and in a finally block set saveInFlight.current = false and isSaving to false. The submit button gets the disabled attribute bound to isSaving. Success path (clear error, clear text, onCreated) and failure path (SAVE_FAILED_MESSAGE, text kept) are unchanged.
- Routes: none (the form stays on /).
- State management: local component state as today; one added ref and one added boolean state in NoteForm. LandingPage.tsx is unchanged.
- Design reference notes: AI freestyle. Disabled button: keep buttonStyle and add only what the native disabled state needs to read as unavailable, cursor not-allowed and opacity 0.6 while isSaving is true; no new colors.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: POST (unchanged, consumed through the existing createNote in frontend/src/api/notes.ts, which this plan does not modify)
- URL: /api/notes
- Request: body with one text field holding the trimmed note text (unchanged)
- Response: 201 with the stored note, id and text (unchanged). The only contract change is behavioural on the client: at most one request in flight per form.

## Technology Selection
- In-flight submit guard: chose React useRef plus the native disabled attribute on the existing submit button over a debounce or throttle utility, a new dependency (for example a form library), or a server-side idempotency key, because React (already installed) and the platform disabled state cover the need in a few lines; a disabled default button also blocks implicit Enter submission natively, and the ref closes the window before re-render.
- No net-new component, module or dependency is introduced; every change edits existing files or adds test and UAT files.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser reproduction of the double submit; a fast double click on note-submit sends one POST /api/notes and renders one list item, and the button is disabled while the save is pending
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the artifact copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the ref-based in-flight guard, the isSaving state, a finally block that releases both, and disabled on the submit button
- [A] frontend/src/components/NoteForm.test.tsx: add the reproduction test and the disabled-state and retry-after-failure unit tests

No dependency changes, so no lockfile is regenerated. README.md and docs/DEVELOPMENT.md need no edit: the fix changes no project structure, run configuration, dependency or test infrastructure. frontend/src/api/notes.ts, frontend/src/components/LandingPage.tsx and frontend/src/components/LandingPage.test.tsx are deliberately not modified.

## Testing Strategy
- Unit tests: NoteForm behaviour with createNote mocked (Vitest + Testing Library, the existing vi.mock of ../api/notes). New tests in the existing file:
  - "sends one save request when the form is submitted twice while the first save is pending" (the reproduction test: createNote returns a promise the test resolves manually; type a note, click note-submit twice, and also fire submit on note-form, expect createNote called once; then resolve and expect onCreated called once). Fails on ecf26aa, passes after the fix.
  - "disables the save button while a save is pending and enables it after success" (pending promise: button disabled; after resolve: button enabled and input cleared).
  - "enables the save button again after a failed save so a retry sends one new request" (first call rejects: error shown, text kept, button enabled; second click sends exactly one more call).
  - The six existing NoteForm tests stay green unchanged (empty and whitespace validation still arms no guard and sends no request).
  - Directory: frontend/src/components/ (colocated, the existing frontend convention; the backend/tests/unit/ directory in CLAUDE.md is for pytest and does not apply to a frontend component)
  - Naming: NoteForm.test.tsx (existing file)
- Integration tests: not warranted. No router, repository, model or migration changes (testing_standards.md Section 6); the backend keeps accepting duplicate texts by design.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: one spec reproducing the defect through the browser. Open / and wait for the mount GET /api/notes (same helper shape as the TEST-03 spec). Use page.route on POST /api/notes to hold the request until both clicks have been issued, then let it continue to the real backend, so the pending window is deterministic rather than timing dependent. Type a unique note text, double click note-submit, assert the button is disabled while held, release, then assert exactly one POST /api/notes was issued and exactly one list item with that text is shown. Edge case: after the save completes the button is enabled and a second, different note saves normally (one more POST).
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus the edge case of a second different note after the first save.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A second submit while a save is in flight sends no extra POST; a fast double submit stores one note, listed once | E2E (plus the Unit reproduction test) | — |
| 2 | The button is disabled while a save is pending and enabled again after success | Unit | verifying it needs no navigation: it is the button disabled attribute across a mocked pending and resolved promise, which the E2E spec also observes in passing |
| 3 | After a failed save the error shows, text is kept, the button re-enables and a retry sends exactly one request | Unit | verifying it needs no navigation: a failing backend is a mocked rejection, and forcing a real server failure in the browser adds cost without covering more of the guard |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Fast double submit stores the note once | Hold POST /api/notes with page.route, double click note-submit, release; assert one POST and one note-list item with the text | Given the landing page is open, When I type a note and double click Save note, Then the note appears once in the list |
| 2 | Button disabled while pending, enabled after success | covered at Unit, see Criterion coverage (the E2E spec also asserts disabled while held) | Given a save is pending, Then Save note is disabled, And after it completes Save note is enabled |
| 3 | Retry after a failed save sends one request | covered at Unit, see Criterion coverage | Given the backend is down, When I save a note, Then the error shows and Save note is enabled again, When the backend is back and I click Save note, Then the note is stored once |

## Manual verification plan
### Criterion 1: a fast double submit stores the note once
Prerequisites: the stack is running with docker compose up (frontend on http://localhost:5183, backend on http://localhost:8010); a desktop browser with DevTools open on the Network tab, throttling set to "Slow 3G" so the save stays pending long enough to click twice.
1. Navigate to http://localhost:5183/ → the "Task Notes" page shows the "New note" field, the "Save note" button and the notes list.
2. Type `Double click check 1` in the "New note" field → the text appears in the field.
3. Double click "Save note" quickly → the Network tab shows exactly one POST request to /api/notes.
4. Wait for that request to finish → the list shows `Double click check 1` exactly once and the field is empty.
5. Reload the page → the list still shows `Double click check 1` exactly once (one row was stored, not two).
6. Type `Enter key check 1`, click into the field and press Enter twice quickly → the Network tab shows one POST to /api/notes, and after it finishes the list shows `Enter key check 1` exactly once.

### Criterion 2: the button is disabled while a save is pending and enabled after success
Prerequisites: as for Criterion 1, Slow 3G throttling on.
1. Navigate to http://localhost:5183/ → "Save note" is enabled.
2. Type `Pending state check` and click "Save note" once → while the POST is still pending, "Save note" is visibly dimmed, shows a not-allowed cursor on hover, and clicking it does nothing (no second POST in the Network tab).
3. Wait for the request to finish → `Pending state check` is in the list, the field is empty, and "Save note" is enabled again.
4. Type `Second note` and click "Save note" → one more POST is sent and `Second note` appears once in the list.

### Criterion 3: a failed save re-enables the button and a retry sends one request
Prerequisites: the stack is running; throttling off.
1. Navigate to http://localhost:5183/ and wait for the page to load → the form is shown.
2. Stop the backend with `docker compose stop backend` from the repository root → the page stays open.
3. Type `Retry check` and click "Save note" → the message "The note could not be saved. Please try again." appears, the field still holds `Retry check`, and "Save note" is enabled.
4. Start the backend again with `docker compose start backend` and wait until http://localhost:8010/api/health answers.
5. Click "Save note" once → the Network tab shows exactly one new POST to /api/notes, `Retry check` appears once in the list, the error message is gone, and the field is empty.

### Automated check for all three criteria
1. From the repository root run `npm --prefix frontend test` → the run includes frontend/src/components/NoteForm.test.tsx, including the test "sends one save request when the form is submitted twice while the first save is pending", and reports 0 failed.
2. With the stack running, run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` from the repository root → 0 failed.
