# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task carries no description, no checklist and no actionable comments; the criteria below are derived from the title. See Re-Plan Feedback.)

## Acceptance Criteria
- [ ] Triggering Save twice in quick succession for one note (a double click on "Save note", or the form submitted twice before the first save answers) sends one create request and stores the note once; the list shows it once.
- [ ] While a save is in flight the "Save note" button is disabled, and it is enabled again once that save succeeds or fails, so a failed save can be retried.
- [ ] A save started after the previous save has finished is stored normally, even when its text is identical to the previous note (only concurrent submits are suppressed, never duplicate text).

## Re-Plan Feedback
- Comment (tracker): 34 comments read by the dispatching session, 0 actionable (all framework PR-opened notes from earlier runs) → Addressed by: nothing to act on; recorded so the read is visible.
- Comment (tracker): none; the item has no description → Addressed by: criteria derived from the title. Assumption: "twice quickly" means a second submit while the first create request is still in flight (the client has no guard against it today: `NoteForm.handleSubmit` awaits `createNote` with nothing preventing a re-entry). Criterion 3 is stated explicitly so the fix cannot over-reach into deduplicating identical text, which the title does not ask for.
- Comment (tracker): none → Addressed by: fix is client-side only. Assumption: a server-side idempotency key or unique constraint on note text is not requested and would forbid two legitimately identical notes (criterion 3); CLAUDE.md Architecture Notes ask for the smallest possible change. Not acted on.
- Merged since the last plan: n/a (fresh plan, plan base origin/main 0b16aad). Context only: origin/main history shows an earlier BUG-04 fix (89fa651, #701) later reset by ac6e44c; this plan is written against NoteForm.tsx as it stands at 0b16aad, which has no guard.

## Plan Overview
Frontend-only fix in `frontend/src/components/NoteForm.tsx`: add an in-flight guard to the submit handler. A `useRef<boolean>` flag is checked and set synchronously at the top of `handleSubmit` (after the empty-text validation), so a second submit event that arrives before React re-renders is ignored; a `useState<boolean>` `isSaving` drives `disabled` on the submit button. Both are cleared in a `finally` block after `createNote` settles, success or failure. No backend, API or schema change.

- Repro: local-automated: npm --prefix frontend test -- src/components/NoteForm.test.tsx (source: item title; the new double-submit unit tests encode it and fail on the current code because `createNote` is called twice)

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight ref guard plus `isSaving` state; `disabled={isSaving}` on the `note-submit` button; guard and state reset in `finally`). No other component changes; `LandingPage.tsx` is not touched.
- Routes: none.
- State management: local component state (`useState` for `isSaving`) plus a `useRef` flag for the synchronous re-entry check. The ref is needed because two submit events dispatched in the same tick both see the stale `isSaving` closure value; the disabled button alone does not stop a form submitted by Enter.
- Visual: the disabled button keeps the existing `buttonStyle` with `cursor: "not-allowed"` and `opacity: 0.6` while `isSaving` is true (existing inline-style convention of the file). Label stays "Save note".
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The existing contract is used as is:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201 `{"id": 7, "text": "Buy milk"}`

The fix changes how many times the client calls it, not the contract.

## Technology Selection
- In-flight guard: chose React's built-in `useRef` and `useState` plus the native `disabled` attribute on the submit `<button>` over a debounce/throttle utility or a new dependency (none installed covers it, and a debounce would also wrongly delay a legitimate single save); no new dependency.
- No net-new module or dependency: the change is inside an existing component and its existing test file, plus one new E2E spec using the already installed `@playwright/test`.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser spec, double click on Save with the POST held open, asserts one POST request and one list item, then a reload shows the note once
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard and `isSaving` state, `disabled` on the submit button, reset in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for double click, double form submit, disabled-while-saving, re-enabled after success and after failure, identical text saved twice sequentially

