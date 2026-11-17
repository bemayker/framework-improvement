# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task carries no description, checklist or dependency; the title is the whole report. The acceptance criteria below are derived from it, see Re-Plan Feedback for the assumptions.)

## Acceptance Criteria
- [ ] Clicking "Save note" twice in quick succession on one note sends a single `POST /api/notes`, and the note is stored and listed exactly once (also after a page reload).
- [ ] While a save is in progress the "Save note" button is disabled, and a second submit (click or Enter in the field) is ignored.
- [ ] Once the save finishes, successfully or not, the button is enabled again: after a success the next note can be saved, and after a failure the kept text can be retried.

## Re-Plan Feedback
- Comment (tracker): every comment on ClickUp task 123k99cx47m is a framework "PR opened" notice from earlier runs → not acted on because none carries feedback on the item's scope or behaviour.
- Comment (tracker): the task has no description → Addressed by: acceptance criteria derived from the title. Assumption 1: "saving twice quickly" means a double submit of the same form entry from the UI (double click or a repeated Enter before the first request answers), which is the only path in this app that issues two creates for one entry; the fix is therefore a client-side in-flight guard in `NoteForm`.
- Assumption 2 (scope): no server-side deduplication or idempotency key. Two separate notes with identical text, saved deliberately one after another, remain legal; a server rule refusing duplicates would change TEST-03's contract and is not asked for (`user_story_alignment.md` Section 3).
- Assumption 3 (scope): the button's label stays "Save note" while disabled; no spinner or "Saving..." text is added, since the criterion is that the second submit is ignored, not a new progress indicator.
- Merged since the last plan: n/a (fresh plan; no previous plan artifact exists, planned against main at 2410428f).

## Plan Overview
A frontend-only fix in `frontend/src/components/NoteForm.tsx`. `handleSubmit` currently awaits `createNote` with no guard, so a second submit event fired before the first response arrives runs a second `createNote` call. The fix adds an in-flight guard: a `useRef<boolean>` checked and set synchronously at the top of `handleSubmit` (after the empty-note check), so even two submit events dispatched in the same tick before React re-renders cannot both pass, plus an `isSaving` state that sets the native `disabled` attribute on the submit button so the user sees the form is busy and implicit submission via Enter is suppressed. Both are reset in a `finally` block, so success and failure both re-enable the form. No backend, API client or LandingPage change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard: `isSubmittingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`; in `handleSubmit`, after the empty-note early return: `if (isSubmittingRef.current) return;` then set the ref and `setIsSaving(true)`; wrap the existing try/catch so a `finally` resets the ref to false and calls `setIsSaving(false)`; the submit `<button>` gets `disabled={isSaving}` and, while disabled, `cursor: "not-allowed"` and `opacity: 0.6` merged over `buttonStyle`). The empty-note validation path is unchanged and never sets the guard.
- Routes: none (landing page `/` as today).
- State management: local component state (`useState` for the rendered disabled flag) plus a `useRef` for the synchronous re-entrancy check; no new shared state, `LandingPage.onCreated` is still called once per stored note.
- Design reference notes: AI freestyle (Design Reference mode NONE). Disabled Save button: existing `buttonStyle` values unchanged, plus `opacity 0.6` and `cursor not-allowed` while a save is in progress.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; the existing TEST-03 endpoint is called at most once per form submission.
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard: chose React's own `useRef` and `useState` (already installed) over a debounce/throttle utility or a new dependency (lodash.debounce), because a debounce delays the first save and still lets a slow response be overtaken, while a ref closes the window exactly for the request's lifetime.
- Disabled state: chose the native `disabled` attribute on the `<button type="submit">` (native platform feature, which also suppresses implicit Enter submission) over a custom click-blocking overlay or `pointer-events` CSS.
- No net-new dependency, module or component is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser regression spec, double-click on Save sends one POST and the note is listed once after reload
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios for the three criteria plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus isSaving state), disabled submit button while saving, reset in finally
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the single request on a double submit, the disabled state, and re-enabling after success and failure

No dependency changes, so no lockfile is regenerated. README.md and docs/DEVELOPMENT.md need no edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (vitest + Testing Library), using a deferred promise so the save stays in flight while the second submit fires.
  - Directory: co-located, frontend/src/components/ (project-standards.md Naming: co-located {Name}.test.tsx)
  - Naming: NoteForm.test.tsx (existing file, new `it` cases)
