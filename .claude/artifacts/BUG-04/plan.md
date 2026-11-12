# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m has no description; its title is the whole feature text.)

## Acceptance Criteria
- [ ] Submitting a note twice in quick succession (double-clicking "Save note", or submitting again while the first save is still in flight) stores the note exactly once, and it appears exactly once in the on-page list.
- [ ] Once a save has finished, whether it succeeded or failed, the form accepts a new submission again.

## Re-Plan Feedback
- Comment (tracker): none actionable. 35 comments read by the dispatching session, all earlier runs' automated PR notes (`decisions.md`) → Addressed by: not acted on, because none of them carries feedback on this item.
- Assumption (no description on the item): the acceptance criteria are derived from the title alone and kept minimal. Criterion 1 is the defect itself, read as "a second submit while the first is still in flight". Criterion 2 is its regression guard: an in-flight guard that never releases would turn a double-store bug into a dead form, so the release is stated rather than assumed. Deliberately out of scope (no gold plating, `user_story_alignment.md` Section 3): server-side idempotency keys, a unique constraint on note text (two separate deliberate saves of the same text remain allowed), a loading spinner, and any change to the notes API.
- Assumption (where the defect lives): `frontend/src/components/NoteForm.tsx` `handleSubmit` awaits `createNote` with no in-flight state, and the submit button is never disabled, so every click before the response lands sends its own `POST /api/notes`. The backend stores what it is sent, which is correct behaviour for two distinct requests. The fix is therefore frontend-only.
- Merged since the last plan: n/a (fresh plan, branched from current main at 20353cb, which already contains TEST-09 and BUG-01; neither touches a path below).
- Repro: local-automated: `npm --prefix frontend test -- --run src/components/NoteForm.test.tsx` running the new test `stores a note only once when it is submitted twice while saving` (source: none in item; the steps are the title's, encoded as a component test that holds `createNote` pending and clicks Save twice). It fails on main (createNote called twice) and passes on the fix. The E2E spec below is the observed-layer check through the real backend.

## Plan Overview
A frontend-only fix in `NoteForm`. The form gains an in-flight guard: a `useRef<boolean>` flag checked and set synchronously at the top of `handleSubmit` (after the empty-note check), so a second submit event that arrives before React re-renders is still rejected, plus an `isSaving` state that sets `disabled` on the "Save note" button while the request is pending. Both are released in a `finally` block, so success and failure both re-open the form. No backend, API client or LandingPage change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight ref guard, `isSaving` state, `disabled={isSaving}` on `note-submit`, release in `finally`); `frontend/src/components/NoteForm.test.tsx` (new unit tests for both criteria).
- Routes: none.
- State management: local component state only. `isSavingRef` (useRef) is the authority for rejecting a duplicate submit because it updates synchronously; `isSaving` (useState) drives the button's `disabled` attribute for the user. The existing `error`, `text` and `onCreated` behaviour is unchanged: the input keeps its text on failure, is cleared on success.
- Design reference notes: AI freestyle. Design Reference mode is NONE. The disabled button reuses the existing `buttonStyle` and adds only `cursor: "not-allowed"` and `opacity: 0.6` while `isSaving` is true, so the disabled state is visible.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged, consumed as is:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201 with `{"id": 7, "text": "Buy milk"}`

The fix changes how often the frontend calls it (once per in-flight save), not the contract.

## Technology Selection
- In-flight guard: chose React's built-in `useRef` and `useState` plus the native `disabled` attribute on the submit button over a debounce utility or a new dependency, because the platform's disabled button plus a synchronous ref covers both a double click and an Enter-key resubmit in a few lines.
- No new dependency, module or component is introduced; the E2E spec uses the already-installed `@playwright/test` (`page.route` to hold the POST in flight).

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec, double-click Save with the POST held in flight, asserts one POST, one list item, and one stored note after reload; plus the re-enable-after-save case
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus one edge case (failed save re-enables the form)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT clickthrough expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard and `isSaving` state, `disabled` on the submit button while saving, release in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the duplicate-submit guard, the disabled button, and re-enable after success and after failure

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure changes.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (Vitest + Testing Library), holding the mocked promise unresolved to simulate an in-flight save.
  - Directory: frontend/src/components/ (co-located, as the existing `NoteForm.test.tsx`)
  - Naming: `{Component}.test.tsx`, the frontend's existing convention
- Integration tests: not warranted. No backend code changes (`testing_standards.md` Section 6: no repository, model, migration or endpoint is touched); the existing `backend/tests/integration/test_notes_integration.py` stays as is.
- E2E tests: one spec for criterion 1, the observed layer: a real browser double-click against the real backend, with the `POST /api/notes` held by `page.route` until both clicks have happened (no hardcoded waits), asserting one POST request, one `note-list-item-*` with the text, and still one after a reload. Plus one spec for criterion 2's success path (a second, different note saves after the first completes).
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one per criterion plus the failed-save edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | Submitting a note twice in quick succession stores it exactly once and it appears once in the list | E2E | `stores a double-clicked note only once`, `stores a note only once when it is submitted twice while saving` | — |
| 2 | Once a save has finished, success or failure, the form accepts a new submission again | Unit | `re-enables the save button after a successful save`, `re-enables the save button after a failed save` | verifying it needs no navigation: it is the component's own state release, and a failed save is only reliably produced with the API client mocked |

The unit test `disables the save button while a note is saving` also runs in `NoteForm.test.tsx` as supporting coverage for criterion 1.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double submit stores the note once | Hold `POST /api/notes` with `page.route`, `dblclick` on `note-submit`, release the route, assert one POST recorded, one `note-list-item-{id}` with the text, and one after reload | Given the landing page is open, When I type a note and double-click "Save note", Then the note appears once in the list, and once after a reload |
| 2 | Form accepts a new submission after a save finishes | covered at Unit, see Criterion coverage | Given a note was just saved (or a save failed), When I type another note and click "Save note", Then it is saved |

## Manual verification plan
### Criterion 1: Submitting a note twice in quick succession stores it exactly once
Prerequisites: the stack is running (backend on http://localhost:8010, frontend on http://localhost:5183), browser devtools open on the Network tab filtered to `notes`.
1. Navigate to `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the current list of notes.
2. Type `BUG-04 double click check` in the "New note" field → the text is in the field.
3. Double-click "Save note" as fast as you can → the button greys out (disabled) while saving, then the field clears.
4. Look at the note list → `BUG-04 double click check` appears exactly once.
5. Look at the Network tab → exactly one `POST /api/notes` request, status 201.
6. Reload the page → `BUG-04 double click check` still appears exactly once.
7. Optional slower-network variant: in devtools set throttling to "Slow 3G", type `BUG-04 slow network check`, click "Save note" and press Enter in the field before the save finishes → one `POST /api/notes`, and the note appears once.

### Criterion 2: Once a save has finished, the form accepts a new submission again
Prerequisites: as for Criterion 1.
1. On `http://localhost:5183/`, type `BUG-04 first note` and click "Save note" → the note appears in the list and the button is enabled again.
2. Type `BUG-04 second note` and click "Save note" → it appears in the list below the first one.
3. Failure path: stop the backend container, type `BUG-04 offline note` and click "Save note" → the red message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again.
4. Start the backend again and click "Save note" → the message clears, the field empties, and `BUG-04 offline note` appears once in the list.
5. Run `npm --prefix frontend test -- --run src/components/NoteForm.test.tsx` → `0 failed`, running the NoteForm tests including the duplicate-submit and re-enable tests.
