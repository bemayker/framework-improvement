# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m has an empty description. The acceptance criteria below are derived from the title; see `## Re-Plan Feedback`.)

## Acceptance Criteria
- [ ] Submitting the note form twice in quick succession (double-clicking "Save note", or pressing Enter twice) before the first save has finished sends exactly one save request and stores the note exactly once.
- [ ] While a save is in progress the "Save note" button is disabled, and it is enabled again once that save completes.
- [ ] After a save fails, the button is enabled again and the note (text still in the field) can be saved by submitting once more.

## Re-Plan Feedback
- Comment (tracker): the task carries only mayker-dev bot notes from earlier runs whose PRs were reset → Addressed by: not acted on because they are status notes, not requirements (relayed by the dispatching session).
- Comment (tracker): the item has no description → Addressed by: assumption. The three criteria above are derived from the title and the existing note form (TEST-03): the defect is the client sending a second `POST /api/notes` while the first is still in flight, so the fix is a client-side in-flight guard. Criterion 3 is included only to keep the guard from locking the form after an error (a regression the fix itself could introduce), not as new behaviour.
- Comment (tracker): scope assumption → Addressed by: no server-side deduplication (idempotency keys, unique constraint on note text). Two identical notes saved deliberately, one after the other, remain allowed; the title names a "quickly" double submit, which the client guard fully covers. A server-side dedupe would also collide with TEST-12's edits to the notes router, service and repository.
- Merged since the last plan: n/a (fresh plan, written against main at 0522812). TEST-08 (PR #744, open) modifies `frontend/src/api/notes.ts`, `frontend/src/components/AppFooter.tsx` and `frontend/src/components/LandingPage.test.tsx`; this plan touches none of those files, so the merged-since check at build time should find no overlap.

## Plan Overview
Frontend-only fix in `NoteForm`. `handleSubmit` currently awaits `createNote` with no in-flight guard, so a second submit event fired before the first request resolves sends a second `POST /api/notes` and the backend stores a duplicate row. The fix adds:

- a synchronous in-flight guard (`useRef<boolean>`) checked and set at the top of `handleSubmit`, after the empty-text check and before `createNote`, and released in a `finally` block. A ref and not only state, because two submit events dispatched in the same tick both read the stale `isSaving` state before React re-renders; the ref is what actually blocks the second call.
- an `isSaving` state mirroring the ref, driving `disabled={isSaving}` on the submit button (and `aria-busy` is not added: no criterion asks for it).

No change to the API client, the landing page, the list, or the backend. The button label stays "Save note" while saving (no criterion asks for a "Saving…" label).

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard via `useRef`, `isSaving` state, `disabled` on the `note-submit` button, guard released in `finally` on success and on failure). `frontend/src/components/NoteForm.test.tsx` gains the unit tests named in `### Criterion coverage`.
- Routes: none.
- State management: local component state as today; one `useRef<boolean>` (`savingRef`) plus one `useState<boolean>` (`isSaving`). The empty and whitespace-only validation path stays before the guard and is unchanged (it sends no request, so it never sets the guard).
- Design reference notes: AI freestyle. Disabled button keeps the existing `buttonStyle` and adds `opacity: 0.6` and `cursor: "not-allowed"` while `isSaving` is true; no other style changes.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged, consumed as today by `createNote` in `frontend/src/api/notes.ts`:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

The fix guarantees at most one in-flight call to it per form.

## Technology Selection
- In-flight submit guard: chose React's built-in `useRef` and `useState` plus the native `disabled` attribute on the `<button type="submit">` over a debounce utility or a form library (none installed, and a disabled submit button natively suppresses both click and implicit Enter submission); the ref is kept because `disabled` takes effect only after a re-render, which a same-tick second submit precedes.
- No net-new dependency, module or component is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec reproducing the double submit through the UI and asserting one POST and one stored note.
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the `useRef` in-flight guard, the `isSaving` state, and `disabled={isSaving}` with the disabled style on the submit button; release the guard in `finally`.
- [A] frontend/src/components/NoteForm.test.tsx: add the three unit tests named in `### Criterion coverage`.

