# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task carries no description; the criteria below are derived from the title and recorded as assumptions under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] 1. Submitting the note form a second time (double-click on "Save note", a second click, or pressing Enter again) while the first save is still in flight sends exactly one `POST /api/notes` and stores the note once; the list shows it once.
- [ ] 2. While a save is in flight, the "Save note" button is disabled, so the user can see a save is in progress and cannot trigger another.
- [ ] 3. Once the save settles, the form accepts a new submission again: after a success the button is re-enabled for the next note, and after a failure the error message shows, the typed text is kept and a retry sends one new request.

## Re-Plan Feedback
- Comment (tracker): none actionable. All 31 comments on the task are the framework's own "PR opened" notices from earlier runs → Addressed by: not acted on, because none of them carries product feedback.
- Assumption (tracker description empty): the criteria are derived from the title alone. "Twice quickly" is read as a repeated submit of the same form while the first request is still pending (double-click, or a click then Enter). → Addressed by: criteria 1 to 3.
- Assumption (where the fix lives): the fix is client-side only, an in-flight guard in `NoteForm`. The backend is not changed to reject or merge duplicate texts, because two notes with the same text submitted deliberately at different times are legitimate, and no criterion asks for server-side idempotency. → Addressed by: Backend Plan reads "No backend changes required."
- Assumption (scope): no spinner, no changed button label and no toast. Disabling the button is the only in-progress cue, which is enough to satisfy criterion 2 without gold plating (`user_story_alignment.md` Section 3).
- Reproduction (defect item): the reproduction can run as a local automated test on this checkout. The new Vitest case in `frontend/src/components/NoteForm.test.tsx` holds `createNote` on an unresolved promise, submits twice and asserts one call; it fails on the current `main` (`createNote` is called twice) and passes after the fix. The E2E spec reproduces the same thing in the browser by delaying the `POST` response through Playwright request routing and counting requests.

## Plan Overview
`frontend/src/components/NoteForm.tsx` has no in-flight state. `handleSubmit` awaits `createNote` and clears the input only after the response, so every submit event fired during that window starts another `POST /api/notes`, and each one stores a row. The fix adds a saving guard to `NoteForm`:

- a `useRef<boolean>` flag, checked and set synchronously at the top of `handleSubmit` (after the empty-text check), so two submit events delivered before React re-renders are still caught. State alone is read from the render's closure and would let the second event through.
- a `useState<boolean>` `isSaving` mirror that drives `disabled` on the submit button.
- both flags are cleared in a `finally` block, so success and failure both re-open the form.

