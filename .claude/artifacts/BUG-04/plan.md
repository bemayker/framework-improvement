# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice

(Tracker task 123k99cx47m. The task's description is empty and there is no `docs/issues/BUG-04.md`, so the title above is the whole feature text. The acceptance criteria below are derived from it, and each derivation is recorded under `## Re-Plan Feedback`.)

## Acceptance Criteria
- [ ] 1. Submitting the note form a second time while the first save is still in flight (a double-click on "Save note", a second click, or Enter pressed again) sends exactly one `POST /api/notes`, stores exactly one note, and the note list shows it once.
- [ ] 2. While a save is in flight, the "Save note" button is disabled; it is enabled again once the save completes.
- [ ] 3. After a failed save, the guard is released: the button is enabled, the text is kept, and submitting again sends a new save request. The existing TEST-03 behaviours (empty and whitespace-only validation with no request, trimming, clearing the input on success) are unchanged.

## Re-Plan Feedback
- Item description: empty, no local `docs/issues/BUG-04.md`; only the title exists → Addressed by: deriving criteria 1 to 3 from the title, recorded here as assumptions because there is no human to ask (`user_story_alignment.md` Section 4, autonomous mode).
- Assumption (criterion 1): "twice quickly" means a second submission issued before the first `POST /api/notes` has returned. That window is the defect: `NoteForm.handleSubmit` (`frontend/src/components/NoteForm.tsx`) has no in-flight guard and the text is cleared only after the response, so every extra click or Enter during the request sends another POST with the same text.
- Assumption (scope): two deliberate submissions of the same text, the second made after the first save has completed, still store two notes. This bug is about a double submit, not duplicate-text detection. No backend uniqueness constraint, idempotency key or dedupe is added: that would reject notes a user legitimately repeats and is not asked for (`user_story_alignment.md` Section 3).
- Assumption (criterion 2): disabling the button while saving is part of the fix rather than an extra, because it is the native, visible way the form refuses the second submit. The button label stays "Save note"; no "Saving..." text or spinner is added.
- Assumption (criterion 3): the guard must not lock the form after an error, otherwise the fix would introduce a new defect (no retry after a failed save). Criterion 3 pins that, and the TEST-03 behaviours, as a regression floor.
- Comment (tracker): 39 comments across 2 pages, all the framework's own "PR opened" notes from earlier runs, none from a human and none actionable → not acted on, because they carry no requirement or correction.
- Merged since the last plan: n/a (fresh plan, branched from current main `4e346c0928bff70678230a2fa50136b542c91a77`).

## Reproduction
- Class: `local-automated` (the `/fix` R1 default).
- Repro: local-automated: `npm --prefix frontend test -- src/components/NoteForm.test.tsx` (source: item)
- The reproduction is a new Vitest test written into `frontend/src/components/NoteForm.test.tsx` **before** any change to `NoteForm.tsx`: `sends one save request when the form is submitted twice before the first save completes`. It mocks `createNote` with a promise held unresolved, types `Buy milk`, clicks `note-submit` twice, and asserts `createNote` was called exactly once. On the base commit the second click re-enters `handleSubmit` and calls `createNote` again, so the test fails (Vitest exit 1, `result=fail`); after the fix it passes.
- The companion test `sends one save request when the form is submitted twice via Enter before the first save completes` (two `fireEvent.submit` on `note-form`) also fails on the base and is the one that proves the guard lives in the submit handler and not only on the button.
- The command runs inside the item's worktree, so its paths are relative to the worktree (`--project .claude/worktrees/BUG-04 -- npm --prefix frontend test -- src/components/NoteForm.test.tsx`), never prefixed with it.

## Plan Overview
Frontend-only fix in `frontend/src/components/NoteForm.tsx`. `handleSubmit` gets a synchronous in-flight guard, a `useRef<boolean>` set before `createNote` is awaited and cleared in a `finally`, so a second submit event fired before React re-renders is dropped. A mirrored `isSaving` state drives the native `disabled` attribute on the "Save note" button. On success the input clears and `onCreated` runs as today; on failure the error shows, the text stays, and the guard is released so the user can retry. No backend, API, schema or `LandingPage.tsx` change. Tests: Vitest component tests (the reproduction plus the disabled and retry cases) and one Playwright spec that double-clicks in a real browser and checks one POST and one stored note.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify). Add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`, after `event.preventDefault()`, return immediately when `isSavingRef.current` is true. The empty and whitespace validation runs as today and does not set the guard. Before `await createNote(trimmedText)`, set `isSavingRef.current = true` and `setIsSaving(true)`. In a `finally`, set both back to false. Success and failure branches are otherwise unchanged. The button gets `disabled={isSaving}`, and its style switches to the disabled values below while `isSaving` is true. `data-testid`s (`note-form`, `note-input`, `note-submit`, `note-form-error`) are unchanged. The input stays editable while saving.
- Routes: none.
- State management: local to `NoteForm`, a ref for the synchronous guard and `useState` for the rendered disabled state. Both are needed, because state updates are not visible to a second event handler fired in the same tick, and a ref does not re-render.
- Design reference notes: AI freestyle (Design Reference mode NONE). Save button, enabled state, unchanged from TEST-03: padding 0.5rem 1rem, font-size 1rem, font-weight 600, color #ffffff, background #1a1a1a, no border, radius 0.375rem, cursor pointer. Disabled state (new): same values except opacity 0.6 and cursor not-allowed. Label stays "Save note" in both states.

## Backend Plan
No backend changes required.

The duplicate rows are caused by the client sending two requests. `POST /api/notes` storing each request it receives is correct behaviour, and a server-side dedupe is out of scope (see `## Re-Plan Feedback`, the scope assumption).

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The fix only changes how often the frontend calls the existing endpoint.
- Method: POST
- URL: `/api/notes` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: `{"text": "Buy milk"}`
- Response: 201 with `{"id": 12, "text": "Buy milk"}`

