# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The tracker item, ClickUp task 123k99cx47m, has an empty description and no acceptance criteria. The criteria below are derived from the title and from the code; every assumption is recorded under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] Submitting the note form again while a save is still in progress (a second click on "Save note", or a second Enter in the note field) sends no second `POST /api/notes`, so the note is stored exactly once.
- [ ] While a save is in progress the "Save note" button is disabled, and it is enabled again once that save succeeds or fails.
- [ ] Once a save has finished, the form accepts the next submit normally: a new note can be saved after a success, and the same note can be retried after a failure.

## Re-Plan Feedback
- Comment (tracker): 11 comments read, all framework PR notices from earlier runs → Addressed by: not acted on because none states a requirement or a correction for this item.
- Assumption (empty description): the defect is client-side. `frontend/src/components/NoteForm.tsx` `handleSubmit` has no in-flight guard: it awaits `createNote` with no state that blocks a second submit, and the submit button is never disabled, so two submits before the first response returns issue two `POST /api/notes` calls and the backend stores two rows. → Addressed by: an in-flight guard in `NoteForm` (a synchronous `useRef` flag plus an `isSaving` state that disables the button).
- Assumption (no server-side dedupe): the backend is not changed. Rejecting or collapsing identical texts server-side would also refuse a user who deliberately saves the same text twice, which nothing asks to forbid, and it would need an idempotency key or a uniqueness rule that is new scope (`user_story_alignment.md` Section 3). → Addressed by: Backend Plan reads "No backend changes required"; this keeps the plan disjoint from TEST-12, TEST-14, FEAT-2 and FEAT-3 (the notes router, service and repository).
- Assumption (Enter key): a disabled button alone does not fix the bug, because pressing Enter in the still-enabled text field submits the form again. The guard therefore lives in `handleSubmit` itself, as a ref checked and set synchronously, so a second submit from either path in the same tick, before React re-renders, is dropped. → Addressed by: criterion 1 names both paths and the E2E spec reproduces through Enter.
- Assumption (no visible "Saving..." label): the button text stays "Save note" while disabled. A progress label or spinner is not asked for. → Addressed by: only the `disabled` attribute and its disabled styling change.
- Scheduling note (TEST-08, PR #349, branch feature/TEST-08-footer-app-version, not yet merged): TEST-08 modifies `frontend/src/api/notes.ts`, adds `frontend/src/api/baseUrl.ts` and modifies `frontend/src/components/LandingPage.test.tsx`. → Addressed by: this plan touches none of those three files and does not touch `frontend/src/components/LandingPage.tsx` either (the `onCreated` wiring there is unchanged), so the File Manifests are disjoint.

## Plan Overview
Frontend-only bug fix in the note form component. `NoteForm` gains an in-flight guard: a `useRef<boolean>` that `handleSubmit` checks and sets synchronously before calling `createNote`, cleared in a `finally`, plus an `isSaving` state that drives the submit button's `disabled` attribute and disabled styling. Validation (empty or whitespace-only note) still runs first and never sets the guard. Regression coverage: Vitest component tests in the existing `NoteForm.test.tsx`, and one Playwright spec that reproduces the original bug in the browser.

### Reproduction (a local test that expresses the defect)
In `frontend/src/components/NoteForm.test.tsx`: make `createNote` return a promise that has not resolved yet (a deferred whose `resolve` the test holds), type `Buy milk`, then call `fireEvent.click` on `note-submit` twice in a row. On the current code `createNote` is called twice (`toHaveBeenCalledTimes(2)`); after the fix it is called once. The same reproduction with `fireEvent.submit` on `note-form` twice covers the Enter path. In the browser: hold the `POST /api/notes` response with `page.route`, press Enter twice in `note-input`, release it; on the current code two POST requests are recorded and two list items with the same text appear.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify): add `const savingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`, after `event.preventDefault()`: return immediately when `savingRef.current` is true; keep the existing empty-note validation as is; then set `savingRef.current = true` and `setIsSaving(true)`, run the existing `try`/`catch` around `createNote`, and in a `finally` set `savingRef.current = false` and `setIsSaving(false)`. The submit `<button>` gets `disabled={isSaving}` and its style switches to the disabled variant while saving. The input stays enabled (its text is kept on failure, cleared on success, exactly as today).
- Routes: none.
- State management: local component state (`useState`) plus a `useRef` flag; the ref is the authoritative guard because a state update is not visible to a second event fired before the next render.
- Design reference notes: AI freestyle. Disabled button: same `buttonStyle` with `opacity 0.6` and `cursor not-allowed`; enabled button unchanged (`padding 0.5rem 1rem`, `font-size 1rem`, `font-weight 600`, `color #ffffff`, `background-color #1a1a1a`, `border-radius 0.375rem`, `cursor pointer`).

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- No contract change. The form keeps calling the existing `POST /api/notes` (request `{"text": "Buy milk"}`, response 201 `{"id": 7, "text": "Buy milk"}`) through `createNote` in `frontend/src/api/notes.ts`, which this plan does not modify; the fix only guarantees it is called once per save.

