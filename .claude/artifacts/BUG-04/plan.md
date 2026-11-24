# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m has an empty description. The acceptance criteria below are derived from the title and recorded as an assumption under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] Submitting the note form twice in quick succession (two clicks on "Save note", or Enter pressed twice in the note field) before the first save has completed stores exactly one note, and the note list shows it exactly once.
- [ ] Once a save has finished, whether it succeeded or failed, the form accepts the next submission again: a note can still be saved after a failed save, and the same text can still be saved deliberately a second time after the first save completed.

## Re-Plan Feedback
- Comment (tracker): 52 comments read by the dispatching session, all automated "mayker-dev:" PR-link notices from earlier runs → not acted on because none states a requirement or a correction.
- Comment (tracker): none carries a description; the task description is empty → Addressed by: assumption recorded here. The criteria are derived from the title alone: the defect is a client-side double submit (the form at `frontend/src/components/NoteForm.tsx` has no in-flight guard, so a second click or Enter while `createNote` is pending fires a second `POST /api/notes`). The fix is scoped to preventing the duplicate request, not to server-side de-duplication of identical texts, because two notes with the same text saved on purpose are legitimate data in a task-notes app and nothing in the title asks to forbid them (`user_story_alignment.md` Section 3).

## Plan Overview
Frontend-only fix in the note form. `NoteForm` gains an in-flight guard: a `useRef` flag checked first in `handleSubmit` (synchronous, so it holds even for two submits dispatched before React re-renders) plus an `isSaving` state that disables the "Save note" button while the request is pending. Both are released in a `finally` block, so a failed save never leaves the form stuck. No backend, API or schema change; `LandingPage.tsx` is not touched.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard: `isSavingRef` via `useRef<boolean>(false)` and `isSaving` via `useState(false)`; `handleSubmit` returns immediately when `isSavingRef.current` is true; after the empty-text validation passes it sets both to true, awaits `createNote`, and resets both in `finally`; the submit button gets `disabled={isSaving}` and `aria-busy={isSaving}`). `frontend/src/components/NoteForm.test.tsx` gains the unit tests named under Testing Strategy.
- Routes: none.
- State management: local component state only (`useState` plus `useRef`), no new context or store.
- Design reference notes: AI freestyle. Only one visual change: while saving, the "Save note" button keeps its existing style (`padding 0.5rem 1rem, font-size 1rem, weight 600, color #ffffff, background #1a1a1a, radius 0.375rem`) and adds a disabled state of `opacity 0.6, cursor not-allowed`. The label text stays "Save note".

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: POST (existing, unchanged)
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201 with `{"id": 7, "text": "Buy milk"}`. Contract unchanged; this fix only ensures the frontend sends it once per deliberate submission.

## Technology Selection
- In-flight guard in `NoteForm.tsx`: chose React's own `useRef` and `useState` (already installed) over a debounce/throttle helper or a new dependency such as lodash, because a debounce is time-based and still lets a second submit through once the window passes while the first request is pending; a ref flag tied to the request lifetime covers the need exactly.
- Disabled button while saving: chose the native `disabled` attribute on the `<button>` over a JS click-swallowing wrapper, because the browser then drops clicks and Enter-triggered submits through that button on its own and exposes the state to assistive technology.
- No net-new module or dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright specs proving a double click and a double Enter each store exactly one note
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the in-flight guard (ref plus state), disable the submit button while saving, release both in finally
- [A] frontend/src/components/NoteForm.test.tsx: add unit tests for the guard, the disabled state and the release after success and after failure

No dependency changes, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour in jsdom with `createNote` mocked (an unresolved promise held open to simulate a pending save), Vitest plus Testing Library, extending the existing file.
  - Directory: beside the component (`frontend/src/components/`), per this project's frontend convention
  - Naming: `NoteForm.test.tsx` (existing file)
- Integration tests: not warranted. Integration Tests is ENABLED, but this fix adds or modifies no repository, model, migration or endpoint, so no integration test is added.
  - Directory: backend/tests/integration/ (untouched)
- E2E tests: two specs against the real stack. `page.route` on `POST /api/notes` delays the request by holding it before `route.continue()` so the pending window is real, then the spec clicks "Save note" twice (and, in the edge-case spec, presses Enter twice in the note field) and asserts exactly one recorded `POST /api/notes` and exactly one list item carrying the unique note text.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one per criterion plus one edge case (failed save then retry).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | Submitting twice quickly stores exactly one note and the list shows it once | E2E | `stores a note once when Save note is clicked twice quickly`, `stores a note once when Enter is pressed twice quickly`, `submits only once when Save note is clicked twice while the first save is pending`, `submits only once when the form is submitted twice while the first save is pending`, `disables the Save note button while a save is pending` | — |
| 2 | After a save finishes, successfully or not, the form accepts the next submission | Unit | `accepts a new submission after a failed save`, `accepts a new submission after a successful save` | verifying it needs no navigation through the real stack: it is the guard's release in the component's own state, provable in jsdom by resolving or rejecting the mocked `createNote` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Submitting twice quickly stores exactly one note | Delay `POST /api/notes` with `page.route`, click `note-submit` twice (second spec: press Enter twice in `note-input`), release the request, assert one recorded POST and one `note-list` item with the text | Given the landing page is open When I enter a note and click Save note twice quickly Then the note appears once in the list, and once after a reload |
| 2 | Form accepts the next submission after a save finished | covered at Unit, see Criterion coverage | Given a save just finished When I enter the same text and click Save note again Then a second note with that text appears |

## Manual verification plan
### Criterion 1: Submitting twice quickly stores exactly one note and the list shows it once
Prerequisites: the stack is running (`docker compose up`), the frontend is at `http://localhost:5183`, and Chrome DevTools is open on the Network tab with throttling set to "Slow 3G" so the save takes long enough to click twice.
1. Navigate to `http://localhost:5183/` → the "Task Notes" page shows the "New note" field and the "Save note" button.
2. Type `Double click check 1` in the "New note" field → the text is in the field.
3. Double-click "Save note" as fast as you can → the button turns dimmed (disabled) while the request is pending; the Network tab shows exactly one `POST /api/notes` request.
4. Wait for the request to finish → `Double click check 1` appears once in the list below the form and the field is empty.
5. Type `Enter check 1` in the field and press Enter twice quickly → the Network tab shows exactly one new `POST /api/notes`, and `Enter check 1` appears once in the list.
6. Reload the page → `Double click check 1` and `Enter check 1` each appear exactly once.

### Criterion 2: After a save finishes, successfully or not, the form accepts the next submission
Prerequisites: as for Criterion 1, with throttling back on "No throttling".
1. Navigate to `http://localhost:5183/`, type `Repeat me` and click "Save note" once → `Repeat me` appears once in the list, the button is enabled again.
2. Type `Repeat me` again and click "Save note" once → a second `Repeat me` entry appears (a deliberate second save is still allowed).
3. In the Network tab, set throttling to "Offline", type `Offline check` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again.
4. Set throttling back to "No throttling" and click "Save note" → `Offline check` appears once in the list and the error message disappears.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → the run passes: its summary line reports no failed or errored test and the command exits 0.
