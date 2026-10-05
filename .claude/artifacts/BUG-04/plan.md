# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (Tracker description is empty: no acceptance criteria and no comments were written on ClickUp task 123k99cx47m. The criteria below are derived from the title alone and every one is an assumption, per `user_story_alignment.md` Section 4, autonomous mode.)

## Acceptance Criteria
- [ ] AC1: Activating "Save note" twice in quick succession (double-click, or a second click/Enter while the first save is still in flight) stores the note exactly once: one `POST /api/notes`, one row in PostgreSQL, one entry in the on-page list, and still one entry after a page reload.
- [ ] AC2: Once the in-flight save settles, the form accepts the next save: after a success a different note can be saved, and after a failure the same text (kept in the field) can be retried.

## Re-Plan Feedback (if applicable)
- Comment (tracker): none on the item (0 comments read by the main session) → nothing to address.
- Assumption (empty description): AC1 is the literal reading of the title. AC2 is the regression guard that the fix must not leave the form stuck; it adds no new behaviour, it states that TEST-03's existing save and error-retry behaviour survives the guard.
- Assumption (scope): "twice quickly" means a repeat submit while the first request has not yet answered. Saving the same text again AFTER the first save has completed is a deliberate user action and stays allowed (notes have no uniqueness rule in TEST-03, and adding one would be new product behaviour).
- Assumption (layer): the fix is a frontend in-flight guard only; see Plan Overview for why no backend change is warranted.

## Plan Overview
Root cause, confirmed in the code: `frontend/src/components/NoteForm.tsx` `handleSubmit` awaits `createNote(...)` with no in-flight state, and the submit button is never disabled, so a second click or Enter while the first `POST` is pending fires a second `POST`. The backend (`notes.py` → `note_service.create_note` → `NoteRepository.insert_note`) does a plain `INSERT` per request by design, so two requests correctly produce two rows.

Fix (frontend only, one component): add an `isSaving` state to `NoteForm`. `handleSubmit` returns immediately when `isSaving` is true; otherwise it sets `isSaving` true before calling `createNote` and resets it in a `finally` block, so both the success and the failure path release the guard (AC2). The submit button gets `disabled={isSaving}`, which also blocks implicit (Enter-key) submission per the HTML form rules, and the early return covers any submit event that still reaches the handler. React 18 commits a discrete-event state update before the next input event is dispatched, so a state guard is sufficient; no ref is needed.

Why a frontend guard alone suffices and no backend change is warranted: the defect as titled is a single user's repeated submit, and the guard removes the second request at its source. Backend-side deduplication would need either a uniqueness constraint on `text` (wrong: it would forbid deliberately saving the same note twice, new product behaviour) or an idempotency-key protocol (new header, new column or table, new client wiring), which is gold plating for a validation sandbox whose Architecture Notes say "keep every feature as small as possible". Requests from other clients (curl, a second tab) are legitimately separate notes and out of scope.

Layers: frontend component + its Vitest tests, one Playwright spec, UAT artifacts. No backend, no API, no dependency, no schema change. `LandingPage.tsx` is NOT touched (the `onCreated` wiring is unchanged), which removes the conflict `feature_map.md` flagged against TEST-08 and TEST-10.

Reproduction (`/fix` Section R1): class `local-automated`, source `none` in the item (the tracker carries no steps), so the reproduction is a new test this fix writes that encodes the title's steps:
- Repro: local-automated: npm --prefix frontend test -- src/components/NoteForm.test.tsx (source: none; steps derived from the title)
The new test "submits once when the form is submitted twice while a save is in flight" renders `NoteForm` with `createNote` mocked to return a promise the test resolves by hand, submits twice, and asserts `createNote` was called once. On the code before the fix it records `result=fail` (two calls); after the fix it passes. The builder writes this test first, runs `repro-check.sh ... --phase before` on it, then implements the fix (R2).

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` only. Add `const [isSaving, setIsSaving] = useState(false)`; in `handleSubmit`, after `event.preventDefault()`, `if (isSaving) return;` (placed before the empty-note check so a repeat submit never re-validates either); wrap the `createNote` call in `setIsSaving(true)` / `try ... catch ... finally { setIsSaving(false) }`, keeping the existing success branch (clear error, clear text, `onCreated`) and failure branch (`SAVE_FAILED_MESSAGE`, text kept) unchanged. Add `disabled={isSaving}` to the `note-submit` button, and a disabled style (`cursor: "not-allowed"`, `opacity: 0.6`) so the disabled state is visible. No label change, no spinner, no new testid.
- Routes: none.
- State management: local component state (`useState`), as the component already uses for `text` and `error`.
- Design reference notes: AI freestyle (Design Reference mode NONE). The only visual change is the disabled button: `opacity 0.6`, `cursor not-allowed`, every other button value unchanged from TEST-03 (`padding 0.5rem 1rem`, `font-size 1rem`, `font-weight 600`, `color #ffffff`, `background #1a1a1a`, `radius 0.375rem`).

## Backend Plan
No backend changes required. The router, service and repository insert exactly one row per request, which is correct; the duplicate comes from the client sending two requests (see Plan Overview for why backend deduplication is out of scope).

## API Integration Plan
No external API integration.