No dependency changes, so no lockfile is regenerated. No project structure, run configuration, dependency or test infrastructure change, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (existing `vi.mock("../api/notes")` pattern), using a deferred promise so the first save stays pending while the second submit fires.
  - Directory: `frontend/src/components/` (co-located Vitest tests, the established frontend convention; `backend/tests/unit/` is the backend's)
  - Naming: `{Component}.test.tsx`, existing file `NoteForm.test.tsx`
- Integration tests: none warranted. No router, repository, model or migration changes; the backend correctly stores each POST it receives.
  - Directory: `backend/tests/integration/` (unchanged)
- E2E tests: one spec reproducing the defect against the real stack. It holds the first `POST /api/notes` with `page.route` until the second click has been dispatched (a gate released by the test, not a timeout), double-clicks `note-submit`, then asserts exactly one recorded POST and, after a reload, exactly one list item with the unique note text.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/BUG-04_double_submit_note.spec.ts`
- UAT scenarios: one scenario per criterion plus one edge case (Enter pressed twice).
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A quick double submit sends one save request and stores the note once | E2E | `stores a note once when the save button is double-clicked`, `sends one save request when the form is submitted twice before the first save finishes` | — |
| 2 | The button is disabled while a save is in progress and enabled once it completes | Unit | `disables the save button while a save is in progress` | verifying it needs no navigation: it is the component's own disabled state against a pending mocked save, fully observable in jsdom |
| 3 | After a failed save the button is enabled again and the note can be saved by submitting once more | Unit | `re-enables the save button and allows a retry after a save fails` | verifying it needs no navigation: forcing a failed save is a mocked rejection, which a browser spec could only reach by intercepting the API anyway |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Quick double submit stores once | Hold the first POST via `page.route`, double-click `note-submit`, release, assert one POST recorded and one `note-list-item-*` with the text after reload | Given the landing page is open, When I type a note and double-click "Save note", Then the note appears once and still appears once after reload |
| 2 | Button disabled while saving | covered at Unit, see Criterion coverage | Given a save is in progress, When I look at "Save note", Then it is disabled until the note appears |
| 3 | Retry after failure | covered at Unit, see Criterion coverage | Given the backend is unreachable, When I save a note, Then an error shows, the button is enabled, and once the backend is back a single submit saves the note |

## Manual verification plan
### Criterion 1: A quick double submit sends one save request and stores the note once
Prerequisites: the stack is running (backend on its configured port, frontend at http://localhost:5183), browser DevTools Network tab open and filtered to `notes`.
1. Navigate to `http://localhost:5183/` → the "Task Notes" page shows the "New note" field and the "Save note" button.
2. Enter `Double click check 1` in the "New note" field → the text appears in the field.
3. Double-click "Save note" as fast as you can → exactly one `POST /api/notes` row appears in the Network tab, the field clears, and "Double click check 1" appears once in the list.
4. Reload the page → "Double click check 1" appears exactly once in the list.
5. Enter `Double enter check 2` in the field and press Enter twice rapidly → one `POST /api/notes` row; "Double enter check 2" appears once, and once again after a reload.

### Criterion 2: The button is disabled while a save is in progress and enabled once it completes
Prerequisites: as Criterion 1; in DevTools Network set throttling to "Slow 3G" so the save stays in flight long enough to observe.
1. On `http://localhost:5183/`, enter `Slow save check` in the "New note" field.
2. Click "Save note" once → the button turns greyed out (disabled) and clicking it again does nothing; no second `POST /api/notes` appears.
3. Wait for the request to finish → "Slow save check" appears once in the list, the field clears, and the "Save note" button is enabled again.
4. Set throttling back to "No throttling".

### Criterion 3: After a failed save the button is enabled again and the note can be saved by submitting once more
Prerequisites: as Criterion 1, with the page loaded.
1. In DevTools Network, enable "Offline".
2. Enter `Retry check` in the "New note" field and click "Save note" → the red message "The note could not be saved. Please try again." appears, the field still reads `Retry check`, and "Save note" is enabled.
3. Disable "Offline" in DevTools.
4. Click "Save note" once → the error message disappears, the field clears, and "Retry check" appears once in the list.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → `0 failed`, including the three BUG-04 tests named in `### Criterion coverage`.
