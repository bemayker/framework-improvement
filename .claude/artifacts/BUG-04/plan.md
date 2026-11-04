# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m has no description. The acceptance criteria below are derived from the title; see Assumptions.)

## Acceptance Criteria
- [ ] Clicking "Save note" twice (or double-clicking it) before the first save has finished stores the note only once: exactly one `POST /api/notes` is sent, and the note appears once in the on-page list and once after a page reload.
- [ ] While a save is in progress the "Save note" button is disabled, and it is enabled again once that save succeeds or fails, so the next note, or a retry after an error, can still be saved.

### Assumptions
- The tracker item has no description, so both criteria are derived from the title. The defect is that the TEST-03 note form (`frontend/src/components/NoteForm.tsx`) has no in-flight guard: every submit event while the first `createNote` call is pending sends another `POST /api/notes`.
- The fix is client-side only. A server-side de-duplication (unique text, idempotency key) is not planned: the app legitimately allows two notes with the same text submitted deliberately, and an idempotency key is a new API contract nothing asks for (`user_story_alignment.md` Section 3). The backend, and TEST-12's notes router, service and repository, are therefore untouched.
- Criterion 2 is the minimal observable form of the guard plus a regression floor: re-enabling after a failure keeps TEST-03's existing "error message, text kept, user can retry" behaviour working.
- No new message, spinner or label change while saving; the button label stays "Save note".

## Re-Plan Feedback
- Comment (tracker): 24 comments read by the dispatching session, all the framework's own "PR opened" notices from earlier runs whose code was reset → not acted on because none carries feedback on the item's behaviour or scope.

