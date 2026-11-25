# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (ClickUp task 123k99cx47m. The tracker description is empty: the title is the whole report. No `docs/issues/BUG-04.md` and no `docs/diagnose/BUG-04.md` exist. The acceptance criteria below are derived from the title and recorded as assumptions in `## Re-Plan Feedback`.)

## Acceptance Criteria
- [ ] Triggering Save twice in quick succession for the same note (a double click on "Save note", or "Save note" followed by Enter before the first save has answered) sends exactly one create request and stores exactly one note.
- [ ] While a save is in flight the "Save note" button is disabled, and it is enabled again once that save has succeeded or failed.
- [ ] After a failed save the same text can be saved again with one more Save, which sends exactly one new create request.

## Re-Plan Feedback
- Comment (tracker): 54 comments scanned over 3 pages, every one an automated `mayker-dev` bot note from earlier runs whose code was reset off main → not acted on because none is a requirement or a correction from a human (counted by the dispatching session, relayed in the dispatch prompt).
- Comment (tracker): none from a human; the description is empty → Addressed by: assumption A1, the defect is a client-side double submit from one form (double click, or click plus Enter) while the first `POST /api/notes` is still in flight. The fix is a client-side in-flight guard in `NoteForm`. Two separate tabs or two separate users posting the same text are not this defect and are not deduplicated; identical text saved deliberately twice, one save after the other has answered, stays two notes, as TEST-03 allows.
- Comment (tracker): assumption A2 → Addressed by: no server-side deduplication (no idempotency key, no unique constraint on `notes.text`). Nothing in the report asks for it, a unique constraint would forbid two genuinely separate notes with the same text, and a server-side change would collide with TEST-12 on `notes.py`, `note_service.py` and `note_repository.py` (feature map row). Recorded here so a reviewer who wants server-side protection can say so on the plan PR.
- Merged since the last plan: n/a (fresh plan, branched from current main 41cd1e09d181d7660116af364f4faddf8c957148).

## Plan Overview
Frontend-only defect fix in `frontend/src/components/NoteForm.tsx`. Today `handleSubmit` awaits `createNote` with no in-flight state, so a second submit event fired before the first response arrives runs `createNote` a second time and the backend stores two rows. The fix adds a synchronous in-flight guard (a `useRef<boolean>`, set before the request and cleared in `finally`) so a second submit while one is pending returns without a request, plus an `isSaving` state that sets `disabled` on the submit button for visible feedback. The ref is the actual guard because two submit events can arrive before React re-renders the disabled button; the disabled attribute alone is not sufficient. No backend, API, schema or `LandingPage.tsx` change.

Reproduction, classified per `/fix` Section R1:
- Repro: local-automated: `npm --prefix frontend test -- src/components/NoteForm.test.tsx` with the new test `sends one create request when the form is submitted twice before the first save answers` written first; it fails on the current code (createNote called twice) and passes on the fix (source: item, its title; derived because the description is empty)

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard: `useRef` flag checked and set at the top of `handleSubmit` after the empty-text check, cleared in a `finally`; `isSaving` state driving `disabled={isSaving}` on the `note-submit` button; `buttonStyle` gets a disabled look via `opacity: 0.6` and `cursor: "not-allowed"` applied only while saving)
- Routes: none
- State management: local component state only (`useState` for `isSaving`, `useRef` for the synchronous guard). `LandingPage.tsx` and its `onCreated` wiring are unchanged.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: POST
- URL: /api/notes (unchanged, from TEST-03)
- Request: `{"text": "Buy milk"}` (unchanged)
- Response: 201 `{"id": 7, "text": "Buy milk"}` (unchanged). The fix changes only how many times the frontend calls it per user save.

## Technology Selection
- In-flight guard: chose React's own `useRef` and `useState` (installed, `react` ^18.3.1) over a debounce or throttle helper and over a new dependency such as lodash, because a debounce delays the first save and still lets a slow second click through, while a ref flag blocks exactly the overlap window.
- Disabled feedback: chose the native `disabled` attribute on the existing `<button type="submit">` over a custom overlay or spinner component, because the platform already blocks clicks and implicit Enter submission on a disabled default button.
- No new dependency, module or component is introduced.

