# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice
>
> (ClickUp task 123k99cx47m. The tracker description is empty and the item carries no dependency link; `depends_on [TEST-03]` comes from `.claude/feature_map.md`. The acceptance criteria below are derived from the title, see `## Re-Plan Feedback`.)

## Acceptance Criteria
- [ ] Submitting the note form twice in quick succession (a double-click on "Save note", or a second click or Enter before the first save has answered) sends exactly one `POST /api/notes` and stores exactly one note, which appears once in the note list.
- [ ] While a save is in flight the "Save note" button is disabled, and it is enabled again once that save settles, on success and on failure, so a later deliberate save (including a retry after a failure, or the same text saved again on purpose) still creates a note.

## Re-Plan Feedback
- Comment (tracker): 8 comments read on the item by the dispatching session, none actionable (all earlier-run PR notices, per `.claude/artifacts/BUG-04/decisions.md`) → Addressed by: not acted on because none states a requirement, a correction or an amendment; no comment text was handed to this dispatch.
- Assumption (empty tracker description): the acceptance criteria are derived from the title alone (`user_story_alignment.md` Section 4, autonomous arm). "Twice quickly" is read as a second submit issued before the first save has answered, which is exactly the window the current `NoteForm` leaves open: `handleSubmit` awaits `createNote` with no in-flight guard, and the submit button stays enabled throughout.
- Assumption (where the fix lives): the duplicate is prevented on the client, in `frontend/src/components/NoteForm.tsx`, not by server-side deduplication. A backend that rejects or merges equal text would also refuse a user who saves the same note twice on purpose, which the title does not ask for, and an idempotency-key contract would be new API surface the item does not request (`user_story_alignment.md` Section 3). Consequence: no backend file changes, so this plan does not collide with TEST-12's notes router, service and repository.
- Fresh plan: an earlier run's merge of this item was reverted by #283, so this plan is written against the plan base 284caaaea083421d09142db759ad7f1b4d5da3d8 as it stands, with no `[merged-since]` lines handed to this dispatch.

## Plan Overview
A frontend-only defect fix in the note form. `NoteForm` gains an in-flight guard: a `useRef` flag that `handleSubmit` checks and sets synchronously before the `await createNote(...)` call, so a second submit dispatched before React re-renders is dropped, plus an `isSaving` state that drives the native `disabled` attribute on the "Save note" button. Both are released in a `finally` block, so success and failure each re-enable the form. Because the button is the form's only submit button, a disabled button also blocks the browser's implicit submission on Enter. No backend, API contract, page wiring (`LandingPage.tsx`) or API client (`frontend/src/api/notes.ts`) change. Tests: Vitest unit tests on `NoteForm`, one Playwright spec for the double-click in the browser, and the UAT artifacts.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify). Add `const isSubmittingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`, after `event.preventDefault()`: return immediately when `isSubmittingRef.current` is true. Keep the existing empty and whitespace validation before the guard is taken (a rejected empty note never marks the form as saving). Then set `isSubmittingRef.current = true` and `setIsSaving(true)`, run the existing `try`/`catch` unchanged, and in a new `finally` set `isSubmittingRef.current = false` and `setIsSaving(false)`. Render the button with `disabled={isSaving}` and `aria-disabled` left to the native attribute. The button keeps `data-testid="note-submit"` and its "Save note" label.
- Routes: none.
- State management: local component state only (`useRef` for the synchronous guard, `useState` for the rendered disabled state). The ref is needed as well as the state because state is read from the render that created the handler: two submit events delivered before a re-render would both see `isSaving === false`.
- Design reference notes: AI freestyle (Design Reference mode NONE). Disabled state of the existing "Save note" button: same `buttonStyle`, plus `opacity: 0.6` and `cursor: "not-allowed"` while `isSaving` is true; every other value unchanged.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged, recorded for the builder's reference (TEST-03's endpoint, consumed through `frontend/src/api/notes.ts`):
- Method: POST
- URL: /api/notes
- Request: `{ "text": "Buy milk" }`
- Response: 201, `{ "id": 7, "text": "Buy milk" }`

The fix changes how many times the client calls it, never its shape.

