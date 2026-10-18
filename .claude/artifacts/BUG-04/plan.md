# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m carries no description; the title is the whole feature text. The acceptance criteria below are derived from it, and each derivation is recorded under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] 1. Submitting the note form a second time while the first save of that note is still in flight (a double-click on "Save note", or a click followed by Enter in the field) sends exactly one `POST /api/notes`, and the note is stored and listed once.
- [ ] 2. The "Save note" button is disabled while a save is in flight and is enabled again once the save completes.
- [ ] 3. After a save completes, successfully or with an error, the form accepts the next submit: a new note can be saved, and a failed save can be retried.

## Re-Plan Feedback
- Comment (tracker): 5 comments read on the ClickUp task, all mayker-dev PR notices from earlier runs → not acted on because none states a requirement, correction or amendment (the dispatching session classified all 5 as non-actionable; this plan received no comment text to quote).
- Assumption (no description on the item): "twice quickly" is read as a second submit of the SAME save action before the first request has returned (double-click, or click plus Enter). → Addressed by: criterion 1, fixed client-side in NoteForm with an in-flight guard.
- Assumption: two deliberate, sequential saves of identical text remain allowed (the app has never deduplicated note text, and TEST-03 defines no uniqueness rule). → Addressed by: criterion 3, and by NOT adding a backend uniqueness constraint or dedupe; a server-side dedupe would invent a product rule the item does not ask for and would collide with TEST-12 in the notes router, service and repository.
- Assumption: disabling the button is the user-visible part of the fix; no "Saving..." label, spinner or new style is added (scope containment, `user_story_alignment.md` Section 3). → Addressed by: criterion 2, using the native `disabled` attribute only.
- Dispatch scope note: TEST-09 (backend/app/main.py) and BUG-01 (server_time.py) are in flight concurrently; this plan touches neither. TEST-08 and TEST-10 were flagged as sharing frontend/src/components/LandingPage.tsx; this plan does NOT modify LandingPage.tsx (the fix lives entirely in NoteForm), so that overlap does not materialize.
- Merged since the last plan: n/a (fresh plan, branched from current main at 68540ede).

## Defect Reproduction
Classified for the main session (/fix Section R1). Current behaviour on main at 68540ede:
1. `frontend/src/components/NoteForm.tsx` `handleSubmit` has no in-flight state. It awaits `createNote(trimmedText)` and only clears the field after the response, so the field still holds the text and the button is still enabled while the request is pending.
2. A second submit event during that window (second click of a double-click, or Enter in the field) runs `handleSubmit` again with the same text and issues a second `POST /api/notes`.
3. The backend stores each POST as a new row (no uniqueness on note text), and `LandingPage` appends each returned note, so the list shows the note twice with two ids.

Deterministic reproduction (unit, Vitest, fails on main): mock `createNote` with a promise that never resolves during the test, type "Buy milk", click `note-submit` twice → `createNote` is called 2 times (expected 1).

Browser reproduction (E2E, Playwright, fails on main): on `/`, hold the `POST /api/notes` request with `page.route` until released, fill "BUG-04 double <uuid>", click `note-submit`, press Enter in `note-input`, release the route → 2 POST requests recorded and 2 list items carry the text (expected 1 and 1).

Manual reproduction: open http://localhost:5183/, open DevTools Network and set throttling to "Slow 3G", type "Buy milk twice", double-click "Save note" → two `POST /api/notes` rows in Network and "Buy milk twice" appears twice in the list.

Root cause: missing client-side in-flight guard in NoteForm. Not a backend defect.