## File Manifest
### New files
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus one edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the in-flight ref guard, the `isSaving` state and the disabled submit button
- [A] frontend/src/components/NoteForm.test.tsx: add the reproduction test and the disabled-state and retry tests (Criterion coverage below)

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure. No E2E spec: every criterion is covered at unit tier (Criterion coverage below). `frontend/src/components/LandingPage.tsx`, `frontend/src/api/notes.ts` and every backend file are deliberately not touched.

## Testing Strategy
- Unit tests: `NoteForm` component tests with `createNote` mocked (existing `vi.mock("../api/notes")` pattern), using a deferred promise so the first save stays pending while the second submit fires. The double submit is fired with `fireEvent.submit` on the `note-form` element twice, which bypasses the disabled button on purpose and so proves the ref guard rather than the attribute.
  - Directory: `frontend/src/components/` (co-located `*.test.tsx`, per project standards)
  - Naming: `NoteForm.test.tsx` (existing file)
- Integration tests: none warranted. No router, service, repository or model changes (`testing_standards.md` Section 6, questions two and three answer no).
- E2E tests: none warranted. Every criterion is verifiable at component level with the API mocked; the backend's behaviour per request is unchanged and already covered by TEST-03's integration and E2E tests.
- UAT scenarios: one scenario per criterion plus one edge case (two deliberate saves of the same text, one after the other has answered, store two notes).
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | Two quick saves send one create request and store one note | Unit | `sends one create request when the form is submitted twice before the first save answers` | verifying it needs no navigation: the defect is the component issuing a second request, observable as the mock's call count; the backend stores one row per request, already covered by TEST-03 |
| 2 | Save button disabled while a save is in flight, enabled again after success or failure | Unit | `disables the save button while a save is in flight and enables it after success`, `enables the save button again after a failed save` | verifying it needs no navigation: it is a rendered attribute of one component during a pending promise |
| 3 | After a failed save one more Save sends exactly one new request | Unit | `sends exactly one new create request when saving again after a failure` | verifying it needs no navigation: it is the guard being released in `finally`, observable as the mock's call count |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Two quick saves store one note | covered at Unit, see Criterion coverage | Given the landing page is open, When I double-click "Save note" with text "Double click check", Then the list shows that note once |
| 2 | Save button disabled while saving | covered at Unit, see Criterion coverage | Given a slow network, When I click "Save note", Then the button is disabled until the note appears |
| 3 | Retry after failure sends one request | covered at Unit, see Criterion coverage | Given the backend is stopped, When I save and it fails, and the backend is started and I save again, Then the note appears once |

## Manual verification plan
### Criterion 1: Two quick saves send one create request and store one note
Prerequisites: the stack is running (`docker compose up` from the repo root), the frontend is at http://localhost:5183, browser DevTools open on the Network tab filtered to `notes`.
1. Navigate to `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the current note list.
2. Enter `Double click check` in the "New note" field → the text is in the field.
3. Double-click "Save note" as fast as you can → exactly one `POST /api/notes` row appears in the Network tab, and "Double click check" appears once in the note list.
4. Enter `Click then enter check`, click "Save note" and press Enter immediately after → one `POST /api/notes` row for it, and the note appears once in the list.
5. Reload the page → each of the two notes appears exactly once.
6. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → the run passes: its summary line reports no failed test and the command exits 0.

### Criterion 2: Save button disabled while a save is in flight
Prerequisites: as Criterion 1, and in DevTools Network set throttling to "Slow 3G" so the save takes a few seconds.
1. Navigate to `http://localhost:5183/` → the page loads, "Save note" is enabled.
2. Enter `Slow save check` and click "Save note" → while the request is pending the button appears dimmed and clicking it does nothing.
3. Wait for the request to finish → "Slow save check" appears once in the list, the field is cleared, and "Save note" is enabled again.
4. Set throttling back to "No throttling".

### Criterion 3: After a failed save one more Save sends exactly one new request
Prerequisites: the frontend is running at http://localhost:5183 and the page is loaded; then stop the backend container (`docker compose stop backend`).
1. Enter `Retry check` and click "Save note" → the red message "The note could not be saved. Please try again." appears, the text stays in the field, and "Save note" is enabled again.
2. Start the backend (`docker compose start backend`) and wait until `http://localhost:8010/api/health` answers.
3. Click "Save note" once → exactly one new `POST /api/notes` row in the Network tab, "Retry check" appears once in the list, and the error message is gone.
