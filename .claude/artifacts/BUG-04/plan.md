# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m has an empty description; the title is the whole feature text. Acceptance criteria below are derived from the title, see Re-Plan Feedback.)

## Acceptance Criteria
- [ ] Clicking "Save note" twice in quick succession stores the note once: the list shows it once, and it is still shown once after a page reload.
- [ ] While a save is in progress, the "Save note" button is disabled and a further submit of the form (a second click or pressing Enter) sends no second save request.
- [ ] Once the save completes or fails, the "Save note" button is enabled again, so the next note can be saved or a failed save retried.

## Re-Plan Feedback
- Comment (tracker): 19 comments read on the ClickUp task, all mayker-dev automation notices from earlier runs; none carries product feedback → Addressed by: not acted on because none states a requirement or a correction.
- Comment (tracker): no description on the task (verified at plan time: `description` is empty) → Addressed by: assumption recorded here. The three acceptance criteria are derived from the title alone: the defect is a double submit from the note form (TEST-03), so the fix is that one rapid double submit produces one stored note, the form blocks re-submission while a save is in flight, and the form is usable again afterwards.
- Assumption (no comment source): the fix is client-side only. A server-side dedupe was considered and rejected: rejecting a second note with identical text would also reject a user who deliberately saves the same text twice, and an idempotency key would change the POST /api/notes contract and need a schema change, both outside "keep every feature as small as possible" (CLAUDE.md Architecture Notes). Residual risk, stated rather than hidden: a non-browser client can still post the same note twice; that is not this defect.
- Merged since the last plan: n/a (fresh plan, branched from current main 20e3ddd).