## Technology Selection
- In-flight submit guard: chose React's built-in `useRef` and `useState` (already installed) over a debounce or throttle helper (lodash or hand-written timer), because a time window would still let a slow request be duplicated and would drop legitimate later submits, while a flag cleared when the request settles matches the real condition exactly.
- Disabled button while saving: chose the native `disabled` attribute on the `<button>` over swallowing clicks in JavaScript, because the platform then blocks clicks and implicit Enter submission and exposes the state to assistive technology.
- Duplicate prevention location: chose the client over a database unique constraint or an idempotency key, because the defect is the client sending twice, and a constraint would also reject a note the user deliberately repeats.
- E2E request hold: chose Playwright's built-in `page.route` with a held `route.continue()` over a fixed timeout, because the spec must assert the in-flight state deterministically, and hardcoded waits are disallowed (`testing_standards.md` Section 1.3).
- No new dependency is added anywhere.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec double-clicking "Save note" while the POST is held, asserting one POST, the button disabled while held, and one stored note after reload
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: synchronous in-flight guard in `handleSubmit`, `isSaving` state, `disabled` and disabled styling on the save button, guard released in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: reproduction tests (double click, double submit via Enter) written first, plus the disabled-while-saving and retry-after-failure cases; existing TEST-03 cases kept unchanged

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component tests in Vitest with `../api/notes` mocked, as the file already does. A held promise (`new Promise` whose resolve or reject the test calls) keeps a save in flight without timers.
  - Directory: `frontend/src/components/` (colocated `*.test.tsx`, the existing frontend convention; CLAUDE.md's `backend/tests/unit/` is the backend's)
  - Naming: `{Component}.test.tsx`
- Integration tests: none. No router, service, repository or schema changes. `POST /api/notes` stays covered by `backend/tests/integration/test_notes_integration.py`.
  - Directory: `backend/tests/integration/`
