# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The tracker item, ClickUp 123k99cx47m, has an empty description and no checklist, custom fields or dependencies recorded on it. The acceptance criteria below are derived from the title alone; see Re-Plan Feedback for the assumptions.)

## Acceptance Criteria
- [ ] 1. Submitting a note twice in quick succession on the landing page's note form (a double click on "Save note", or a click followed by pressing Enter in the field, before the first save has answered) sends exactly one `POST /api/notes`, stores exactly one note, and the note list shows that note once.
- [ ] 2. Once a save has finished, successfully or with an error, the form accepts the next submit: a deliberate later save of the same text is stored as a second note (identical texts are not de-duplicated), and a save that failed can be retried from the same form.

## Re-Plan Feedback
- Comment (tracker): 32 comments read by the dispatching session (decisions.md, 6.1), all framework PR notices → not acted on because none states a requirement; relayed as "none actionable".
- Assumption (empty tracker description, recorded instead of a blocking question per `user_story_alignment.md` Section 4): the defect is the form issuing a second `POST /api/notes` while the first is still in flight. `NoteForm.handleSubmit` today has no in-flight guard, so every submit event that passes the empty-text check calls `createNote`, and the input is only cleared after the first response arrives. The fix is therefore client-side: one save in flight at a time per form.
- Assumption: the backend is not changed. A server-side de-duplication (same text within N seconds, or an idempotency key) is not implied by the title, would turn two deliberate saves of the same text into one (criterion 2 keeps them separate), and would edit `backend/app/routers/notes.py`, `note_service.py` and `note_repository.py`, which TEST-12 is planned to edit (feature_map.md row BUG-04). Not chosen.
- Assumption: while a save is in flight the "Save note" button is disabled, so the user sees why a second click does nothing. Its label stays "Save note" (no "Saving..." text, no spinner: not asked for, `user_story_alignment.md` Section 3).
- Merged since the last plan: n/a (fresh plan, branched from current main 61039ee).

