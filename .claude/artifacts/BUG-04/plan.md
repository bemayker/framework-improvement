# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice
>
> (ClickUp task 123k99cx47m. The tracker item carries a title and no description; the acceptance criteria below are derived from the title and recorded as assumptions under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] 1. Clicking "Save note" twice in quick succession (a double-click) on a non-empty note stores that note once: exactly one `POST /api/notes` is sent, and the note appears once in the list, including after a page reload.
- [ ] 2. While a save is in flight the note form accepts no further submission (the "Save note" button is disabled); once that save finishes, whether stored or failed, the button is enabled again, so the next note can be saved and a failed save can be retried.

## Re-Plan Feedback
- Comment (tracker): none actionable. Every tracker comment on 123k99cx47m is a framework PR notice from an earlier run (per the dispatch) → Addressed by: not acted on, because none of them states a requirement.
- Assumption (item has no description, `user_story_alignment.md` Section 4): criterion 1 is the title restated as an observable outcome: one click burst, one request, one stored note, one list row. → Addressed by: the client-side in-flight guard in `NoteForm.tsx`.
- Assumption: criterion 2 is the minimum behaviour the fix needs so it does not regress TEST-03. A guard that never releases would block every later save, and TEST-03's "shows an error message and keeps the text when saving fails" case expects the user to be able to retry. → Addressed by: releasing the guard in a `finally` block.
- Assumption: the fix is client-side only. A server-side dedupe (unique constraint on `text`, or an idempotency key) is out of scope: the title reports a double submission from the form, and a unique constraint would also refuse two notes that legitimately share their text, which TEST-03 never forbade. → Addressed by: Backend Plan reads "No backend changes required", which also keeps this item off TEST-12's notes router, service and repository files.
- Assumption: Enter pressed twice in the input is the same defect as a double-click (both submit the form), and the same guard covers it. No separate criterion was added for it.
- Merged since the last plan: n/a (fresh plan, branched from current main d54252d1d8db2b912a99a01807955a1650da3ace; the sandbox reset removed every earlier BUG-04 build, so nothing of this item is on main).

## Plan Overview
A frontend-only defect fix in `frontend/src/components/NoteForm.tsx`. `handleSubmit` currently awaits `createNote` with nothing marking a save as in progress, so a second click (or a second Enter) during the first request's round-trip sends a second `POST /api/notes` and the backend stores the note twice. The fix adds an in-flight guard: a `useRef` flag checked and set synchronously at the top of `handleSubmit` (so two events in the same tick cannot both pass it), mirrored into a `useState` flag that sets the submit button's native `disabled` attribute while the save is pending. Both are released in a `finally` block, so success and failure each re-enable the form. No API, backend, schema or dependency change.

- Repro: local-automated: npm --prefix frontend test -- src/components/NoteForm.test.tsx (source: item, its title; the item has no description)

