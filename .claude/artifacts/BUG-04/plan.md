# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The tracker item, ClickUp task 123k99cx47m, has an empty description and no written acceptance criteria. The criteria below are derived from the title alone and are recorded as assumptions under `## Re-Plan Feedback`.)

## Acceptance Criteria
- [ ] 1. Clicking "Save note" twice in quick succession (a double click, or a second click while the first save is still in progress) on a non-empty note sends exactly one `POST /api/notes` and the note is stored and listed exactly once.
- [ ] 2. Once a save has finished, successfully or with an error, the form accepts the next submit again: a later note can be saved, and after a failed save the user can retry with the kept text.

## Re-Plan Feedback
- Comment (tracker): 37 comments over 2 pages, all framework PR-opened notes from earlier runs → not acted on because none carries feedback on this item's behaviour or scope.
- Assumption (tracker description empty): criterion 1 is the defect in the title, restated as the observable outcome (one request, one stored note, one list entry) → Addressed by: the in-flight guard in `NoteForm.tsx` and the reproduction test.
- Assumption (tracker description empty): criterion 2 is the minimal non-regression bound on the fix. A guard that never releases would "fix" the duplicate by blocking every later save, and TEST-03 already promises that a failed save keeps the text so the user can try again → Addressed by: the guard is released in a `finally` block, covered by two unit tests.
- Assumption (scope): the fix is client-side only. The duplicate comes from `NoteForm.handleSubmit` issuing a second `createNote` call while the first is pending; the backend correctly stores each request it receives. Server-side deduplication (an idempotency key, a uniqueness constraint on note text) is not added: two deliberate saves of the same text are legitimate notes, and an idempotency key would be a new API contract the title does not ask for (`user_story_alignment.md` Section 3) → not acted on, recorded here so the reviewer sees it was considered.
- Assumption (scope): no new visible "saving" state (spinner, label change, restyled disabled button). The title asks for the duplicate to stop, not for progress feedback → not acted on.
- Merged since the last plan: n/a (fresh plan, planned against main at 851524e, which holds BUG-01 and TEST-09; neither touches the frontend note form).

## Plan Overview
One frontend component change. `NoteForm`'s submit handler gains an in-flight guard: a `useRef<boolean>` that is set before `createNote` is awaited, checked at the top of the handler, and cleared in a `finally` block. A second submit that arrives while the first request is pending returns without calling the API. The button also receives the native `disabled` attribute while a save is pending, so a mouse or keyboard (Enter in the field) submit is refused by the browser itself.

Why a ref and not only state: two clicks can be dispatched before React re-renders with the new `disabled` value, and both handler invocations would then read the same stale `isSaving` from their closure. The ref is read and written synchronously, so the guard holds regardless of render timing. The `isSaving` state exists only to drive the `disabled` attribute.

No backend, schema, API or API-client change.

**Local reproduction (run before and after the fix, from the worktree root):**
`npm --prefix frontend test -- src/components/NoteForm.test.tsx`
The builder first adds the test `sends one save request when the form is submitted twice while saving` (below). Before the fix it fails (`createNote` called 2 times, expected 1); after the fix the file reports `0 failed`.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify only).
  - Add `const isSavingRef = useRef(false);` and `const [isSaving, setIsSaving] = useState(false);`.
  - In `handleSubmit`, after `event.preventDefault()`: `if (isSavingRef.current) return;` placed BEFORE the empty-text check, so a second submit during a save never shows the validation message either (the first save may already have cleared the input).
  - Set `isSavingRef.current = true` and `setIsSaving(true)` immediately before `await createNote(trimmedText)`, after the empty-text check (an empty submit never enters the saving state).
  - Wrap the existing try/catch with `finally { isSavingRef.current = false; setIsSaving(false); }`. Success and error branches are otherwise unchanged: on success clear the error, clear the text, call `onCreated`; on error show `SAVE_FAILED_MESSAGE` and keep the text.
  - Add `disabled={isSaving}` to the `note-submit` button. No style change: `buttonStyle` stays as it is (no gold plating, see Re-Plan Feedback).
  - Keep every existing `data-testid` (`note-form`, `note-input`, `note-submit`, `note-form-error`) and every user-facing string unchanged.
- Routes: none.
- State management: local component state plus one ref, as above. `LandingPage` and `NoteList` are not touched.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The existing internal contract is reused as is:
- Method: POST
- URL: /api/notes
- Request: `{ "text": string }` (1 to 500 characters after trimming)
- Response: 201, `{ "id": number, "text": string }`

The change is in how often the client calls it, never in its shape.

## Technology Selection
- In-flight guard: chose React's `useRef` (already installed) over a debounce utility or a new dependency such as lodash, because a debounce delays the legitimate first save and still lets a slow request be duplicated, while a ref read and written synchronously answers "is a save pending" exactly.
- Button lock: chose the native `disabled` attribute on the existing `<button>` over a custom click-swallowing wrapper, because the browser then refuses both the click and the implicit Enter-key submission with no extra code.
- No new component, module or dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec for criterion 1 (double click stores and lists the note once) plus the edge case of a second note saved after the first.
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard in `handleSubmit`, released in `finally`; `disabled={isSaving}` on the submit button.
- [A] frontend/src/components/NoteForm.test.tsx: three new colocated Vitest cases (the reproduction for criterion 1, and two for criterion 2); the six existing cases stay unchanged as the TEST-03 regression guard.

No dependency is added or changed, so no lockfile changes. `README.md` and `docs/DEVELOPMENT.md` need no edit: this item changes no project structure, run configuration, dependency or test infrastructure.