## Plan Overview
Frontend-only fix in the note form component. `NoteForm` gains an in-flight guard: a `useRef` boolean checked and set synchronously at the top of the submit handler (so a second submit event that arrives before React re-renders is dropped), and an `isSaving` state that drives the submit button's native `disabled` attribute. Both are cleared in a `finally` after `createNote` settles, on success and on failure. No API, backend, schema or `LandingPage` change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` only.
  - Add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`.
  - In `handleSubmit`, after `event.preventDefault()`: if `isSavingRef.current` is true, return immediately (no request, no validation message change). Empty-note validation stays as it is and does not set the guard.
  - Before `await createNote(...)`: set `isSavingRef.current = true` and `setIsSaving(true)`. Wrap the existing try/catch with a `finally` that sets both back to false.
  - Submit button: `disabled={isSaving}`. Style while disabled: `opacity: 0.6`, `cursor: "not-allowed"` merged into `buttonStyle` when `isSaving`, so the disabled state is visible.
  - The input stays editable while saving (unchanged behaviour); the text is still cleared only on success.
- Routes: none.
- State management: local component state plus a ref, as above. `LandingPage`'s `onCreated` append is unchanged; it is now called once per stored note because only one request is sent.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The existing internal contract is used as-is, now called at most once per in-flight save:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight submit guard: chose React's built-in `useRef` and `useState` over a debounce/throttle helper or a new dependency (for example lodash.debounce), because a debounce only narrows the time window while a pending-request flag closes it entirely, and React already ships both hooks.
- Disabled-while-saving button: chose the native `<button disabled>` attribute over a hand-built click-swallowing wrapper, because the platform already blocks clicks and implicit (Enter-key) submission through a disabled default button.
- E2E slow-save simulation: chose Playwright's built-in `page.route` (already installed via `@playwright/test`) over a test-only backend delay endpoint, because it delays the real request in the browser without any application change.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser spec for criterion 1 (double click on a delayed save sends one POST, one list item, one item after reload) plus the edge case of a second distinct note saved after the first completes
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus state), `finally` reset, `disabled` submit button with a visible disabled style
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the guard and the disabled/re-enabled button

No dependency is added or changed, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (existing `vi.mock("../api/notes")` pattern), using a deferred promise so the save stays pending while the test acts:
  - two submits while the first save is pending call `createNote` exactly once, and `onCreated` exactly once after it resolves;
  - the submit button is disabled while the save is pending and enabled again after it resolves;
  - the submit button is enabled again after the save rejects, the error message shows, the text is kept, and a second submit calls `createNote` again (retry works);
  - an empty submit does not disable the button (validation path never sets the guard).
  - Directory: frontend/src/components/ (Vitest, co-located `*.test.tsx`, the existing frontend convention; CLAUDE.md's unit directory and naming apply to the backend)
  - Naming: NoteForm.test.tsx (existing file, extended)
- Integration tests: not warranted. No repository, model, migration or router changes (`testing_standards.md` Section 6); the backend is untouched.
  - Directory: backend/tests/integration/ (no file added)
- E2E tests: criterion 1. Use `page.route` on the exact `POST /api/notes` (pathname match, as TEST-03's spec does, since Vite serves `src/api/notes.ts` under a matching substring) to hold the response for a short, deterministic window (resolve it after both clicks have been dispatched, not after a fixed sleep), `dblclick` the `note-submit` button, record POST requests, assert exactly one, assert one `note-list-item-*` with the unique text, reload and assert the text appears exactly once. Edge case: after the first save completes, a second different note saves normally (one more POST, two items). Unique note text per test (`randomUUID`), no shared state.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (save, then a second different note saves normally).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Clicking "Save note" twice before the first save has finished stores the note only once (one POST, one list item, one item after reload) | E2E | — |
| 2 | The button is disabled while a save is in progress and enabled again after success or failure | Unit | verifying it needs no navigation through the app: it is the form component's own state, observable on the rendered button with the API mocked, and the failure path needs a controlled rejection a browser run cannot produce cheaply |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double submit stores the note once | Delay the `POST /api/notes` response with `page.route`, double-click `note-submit`, assert one recorded POST, one `note-list-item-*` with the text, and one after reload | Given the landing page is open and saving is slow, When I click "Save note" twice quickly, Then the note appears once in the list and once after reloading |
| 2 | Button disabled while saving, re-enabled after success or failure | covered at Unit, see Criterion coverage | Given a save is in progress, When I look at the "Save note" button, Then it is disabled, and When the save finishes, Then it is enabled again |

## Manual verification plan
### Criterion 1: Clicking "Save note" twice before the first save has finished stores the note only once
Prerequisites: the stack is running (frontend at http://localhost:5183, backend at http://localhost:8010); Chrome with DevTools available.
1. Open `http://localhost:5183/` in Chrome → the "Task Notes" page shows the "New note" field, the "Save note" button and the notes list.
2. Open DevTools (F12) → Network tab, set throttling to `Slow 3G` → the throttling dropdown reads "Slow 3G".
3. Type `BUG-04 double click check` in the "New note" field → the text appears in the field.
4. Double-click the "Save note" button quickly → in the Network tab exactly one `notes` request with method `POST` appears.
5. Wait until that request completes → `BUG-04 double click check` appears once in the notes list and the field is empty.
6. Set throttling back to `No throttling` and reload the page (F5) → `BUG-04 double click check` appears exactly once in the list.
7. Open `http://localhost:8010/api/notes` in a new tab → the JSON array holds exactly one object whose `text` is `BUG-04 double click check`.

### Criterion 2: The button is disabled while a save is in progress and enabled again after success or failure
Prerequisites: as for Criterion 1, DevTools Network throttling set to `Slow 3G`.
1. On `http://localhost:5183/`, type `BUG-04 disabled state` in the "New note" field and click "Save note" once → the button turns faded (reduced opacity) and the mouse pointer over it shows "not-allowed" while the request is pending.
2. Wait for the request to complete → the note appears in the list, the field is empty and the "Save note" button is back to full opacity and clickable.
3. In the Network tab, switch throttling to `Offline`, type `BUG-04 offline retry` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and the "Save note" button is enabled again.
4. Switch throttling to `No throttling` and click "Save note" again → `BUG-04 offline retry` appears once in the list and the error message disappears.
5. Run `npm --prefix frontend test -- NoteForm` from the repo root → the NoteForm tests in `frontend/src/components/NoteForm.test.tsx` run with 0 failed.
