# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The tracker task carries no description; the title is the whole report. The acceptance criteria below are derived from it, see Re-Plan Feedback for the recorded assumption.)

## Acceptance Criteria
- [ ] Submitting the note form twice in quick succession (a double click on "Save note", or a second submit before the first save has returned) sends exactly one save request and stores the note once: one row in the backend, one entry in the note list.
- [ ] While a save is in flight the "Save note" button is disabled, and it is enabled again once that save succeeds or fails, so a note whose save failed can still be retried.

## Re-Plan Feedback
- Comment (tracker): all 16 comments on the task (the newest 25-page provided by the dispatch plus the older page read here from id 1200230000122213, and an empty page after the oldest, id 1200230000074677) are framework bot "PR opened" notes from earlier autonomous runs; none is a human comment → Addressed by: not acted on because none carries a requirement, correction or amendment.
- Scope assumption (no description on the item): the acceptance criteria are derived from the title alone. Assumed the defect is client-side double submission from the note form (the only UI that creates notes, frontend/src/components/NoteForm.tsx), fixed with an in-flight guard plus a disabled submit button. Not assumed: server-side de-duplication (an idempotency key, a uniqueness constraint on note text, or time-window dedupe). Two notes with identical text saved deliberately at different times stay legitimate, and a server-side dedupe would change the notes API contract and collide with TEST-12's notes router, service and repository work; that would be gold plating against a title that names the double save as the defect.
- Merged since the last plan: n/a (fresh plan, no existing plan.md for BUG-04 at base 27c3d0eb).

## Plan Overview
Frontend-only defect fix in the note form.

Reproduction reasoning: NoteForm.handleSubmit (frontend/src/components/NoteForm.tsx) awaits createNote with no in-flight state, and the "Save note" button is never disabled. A second click or Enter press before the first POST resolves runs handleSubmit again while `text` still holds the same value (it is cleared only after the first response), so a second POST /api/notes with the same body is sent and the backend stores two rows; LandingPage's onCreated then appends both notes to the list. The local reproduction is a Vitest component test in NoteForm.test.tsx: mock createNote with a promise that stays pending, submit the form twice, assert createNote was called once. On the current code it fails (called twice); after the fix it passes. The builder runs it red before the fix and records that in the PR body.

Fix: in NoteForm, a `useRef<boolean>` in-flight flag checked and set synchronously at the start of handleSubmit (after the empty-note check), cleared in a `finally`. A ref and not only state, because two submit events dispatched in the same tick both read the same pre-render state value, so a state-only guard lets both through; the ref is read and written synchronously. A mirrored `isSaving` state drives `disabled` on the submit button (and the disabled visual), and is cleared in the same `finally`, so the button re-enables after success or failure.

Not touched: LandingPage.tsx, the notes API client, the backend.