## Technology Selection
- In-flight submit guard: chose React's own `useRef` and `useState` plus the native `disabled` attribute on the `<button>` over a debounce or throttle utility or a form library, because the need is "one request while one is pending", which a ref flag expresses exactly and a time-based debounce does not (a slow save would outlast any fixed delay); no new dependency.
- No other net-new component, module or dependency: the remaining changes are tests in existing or convention-named test files.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright regression spec that holds the POST response, submits twice via Enter, and asserts exactly one POST request and one stored note (also after reload).
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus an edge case.
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan.
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3.

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus `isSaving` state) in `handleSubmit`, `disabled={isSaving}` and disabled styling on the submit button.
- [A] frontend/src/components/NoteForm.test.tsx: Vitest regression tests for the double submit (click and form submit), the disabled state while pending, re-enabling after success and after failure, and saving a second note afterwards.

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (`vi.mock("../api/notes")`), using a deferred promise to hold a save in flight: two clicks on `note-submit` call `createNote` once; two `fireEvent.submit` on `note-form` call it once; `note-submit` is disabled while pending; it is enabled again after the promise resolves and after it rejects; after a resolved save a second note (`Walk dog`) is saved with a second call; after a rejected save, submitting again retries with the same text. Existing tests stay unchanged and must keep passing.
  - Directory: `frontend/src/components/` (co-located Vitest tests, the existing convention for frontend unit tests; `CLAUDE.md`'s unit directory `backend/tests/unit/` covers backend tests only)
  - Naming: `{Component}.test.tsx`, the existing `NoteForm.test.tsx`
- Integration tests: not warranted. No repository, model, migration or router changes (`testing_standards.md` Section 6), and the backend legitimately stores two identical notes when it receives two requests.
  - Directory: `backend/tests/integration/` (unchanged)
- E2E tests: one spec reproducing the bug in a real browser. Hold the `POST /api/notes` response with `page.route` (continue the request only after both submits have happened), fill `note-input` with a unique text, press Enter twice, release; assert exactly one POST was recorded, exactly one `note-list` item carries the text, and after `page.reload()` still exactly one. Plus an edge-case spec: the button is disabled while the held request is pending and enabled after it returns.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/BUG-04_double_submit_note.spec.ts`
- UAT scenarios: one scenario per criterion plus one edge case (a failed save followed by a retry stores the note once).
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A second submit while a save is in progress sends no second POST, so the note is stored once | E2E | — |
| 2 | The Save note button is disabled while a save is in progress and enabled again after success or failure | Unit | verifying it needs no navigation or real backend: it is component state observable on the button with a mocked, held `createNote` (the E2E edge-case spec also observes it) |
| 3 | After a save finishes, the next submit works normally (new note after success, retry after failure) | Unit | verifying it needs no navigation: it is the guard being released in `finally`, observable as a second `createNote` call after a resolved and after a rejected promise |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Second submit during a save stores the note once | Route-hold the POST, press Enter twice in `note-input`, release, assert one POST recorded, one list item with the text, still one after reload | Given the landing page is open and the network is slow, When I press Enter twice on the note "Buy milk", Then the list shows "Buy milk" once, also after reload |
| 2 | Button disabled while saving, enabled after | covered at Unit, see Criterion coverage (plus the edge-case spec) | Given a save is in progress, When I look at the Save note button, Then it is disabled, and When the save finishes, Then it is enabled |
| 3 | Next submit works after a save finishes | covered at Unit, see Criterion coverage | Given I saved "Buy milk", When I save "Walk dog", Then both notes appear once each |

## Manual verification plan
### Criterion 1: A second submit while a save is in progress stores the note once
Prerequisites: the stack is running (`docker compose up`), the app is open at `http://localhost:5183/`, and Chrome DevTools is open on the Network tab with throttling set to "Slow 3G" so a save takes a few seconds.
1. Click the "New note" field and type `Double submit check` → the text is in the field.
2. Press Enter, then press Enter again immediately (within one second) → the Network tab shows exactly one `POST notes` request.
3. Wait for the request to finish → the note list shows `Double submit check` exactly once and the field is empty.
4. Set throttling back to "No throttling" and reload the page → the list still shows `Double submit check` exactly once.
5. Repeat steps 1 to 4 with text `Double click check`, double-clicking the "Save note" button instead of pressing Enter → one `POST notes` request, one list entry, still one after reload.

### Criterion 2: The Save note button is disabled while saving
Prerequisites: as for Criterion 1, with "Slow 3G" throttling on.
1. Type `Disabled button check` in the "New note" field and click "Save note" → the "Save note" button turns faded (reduced opacity) and the mouse pointer over it shows the not-allowed cursor; clicking it does nothing.
2. Wait for the request to finish → the button returns to full opacity with the normal pointer cursor and the note appears once in the list.
3. Stop the backend container (`docker compose stop backend`), type `Failure check` and click "Save note" → the button is disabled until the request fails, then enabled again, and the message "The note could not be saved. Please try again." appears under the form with `Failure check` still in the field.

### Criterion 3: After a save finishes, the next submit works normally
Prerequisites: the stack is running with the backend up, no throttling.
1. Type `First note` and click "Save note" → `First note` appears in the list and the field is empty.
2. Type `Second note` and click "Save note" → `Second note` appears below `First note`; each appears once.
3. Stop the backend (`docker compose stop backend`), type `Retry note` and click "Save note" → the error message appears and `Retry note` stays in the field.
4. Start the backend (`docker compose start backend`) and click "Save note" again → `Retry note` appears in the list exactly once and the error message disappears.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → the run reports `0 failed` for `src/components/NoteForm.test.tsx`.