- E2E tests: one spec for the user-visible defect. Open `/`, wait for the mount `GET /api/notes` (as the TEST-03 spec's `openLandingPage` does), route `POST /api/notes` to a handler that records the request and holds it, fill a unique text (`BUG-04 double ${randomUUID().slice(0, 8)}`), `dblclick` the `note-submit` button, assert it is disabled, release the held route, wait for the 201, then assert one recorded POST, exactly one list item with that text, and still one after `page.reload()`. Edge case: after the save completes, the button is enabled again. Match the API call on exact pathname and method, not a substring (the TEST-03 spec explains why).
  - Directory: `e2e/tests/`
  - File: `BUG-04_double_submit_note.spec.ts`
- UAT scenarios: one per criterion plus an edge case (two deliberate saves of the same text after the first completes store two notes, recording the scope assumption).
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A second submit while the first save is in flight sends one POST and stores one note | E2E | `stores one note when Save note is double-clicked`, `sends one save request when the form is submitted twice before the first save completes`, `sends one save request when the form is submitted twice via Enter before the first save completes` | — |
| 2 | The save button is disabled while a save is in flight and enabled again after | Unit | `disables the save button while a save is in flight and re-enables it after success` | Verifying it needs no navigation: it is a rendered attribute of one component across a held promise, which a component test controls exactly. The E2E spec also asserts the disabled state while the POST is held |
| 3 | After a failed save the guard is released and saving again sends a new request; TEST-03 behaviours unchanged | Unit | `re-enables saving after a failed save so the note can be saved on retry`, `saves a non-empty note, clears the input, and reports the stored note`, `treats a whitespace-only note as empty and makes no API call` | Verifying it needs no navigation: it is the submit handler's error path and existing validation, and forcing a server failure in a browser adds nothing a rejected mock does not |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | One POST and one stored note on a quick double submit | Hold `POST /api/notes` with `page.route`, `dblclick` `note-submit`, release, assert one recorded POST, one list item with the text, and one after reload | Given the landing page is open, When I type a note and double-click "Save note", Then the note appears once and is still once after reload |
| 2 | Button disabled while saving | covered at Unit, see Criterion coverage; the E2E spec also asserts `toBeDisabled()` while held | Given a save is in progress, When I look at "Save note", Then it is disabled until the save finishes |
| 3 | Retry after failure, TEST-03 unchanged | covered at Unit, see Criterion coverage | Given the save failed, When I click "Save note" again, Then a new save is attempted and the note is stored |

## Manual verification plan
Common prerequisites for every criterion: the stack is running locally, with the backend on `http://localhost:8010` and the frontend on `http://localhost:5183`, and the browser is Chrome with DevTools available.

### Criterion 1: A second submit while the first save is in flight sends one POST and stores one note
Prerequisites: common prerequisites; DevTools open on the Network tab, filter `notes`.
1. Set the Network throttling dropdown to "Slow 3G" → the dropdown shows "Slow 3G", so each save stays in flight for a few seconds.
2. Open `http://localhost:5183/` and wait for the page to load → the "Task Notes" heading, the "New note" field and the "Save note" button are visible.
3. Type `Double click check 1` in the "New note" field → the field shows the text.
4. Double-click "Save note" quickly → the Network tab lists exactly one `POST http://localhost:8010/api/notes` request.
5. Wait for that request to finish → the note list shows `Double click check 1` once, and the field is empty.
6. Type `Enter twice check 1` in the field, then press Enter twice quickly → exactly one more `POST /api/notes` appears, and `Enter twice check 1` appears in the list once.
7. Set throttling back to "No throttling" and reload the page → `Double click check 1` and `Enter twice check 1` each appear exactly once in the list.

### Criterion 2: The save button is disabled while a save is in flight and enabled again after
Prerequisites: common prerequisites; Network throttling set to "Slow 3G".
1. Open `http://localhost:5183/`, type `Disabled state check` in the "New note" field → "Save note" is dark (#1a1a1a) at full opacity.
2. Click "Save note" once and look at the button while the `POST /api/notes` is pending → the button is faded (opacity 0.6), the cursor over it is "not-allowed", and clicking it does nothing (no new request in the Network tab).
3. Wait for the request to finish → the button returns to full opacity with a pointer cursor, and `Disabled state check` is in the list once.
4. Set throttling back to "No throttling".

### Criterion 3: After a failed save the guard is released, and TEST-03 behaviours are unchanged
Prerequisites: common prerequisites; DevTools Network request blocking enabled (Cmd+Shift+P, "Show Network request blocking") with the pattern `*/api/notes` ticked after the page has loaded.
1. Open `http://localhost:5183/` with the pattern unticked, then tick `*/api/notes` → the pattern is listed and checked.
2. Type `Retry check` in the "New note" field and click "Save note" → the request shows as `(blocked:devtools)`, the red message "The note could not be saved. Please try again." appears, the field still reads `Retry check`, and "Save note" is enabled.
3. Untick the blocking pattern and click "Save note" again → a new `POST /api/notes` returns 201, `Retry check` appears in the list once, the field is empty and the red message is gone.
4. With the field empty, click "Save note" → "Enter a note before saving." appears and no `POST /api/notes` is sent.
5. Type three spaces in the field and click "Save note" → the same validation message appears and no request is sent.
6. Type `  Trim check  ` (two spaces either side) and click "Save note" → the list shows `Trim check` with no surrounding spaces.
7. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → the run includes the three reproduction and guard tests named in `### Criterion coverage` and reports `0 failed`.
