# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m carries no description: its description and text content are empty. The acceptance criteria below are derived from the title; see Re-Plan Feedback.)

## Acceptance Criteria
- [ ] Submitting the same note twice in quick succession (a double-click on "Save note", or Enter followed by a click) while the first save is still pending sends exactly one create request, so the note is stored once.
- [ ] After a quick double submit, the saved note appears exactly once in the note list on the landing page.
- [ ] Once the pending save finishes, successfully or with an error, the form accepts the next submission again (the "Save note" button is enabled and a further note can be saved).

## Re-Plan Feedback
- Comment (tracker): 18 comments on the item, all the framework's own "PR opened" notices from earlier runs whose product a reset removed from main → not acted on because none carries stakeholder feedback about the defect (relayed by the dispatching session, which read them; this planner did not see their text).
- Assumption (no description): the item has an empty description, so the acceptance criteria are derived from the title alone. "Twice quickly" is read as a second submit of the same form while the first `POST /api/notes` is still in flight, which is the only window in which the current code can send two requests for one note: `NoteForm.handleSubmit` clears the input only after `createNote` resolves, so a second submit inside that window re-sends the same text.
- Assumption (fix location): the fix is client-side, in `NoteForm`, by ignoring a submit while a save is in flight and disabling the submit button for that window. A server-side idempotency key or uniqueness constraint on note text is not planned: two deliberately separate saves of the same text remain legitimate notes, and nothing in the item asks for de-duplication of stored data (user_story_alignment.md, scope containment). Criterion 3 exists only so the guard cannot lock the form after a failure, which is the regression the fix itself could introduce.
- Merged since the last plan: n/a (fresh plan, the plan base is 86dda155 on main).

## Plan Overview
A frontend-only defect fix in `frontend/src/components/NoteForm.tsx`. The form gains an in-flight flag: while `createNote` is pending, further submits return immediately without a request, and the "Save note" button carries the native `disabled` attribute. The flag is cleared in a `finally` block, so success and failure both re-open the form. A `useRef` guard backs the state flag, so two submit events dispatched before React re-renders still see the first save as in flight. No backend, API contract or dependency change. Coverage: Vitest unit tests in `NoteForm.test.tsx` (these carry the reproduction) plus one Playwright spec for the browser double-click.

Reproduction (fix Section R1): `- Repro: local-automated: npm --prefix frontend test -- src/components/NoteForm.test.tsx (source: item)`. The new test "sends one create request when the form is submitted twice while the first save is pending" holds `createNote` on an unresolved promise, submits twice, and asserts one call; on the current code it fails with two calls (vitest exit 1), and passes after the fix. Write that test first and run the `before` phase before touching `NoteForm.tsx`.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify). Add `const [isSaving, setIsSaving] = useState(false)` and `const savingRef = useRef(false)`. In `handleSubmit`, after `event.preventDefault()`, return immediately when `savingRef.current` is true. After the empty-note validation passes, set `savingRef.current = true` and `setIsSaving(true)`, then run the existing `try`/`catch` and add `finally { savingRef.current = false; setIsSaving(false); }`. The submit button gets `disabled={isSaving}`. The empty-note path is untouched: it sends no request and never enters the in-flight state. The input stays editable while saving (nothing asks otherwise).
- Routes: none.
- State management: local component state plus a ref, as above; `LandingPage` and its `onCreated` wiring are unchanged.
- Design reference notes: AI freestyle. The existing `buttonStyle` is kept; the disabled state adds `cursor: "not-allowed"` and `opacity: 0.6` while `isSaving` is true, as inline style alongside the existing ones.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form keeps calling the existing endpoint:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

The fix changes only how many times the client calls it for one user action.

## Technology Selection
- Double-submit guard: chose the native `disabled` attribute on the existing `<button type="submit">` plus React's `useState` and `useRef` (React is installed) over a debounce or throttle helper or a new dependency, because the defect is a pending-request window, not a timing window, and the platform's disabled button already blocks clicks and implicit Enter submission for exactly that window.
- No new dependency, component or module is introduced; the e2e spec uses the installed `@playwright/test`.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser spec that double-clicks "Save note" with the create response held, and asserts one POST and one list item
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus one edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus state), `finally` reset, `disabled` on the submit button with its disabled style
- [A] frontend/src/components/NoteForm.test.tsx: reproduction test plus the unit tests for criteria 1 and 3

