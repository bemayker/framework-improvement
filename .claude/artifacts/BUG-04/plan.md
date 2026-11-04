# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice
>
> (Tracker task 123k99cx47m. The item description is empty; the acceptance criteria below are derived from the title and the current code, with every assumption recorded under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] Double-clicking "Save note" (two clicks in quick succession) with a non-empty note sends exactly one `POST /api/notes`, stores exactly one note, and the list shows that note once.
- [ ] While a save is in flight, the "Save note" button is disabled, and a further click or Enter press in the field sends no additional `POST /api/notes`.
- [ ] Once the in-flight save finishes, successfully or with an error, the "Save note" button is enabled again, so the next note (or a retry after a failure) can be saved.

## Re-Plan Feedback
- Comment (tracker): 23 comments on task 123k99cx47m, all framework "PR opened" notes from earlier runs → not acted on because none states a requirement or correction for this defect (counted by the /deliver session and recorded in `.claude/artifacts/BUG-04/decisions.md`).
- Assumption (empty description): "twice quickly" means a repeated submit of the same form while the first `POST /api/notes` is still pending (double-click, or click then Enter). Root cause read in `frontend/src/components/NoteForm.tsx`: `handleSubmit` has no in-flight state, the button is never disabled, and the input is cleared only after the request resolves, so the second submit still sees the same text and issues a second POST.
- Assumption (fix location): the fix is client-side only, an in-flight guard in `NoteForm`. No backend de-duplication or idempotency key is added: two deliberate, separate saves of the same text remain two notes, which is the existing behaviour TEST-03 established, and server-side de-duplication would be unrequested scope (`user_story_alignment.md` Section 3). The feature map's note about TEST-12 overlapping "if the fix is server-side" therefore does not apply.
- Assumption (no visible label change): the disabled button keeps the label "Save note"; no spinner or "Saving..." text is added, since the defect asks only that the note not be stored twice.
- Scheduler note (dispatch): TEST-10 is planned concurrently around `AppFooter.tsx`, `api/version.ts` and `LandingPage.test.tsx` → this plan touches none of them; `LandingPage.tsx` and `LandingPage.test.tsx` are not modified because `NoteForm` owns the submit and its `onCreated` contract is unchanged.