The reproduction is a new Vitest case in `NoteForm.test.tsx` written before the fix: `createNote` is mocked to return a promise that stays pending, "Save note" is clicked twice, and the test asserts `createNote` was called once. On main it records a call count of 2 and fails (Vitest exit 1); after the fix it passes. The command runs from the worktree root, with no worktree prefix in its paths.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard: `isSavingRef` from `useRef(false)` and `isSaving` from `useState(false)`; `handleSubmit` returns immediately when `isSavingRef.current` is true, before validation; sets both flags after validation passes and before `createNote`; clears both in `finally`; the submit button gets `disabled={isSaving}`). `frontend/src/components/LandingPage.tsx` is NOT modified: the parent's `onCreated` wiring is correct, the duplication happens before it.
- Routes: none new; the form lives on `/`.
- State management: component-local, as today. The ref is the guard (synchronous, immune to a render that has not happened yet); the state exists only to render the disabled button.
- Design reference notes: AI freestyle (Design Reference mode NONE). The only visual change is the disabled state of the existing "Save note" button: while disabled it keeps `buttonStyle` and adds `opacity: 0.6` and `cursor: "not-allowed"`; enabled styling is unchanged.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; the fix changes how often the frontend calls the existing endpoint, not the endpoint.
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight submit guard: chose React's `useRef` and `useState` (React is already installed) over a debounce or throttle helper (`lodash.debounce` is not installed, and a time window would still let a slow response through a second click), because the guard has to hold for exactly as long as the request is pending, which only the request's own completion knows.
- Blocking the second click in the UI: chose the native `disabled` attribute on the existing submit button over a click-swallowing handler or overlay, because a disabled submit button also stops implicit form submission by Enter, and the browser handles both.
- Dedupe at the database (a unique constraint) or an idempotency key: not chosen. It would refuse two legitimately identical notes and needs a schema and API change for a defect that originates in the form (see Re-Plan Feedback).
- No net-new dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser specs for criterion 1 (double-click sends one POST and lists the note once, also after reload) and the edge case (after a double-clicked save completes, a second distinct note saves normally)
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the in-flight guard (`useRef` plus `useState`), early return while saving, `finally` release, `disabled={isSaving}` on the submit button with the disabled style
- [A] frontend/src/components/NoteForm.test.tsx: add the reproduction case (two clicks while the first save is pending send one `createNote` call) and the criterion 2 cases (button disabled while pending; enabled again after a successful save; enabled again after a failed save and a retry sends a second call)

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (Vitest + Testing Library, matching the existing `NoteForm.test.tsx`). Cases: two clicks while a save is pending call `createNote` once (the reproduction); the submit button is disabled while a save is pending; it is enabled again after the save resolves; it is enabled again after the save rejects, and a retry calls `createNote` a second time. Existing cases stay green unchanged.
  - Directory: frontend/src/components/ (co-located, as every existing frontend test is; the `backend/tests/unit/` directory and `test_{module}_unit.py` naming in CLAUDE.md are the backend's)
  - Naming: `{Component}.test.tsx`, the existing frontend convention
- Integration tests: not warranted. No repository, model, migration or endpoint changes, so neither integration question of `testing_standards.md` Section 6 applies.
  - Directory: backend/tests/integration/ (untouched)
- E2E tests: criterion 1 through the real browser and backend: open `/`, wait for the mount `GET /api/notes`, fill a unique note, `dblclick()` "Save note", assert exactly one `POST /api/notes` was recorded, that one list item carries the text, and that it is still one after reload. Edge case: after the double-clicked save completes, fill a second unique note and click once; it saves and both notes are listed once. Reuse the TEST-03 spec's patterns (exact-path request matcher, unique note text via `randomUUID`, `data-testid` locators) inside the new spec file, without importing from or editing the TEST-03 spec.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus the edge case above.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A double-click on "Save note" stores the note once (one POST, one list row, also after reload) | E2E | — |
| 2 | While a save is in flight the form accepts no further submission; afterwards (stored or failed) the button is enabled again and a failed save can be retried | Unit | the in-flight window and the failed-save path are only reproducible deterministically with a pending or rejecting mocked `createNote`; no navigation is involved, and the browser path of the same guard is criterion 1's spec and its edge case |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double-click stores the note once | `dblclick()` on `note-submit` with a unique note, record POSTs on the exact `/api/notes` path, assert one POST, one `note-list-item-{id}` with the text, still one after `page.reload()` | Given the landing page is open, When I type a note and double-click "Save note", Then the note appears once in the list and still once after reloading |
| 2 | No submission while in flight; re-enabled after success or failure | covered at Unit, see Criterion coverage (the E2E edge case shows the form saving a second note after a double-click) | Given a save is in progress, When I look at "Save note", Then it is disabled, and when the save finishes it is enabled again |

## Manual verification plan
### Criterion 1: a double-click on "Save note" stores the note once
Prerequisites: the app stack is running (frontend at http://localhost:5183, backend reachable from it, database up); a desktop browser with DevTools.
1. Open http://localhost:5183/ → the "Task Notes" landing page shows the "New note" field, the "Save note" button and the notes list.
2. Open DevTools → Network, filter on `notes` → the page's initial `GET /api/notes` is listed.
3. Type `BUG-04 double click 1` in the "New note" field → the text shows in the field.
4. Double-click "Save note" quickly → exactly one `POST /api/notes` row appears in Network with status 201; the field clears; the list shows `BUG-04 double click 1` exactly once.
5. Reload the page → the list still shows `BUG-04 double click 1` exactly once.
6. Repeat steps 3 and 4 with `BUG-04 enter twice` in the field, pressing Enter twice quickly instead of double-clicking → one `POST /api/notes`, and `BUG-04 enter twice` listed once.

### Criterion 2: no submission while a save is in flight, and the form recovers afterwards
Prerequisites: as for criterion 1.
1. On http://localhost:5183/, in DevTools → Network, set throttling to "Slow 3G" → the throttling selector shows Slow 3G.
2. Type `BUG-04 slow save` in "New note" and click "Save note" once → while the `POST /api/notes` is pending, the "Save note" button is greyed out (reduced opacity, not-allowed cursor) and clicking it again sends no second request.
3. Wait for the request to finish → the button returns to its normal look, the field is empty, and `BUG-04 slow save` is listed once.
4. Set throttling to "Offline", type `BUG-04 retry after failure` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again.
5. Set throttling back to "No throttling" and click "Save note" → the error message disappears, the field clears, and `BUG-04 retry after failure` is listed once.
6. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → `0 failed` for `src/components/NoteForm.test.tsx`.
