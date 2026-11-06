# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice

(The ClickUp task 123k99cx47m carries a title only and no description. The acceptance criteria below are derived from the title and the code as it stands at plan base 2df5a7e97a154ec1d4a191e15061a36cea07c40e; see Assumptions.)

## Acceptance Criteria
- [ ] 1. Clicking **Save note** twice in quick succession (a double-click, or a second click or Enter press while the first save is still pending) sends exactly one save request and stores the note exactly once: one new entry in the list, and still one after a page reload.
- [ ] 2. While a save is pending, the **Save note** button is disabled; it is enabled again once that save succeeds or fails, so the user can save the next note, or retry after a failure.

### Assumptions
- Defect type: client-side double submit. `frontend/src/components/NoteForm.tsx` `handleSubmit` awaits `createNote` with no in-flight guard, and the submit button is never disabled, so a second submit event fired before the first response arrives issues a second `POST /api/notes`. The backend stores every POST it receives, which is correct behaviour for a POST without an idempotency key.
- The fix is therefore in the form, not the server. No server-side de-duplication of identical text: two separate, deliberate saves of the same text remain two notes (scope containment, `user_story_alignment.md` Section 3), and a server-side dedupe would also collide with TEST-12's edits to the notes router, service and repository.
- No new visual text (no "Saving..." label): the disabled button is the only visible pending state. Design Reference mode is NONE.

## Re-Plan Feedback
- Comment (tracker): 28 comments read on the task (recorded in decisions.md, run deliver-20261106T221517Z), all framework PR-opened notices from earlier runs → not acted on because none states a requirement or a correction; the item has no description, so the criteria are derived from the title (Assumptions above).

## Plan Overview
Frontend-only fix in `NoteForm`. Add an in-flight guard to the submit handler: a `useRef` flag checked and set synchronously at the top of `handleSubmit` (so a second submit event in the same tick is ignored even before React re-renders), plus an `isSaving` state that disables the submit button for the duration of the request and is cleared in a `finally` block on success and on failure. Tests: a Vitest reproduction in `NoteForm.test.tsx` plus button-state cases, and one Playwright spec that double-clicks against the real backend and counts the POSTs and the stored notes.

### Local reproduction (for the defect classification after approval)
The defect is expressible as a test on this checkout. Add the Vitest case `sends one save request when Save note is clicked twice while the first save is pending` to `frontend/src/components/NoteForm.test.tsx`: `createNote` is mocked to return a promise that stays pending, the test types `Buy milk`, fires two clicks on `note-submit`, and asserts `createNote` was called once. Run:

`npm --prefix frontend test -- src/components/NoteForm.test.tsx`

On the plan base the new case fails (`createNote` called 2 times, expected 1); after the fix it passes with 0 failed. No backing service is needed.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard in `handleSubmit`; `disabled={isSaving}` on the `note-submit` button; disabled styling).
- Routes: none (the form stays on `/`).
- State management: local component state. `isSavingRef = useRef(false)` is the guard read and written synchronously in the handler; `const [isSaving, setIsSaving] = useState(false)` drives the button's `disabled` attribute. Both are set to true only after the empty-note validation passes (an empty submit still shows the validation message and sends nothing) and reset in `finally`. `LandingPage.tsx` and its `onCreated` wiring are unchanged.
- Design reference notes: AI freestyle. Disabled submit button: keep the existing button values and add `opacity: 0.6` and `cursor: "not-allowed"` while disabled; enabled state unchanged (`#1a1a1a` background, `#ffffff` text, `cursor: pointer`).

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The existing internal contract the form calls:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}` (trimmed, 1 to 500 characters)
- Response: 201, `{"id": 7, "text": "Buy milk"}`

The fix changes how many times the client calls it per user save (exactly once), not its shape.

## Technology Selection
- Double-submit guard: chose React's `useRef` (installed, `react` 18) over a debounce utility or a new dependency (lodash.debounce), because a ref read synchronously in the handler blocks the second event deterministically while a debounce only narrows the time window.
- Pending state on the button: chose the native `disabled` attribute on the existing `<button type="submit">` over a JS click-swallowing overlay or a custom button component, because a disabled default button also blocks the form's implicit Enter submission natively.
- No new dependency and no new module are introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec, double-click on Save note against the real backend stores one note and issues one POST
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus `isSaving` state), disabled submit button while saving, reset in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: reproduction case plus button-disabled and re-enable cases

No dependency changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` change: the fix alters no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component tests in Vitest (`frontend/src/components/NoteForm.test.tsx`, the existing frontend test file for this component; the backend unit directory and naming in CLAUDE.md do not apply to a frontend-only change). Cases:
  - `sends one save request when Save note is clicked twice while the first save is pending` (the reproduction): pending `createNote` promise, two clicks, `createNote` called once.
  - `ignores a second Enter submit while the first save is pending`: two `fireEvent.submit` on `note-form` with a pending promise, `createNote` called once.
  - `disables Save note while the save is pending and enables it after success`: deferred promise; button disabled after the click, enabled and input cleared after resolve.
  - `enables Save note again after a failed save so the user can retry`: deferred promise rejected; error shown, button enabled, a second click calls `createNote` a second time.
  - `keeps Save note enabled when an empty note is rejected`: existing validation path does not leave the button disabled.
  - Existing six cases stay green unchanged.