No dependency changes, so no lockfile entry. No project structure, run configuration, dependency or test infrastructure change, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (Vitest + Testing Library, existing file). `createNote` is mocked to return a deferred promise the test resolves or rejects, so the in-flight window is controlled without timers.
  - Directory: frontend/src/components/ (colocated, the project's existing frontend convention; CLAUDE.md's unit directory is the backend's)
  - Naming: existing `NoteForm.test.tsx`; tests named after the scenario, e.g. "sends one create request when Save is clicked twice while saving", "ignores a second form submit while the first save is in flight", "disables Save while a save is in flight", "re-enables Save after a failed save so it can be retried", "saves identical text again once the previous save finished"
- Integration tests: not warranted; no repository, model, migration or endpoint changes (testing_standards.md tier questions 2 and 3 answer no).
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: one spec for criterion 1, the only criterion whose verification needs real browser interaction (a real double click on the rendered button). It holds the POST open with `page.route` on the exact `/api/notes` POST and releases it from the test after the second click (a controlled promise, no fixed waits), records POST requests with the same exact-path matcher as TEST-03's spec, asserts exactly one POST, then one `note-list-item-*` with the unique text, then after `page.reload()` still exactly one. Edge-case spec: Enter pressed twice in the input while the POST is held, same assertions.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus the Enter-twice edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A quick double submit sends one create request and stores the note once | E2E (plus Unit as the reproduction) | — |
| 2 | Save is disabled while a save is in flight and re-enabled after success or failure | Unit | verifying it needs no navigation: it is component state observable with a mocked, deferred `createNote`, and the failure path is only reachable deterministically with a mock |
| 3 | A save after the previous one finished is stored normally, identical text included | Unit | verifying it needs no navigation: it is the guard's reset rule, two sequential submits against a mocked `createNote` asserting two calls |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Quick double submit stores the note once | Hold the POST with `page.route`, `dblclick` on `note-submit`, release, assert one POST and one list item, reload, still one | Given the landing page is open and "Buy milk" is typed, When the user double-clicks Save, Then the list shows "Buy milk" once and still once after reload |
| 2 | Save disabled in flight, re-enabled after | covered at Unit, see Criterion coverage | Given a save is in flight, When the user looks at Save, Then it is disabled, and When the save finishes, Then it is enabled |
| 3 | Sequential identical saves both stored | covered at Unit, see Criterion coverage | Given "Buy milk" was saved, When the user saves "Buy milk" again, Then the list shows it twice |

## Manual verification plan
### Criterion 1: A quick double submit sends one create request and stores the note once
Prerequisites: app stack running (backend and database up, frontend at http://localhost:5183); browser DevTools open on the Network tab, filtered to `notes`; optionally throttle to "Slow 3G" so the in-flight window is wide enough to hit by hand.
1. Open `http://localhost:5183/` → the "Task Notes" landing page shows the "New note" field and the "Save note" button.
2. Type `Double click check 1` in the "New note" field → the text appears in the field.
3. Double-click "Save note" as fast as possible → the Network tab shows exactly one `POST /api/notes` request.
4. Wait for the request to finish → the list shows `Double click check 1` exactly once and the field is empty.
5. Reload the page → the list still shows `Double click check 1` exactly once.
6. Type `Enter twice check 1` in the field and press Enter twice quickly → one `POST /api/notes` in the Network tab, and the note appears once in the list.

### Criterion 2: Save is disabled while a save is in flight and re-enabled after success or failure
Prerequisites: as Criterion 1, with Network throttling set to "Slow 3G".
1. On `http://localhost:5183/`, type `Disabled check` and click "Save note" once → while the request is pending the button is greyed out and does not respond to clicks.
2. Wait for the request to finish → the note appears in the list and "Save note" is clickable again.
3. Stop the backend container (or in DevTools, right-click the `/api/notes` request and choose "Block request URL"), type `Failure retry check`, click "Save note" → the error "The note could not be saved. Please try again." appears, the text stays in the field, and "Save note" is clickable again.
4. Restore the backend (or unblock the URL) and click "Save note" → the note `Failure retry check` appears once in the list.

### Criterion 3: A save after the previous one finished is stored normally, identical text included
Prerequisites: as Criterion 1, no throttling.
1. On `http://localhost:5183/`, type `Same text twice` and click "Save note" → the note appears in the list.
2. Type `Same text twice` again and click "Save note" → a second `Same text twice` entry appears, so the list shows it twice.
3. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → the NoteForm tests run with `0 failed`.