No dependency manifest changes, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` behaviour with `createNote` mocked (the file's existing `vi.mock("../api/notes")`), using a deferred promise to keep a save pending.
  - Directory: frontend/src/components/ (the project's co-located Vitest convention; the backend unit directory does not apply to frontend code)
  - Naming: NoteForm.test.tsx (existing file)
  - Cases: (a) reproduction: two submits while pending, `createNote` called once; (b) Enter-style second submit via `fireEvent.submit` on `note-form` while pending, still one call; (c) the button is disabled while pending and enabled after the save resolves; (d) after a rejected save the button is enabled, the error shows, and a second submit calls `createNote` again; (e) `onCreated` is called exactly once for a double submit. Existing tests stay green unchanged.
- Integration tests: not warranted. No router, service or repository code changes, so there is nothing new to exercise against the database (testing_standards.md Section 6).
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: one spec for criterion 2. `page.route` on `**/api/notes` delays only the POST (then `route.continue()`), so the second click lands inside the pending window deterministically; the spec double-clicks `note-submit` (`dblclick`), records POST requests with the same exact-path matcher TEST-03 uses, waits for the 201, and asserts one POST and exactly one `note-list-item-{id}` carrying the unique text. Edge-case spec: after the held save completes, a second unique note saves normally (button enabled again).
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus the edge case of a failed save re-opening the form.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A quick double submit sends exactly one create request | Unit | Verifying it needs no navigation: it is the form's own submit guard, observed as the number of `createNote` calls on a mocked client with the save held pending; this test is also the reproduction |
| 2 | After a quick double submit the note appears exactly once in the list | E2E | — |
| 3 | After the pending save finishes, successfully or not, the form accepts the next submission | Unit | Verifying it needs no navigation: it is the button's disabled state and a further `createNote` call after a resolved or rejected mock, which the component test observes directly |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | One create request for a quick double submit | covered at Unit, see Criterion coverage | Given the landing page, When I type a note and double-click "Save note", Then only one save request is sent |
| 2 | The note appears once in the list | Hold the POST with `page.route`, `dblclick` the submit button, assert one recorded POST and one `note-list-item-{id}` with the text | Given the landing page, When I double-click "Save note" for a new note, Then the note is listed exactly once |
| 3 | The form accepts the next submission after the save finishes | covered at Unit, see Criterion coverage; the E2E edge-case spec also saves a second note after the held save | Given a save has just finished or failed, When I submit another note, Then it is saved |

## Manual verification plan
### Criterion 1: A quick double submit sends exactly one create request
Prerequisites: the stack is running (`docker compose up`), the app is open at http://localhost:5183, and the browser DevTools Network tab is open, filtered to `notes`, with throttling set to "Slow 3G" so the save stays pending long enough to click twice.
1. On `/`, type `Double click check 1` in the "New note" field → the text is in the field.
2. Double-click "Save note" quickly → the button turns greyed out (disabled) while the save is pending.
3. Look at the Network tab → exactly one `POST /api/notes` request appears, answered 201.
4. Clear the Network tab, type `Enter then click 1` in the field, press Enter and immediately click "Save note" → again exactly one `POST /api/notes` request appears.
5. Set throttling back to "No throttling".

### Criterion 2: After a quick double submit the note appears exactly once in the list
Prerequisites: as for Criterion 1, with "Slow 3G" throttling on.
1. On `/`, type `Shows once 2` in the "New note" field and double-click "Save note" → the button is disabled until the save completes, then the field clears.
2. Read the note list below the form → `Shows once 2` appears exactly once.
3. Reload the page (F5) → after the list loads, `Shows once 2` still appears exactly once, so only one note was stored.

### Criterion 3: After the save finishes, the form accepts the next submission
Prerequisites: the app is open at http://localhost:5183 with no throttling.
1. On `/`, type `First after fix 3` and click "Save note" once → the note appears in the list, the field clears, and "Save note" is enabled again.
2. Type `Second after fix 3` and click "Save note" → this note also appears in the list, once.
3. Stop the backend (`docker compose stop backend`), type `Fails then retries 3`, click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and "Save note" is enabled again.
4. Start the backend (`docker compose start backend`), wait a few seconds, click "Save note" again → the note `Fails then retries 3` appears in the list and the error message disappears.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → expected `0 failed` for NoteForm.test.tsx.