- Integration tests: not warranted. The backend router, service and repository are unchanged, so `testing_standards.md` Section 6's repository and endpoint questions answer no; the existing `backend/tests/integration/test_notes_integration.py` keeps covering `POST /api/notes`.
- E2E tests: one browser regression spec for criterion 1, since the defect is the browser's double-click reaching the backend twice.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts. Reuse the TEST-03 spec's approach (exact path and method matching on `/api/notes`, a unique note text per test via `randomUUID`, waiting for the mount GET before interacting). Record POST requests with `page.on("request")`, `dblclick()` the `note-submit` button after filling `note-input`, await the 201 response, assert exactly one POST was recorded and exactly one list item carries the text, then reload and assert still exactly one. No fixed timeouts.
- UAT scenarios: one scenario per criterion plus an edge case (pressing Enter twice in the field).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A quick double click on "Save note" sends one POST and the note is stored and listed once, also after reload | E2E | `double-clicking Save stores and lists the note exactly once`, `sends a single create request when the form is submitted twice before the save finishes` | — |
| 2 | While a save is in progress the button is disabled and a second submit is ignored | Unit | `disables the save button while a save is in progress`, `ignores a second Enter submit while a save is in progress` | verifying it needs no navigation: it is component state observable with a mocked pending `createNote` in Testing Library |
| 3 | After the save finishes, successfully or not, the button is enabled again and a next save or retry works | Unit | `re-enables the save button after a successful save`, `re-enables the save button after a failed save so the note can be retried` | verifying it needs no navigation: it is the component's reset of its own state after the mocked promise settles |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double click stores the note once | Fill a unique note, `dblclick()` on `note-submit`, count POSTs (expect 1) and list items with the text (expect 1), reload, count again | Given the landing page is open, When I type a note and double-click "Save note", Then the note appears once in the list and still once after reload |
| 2 | Button disabled while saving, second submit ignored | covered at Unit, see Criterion coverage | Given a save is in progress, When I press Enter again, Then the button is disabled and no second note appears |
| 3 | Button re-enabled after success or failure | covered at Unit, see Criterion coverage | Given a save has finished, When I type another note and click "Save note", Then it is saved; Given the backend is down, When the save fails, Then the button is enabled and my text is kept |

## Manual verification plan
### Criterion 1: Clicking "Save note" twice quickly stores the note once
Prerequisites: backend, database and frontend running (frontend on http://localhost:5183); browser devtools Network tab open and filtered on `notes`.
1. Open `http://localhost:5183/` → the "Task Notes" landing page shows the "New note" field, the "Save note" button and the note list.
2. Type `Double click check 1` in the "New note" field → the text is in the field.
3. Double-click "Save note" as fast as you can → the Network tab shows exactly one `POST /api/notes` with status 201; the field empties; "Double click check 1" appears once in the list.
4. Reload the page → after the list loads, "Double click check 1" is listed exactly once.

### Criterion 2: The button is disabled while a save is in progress
Prerequisites: as for Criterion 1; in devtools Network, set throttling to "Slow 3G" so the save stays in flight long enough to observe.
1. Open `http://localhost:5183/` → the landing page loads (slowly).
2. Type `Slow save check` in the "New note" field and click "Save note" once → the button turns greyed out (disabled, not-allowed cursor) while the request is pending.
3. While it is still greyed out, click the field and press Enter, then click the button again → nothing happens; the Network tab still shows a single `POST /api/notes`.
4. Wait for the request to finish → "Slow save check" appears once in the list.
5. Set throttling back to "No throttling".

### Criterion 3: The button is enabled again after a save finishes
Prerequisites: as for Criterion 1.
1. Open `http://localhost:5183/`, type `First after fix`, click "Save note" → the note is listed and the button is enabled again (full colour, pointer cursor).
2. Type `Second after fix`, click "Save note" → the note is listed below "First after fix"; one POST per note in the Network tab.
3. Stop the backend container (or in devtools Network, enable "Offline"), type `Retry me`, click "Save note" → the red message "The note could not be saved. Please try again." appears, the field still reads `Retry me`, and the button is enabled.
4. Start the backend again (or disable "Offline") and click "Save note" → "Retry me" is listed once and the error message disappears.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → the run passes: no failed or errored test on its summary line, exit code 0.
