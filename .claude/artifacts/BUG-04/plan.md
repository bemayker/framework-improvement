# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice
>
> (ClickUp task 123k99cx47m, a defect item. The tracker description is empty; the title above is the whole item text. The criteria below are derived from it, see `## Re-Plan Feedback`.)

## Acceptance Criteria
- [ ] 1. Submitting the note form twice in quick succession (double-clicking "Save note", or pressing Enter twice in the note field) sends exactly one save request, and the note appears once in the list, also after a page reload.
- [ ] 2. Once a save has completed or failed, the form accepts the next save: a new note can be saved after a success, and the same note can be retried after a failure.

## Re-Plan Feedback
- Comment (tracker): none actionable. The item's tracker comments are framework PR notices only, so nothing here changes the plan. → Addressed by: not acted on because none carries feedback on the item.
- Assumption (tracker description empty): the item carries a title and no description, steps or criteria. Criterion 1 is the title restated as an observable outcome; criterion 2 is the guard that keeps the fix from locking the form (a fix that blocks every later save would satisfy criterion 1 and break TEST-03). Recorded as a scope change per `user_story_alignment.md` Section 4. → Addressed by: the two criteria above.
- Assumption (where the fix lives): the duplicate comes from the client. `NoteForm.handleSubmit` has no in-flight guard, so a second submit event before the first `createNote` resolves sends a second `POST /api/notes`. The fix is a client-side in-flight guard in `frontend/src/components/NoteForm.tsx`. A server-side dedupe is not planned: a unique constraint on note text would forbid two legitimately identical notes, and an idempotency key is a new API contract the title does not ask for (`user_story_alignment.md` Section 3). This also keeps BUG-04 off the notes router, service and repository that TEST-12 edits. → Addressed by: Frontend Plan only; Backend Plan says no changes.
- Merged since the last plan: n/a (fresh plan on plan base 174a1e09cbf5d30c23699012f94b3fc0d1fa375e; no `[merged-since]` lines in the dispatch). An earlier BUG-04 fix (5a927f2b) was removed from main by the reset 7508f8f4, so the defect is present on the plan base and this plan rebuilds the fix.

## Plan Overview
Frontend-only defect fix. `NoteForm` gains an in-flight guard: while a `createNote` call is pending, a further submit is ignored and the "Save note" button is disabled; the guard clears when the call settles, success or failure. A reproduction test drives the component's own entry point (two submits through the rendered form against a pending `createNote` mock) and fails on the plan base, then passes on the fix. One Playwright spec double-clicks the real button against the real backend and asserts one `POST` and one list entry. No backend, schema or API change.

- Repro: local-automated: npm --prefix frontend test -- src/components/NoteForm.test.tsx (source: item)

The reproduction test is `sends one save request when the form is submitted twice quickly` in `frontend/src/components/NoteForm.test.tsx`, written before the source change (fix Section R2). On the plan base it records vitest's failing-test exit 1, because `createNote` is called twice; on the fix it passes. Source is `item`: the title is the item's only reproduction (submit twice quickly).

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify).
  - Add `const [isSaving, setIsSaving] = useState(false)` for the rendered state, and `const isSavingRef = useRef(false)` as the guard read inside `handleSubmit`. The ref is the guard because two submit events dispatched before React re-renders (Enter pressed twice, or two events in one batch) would both read a stale `isSaving === false`; the state only drives the `disabled` attribute.
  - In `handleSubmit`, after `event.preventDefault()`: return immediately when `isSavingRef.current` is true (no request, no message change). Keep the existing empty and whitespace validation unchanged and before the guard is set, so a rejected empty note never sets it.
  - Set `isSavingRef.current = true` and `setIsSaving(true)` immediately before `await createNote(trimmedText)`; clear both in a `finally` block so success and failure both release the form.
  - `<button data-testid="note-submit" type="submit" disabled={isSaving}>`: the native `disabled` attribute, no label change, no spinner.
- Routes: none (the form lives on `/`, rendered by `LandingPage`; `LandingPage.tsx` is not modified).
- State management: local component state plus one ref, as above; no store.
- Design reference notes: AI freestyle (Design Reference mode NONE). No visual change beyond the browser's native disabled state on the existing button; the existing `buttonStyle` values (padding 0.5rem 1rem, 1rem, 600, #ffffff on #1a1a1a, radius 0.375rem) are unchanged.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form keeps calling the existing endpoint through `frontend/src/api/notes.ts` (`createNote`), which this plan does not modify:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

The fix changes how many times it is called (once per save), not its shape.