## API Contract
Unchanged from TEST-03; listed so the E2E assertions have a reference.
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`
- The fix changes how many times the client sends this request (once per user save), not its shape.

## Technology Selection
- In-flight guard: chose React's built-in `useState` plus the native `disabled` attribute on the existing `<button type="submit">` over a debounce/throttle helper or a new dependency (lodash, a form library), because the native disabled button already blocks clicks and implicit Enter submission, and one boolean covers the handler; nothing net-new is installed.
- Backend idempotency: chose no backend change over a database UNIQUE constraint or an idempotency-key header, because the constraint would forbid legitimate repeat notes and the key protocol is new infrastructure the title does not ask for.
- No other net-new component, module or dependency is introduced.

## File Manifest
<!-- Phase tags: [0S]=Infrastructure Scaffolding, [A]=Frontend Plan, [B]=Backend Plan, [C]=API Integration Plan, [D]=Testing Strategy, [G]=Acceptance Test Outline, [Docs]=- -->

### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec: double-click on "Save note" with the POST delayed stores one note (one POST, one list item, one item after reload); edge case: Enter pressed twice while in flight also stores one
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus one edge case (Enter key)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add `isSaving` state, early return while saving, `finally` reset, `disabled={isSaving}` and disabled style on the submit button
- [A] frontend/src/components/NoteForm.test.tsx: add the reproduction test (two submits while in flight → one `createNote` call) plus tests for the disabled button while saving, re-enable after success, and retry after failure

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests (Vitest, frontend component level, `createNote` mocked as TEST-03's tests already do):
  - Directory: `frontend/src/components/` (co-located `*.test.tsx`, the frontend's existing convention; `CLAUDE.md` unit naming applies to the backend)
  - File: `frontend/src/components/NoteForm.test.tsx`
  - New cases: (1) REPRODUCTION, `submits once when the form is submitted twice while a save is in flight`: mock `createNote` with a manually resolved promise, type "Buy milk", `fireEvent.submit` the form twice (exercises the handler guard independently of the disabled button), assert one call, resolve, assert `onCreated` called once; (2) `disables the save button while a save is in flight` (button disabled after click, a second click sends nothing); (3) `re-enables the save button after a successful save so the next note can be saved` (second distinct note saved → two calls total, each with its own text); (4) `re-enables the save button after a failed save and keeps the text for a retry` (first call rejects, button enabled, text kept, retry calls `createNote` again).
  - Existing TEST-03 cases stay unchanged and must keep passing.
- Integration tests: not warranted. No repository, model, migration or router code changes (`testing_standards.md` Section 6 questions 2 and 3 answer no); the existing `backend/tests/integration/test_notes_integration.py` stays as is.
- E2E tests (Playwright):
  - Directory: `e2e/tests/`
  - File: `e2e/tests/BUG-04_double_submit_note.spec.ts`
  - Reuse TEST-03's spec patterns locally (exact-path `isNotesApiRequest` matcher, unique note text via `randomUUID`, wait for the mount `GET` before interacting). Make the race deterministic with `page.route` on the `POST /api/notes` path that waits about 500 ms then `route.continue()`, so the second activation always lands while the first request is in flight. Do not depend on backend speed.
  - Spec 1 (AC1): fill a unique text, `dblclick()` the `note-submit` button, wait for the 201, assert exactly one recorded POST, exactly one list item with that text, then reload and assert still exactly one item with that text (proves one stored row).
  - Spec 2 (edge case, AC1): fill a unique text, press Enter in `note-input` twice in a row, assert one POST and one list item.
- UAT scenarios: enabled.
  - Directory: `e2e/uat/scenarios/` and `e2e/uat/scripts/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Double activation of "Save note" while in flight stores the note once (one POST, one row, one list entry, one after reload) | E2E (plus the Unit reproduction test) | — |
| 2 | After the in-flight save settles, the form accepts the next save (success → next note; failure → retry) | Unit | Verifying it needs no navigation or real backend: it is the component's guard-release logic (`finally` reset), and the failure path needs a rejected `createNote`, which a mocked API gives deterministically and the browser tier cannot produce without breaking the backend; TEST-03's E2E already covers a plain successful save |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double activation stores once | Delay POST with `page.route`, `dblclick` submit, assert one POST, one list item, one item after reload; edge: Enter twice | Given the landing page with the POST slowed, When I double-click "Save note" on a new note, Then exactly one copy of the note is listed, also after reload |
| 2 | Form accepts the next save after settle | covered at Unit, see Criterion coverage | Given a note was just saved, When I type a second note and click "Save note", Then both notes are listed once each |

## Manual verification plan
### Criterion 1: Double activation of "Save note" while in flight stores the note once
Prerequisites: the stack is running (`docker compose up`), the frontend is open at http://localhost:5183 in Chrome, and DevTools is open on the Network tab with throttling set to "Slow 3G" so the save takes long enough to click twice.
1. Navigate to `/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the saved-notes list.
2. Type `Double click check 1` in the "New note" field → the text is in the field.
3. Double-click "Save note" quickly → the button greys out (disabled) while the save is pending; the Network tab shows exactly one `POST notes` request.
4. Wait for the request to finish → `Double click check 1` appears exactly once in the list, the field is empty, and the button is enabled again.
5. Reload the page (Cmd+R) → `Double click check 1` is still listed exactly once.
6. Type `Enter key check 1`, then press Enter twice quickly → exactly one `POST notes` request in the Network tab, and `Enter key check 1` appears exactly once in the list.

### Criterion 2: After the in-flight save settles, the form accepts the next save
Prerequisites: as Criterion 1, throttling may be switched back to "No throttling".
1. Navigate to `/`, type `First note A`, click "Save note" → `First note A` is listed and the button is enabled.
2. Type `Second note B`, click "Save note" → `Second note B` is listed below `First note A`; each appears once.
3. Stop the backend (`docker compose stop backend`), type `Retry note C`, click "Save note" → the red message "The note could not be saved. Please try again." appears, `Retry note C` stays in the field, and the button is enabled (not stuck greyed out).
4. Start the backend again (`docker compose start backend`), wait until it answers, click "Save note" → `Retry note C` is listed exactly once and the error message disappears.