## Plan Overview
A frontend-only defect fix in `NoteForm`. Add an in-flight guard: a `useRef` boolean checked and set synchronously at the top of the submit path (so two submit events dispatched before React re-renders cannot both pass), mirrored into a `isSaving` state that sets the native `disabled` attribute on the submit button. The guard is released in a `finally` block so both success and failure re-enable the form. No backend, API contract or dependency change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` — add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`, after `event.preventDefault()`, return early when `isSavingRef.current` is true. Keep the existing empty and whitespace validation before the guard is taken (a rejected empty note never disables the button). Before calling `createNote`, set `isSavingRef.current = true` and `setIsSaving(true)`; wrap the existing try/catch in `try { ... } finally { isSavingRef.current = false; setIsSaving(false); }`. Add `disabled={isSaving}` to the submit button. Existing success behaviour (clear input, clear error, call `onCreated`) and failure behaviour (keep text, show `SAVE_FAILED_MESSAGE`) are unchanged. The input stays editable while saving.
- Routes: none.
- State management: local component state plus a ref, as above; nothing lifted into `LandingPage`.
- Design reference notes: AI freestyle (Design Reference mode NONE). The disabled button reuses the existing `buttonStyle`; add only `cursor: "not-allowed"` and `opacity: 0.6` when `isSaving` is true, so the disabled state is visible.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
No change. The existing contract is used as is:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201 with `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard: chose React's built-in `useRef` and `useState` plus the native `disabled` attribute on the existing `<button type="submit">` over a debounce helper or a new form library (no dependency added), because the platform's disabled button already blocks further clicks and implicit Enter submission once rendered, and the ref covers the window before the re-render.
- No net-new component, module or dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser spec proving a double-click on "Save note" sends one POST and stores one note
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus state), disabled submit button while saving, released in finally
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the guard, the disabled state and re-enabling after success and failure

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked to a promise the test resolves or rejects by hand: two rapid submits call `createNote` once; the button is disabled while pending; Enter (form submit) while pending makes no second call; the button is enabled again after resolve and after reject; an empty-note rejection does not disable the button. Existing six tests keep passing unchanged.
  - Directory: frontend/src/components/ (Vitest co-located `*.test.tsx`, the project's existing frontend convention; the backend unit directory backend/tests/unit/ is not touched)
  - Naming: `NoteForm.test.tsx`, test names stating scenario and outcome
- Integration tests: none warranted: no router, repository, model or migration changes (`testing_standards.md` Section 6). Enabled per CLAUDE.md, nothing to add.
  - Directory: backend/tests/integration/
- E2E tests: the defect itself. Open `/`, wait for the mount `GET /api/notes`, hold the first `POST /api/notes` with `page.route` on a promise the test releases (no fixed timeouts), fill a unique note text, `dblclick` the `note-submit` button, assert the button is disabled while held, release, then assert exactly one POST was recorded, exactly one `note-list` item carries that text, and after `page.reload()` still exactly one. Reuse the exact-pathname matcher pattern from `e2e/tests/TEST-03_simple_note_form.spec.ts` (copied locally into the spec, since that spec exports nothing).
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (failed save then retry stores one note).
  - Directory: e2e/uat/scenarios/ (scripts in e2e/uat/scripts/)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Double-clicking "Save note" sends one POST, stores one note, list shows it once | E2E | — |
| 2 | Button disabled while a save is in flight; further click or Enter sends no extra POST | Unit | verifying it needs no navigation: it is component state, checked with a held `createNote` promise in `NoteForm.test.tsx` (the E2E for criterion 1 also asserts disabled as a side check) |
| 3 | Button enabled again after the save finishes, success or error | Unit | verifying it needs no navigation: resolve and reject of a mocked `createNote` exercise both paths deterministically, which a browser cannot do without forcing a server error |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double-click stores one note | Hold POST via `page.route`, `dblclick` submit, release; assert one POST recorded, one list item with the text, still one after reload | Given the landing page is open When I type a note and double-click "Save note" Then the note appears once in the list and once after reload |
| 2 | Disabled while saving | covered at Unit, see Criterion coverage | Given a save is in progress When I look at "Save note" Then it is disabled and pressing Enter adds nothing |
| 3 | Enabled after save finishes | covered at Unit, see Criterion coverage | Given a save has just finished When I type another note Then "Save note" is enabled and saves it |

## Manual verification plan
### Criterion 1: Double-clicking "Save note" stores exactly one note
Prerequisites: the stack is running (frontend at http://localhost:5183, backend and PostgreSQL up); browser devtools Network tab open and filtered to `notes`.
1. Navigate to `http://localhost:5183/` → the "Task Notes" heading, the "New note" field and the "Save note" button are shown, with the existing notes listed below.
2. Type `Double click check 1` in the "New note" field → the text appears in the field.
3. Double-click "Save note" as fast as possible → the field clears and `Double click check 1` appears once at the bottom of the list.
4. In the Network tab, count requests with method POST to `/api/notes` → exactly one, status 201.
5. Reload the page → `Double click check 1` is listed exactly once.

### Criterion 2: "Save note" is disabled while a save is in flight
Prerequisites: as Criterion 1; in devtools Network, set throttling to "Slow 3G" so the save stays pending for a few seconds.
1. On `http://localhost:5183/`, type `Slow save check` in the "New note" field → text appears.
2. Click "Save note" once → the button turns greyed out and cannot be clicked; the POST to `/api/notes` shows as pending.
3. While it is pending, click "Save note" again, then click into the field and press Enter → nothing new happens; the Network tab still shows a single POST to `/api/notes`.
4. Wait for the POST to complete → `Slow save check` appears once in the list.
5. Set throttling back to "No throttling".

### Criterion 3: "Save note" is enabled again after the save finishes
Prerequisites: as Criterion 1.
1. On `http://localhost:5183/`, type `First after fix` and click "Save note" → the note appears in the list, the field clears, and the button is no longer greyed out.
2. Type `Second after fix` and click "Save note" → it saves and appears once below `First after fix`.
3. Failure path: in devtools Network, enable "Offline". Type `Offline retry` and click "Save note" → the message "The note could not be saved. Please try again." appears, `Offline retry` stays in the field, and the button is enabled again.
4. Disable "Offline" and click "Save note" → the error message disappears and `Offline retry` appears once in the list.
5. Automated check: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → `0 failed`.