## Technology Selection
- In-flight submit guard: chose React's built-in `useRef` and `useState` with the native `<button disabled>` attribute over a debounce or throttle helper (lodash or a hand-written timer), because a time window either drops a legitimate second save or still lets a slow request through, while a pending-request flag is exact; no dependency is added.
- Server-side duplicate prevention: chose no change over a database unique constraint on note text (rung 2, a database constraint over application code), because the constraint would also forbid two deliberately identical notes, which no criterion asks to forbid.
- Reproduction and E2E tests: Vitest with Testing Library and Playwright, both already installed; no new test dependency.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: double-clicks "Save note" on `/` against the real backend and asserts one `POST /api/notes`, one list entry, and one entry after reload
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus state), `finally` release, `disabled={isSaving}` on the submit button
- [A] frontend/src/components/NoteForm.test.tsx: reproduction test written first, plus the two release tests named in `### Criterion coverage`

No dependency is added or changed, so no lockfile changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (the file's existing `vi.mock("../api/notes")`). The reproduction test uses a `createNote` mock returning a promise the test resolves by hand, submits twice before resolving it, and asserts one call; the release tests resolve, then reject, and assert a second submit calls `createNote` again. Existing tests in the file stay unchanged and must keep passing.
  - Directory: co-located in `frontend/src/components/` (project standards: frontend tests co-located as `*.test.tsx`)
  - Naming: `NoteForm.test.tsx` (existing file)
- Integration tests: not warranted. No router, service, repository or schema changes; the endpoint's single-note behaviour is already covered by TEST-03's integration tests.
  - Directory: backend/tests/integration/ (no file added)
- E2E tests: one spec reproducing the reported user action (double-click on "Save note") against the running stack, with the TEST-03 spec's exact-path request matcher (`pathname === "/api/notes"` and method `POST`) and a unique note text per test.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one per criterion plus one edge case (double press of Enter in the field).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | Submitting the form twice in quick succession sends one save request and the note appears once, also after reload | E2E | `stores a double-clicked note only once`, `sends one save request when the form is submitted twice quickly` | — |
| 2 | Once a save has completed or failed, the form accepts the next save | Unit | `accepts a new save once the previous save has completed`, `accepts a retry once the previous save has failed` | verifying it needs no navigation: it is the form's release of its own in-flight state, observable by settling the mocked `createNote` and submitting again |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double submit stores one note | On `/`, wait for the mount `GET /api/notes`, record every `POST /api/notes`, fill a unique text, `dblclick()` the `note-submit` button, wait for the 201 response and the `note-list-item-{id}` entry; assert one recorded POST and `getByText(noteText)` count 1; reload and assert count 1 again | Given the landing page is open, When I type a note and double-click Save note, Then the note is listed once, And after reload it is still listed once |
| 2 | Form accepts the next save after success or failure | covered at Unit, see Criterion coverage | Given a note was just saved, When I type a second note and click Save note, Then the second note is listed; Given saving failed, When I click Save note again with the backend back, Then the note is listed once |

## Manual verification plan
### Criterion 1: Submitting the form twice in quick succession sends one save request and the note appears once, also after reload
Prerequisites: the stack is running (`docker compose up -d` at the repo root), the app is open at `http://localhost:5183/`, and the browser's developer tools are open on the Network tab filtered to `notes`.
1. Open `http://localhost:5183/` → the "Task Notes" heading, the "New note" field and the "Save note" button are shown; the Network tab shows one `GET /api/notes`.
2. Type `BUG-04 double click 1` in the "New note" field → the text is shown in the field.
3. Double-click "Save note" as fast as you can → the field clears and `BUG-04 double click 1` appears once at the end of the note list; the Network tab shows exactly one `POST /api/notes` with status 201.
4. Type `BUG-04 double enter 1` in the "New note" field, then press Enter twice quickly → `BUG-04 double enter 1` appears once in the list; the Network tab shows one more `POST /api/notes`, not two.
5. Reload the page → `BUG-04 double click 1` and `BUG-04 double enter 1` are each listed exactly once.
6. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repo root → the run passes: its summary line reports no failed or errored test and the command exits 0.

### Criterion 2: Once a save has completed or failed, the form accepts the next save
Prerequisites: as for criterion 1, with the app open at `http://localhost:5183/`.
1. Type `BUG-04 after success A` and click "Save note" once → the note appears in the list and the field clears.
2. Type `BUG-04 after success B` and click "Save note" once → `BUG-04 after success B` appears in the list; the button was not left disabled by the first save.
3. In the developer tools Network tab, set throttling to "Slow 3G", type `BUG-04 slow save` and click "Save note" once → while the request is pending the "Save note" button is disabled and a second click does nothing; when the request completes the note appears once and the button is enabled again. Set throttling back to "No throttling".
4. Run `docker compose stop backend` at the repo root, type `BUG-04 retry` and click "Save note" → the message "The note could not be saved. Please try again." appears, the field still holds `BUG-04 retry`, and the "Save note" button is enabled.
5. Run `docker compose start backend`, wait until `docker compose ps backend` shows it running, then click "Save note" again → the error message disappears and `BUG-04 retry` appears once in the list.
6. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repo root → the run passes: no failed or errored test on its summary line, exit code 0.