Not modified, deliberately: `frontend/src/api/notes.ts` and `frontend/src/components/LandingPage.tsx`, `frontend/src/components/LandingPage.test.tsx` (TEST-08, PR #764, edits two of these), and everything under `backend/`.

## Testing Strategy
- Unit tests (Vitest, colocated, warranted): the defect is in `NoteForm`'s submit logic, so component tests with `createNote` mocked are the primary tier and the local reproduction.
  - Directory: colocated in `frontend/src/components/`, matching the TEST-03 and TEST-04 precedent (the `CLAUDE.md` unit directory `backend/tests/unit/` and `test_{module}_unit.py` naming are the pytest conventions and do not apply to frontend tests).
  - Naming: existing file `NoteForm.test.tsx`.
  - Cases to add (titles exactly as written, they are the `Test ids` below):
    - `sends one save request when the form is submitted twice while saving`: `createNote` returns a promise the test holds open (a deferred whose `resolve` the test keeps); type `Buy milk`, click `note-submit` twice, assert `createNote` was called exactly once; then resolve and assert `onCreated` was called exactly once. This is the reproduction: it fails before the fix.
    - `accepts a new note after the previous save has finished`: first save resolves, then type `Walk dog` and submit; assert `createNote` was called twice in total, with `Buy milk` then `Walk dog`.
    - `lets the user retry after a failed save`: first call rejects, second resolves; after the error message appears, click `note-submit` again without retyping; assert the second call happened with the kept text and `onCreated` was called with the stored note.
  - Error case: covered by `lets the user retry after a failed save`.
  - Run: `npm --prefix frontend test -- src/components/NoteForm.test.tsx`, expected `0 failed`.
- Integration tests: not warranted. No repository, model, migration or endpoint changes (`testing_standards.md` Section 6); the backend behaves correctly per request. The toggle stays ENABLED; no file under `backend/tests/integration/` is added.
- E2E tests (Playwright, ENABLED, warranted for criterion 1 only): the defect is a real-browser double click, and "stored once" is a claim about the database that only a full-stack run observes.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/BUG-04_double_submit_note.spec.ts`
  - Determinism without fixed waits: before submitting, `page.route` on the `POST /api/notes` request (match by method and exact pathname, the TEST-03 `isNotesApiRequest` pattern, since the Vite module URL `src/api/notes.ts` shares the substring) holds the first request until both clicks have been dispatched, then `route.continue()`. Record every `POST /api/notes` with a `page.on("request")` collector. Use a unique note text per test (`BUG-04 {label} {uuid8}`).
  - Assert: one recorded POST; the note list contains the text exactly once; after `page.reload()` and the mount `GET /api/notes`, still exactly once.
  - Edge-case spec: after a double-clicked save completes, a second distinct note saves normally (two POSTs total, both listed once).
  - Locators: `data-testid` only (`note-input`, `note-submit`, `note-list`).
- UAT scenarios: ENABLED. One scenario per criterion plus one edge case.
  - Directory: `e2e/uat/scenarios/`, script in `e2e/uat/scripts/`.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A quick double submit sends one POST and stores and lists the note once | E2E | `stores a double-clicked note only once`, `sends one save request when the form is submitted twice while saving` | — |
| 2 | After a save finishes (success or failure) the form accepts the next submit | Unit | `accepts a new note after the previous save has finished`, `lets the user retry after a failed save` | verifying it needs no navigation or full-stack interaction: it is the release of the component's own guard, observable from the mocked `createNote` calls, and the success path through a real browser is already exercised by the criterion-1 edge spec and TEST-03's specs |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | A quick double submit stores the note once | Hold the first POST with `page.route`, double click `note-submit`, release; assert one POST, one list entry, one entry after reload | Given I typed a note, When I double click Save note, Then the note appears once and is still there once after a reload |
| 2 | The form accepts the next submit after a save finishes | covered at Unit, see Criterion coverage | Given I saved a note, When I type another and click Save note, Then it is saved too |
| E | Edge: a second note after a double-clicked save | Second distinct note after the first completes saves normally | Given I double clicked Save note on one note, When I save a different note, Then both appear once each |

## Manual verification plan
### Criterion 1: a quick double submit stores the note once
Prerequisites: the stack is running (backend, database, frontend at http://localhost:5183); browser DevTools open on the Network tab, filtered to `notes`.
1. Open `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the current note list.
2. Type `Double click check 1` in the "New note" field → the text is in the field.
3. Double click "Save note" as fast as you can → the field clears, and `Double click check 1` appears once at the bottom of the list.
4. In the Network tab, count the `POST` requests to `/api/notes` made by step 3 → exactly one.
5. Reload the page → `Double click check 1` is still listed exactly once.
6. Optional slow-network variant: in DevTools set throttling to "Slow 3G", type `Double click check 2`, click "Save note", then click it again before the field clears → the second click does nothing (the button is disabled while saving); after the save completes the note is listed once and the Network tab shows one `POST`.

### Criterion 2: the form accepts the next submit after a save finishes
Prerequisites: as for criterion 1.
1. On `http://localhost:5183/`, type `First after fix` and click "Save note" → the field clears and the note is listed.
2. Type `Second after fix` and click "Save note" → the field clears and `Second after fix` is listed below the first; the button is enabled again.
3. Stop the backend (for example stop its container or process), type `Retry after failure` and click "Save note" → the red message "The note could not be saved. Please try again." appears and the field still holds `Retry after failure`.
4. Start the backend again and click "Save note" without retyping → the message disappears, the field clears and `Retry after failure` is listed once.

### Automated check, before and after the fix
1. From the worktree root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → before the fix the test `sends one save request when the form is submitted twice while saving` fails; after the fix the run reports `0 failed`.