## Technology Selection
- In-flight submit guard in `NoteForm`: chose React's own `useRef` and `useState` (already installed) over a debounce or throttle helper (`lodash.debounce` is not installed and would need a new dependency), because a time window guesses how long a save takes while an in-flight flag is exact.
- Blocking repeat clicks and Enter: chose the native `disabled` attribute on the existing submit button over a hand-built click interceptor or keydown handler, because a disabled default button already suppresses both the click and the form's implicit submission.
- Duplicate prevention on the server (unique constraint or idempotency key): not chosen, because a database constraint on note text would reject legitimate repeated notes; recorded in `## Re-Plan Feedback`.
- No net-new component, module or dependency is introduced: every entry below modifies an existing file or adds a test or UAT artifact.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec, a double-click on "Save note" sends one POST and shows the note once, also after a reload
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus one edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus state), `disabled` button while saving, released in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the single request on a double submit and for the disabled and re-enabled button

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` with `createNote` mocked (the file's existing `vi.mock("../api/notes", ...)`), driven by a deferred promise the test resolves or rejects by hand so the in-flight window is held open deterministically. Cases: two submits while the first is pending call `createNote` once and `onCreated` once; the button is disabled while pending; the button is enabled again after the promise resolves; the button is enabled again after it rejects and a retry calls `createNote` a second time; after a successful save, saving the same text again calls `createNote` again; an empty submit never disables the button. Existing cases stay as they are.
  - Directory: `frontend/src/components/` (the frontend's co-located Vitest convention; CLAUDE.md's unit directory `backend/tests/unit/` is the backend's)
  - Naming: `NoteForm.test.tsx` (existing file)
- Integration tests: not warranted. Enabled per CLAUDE.md, but the fix touches no repository, model, migration or endpoint (`testing_standards.md` Section 6).
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: one spec for criterion 1. Open `/`, wait for the mount `GET /api/notes` as TEST-03's spec does, hold every `POST /api/notes` in a `page.route` handler until both clicks have been dispatched (a promise the test releases, never a fixed timeout), fill a unique text, `dblclick()` the `note-submit` button, release the route, then assert exactly one POST was recorded (exact path and method match, as TEST-03's `isNotesApiRequest` does), exactly one `note-list-item-*` carries the text, and after `page.reload()` still exactly one. Edge-case spec: a click then an Enter keypress in `note-input` while the save is held also yields one POST.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one Gherkin scenario per criterion plus the click-then-Enter edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A quick double submit sends one POST and stores and shows one note | E2E | — |
| 2 | The button is disabled while a save is in flight and re-enabled when it settles, on success and failure, so a later deliberate save still works | Unit | verifying it needs no navigation: it is component state, observable in Vitest by holding the mocked `createNote` promise open and settling it by hand, which a browser could only approximate with a held route |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | A quick double submit sends one POST and stores and shows one note | Hold the POST with `page.route`, double-click `note-submit`, release, assert one recorded POST, one list item with the text, and one after reload | Given the landing page is open, When I type "Buy milk" and double-click "Save note", Then "Buy milk" appears once in the list and once after a reload |
| 2 | Disabled while saving, re-enabled on success and on failure | covered at Unit, see Criterion coverage | Given the save is slow, When I click "Save note", Then the button is disabled until the note appears, and enabled afterwards |

## Manual verification plan
### Criterion 1: a quick double submit stores one note
Prerequisites: the stack is running (backend on its configured port, frontend at http://localhost:5183), and the browser's developer tools are open on the Network tab filtered to `notes`.
1. Navigate to `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the note list.
2. In the Network tab, set throttling to "Slow 3G" → later requests take a visible moment to answer.
3. Type `BUG-04 double click check` in the "New note" field → the text is in the field.
4. Double-click "Save note" as fast as you can → the button turns greyed out and the cursor shows not-allowed while the save is running.
5. Wait for the list to update → `BUG-04 double click check` appears exactly once in the list, the field is empty, and the Network tab shows exactly one `POST` to `/api/notes` with status 201.
6. Reload the page → `BUG-04 double click check` is still in the list exactly once.
7. Type `BUG-04 enter check` in the field, click "Save note" and immediately press Enter in the field → one `POST` to `/api/notes` in the Network tab, and `BUG-04 enter check` appears once in the list.
8. Set throttling back to "No throttling".

### Criterion 2: the button is disabled while saving and usable again afterwards
Prerequisites: as for criterion 1, throttling set to "Slow 3G".
1. On `http://localhost:5183/`, type `BUG-04 same text` and click "Save note" once → the button is greyed out and cannot be clicked while the request is pending.
2. Wait for the note to appear → `BUG-04 same text` is in the list once and the button is dark and clickable again.
3. Type `BUG-04 same text` again and click "Save note" once → a second `POST` is sent and the list now shows `BUG-04 same text` twice, because a deliberate second save is still allowed.
4. Stop the backend container (or switch the Network tab to "Offline"), type `BUG-04 retry check` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is clickable again.
5. Start the backend again (or set the Network tab back to "No throttling") and click "Save note" → `BUG-04 retry check` appears once in the list and the error message disappears.
6. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → `0 failed`.