## Plan Overview
Frontend-only fix in one component. NoteForm gains an in-flight guard: a `useRef` boolean checked and set synchronously at the top of `handleSubmit` (so two submit events in the same tick cannot both pass it), mirrored by an `isSaving` state that sets the native `disabled` attribute on the submit button. Both are released in a `finally` block, so success and failure both re-open the form. No backend, API, routing or LandingPage change. Tests: Vitest unit tests in NoteForm.test.tsx for all three criteria, plus one Playwright spec for the browser double-submit.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` only.
  - Add `const isSubmittingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`.
  - In `handleSubmit`, after `event.preventDefault()`: return immediately when `isSubmittingRef.current` is true (no request, no error message change). Keep the existing empty and whitespace validation exactly as it is, before the guard is taken, so an empty submit never disables the button.
  - Before calling `createNote`: set `isSubmittingRef.current = true` and `setIsSaving(true)`. Wrap the existing try/catch in try/catch/finally; in `finally` set `isSubmittingRef.current = false` and `setIsSaving(false)`.
  - Submit button: add `disabled={isSaving}`. Label, testid, type and styles unchanged.
  - Why a ref as well as state: the ref is read and written synchronously, so it blocks a second submit event dispatched before React re-renders the disabled button (Enter in the still-enabled input, or a second click delivered in the same tick). The state exists only to render `disabled`.
- Routes: none (the form stays on `/`).
- State management: component-local (`useRef` plus `useState`); `LandingPage` and its `onCreated` wiring are unchanged.
- Design reference notes: AI freestyle (Design Reference mode NONE). No visual change is planned: the button keeps `buttonStyle`; the browser default for a disabled button (cursor, no activation) is the only difference.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; the existing internal endpoint is consumed as before, once per save.
- Method: POST
- URL: /api/notes
- Request: JSON object with one string field `text` (trimmed, 1 to 500 characters), unchanged from TEST-03.
- Response: 201 with the stored note (`id` integer, `text` string), unchanged from TEST-03. The only contract-level change is behavioural: one form save action produces at most one such request.

## Technology Selection
- In-flight submit guard in NoteForm: chose React `useRef` plus `useState` (already installed, React core) over adding a debounce or throttle utility or a form library (none installed, and a time-based debounce would still let a slow request be submitted twice); no new dependency.
- Blocking the button while saving: chose the native HTML `disabled` attribute on the existing `<button>` over a custom click-swallowing handler or a styled overlay, because the platform already removes a disabled button from activation for both mouse and keyboard.
- Server-side deduplication (a database unique constraint or an idempotency key): considered and not chosen, because the defect is a duplicated client action, not a data rule; a unique constraint on note text would forbid deliberate identical notes, which criterion 3 keeps allowed.
- No net-new component, module or dependency is introduced; the two new test cases files listed below extend the existing Vitest and Playwright setups.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec for criterion 1 (click then Enter while the POST is held in flight sends one request and lists the note once) plus the edge-case spec (double-click on Save note sends one request)
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual step-by-step UAT clickthrough, expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the `useRef` in-flight guard and `isSaving` state, release both in `finally`, set `disabled` on the submit button while saving
- [A] frontend/src/components/NoteForm.test.tsx: Vitest cases for a second submit while pending (one `createNote` call), button disabled while pending and enabled after, form re-usable after success and after a failed save

No dependency changes, so no lockfile is regenerated. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit. frontend/src/components/LandingPage.tsx and every backend file are deliberately untouched.

## Testing Strategy
- Unit tests: NoteForm component behaviour with `createNote` mocked (Vitest plus Testing Library, existing `vi.mock("../api/notes")` pattern). Hold the save in flight with a manually resolved promise (create the promise, keep its resolve and reject functions, resolve or reject it inside `act`), never with timers. New cases in `frontend/src/components/NoteForm.test.tsx`:
  - a second click on `note-submit` while the first save is pending calls `createNote` once (fails on main; this is the regression test for the reproduction);
  - a form submit (Enter path, `fireEvent.submit` on `note-form`) while pending calls `createNote` once;
  - `note-submit` is disabled while pending and enabled after the promise resolves;
  - after a rejected save, `note-submit` is enabled, the error is shown, and a second submit calls `createNote` again (2 calls total);
  - after a successful save, a new note can be typed and saved (2 calls total, one per note);
  - an empty submit does not disable the button (guard is taken only after validation).
  - All existing NoteForm cases stay as they are.
  - Directory: frontend/src/components/ (the project co-locates frontend Vitest files beside the component; the backend unit directory backend/tests/unit/ does not apply to frontend code)
  - Naming: `NoteForm.test.tsx`, matching the existing co-located convention
- Integration tests: not warranted. The fix adds no endpoint, repository, model or migration (`testing_standards.md` Section 6), and the backend contract is unchanged.
  - Directory: backend/tests/integration/ (no file added)
- E2E tests: criterion 1 only, because it is the one criterion whose failure is a real browser double-submit against the real backend and list. Hold the `POST /api/notes` with `page.route` until the second submit has been issued, then `route.continue()`; no fixed waits. Reuse the TEST-03 spec patterns (exact-path request matcher, unique note text per test, wait for the mount `GET /api/notes` before interacting), defined locally in the new spec rather than editing TEST-03.
  - Spec A: fill text, click `note-submit`, press Enter in `note-input`, release the route → exactly 1 POST recorded, exactly 1 `note-list` item with that text.
  - Spec B (edge case): fill text, `dblclick` on `note-submit` with the route held, release → exactly 1 POST recorded and 1 matching list item.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (double-click), and the manual script expanded from the Manual verification plan below.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A second submit while the first save is in flight sends one POST and the note is stored and listed once | E2E (plus the Unit regression case) | — |
| 2 | Save note is disabled while a save is in flight and enabled again once it completes | Unit | verifying it needs no navigation: it is component state, asserted deterministically by holding the mocked save pending, which a browser test can only approximate with a held route |
| 3 | After a save completes (success or error) the form accepts the next submit | Unit | verifying it needs no navigation: it is the guard being released in `finally`, asserted by resolving or rejecting the mocked save and submitting again |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | One POST and one listed note per save action | Hold POST with page.route, click Save note then press Enter, release; assert 1 POST and 1 list item (Spec A); double-click variant as edge case (Spec B) | Given the landing page, When I click Save note twice before the save finishes, Then the note appears once in the list |
| 2 | Button disabled while saving | covered at Unit, see Criterion coverage | Given a slow save, When I click Save note, Then the button is disabled until the note appears |
| 3 | Form usable again after success or failure | covered at Unit, see Criterion coverage | Given a save that failed, When I click Save note again, Then the note is saved and listed once |

## Manual verification plan
### Criterion 1: A second submit while the first save is in flight sends one POST and the note is stored and listed once
Prerequisites: the app stack is running (frontend at http://localhost:5183, backend and PostgreSQL up), Chrome or Edge with DevTools available.
1. Open http://localhost:5183/ → the "Task Notes" heading, the "New note" field and the "Save note" button are visible, with any existing notes listed below.
2. Open DevTools, Network tab, set throttling to "Slow 3G", and type `fetch` in the filter box → the request list is empty or shows only earlier calls.
3. Type `Double click check 1` in the "New note" field and double-click "Save note" quickly → exactly one `notes` request with method POST appears in the Network tab.
4. Wait for that request to finish → `Double click check 1` appears exactly once in the note list and the field is empty.
5. Type `Enter check 1` in the field, click "Save note", then immediately press Enter while the field still has focus → still exactly one new POST in the Network tab, and `Enter check 1` appears once in the list after it finishes.
6. Reload the page with throttling set back to "No throttling" → each of the two notes from steps 3 and 5 is listed exactly once.

### Criterion 2: Save note is disabled while a save is in flight and enabled again once it completes
Prerequisites: as for Criterion 1, DevTools Network throttling set to "Slow 3G".
1. On http://localhost:5183/, type `Disabled check 2` in the "New note" field and click "Save note" once → the button stops responding: clicking it again does nothing, and in the DevTools Elements panel the `note-submit` button carries the `disabled` attribute.
2. Wait until `Disabled check 2` appears in the list → the `disabled` attribute is gone and the button responds to clicks again.
3. With the field empty, click "Save note" → the message "Enter a note before saving." appears and the button stays enabled (an empty submit never disables it).

### Criterion 3: After a save completes (success or error) the form accepts the next submit
Prerequisites: as for Criterion 1, throttling "No throttling".
1. On http://localhost:5183/, set the DevTools Network throttling dropdown to "Offline", type `Retry check 3` in the "New note" field and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again.
2. Set throttling back to "No throttling" and click "Save note" again → `Retry check 3` appears once in the list and the error message disappears.
3. Type `Second note 3` and click "Save note" → `Second note 3` appears once in the list below `Retry check 3`.
4. Type `Second note 3` again (identical text) and click "Save note" → a second `Second note 3` entry appears: deliberate repeated saves are still allowed, only the accidental double submit is blocked.

### Automated check
1. From the repo root run `npm --prefix frontend test -- NoteForm` → the NoteForm.test.tsx cases run, expected result `0 failed`.
2. With the app stack running, run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` → both BUG-04 specs run, expected result `0 failed`.