- Integration tests: no new integration tests. The backend is unchanged; `backend/tests/integration/test_notes_integration.py` already covers `POST /api/notes`.
  - Directory: backend/tests/integration/
- E2E tests: one spec for criterion 1. It holds the first `POST /api/notes` with `page.route` until both clicks have landed (released by the test through a promise, no fixed timeout), records every POST the route sees, then continues the request to the real backend; asserts one POST, one `note-list-item-*` carrying the unique note text, and still one after `page.reload()`. Edge-case spec: after that save completes, saving the same text again deliberately stores a second note (the guard blocks concurrent submits only, not repeat saves). Unique text per test via `randomUUID`, following `e2e/tests/TEST-03_simple_note_form.spec.ts`.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: double-click stores once; button disabled while pending and enabled after success or failure; edge case, deliberate second save of the same text stores a second note.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A quick double save sends one request and stores the note once | E2E | — |
| 2 | Save note is disabled while a save is pending and enabled again after success or failure | Unit | verifying it needs no navigation, only component state across a pending, resolved and rejected request, which a Vitest test controls deterministically with a deferred mock and a browser cannot hold without stubbing the backend |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | A quick double save sends one request and stores the note once | Hold the POST with `page.route`, double-click `note-submit`, release, count POSTs (1) and list items with the text (1), reload, still 1 | Given the landing page, When I type a note and double-click Save note, Then the note appears once and once after reload |
| 2 | Save note disabled while pending, enabled after success or failure | covered at Unit, see Criterion coverage | Given a slow network, When I click Save note, Then the button is disabled until the save finishes, and enabled again after a failed save |

## Manual verification plan
### Criterion 1: A quick double save sends one request and stores the note once
Prerequisites: the app stack running with the frontend on http://localhost:5183 and its backend and database up; a Chromium-based browser with dev tools open on the Network tab, filtered to `api/notes`.
1. Open http://localhost:5183/ → the "Task Notes" title, the note field with placeholder "What needs doing?", the **Save note** button and the notes list are shown.
2. In dev tools Network, set throttling to `Slow 3G` → the throttling indicator shows on the Network tab.
3. Type `Double click check 1` in the "New note" field and double-click **Save note** quickly → exactly one `POST /api/notes` row appears in the Network tab.
4. Wait for that request to finish (status 201) → `Double click check 1` appears once at the bottom of the list and the field is empty.
5. Set throttling back to `No throttling` and reload the page (F5) → the list still shows `Double click check 1` exactly once.
6. Type `Enter twice check` in the field, set throttling to `Slow 3G` again, and press Enter twice quickly → one `POST /api/notes` row appears and, once it finishes, `Enter twice check` is listed once.

### Criterion 2: Save note is disabled while a save is pending and enabled again after success or failure
Prerequisites: as for Criterion 1, with throttling set to `Slow 3G`.
1. On http://localhost:5183/, type `Pending state check` and click **Save note** once → while the request is pending the button is greyed out (reduced opacity, not-allowed cursor) and clicking it again adds no new `POST /api/notes` row.
2. Wait for the request to finish → `Pending state check` appears in the list, the field is empty, and **Save note** is back to its normal dark style and clickable.
3. Set Network throttling to `Offline`, type `Offline check` and click **Save note** → the red message "The note could not be saved. Please try again." appears, `Offline check` stays in the field, and **Save note** is enabled again.
4. Set throttling to `No throttling` and click **Save note** → the message disappears and `Offline check` is added to the list once.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → 0 failed, including the cases named in Testing Strategy.