## Frontend Plan
- Components to create/modify: frontend/src/components/NoteForm.tsx (in-flight ref guard in handleSubmit, `isSaving` state, `disabled={isSaving}` and `aria-busy` free; disabled style on the submit button); frontend/src/components/NoteForm.test.tsx (reproduction and criterion tests).
- Routes: none.
- State management: local component state only; `isSavingRef` (useRef) as the synchronous guard, `isSaving` (useState) for rendering the disabled button. The input stays editable during a save, the label stays "Save note".
- Design reference notes: AI freestyle (Design Reference mode NONE). Disabled submit button: the existing buttonStyle plus opacity 0.6 and cursor not-allowed while `isSaving` is true; every other value unchanged (padding 0.5rem 1rem, font 1rem 600, color #ffffff, background #1a1a1a, radius 0.375rem).

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; the fix relies on the existing internal contract, called at most once per submit.
- Method: POST
- URL: /api/notes
- Request: JSON body with one field, text (string, 1 to 500 characters after trimming)
- Response: 201 with the stored note, for example `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard: chose React's built-in `useRef` and `useState` (already installed) plus the native `disabled` attribute on the submit button over a debounce/throttle helper or a form library, because the need is "one request in flight", which a flag and the native attribute cover in a few lines; no new dependency.
- E2E slow-response simulation: chose Playwright's built-in `page.route` (already installed) to hold the POST until both clicks have landed, over a fixed timeout, because the testing standard forbids hardcoded waits.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser reproduction, a double click on "Save note" while the POST is held stores the note once
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: synchronous in-flight guard, isSaving state, disabled submit button with disabled style
- [A] frontend/src/components/NoteForm.test.tsx: reproduction test (fails before the fix) and criterion tests

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: NoteForm component behaviour (Vitest + Testing Library) with createNote mocked; the reproduction test uses a deferred promise so the first save stays in flight while the second submit is fired.
  - Directory: frontend/src/components/ (co-located, per project standards)
  - Naming: NoteForm.test.tsx (existing file)
- Integration tests: not warranted; no repository, model, migration or endpoint changes (testing_standards.md tier selection). Integration Tests toggle is ENABLED but has nothing new to cover.
- E2E tests: one spec reproducing the double click in a real browser against the real backend, with the POST held by `page.route` until both clicks have been dispatched, then released; asserts one POST request was issued and exactly one list item carries the unique note text, also after a reload.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus an edge case (retry after a failed save).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A quick double submit sends one save request and stores the note once | E2E | `stores a note once when Save note is double-clicked`, `sends one save request when the form is submitted twice before the first save finishes`, `sends one save request when Save note is clicked twice quickly` | — |
| 2 | Save note is disabled while a save is in flight and enabled again after success or failure | Unit | `disables Save note while a save is in flight and enables it after the save succeeds`, `enables Save note again after a failed save so the note can be retried` | verifying it needs no navigation through the app: it is the form component's own button state, observable in a rendered component with a controlled mock |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | A quick double submit stores the note once | Open `/`, hold POST /api/notes with page.route, fill a unique note, dblclick `note-submit`, release the route, assert one POST recorded and `note-list` has exactly one item with that text, reload and assert still one | Given the landing page is open When I type a note and double-click "Save note" Then the note appears once in the list and once after a reload |
| 2 | Button disabled during save, enabled after | covered at Unit, see Criterion coverage | Given the backend answers slowly When I click "Save note" Then the button is disabled until the note appears, and enabled again afterwards |

## Manual verification plan
### Criterion 1: A quick double submit sends one save request and stores the note once
Prerequisites: the app stack is running (backend on its configured port, frontend at http://localhost:5183), browser devtools open on the Network tab filtered to `notes`.
1. Navigate to `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the note list.
2. In devtools Network, set throttling to "Slow 3G" → later requests take a few seconds.
3. Type `Double click check 1` in the "New note" field → the text is in the field.
4. Double-click "Save note" quickly → exactly one POST to `/api/notes` appears in the Network tab, and after it completes `Double click check 1` appears once in the note list and the field is empty.
5. Set throttling back to "No throttling" and reload the page → `Double click check 1` is listed exactly once.
6. Repeat steps 2 to 5 with `Double enter check 1`, pressing Enter twice quickly in the field instead of double-clicking → one POST, one list entry, still one after reload.
7. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → the run passes: its summary line reports no failed or errored test and the command exits 0.

### Criterion 2: Save note is disabled while a save is in flight and enabled again after success or failure
Prerequisites: as for criterion 1, throttling set to "Slow 3G".
1. On `http://localhost:5183/`, type `Disabled button check` and click "Save note" once → while the request is pending the button looks dimmed, the cursor over it is not-allowed, and clicking it again does nothing (no second POST in the Network tab).
2. Wait for the note to appear in the list → the button is back to full opacity and clickable.
3. Set throttling to "Offline", type `Retry after failure` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again.
4. Set throttling to "No throttling" and click "Save note" → `Retry after failure` appears once in the list and the error message disappears.
