# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice. (ClickUp task 123k99cx47m, defect. The tracker item carries no description, no checklist and no acceptance criteria; the criteria below are derived from the title, see Re-Plan Feedback.)

## Acceptance Criteria
- [ ] 1. Double-clicking "Save note" with a non-empty note stores that note exactly once: one `POST /api/notes` is sent, and the note appears once in the list and once after a page reload.
- [ ] 2. While a save is in flight, the "Save note" button is disabled and any further submit of the form (a click or pressing Enter in the field) sends no additional request.
- [ ] 3. Once the in-flight save finishes, successfully or with an error, the "Save note" button is enabled again so another note can be saved.

## Re-Plan Feedback
- Comment (tracker): earlier runs' bot "PR opened" notes only → Addressed by: not acted on because they carry no requirement or correction; no stakeholder comment exists on the item.
- Assumption (tracker item has no description or acceptance criteria): the three criteria above are derived from the title alone. The defect is reproduced from the code at f52ff89: `frontend/src/components/NoteForm.tsx` `handleSubmit` awaits `createNote` with no in-flight guard and the submit button is never disabled, so a second click before the first response arrives sends a second `POST /api/notes` and the backend stores both. The fix is the minimal client-side one: an in-flight guard plus a disabled button in `NoteForm`. Server-side deduplication (an idempotency key or a uniqueness constraint on note text) is out of scope: two identical notes saved deliberately are legitimate, and nothing in the title asks for a backend change. No "Saving..." label or spinner is added (scope containment).
- Merged since the last plan: n/a (fresh plan, read at main f52ff89, no prior BUG-04 plan exists).

## Plan Overview
Frontend-only fix in one component. `NoteForm` gains an `isSaving` state that disables the submit button while `createNote` is pending, plus a `useRef` flag checked at the top of `handleSubmit` so a second submit event that reaches the handler before React re-renders (a double-click, or Enter pressed in the field) returns without sending a request. The flag and the state are cleared in a `finally` block so both the success and the failure path re-enable the form. No backend, API-contract, routing or `LandingPage` change. Overlap with concurrent TEST-08 is none: TEST-08 edits `frontend/src/api/notes.ts`, `AppFooter.tsx`, `AppFooter.test.tsx` and `LandingPage.test.tsx`, none of which this plan touches.

## Frontend Plan
- Components to create/modify: modify `frontend/src/components/NoteForm.tsx` only. Add `const [isSaving, setIsSaving] = useState(false)` and `const savingRef = useRef(false)`. In `handleSubmit`, after `event.preventDefault()`: if `savingRef.current` is true, return immediately (no validation message change, no request). Keep the existing empty and whitespace validation before the guard is set. Then set `savingRef.current = true` and `setIsSaving(true)`, call `createNote` inside the existing `try`/`catch`, and add `finally { savingRef.current = false; setIsSaving(false); }`. The submit button gets `disabled={isSaving}`; its style keeps the current values and adds `cursor: "not-allowed"` and `opacity: 0.6` only while disabled, so the disabled state is visible. The `data-testid`s (`note-form`, `note-input`, `note-submit`, `note-form-error`) and all existing messages are unchanged.
- Routes: none.
- State management: local component state (`useState`) for the rendered disabled state and a `useRef` for the synchronous guard; no new store, no change to `LandingPage`'s `onCreated` wiring.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged, existing internal endpoint consumed through `frontend/src/api/notes.ts` `createNote`:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

The fix only changes how many times the client calls it per user action (once).

## Technology Selection
- In-flight submit guard: chose React's own `useRef` and `useState` (already installed) plus the native `disabled` attribute on the `<button>` over a debounce/throttle utility or a new form library, because the native disabled button also blocks implicit form submission from the field and a ref covers the window before re-render; no new dependency.
- No other net-new component, module or dependency is introduced; the E2E spec and UAT artifacts use the installed Playwright and the existing directory conventions.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec, a double-click on "Save note" stores and shows the note once.
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case.
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan.
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (`useRef`), `isSaving` state, `disabled` submit button, `finally` reset.
- [A] frontend/src/components/NoteForm.test.tsx: Vitest cases for the in-flight guard and the re-enable on success and on failure.