## Plan Overview
Frontend-only bug fix in one component, `frontend/src/components/NoteForm.tsx`:
- Add a synchronous in-flight guard (a `useRef<boolean>`) checked at the top of `handleSubmit` after the empty-text check, set before `createNote` is awaited and cleared in a `finally`. A ref, not only state, because two submit events can be dispatched before React re-renders with new state; the ref closes that window.
- Mirror the guard in state (`isSaving`) to render the submit button `disabled` while a save is in flight, which also stops implicit submission by Enter (HTML: implicit submission does nothing when the form's default button is disabled) and gives the visible cue.
- `LandingPage.tsx`, `NoteList.tsx`, `frontend/src/api/notes.ts` and every backend file stay unchanged.
- Tests: Vitest component tests with a deferred `createNote` promise, and one Playwright spec that holds the real `POST /api/notes` until after a double click and counts requests and list items.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/NoteForm.tsx` (modified):
    - `const isSubmittingRef = useRef(false);` and `const [isSaving, setIsSaving] = useState(false);`.
    - In `handleSubmit`, after `event.preventDefault()` and the existing empty-text check (unchanged, so an empty submit still shows the validation message and sends nothing), `if (isSubmittingRef.current) { return; }`, then set `isSubmittingRef.current = true` and `setIsSaving(true)` before the `try`.
    - Existing `try`/`catch` bodies unchanged; add `finally { isSubmittingRef.current = false; setIsSaving(false); }`.
    - The submit button gets `disabled={isSaving}`, keeps `data-testid="note-submit"` and the label "Save note", and its style becomes `isSaving ? savingButtonStyle : buttonStyle`, where `savingButtonStyle = { ...buttonStyle, opacity: 0.6, cursor: "not-allowed" }`.
    - The input stays editable during a save (unchanged behaviour); on success it is cleared as today.
- Routes: none.
- State management: local component state and a ref inside `NoteForm`; no new props, `onCreated` contract unchanged.
- Design reference notes: AI freestyle (Design Reference mode NONE). Existing NoteForm values unchanged (button padding 0.5rem 1rem, font-size 1rem, weight 600, color #ffffff, background #1a1a1a, radius 0.375rem, cursor pointer). New saving/disabled state of the "Save note" button: same values plus opacity 0.6 and cursor not-allowed.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: POST
- URL: `/api/notes` (existing endpoint from TEST-03, consumed unchanged through `createNote` in `frontend/src/api/notes.ts`)
- Request: `{"text": "<trimmed note text>"}`
- Response: 201 `{"id": 12, "text": "Buy milk"}`
- Client-side contract change only: the form issues at most one such request at a time.

## Technology Selection
- In-flight guard in `NoteForm`: chose React's own `useRef` and `useState` (installed) over a debounce or throttle utility (lodash.debounce or similar), because the need is "one request in flight", not "one request per time window", and a timer-based guard both adds a dependency and still lets a slow response be doubled.
- Blocking the second submit: chose the native `disabled` attribute on the submit button (which also suppresses implicit Enter submission) over a JS keydown handler or an overlay, backed by the ref for submits dispatched before re-render.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec holding the first POST /api/notes until a double click (and a click plus Enter) has happened, asserting one POST, one stored note and one list item; plus a later deliberate save of the same text is stored as a second note
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus the click-then-Enter edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the ref plus state in-flight guard, the finally reset, and the disabled saving state of the submit button
- [A] frontend/src/components/NoteForm.test.tsx: add component tests for double click, double submit, disabled-while-saving, re-enabled after success and after failure, and a second deliberate save

Neither README.md nor docs/DEVELOPMENT.md needs an edit: this item changes no project structure, run configuration, dependency or test infrastructure. No lockfile changes: no dependency is added or removed.

## Testing Strategy
- Unit tests (Vitest, co-located: `frontend/src/components/NoteForm.test.tsx`, the frontend's existing `{Module}.test.tsx` convention; the configured `backend/tests/unit/` directory is the backend's and no backend test changes). Each test uses a deferred promise (`let resolveSave; createNoteMock.mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }))`) so the save stays in flight under control:
  - `test double click while saving calls createNote once`: type "Buy milk", click `note-submit` twice, then `fireEvent.submit(note-form)` once more; `createNote` called exactly once; after resolving, `onCreated` called exactly once.
  - `submit button is disabled while a save is in flight`: after the first click `note-submit` is disabled; after the promise resolves it is enabled again and the input is empty.
  - `button is re-enabled and a retry is sent after a failed save`: deferred promise rejects; error shown, text kept, button enabled; second submit calls `createNote` a second time.
  - `a deliberate second save of the same text is sent after the first finishes`: resolve the first save, type "Buy milk" again, submit; `createNote` called twice, `onCreated` called twice.
  - The six existing tests stay unchanged and green.
- Integration tests: no new integration test; no router, service or repository code changes, and `POST /api/notes` is already covered by TEST-03's integration tests.
  - Directory: `backend/tests/integration/` (unchanged)
- E2E tests: `e2e/tests/BUG-04_double_submit_note.spec.ts`, reusing TEST-03's patterns (exact path and method matcher, unique note text via `randomUUID`, wait for the mount GET):
  - (1) `page.route` on the notes URL holds the first POST in a gate promise (non-POST requests and later POSTs `route.continue()` immediately); fill a unique text, `dblclick` `note-submit`; release the gate (`route.continue()`); wait for the 201; assert the recorded POST count is 1 and `getByTestId("note-list").getByText(text)` has count 1; reload and assert count 1 again (only one stored).
  - (2) edge case: same hold, click `note-submit` then press Enter in `note-input`; one POST, one list item.
  - (3) criterion 2: save a unique text, wait for the 201, save the same text again; two POSTs and two list items with that text.
  - No hardcoded waits: the hold is released by the test explicitly, never by a timeout.
  - Directory: `e2e/tests/`
  - File: `BUG-04_double_submit_note.spec.ts`
- UAT scenarios: one scenario per criterion plus the click-then-Enter edge case.
  - Directory: `e2e/uat/scenarios/` (Gherkin) and `e2e/uat/scripts/` (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A rapid double submit sends one POST, stores one note, shows it once | E2E | — (the defect is a browser interaction race; unit tests in NoteForm.test.tsx cover the guard logic too) |
| 2 | After a save finishes (success or error) the next submit is accepted: a deliberate repeat is stored, a failure can be retried | Unit | verifying it needs no navigation: it is the guard's reset in the component, asserted with a controlled resolved and rejected promise in NoteForm.test.tsx (the deliberate-repeat path also runs in E2E test 3, the retry-after-failure path is only deterministic in a component test) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Rapid double submit stores one note | Hold the first POST via `page.route`, `dblclick` "Save note" (and click plus Enter), release, assert one POST and one list item, reload and assert one | Given the landing page is open When I type a note and double-click "Save note" Then the note appears once in the list and once after a reload |
| 2 | Next submit is accepted after the save finishes | covered at Unit, see Criterion coverage; E2E test 3 also saves the same text twice deliberately | Given I saved "Buy milk" When I type "Buy milk" again and click "Save note" Then the list shows "Buy milk" twice |

## Manual verification plan
### Criterion 1: A rapid double submit stores the note once
Prerequisites: the stack is running from the repository root with `docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010). A local save answers in milliseconds, so the check slows it down rather than racing it.
1. Open `http://localhost:5183/` in Chrome → the "Task Notes" heading, the "New note" field, the "Save note" button and the note list are visible.
2. Open DevTools → Network and set throttling to `Slow 3G` → the throttling menu reads Slow 3G.
3. Type `Double click check 1` in the "New note" field and double-click "Save note" quickly → the button greys out (disabled) right after the first click and stays so while the request is pending.
4. Wait for the request to finish → the Network list shows exactly one `POST` to `http://localhost:8010/api/notes` (status 201), the field is empty, the button is enabled again, and the list shows `Double click check 1` once.
5. Type `Double click check 2`, click "Save note" and immediately press Enter in the field → after the request finishes, one more `POST` (two in total for this walkthrough) and `Double click check 2` appears once.
6. Set throttling back to `No throttling` and reload the page → `Double click check 1` and `Double click check 2` each appear exactly once in the list.

### Criterion 2: After a save finishes, the next submit is accepted
Prerequisites: as for criterion 1, throttling off.
1. On `http://localhost:5183/`, type `Buy milk` and click "Save note" → `Buy milk` appears in the list and the field clears.
2. Type `Buy milk` again and click "Save note" → a second `Buy milk` entry appears; the list now shows it twice (identical texts are not merged).
3. In a terminal at the repository root run `docker compose stop backend`, then type `Retry me` and click "Save note" → the message "The note could not be saved. Please try again." appears, the field still reads `Retry me`, and the "Save note" button is enabled.
4. Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/notes` answers, then click "Save note" → the error message disappears and `Retry me` appears once in the list.
5. The deterministic checks are in the component tests: from the repository root run `npm --prefix frontend exec --no -- vitest run src/components/NoteForm.test.tsx` → the run reports `0 failed`, running `NoteForm.test.tsx` (double click, disabled while saving, retry after failure, deliberate second save).