Frontend-only. One production file and its unit test change, plus a new E2E spec and the UAT artifacts. `LandingPage.tsx`, `api/notes.ts` and the backend are untouched.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify). Add `isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`: keep `event.preventDefault()` and the empty-text validation first (an empty submit during a save still shows the validation message and sends nothing). Then `if (isSavingRef.current) return;`, set the ref and the state to true, `try { await createNote(...) ...existing success path... } catch { ...existing error path... } finally { isSavingRef.current = false; setIsSaving(false); }`. On the button: `disabled={isSaving}`, and a disabled style variant (below). Import `useRef` alongside the existing React imports. Existing `data-testid`s stay unchanged.
- Routes: none (the landing page at `/` already hosts the form).
- State management: component-local (`useRef` for the synchronous guard, `useState` for rendering). No change to `LandingPage`'s notes state.
- Design reference notes: AI freestyle. The only new visual is the disabled button: same `buttonStyle`, plus `opacity: 0.6` and `cursor: "not-allowed"` while `isSaving` is true.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form keeps using the existing internal endpoint, and the fix only changes how many times it is called per user submit.
- Method: POST
- URL: /api/notes
- Request: JSON body with one field, `text` (string, 1 to 500 characters after trimming)
- Response: 201 with the stored note, e.g. `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight submit guard: chose React's built-in `useRef` and `useState` plus the native `disabled` attribute on the `<button>` over a debounce utility or a form library (none installed, none needed), because a disabled submit button is a native platform feature that blocks clicks and Enter-submits once rendered, and the ref covers the gap before the re-render.
- No net-new dependency, module or component is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec that delays the `POST /api/notes` response through `page.route`, double-clicks "Save note" (and also clicks then presses Enter), and asserts one POST request was sent, one list item with the text is shown, and it is still one after a reload
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (Enter key repeat)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the artifact copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the synchronous in-flight guard (`useRef`), the `isSaving` state, the `finally` reset and `disabled={isSaving}` with the disabled style
- [A] frontend/src/components/NoteForm.test.tsx: add unit cases for a double submit while pending (one `createNote` call), the button disabled while pending, re-enabled after success, and re-enabled with the text kept after a failure, with a retry sending exactly one more call

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the project structure, run configuration, dependencies and test infrastructure are unchanged.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (Vitest + Testing Library), using a manually controlled promise so the save stays pending while the test submits again. Cases: double submit while pending gives one call; Enter-submit (`fireEvent.submit` on the form) while pending gives no extra call; button disabled while pending; button enabled after resolve; after reject, error shown, text kept, button enabled, and a retry gives exactly one more call. The existing six cases must still pass unchanged.
  - Directory: `frontend/src/components/` (co-located Vitest tests, the frontend's existing convention; `CLAUDE.md`'s `backend/tests/unit/` directory applies to the backend)
  - Naming: `NoteForm.test.tsx` (existing file)
- Integration tests: none added. No router, repository, model or migration changes, so `testing_standards.md` Section 6 warrants no integration tier for this item. The existing `backend/tests/integration/test_notes_integration.py` stays green unchanged.
  - Directory: `backend/tests/integration/` (no new file)
- E2E tests: the double-submit reproduction in a real browser against the running stack (criterion 1). The spec reuses the TEST-03 pattern: exact-path request matcher, unique note text per test, waiting for the mount `GET`. It holds the `POST` with `page.route` until both submits have been fired, then calls `route.continue()`.
  - Directory: `e2e/tests/`
  - File: `BUG-04_double_submit_note.spec.ts`
- UAT scenarios: one scenario per criterion plus the Enter-key edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A second submit while the first save is in flight sends one POST and stores one note | E2E (plus the Unit reproduction) | — |
| 2 | "Save note" is disabled while a save is in flight | Unit | Verifying it needs no navigation: the disabled attribute on a rendered component is read in jsdom with `createNote` held pending |
| 3 | After the save settles the form accepts a new submission; after a failure the text is kept and a retry sends one request | Unit | Verifying it needs no navigation: it is component state after a mocked promise resolves or rejects, which the unit test controls deterministically, while a browser test cannot make the real backend fail on demand |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | One POST and one stored note on a quick double submit | Route-delay `POST /api/notes`, double-click `note-submit` (second test: click then press Enter in `note-input`), release the route, assert one recorded POST, one `note-list-item-{id}` with the text, and still one after a reload | Given the landing page is open and saving is slow, When I double-click "Save note" for "Buy milk", Then "Buy milk" appears once in the list and once after a reload |
| 2 | Button disabled while saving | covered at Unit, see Criterion coverage | Given saving is slow, When I click "Save note", Then the button is disabled until the note appears |
| 3 | Form usable again after the save settles | covered at Unit, see Criterion coverage | Given a note was just saved, When I type another note and click "Save note", Then it is saved once |

## Manual verification plan
### Criterion 1: a quick second submit stores the note only once
Prerequisites: the stack is running (frontend at http://localhost:5183, backend at http://localhost:8010); Chrome DevTools open on the Network tab with throttling set to "Slow 3G" so the save stays pending long enough.
1. Navigate to `http://localhost:5183/` → the "Task Notes" heading, the "New note" field and the "Save note" button are shown.
2. Type `BUG-04 double click` in the "New note" field → the text is in the field.
3. Double-click "Save note" quickly → in the Network tab exactly one `POST` to `/api/notes` appears, and once it completes `BUG-04 double click` appears in the note list exactly once.
4. Reload the page → `BUG-04 double click` is still listed exactly once.
5. Type `BUG-04 enter key` in the field, click "Save note", then immediately press Enter in the field → one `POST /api/notes` in the Network tab, and `BUG-04 enter key` appears once in the list.
6. Open `http://localhost:8010/api/notes` in a new tab → the JSON array holds one entry with text `BUG-04 double click` and one with `BUG-04 enter key`.

### Criterion 2: the button is disabled while saving
Prerequisites: as for Criterion 1, with "Slow 3G" throttling on.
1. Navigate to `http://localhost:5183/` → the form is shown and "Save note" is enabled (dark background, pointer cursor).
2. Type `BUG-04 disabled check` and click "Save note" once → while the request is pending, the button is greyed (reduced opacity), hovering shows the not-allowed cursor, and clicking it again does nothing.
3. Wait for the request to complete → the note appears in the list and the button returns to its normal look.

### Criterion 3: the form is usable again after a save settles
Prerequisites: as for Criterion 1; throttling can be "No throttling" for steps 1 to 2.
1. On `http://localhost:5183/`, type `BUG-04 first`, click "Save note" → the note appears and the field is empty.
2. Type `BUG-04 second`, click "Save note" → the note is saved and listed once; the button is enabled again.
3. Stop the backend (`docker compose stop backend`), type `BUG-04 retry`, click "Save note" → the message "The note could not be saved. Please try again." appears, the field still reads `BUG-04 retry`, and "Save note" is enabled.
4. Start the backend again (`docker compose start backend`), wait until `http://localhost:8010/api/health` answers, then click "Save note" once → one `POST /api/notes` in the Network tab, the error disappears, and `BUG-04 retry` appears in the list once.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → expected result: `0 failed` for the NoteForm tests.