No dependency changes, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (pending promise held open by the test, then resolved or rejected): one request for two submits in flight, button disabled while pending, button enabled after success and after failure. Existing NoteForm cases stay as they are and must keep passing.
  - Directory: frontend/src/components/ (co-located, per project layout)
  - Naming: NoteForm.test.tsx
- Integration tests: no backend code changes, so no integration test is warranted; the existing `backend/tests/integration/test_notes_integration.py` keeps covering `POST /api/notes`.
  - Directory: backend/tests/integration/
- E2E tests: double-click "Save note" on the landing page with the `POST /api/notes` held by `page.route` until both clicks have been dispatched (then `route.continue()` to the real backend, so the UI and the backend are both exercised), assert exactly one POST was issued, one list item with the unique text, and one after `page.reload()`. Also an edge-case spec: after the save completes, a second distinct note can be saved.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one per criterion plus the edge case "a second distinct note can be saved after the first completes".
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | Double-clicking "Save note" stores the note exactly once (one POST, one list entry, one after reload) | E2E | `stores a note once when Save note is double-clicked` | — |
| 2 | While a save is in flight the button is disabled and further submits send no request | Unit | `disables the save button while a save is in flight`, `sends one request when the form is submitted twice while a save is in flight` | verifying it needs no navigation: it is the component's own guard, and a held mock promise makes the in-flight window deterministic, which a real browser round-trip cannot |
| 3 | After the save finishes, successfully or with an error, the button is enabled again | Unit | `re-enables the save button after a successful save`, `re-enables the save button and keeps the text after a failed save` | verifying it needs no navigation: it is a component state transition on promise settle, and the failure path needs a rejected request a real backend does not produce on demand |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double-click stores the note once | Hold `POST /api/notes` with `page.route`, `dblclick()` on `note-submit`, release, count POSTs (1), count `note-list-item-*` with the text (1), reload and count again (1) | Given the landing page is open, When I type a note and double-click Save note, Then the note appears once and still once after reload |
| 2 | Button disabled and no extra request while in flight | covered at Unit, see Criterion coverage | Given a save is in flight, When I look at Save note and press Enter in the field, Then the button is disabled and no second note is created |
| 3 | Button enabled again after the save finishes | covered at Unit, see Criterion coverage | Given a save has just finished, When I type another note and click Save note, Then it is saved |

## Manual verification plan
### Criterion 1: Double-clicking "Save note" stores the note exactly once
Prerequisites: backend running at http://localhost:8010 and frontend at http://localhost:5183 (docker compose up), browser devtools Network tab open and filtered on `notes`.
1. Navigate to `http://localhost:5183/` → the "Task Notes" title, the "New note" field and the "Save note" button are visible; the Network tab shows one `GET /api/notes`.
2. Enter `Double click check 1` in the "New note" field → the text is in the field.
3. Double-click "Save note" quickly → exactly one `POST /api/notes` row appears in the Network tab (status 201), the field clears, and `Double click check 1` appears once in the list.
4. Reload the page → `Double click check 1` appears exactly once in the list.
5. To make the window wider, set devtools throttling to "Slow 3G", repeat steps 2 to 4 with `Double click check 2` → still one POST and one list entry.

### Criterion 2: While a save is in flight the button is disabled and further submits send nothing
Prerequisites: as Criterion 1, devtools network throttling set to "Slow 3G" so the save stays in flight for a few seconds.
1. Navigate to `http://localhost:5183/` → the form is visible and "Save note" is enabled.
2. Enter `In flight check` in the "New note" field and click "Save note" once → the button turns greyed out (disabled, not-allowed cursor) while the `POST /api/notes` row is pending.
3. While it is still pending, click "Save note" again and press Enter in the field → nothing happens; the Network tab still shows a single `POST /api/notes`.
4. Wait for the POST to finish → `In flight check` appears once in the list.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → the run passes: no failed or errored test on its summary line, exit code 0.

### Criterion 3: After the save finishes the button is enabled again
Prerequisites: as Criterion 1.
1. Navigate to `http://localhost:5183/`, enter `First after fix`, click "Save note" → the note appears in the list and "Save note" is enabled again (normal colour, pointer cursor).
2. Enter `Second after fix`, click "Save note" → it is saved and appears below `First after fix`.
3. Stop the backend (`docker compose stop backend`), enter `Fails to save`, click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and "Save note" is enabled again.
4. Start the backend (`docker compose start backend`), click "Save note" → `Fails to save` is saved once and appears in the list.