## Plan Overview
Frontend-only fix in `NoteForm`. The form gains an in-flight guard: a `useRef` boolean checked at the top of `handleSubmit` (so a second submit event dispatched before React re-renders is still ignored) plus an `isSaving` state that disables the submit button while the request is pending. Both are reset in a `finally` block, so success and failure both re-enable the form. No backend, API, schema or dependency change. Tests: Vitest component tests for criteria 2 and 3, one Playwright spec for criterion 1, plus the UAT artifacts.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` only.
  - Add `const savingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`.
  - In `handleSubmit`, after `event.preventDefault()`: `if (savingRef.current) return;`. Keep the existing empty/whitespace validation before the guard is set, so a blank submit still shows the validation message and never disables the button.
  - After validation passes: set `savingRef.current = true` and `setIsSaving(true)`, then run the existing `try { await createNote(...) ... } catch { ... }`, and add `finally { savingRef.current = false; setIsSaving(false); }`. Existing success behaviour (clear input, clear error, call `onCreated`) and failure behaviour (show `SAVE_FAILED_MESSAGE`, keep the text) are unchanged.
  - Button: add `disabled={isSaving}`, and a disabled visual state: `opacity: 0.6`, `cursor: "not-allowed"` merged into `buttonStyle` when `isSaving` is true. Label stays "Save note" (no "Saving..." text: not asked for).
- Routes: none.
- State management: local component state plus one ref, as above. `LandingPage.tsx` is not touched: its `onCreated` append is correct once `onCreated` fires once per stored note.
- Design reference notes: AI freestyle (Design Reference mode NONE). Disabled submit button: existing button values (padding 0.5rem 1rem, font 1rem 600, color #ffffff, background #1a1a1a, radius 0.375rem) unchanged, plus opacity 0.6 and cursor not-allowed while disabled.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form keeps calling the existing endpoint through `frontend/src/api/notes.ts` `createNote`:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

What changes is how often it is called: once per user save, never twice for one rapid double submit.

## Technology Selection
- In-flight submit guard: chose a React `useRef` flag plus the native `disabled` attribute on the submit button over a debounce/throttle helper or a new dependency (lodash.debounce, react-hook-form `isSubmitting`), because the native disabled button also blocks implicit (Enter) submission per the HTML form spec, and the ref covers the window before the re-render; no new dependency is installed.
- Server-side dedupe (database UNIQUE constraint on text, or an idempotency key): rejected, see Re-Plan Feedback; a uniqueness constraint would forbid legitimate repeated notes.
- E2E and component tests: use the installed Playwright, Vitest and @testing-library/react (`fireEvent`); no @testing-library/user-event is added.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec for criterion 1 (double click stores one note, shown once, once after reload) plus the edge case of Enter pressed right after a click.
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan.
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3.

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus `isSaving` state), `disabled` on the submit button with the disabled style, `finally` reset.
- [A] frontend/src/components/NoteForm.test.tsx: component tests for criteria 2 and 3 (pending save disables the button and ignores a second click and a second form submit; resolve and reject both re-enable it and a second save is sent).

No dependency manifest changes, so no lockfile is regenerated. README.md and docs/DEVELOPMENT.md need no edit: no project structure, run configuration, dependency or test infrastructure change.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (existing `vi.mock("../api/notes")` pattern), using a manually controlled promise so the save stays pending while the test acts.
  - Directory: frontend/src/components/ (Vitest, co-located, as the existing `NoteForm.test.tsx`)
  - Naming: `{Component}.test.tsx`, existing file extended
  - Cases: (a) pending save: button has `disabled`, a second `fireEvent.click` on `note-submit` and a `fireEvent.submit` on `note-form` leave `createNote` called once; (b) after resolve: button enabled, typing a second note and submitting calls `createNote` a second time with that text; (c) after reject: error shown, button enabled, submitting again calls `createNote` again (retry); (d) existing empty-note case still never disables the button.
- Integration tests: not warranted: no router, repository, model or migration changes (testing_standards.md Section 6). Backend suite must still pass.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: criterion 1 only, plus one edge-case spec.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
  - Approach: reuse TEST-03's patterns (exact-path request matcher, wait for the mount GET, unique note text via `randomUUID`), defined locally in the spec. Record every POST /api/notes; `fill` a unique text, `dblclick()` on `note-submit`; wait for the 201; assert exactly one POST was recorded, `getByText(noteText)` inside `note-list` has count 1; reload, wait for the GET, assert count 1 again. Edge case: click `note-submit` then immediately press Enter in `note-input`; assert one POST and one list item.
- UAT scenarios: one scenario per criterion plus one edge case (Enter right after click).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Clicking "Save note" twice in quick succession stores the note once (shown once, once after reload) | E2E | — |
| 2 | While a save is in progress the button is disabled and a further submit sends no second request | Unit | verifying it needs no navigation, only a controlled pending promise, which a Vitest component test holds open deterministically and a browser against a fast local backend cannot |
| 3 | Once the save completes or fails the button is enabled again, so a next note or a retry can be saved | Unit | verifying it needs no navigation: it is the form's state after a resolved or rejected `createNote`, and forcing a failure is a mock rejection at component level |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double click stores the note once | Double-click `note-submit` with unique text; one POST, one list item, one after reload | Given the landing page is open, When I type a note and double-click "Save note", Then the note appears once and still once after reload |
| 2 | Button disabled during save, no second request | covered at Unit, see Criterion coverage | Given a save is in progress, When I click "Save note" again or press Enter, Then the button is disabled and no second note is stored |
| 3 | Button enabled again after success or failure | covered at Unit, see Criterion coverage | Given a save has finished or failed, When I look at the form, Then "Save note" is enabled and I can save another note or retry |

## Manual verification plan
### Criterion 1: Clicking "Save note" twice in quick succession stores the note once
Prerequisites: backend and frontend running (frontend at http://localhost:5183), database reachable.
1. Open `http://localhost:5183/` → the "Task Notes" landing page shows the "New note" field, the "Save note" button and the notes list.
2. Type `Double click check 1` in the "New note" field → the text is in the field.
3. Double-click "Save note" as fast as you can → the field clears and `Double click check 1` appears in the list exactly once.
4. Reload the page → after the list loads, `Double click check 1` is in the list exactly once.
5. Optional, for a developer: in the browser DevTools Network tab, filtered on `notes`, repeat steps 2 and 3 with `Double click check 2` → exactly one `POST /api/notes` with status 201.

### Criterion 2: While a save is in progress the button is disabled and a further submit sends no second request
Prerequisites: as Criterion 1, plus browser DevTools open on the Network tab with throttling set to "Slow 3G" so the save stays in progress long enough to observe.
1. Open `http://localhost:5183/` and wait for the list to load → the form is shown, "Save note" is enabled.
2. Type `Slow save check` in the "New note" field and click "Save note" once → "Save note" turns dimmed and does not react to the pointer (disabled) while the request is pending.
3. While it is still dimmed, click "Save note" again, then click into the field and press Enter → nothing happens; the Network tab shows one `POST /api/notes` only.
4. Wait for the request to finish, set throttling back to "No throttling" and reload → `Slow save check` is in the list exactly once.
Automated equivalent: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → 0 failed.

### Criterion 3: Once the save completes or fails the button is enabled again
Prerequisites: as Criterion 1.
1. Open `http://localhost:5183/`, type `First after fix` and click "Save note" → the note appears in the list and "Save note" is enabled (not dimmed) again.
2. Type `Second after fix` and click "Save note" → the second note appears below the first; both are in the list once.
3. Stop the backend (for example `docker compose stop backend` when running the compose stack), type `Retry after failure` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and "Save note" is enabled again.
4. Start the backend again (`docker compose start backend`), wait a few seconds, click "Save note" → the message disappears, the field clears and `Retry after failure` appears in the list once.
Automated equivalent: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → 0 failed.
