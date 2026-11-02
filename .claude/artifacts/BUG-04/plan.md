# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task carries no description, no checklist and no custom fields; the title is the whole report. Criteria below are derived from the title, see Re-Plan Feedback.)

## Acceptance Criteria
- [ ] Clicking "Save note" twice in quick succession (a double-click, or a second click while the first save is still in flight) stores exactly one note, and the list shows it exactly once.
- [ ] While a save is in progress the "Save note" button is disabled, and once that save succeeds it is enabled again so a further note can be saved.
- [ ] When a save fails, the button is enabled again and the user can retry, and a successful retry stores exactly one note.

## Re-Plan Feedback
- Comment (tracker): 20 comments read by 6.1, 0 actionable, all framework notes from earlier runs → not acted on because none carries product feedback; nothing in them overrides the (empty) description.
- Comment (tracker): earlier runs noted the item has no description → Addressed by: the acceptance criteria above are derived from the title alone. Assumption: the defect is a client-side double submit of one user action (NoteForm sends a second POST /api/notes while the first is pending). Two deliberate, separate saves of identical text remain allowed, so the fix is an in-flight guard in the form and not server-side de-duplication of equal text, which would change the API semantics TEST-03 shipped and is not asked for.

## Plan Overview
Frontend-only fix in `frontend/src/components/NoteForm.tsx`. Today `handleSubmit` has no in-flight state, so every submit event while `createNote` is pending sends another `POST /api/notes`, and the backend stores each one. The fix adds a synchronous in-flight guard (a `useRef` boolean checked and set before the request) plus an `isSaving` state that sets the native `disabled` attribute on the submit button for the duration of the request, cleared in a `finally` so both success and failure re-enable it. The backend, the API client and `LandingPage.tsx` are untouched.

## Reproduction
Class: local-automated (source: item title). A new Vitest case in `frontend/src/components/NoteForm.test.tsx` encodes the report: mock `createNote` with a promise that stays pending, type "Buy milk", click `note-submit` twice before resolving, and assert `createNote` was called exactly once. On the current code it is called twice, so the test fails with the runner's failing-test exit 1.

Command (paths relative to the item's worktree root, never prefixed with it):
`npm --prefix frontend test -- src/components/NoteForm.test.tsx`

Test name: `does not send a second save while the first is still in flight`. The builder writes this test before any source change and runs the `before` phase on it.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard via `useRef<boolean>`, `isSaving` state, `disabled={isSaving}` on the submit button; button keeps its label "Save note"; guard released in `finally`).
- Routes: none.
- State management: local component state only. `isSavingRef` is the authoritative guard because it is set synchronously inside the handler, before any re-render, so two submit events dispatched in the same tick cannot both pass; `isSaving` state only drives the rendered `disabled` attribute.
- Design reference notes: AI freestyle. Disabled submit button: `opacity: 0.6`, `cursor: not-allowed`; all other values unchanged from the existing `buttonStyle` (padding 0.5rem 1rem, 1rem font, 600 weight, #ffffff on #1a1a1a, radius 0.375rem).

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form still calls the existing contract once per user save:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201 with `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard: chose React's `useRef` (installed, already the component's framework) over a debounce or throttle helper or a new dependency such as lodash, because a debounce delays the legitimate first save and still admits a second click after the delay window, while a ref reflects the real request lifetime.
- Disabled button: chose the native `disabled` attribute on the `<button type="submit">` over a custom click-swallowing handler, because the platform already blocks activation and form submission from a disabled submit button and announces the state to assistive technology.
- No new dependency, module or component is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser spec double-clicking "Save note" against a held POST /api/notes and asserting one request, one list item
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard, isSaving state, disabled submit button with disabled style, guard released in finally
- [A] frontend/src/components/NoteForm.test.tsx: reproduction test plus disabled-while-saving, re-enabled-after-success and re-enabled-after-failure cases

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour in jsdom with `createNote` mocked (existing `vi.mock("../api/notes")` pattern): the reproduction (two clicks while pending, one call), two direct `form` submit events in the same tick (proves the ref guard, not only the disabled attribute), button disabled while pending and enabled after resolve, button enabled after reject and a retry calls `createNote` once more and reports the note once.
  - Directory: frontend/src/components/ (co-located Vitest files, existing frontend convention)
  - Naming: {Component}.test.tsx
- Integration tests: not warranted. No repository, model, migration or endpoint changes (testing_standards.md Section 6), and the backend storing each POST it receives is correct behaviour.
  - Directory: backend/tests/integration/
- E2E tests: one spec reproducing the report in a real browser: route-intercept `POST /api/notes` and hold it, `dblclick` the submit button, release, assert exactly one POST was issued and exactly one list item carries the unique note text. Edge-case spec: after the held save completes, a second distinct note can be saved (button re-enabled). Matches requests by exact pathname and method, as TEST-03's spec does.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one per criterion plus the edge case "two deliberate saves of the same text store two notes".
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A quick double click on "Save note" stores exactly one note and the list shows it once | E2E (plus the Unit reproduction) | — |
| 2 | The button is disabled while a save is in progress and enabled again after it succeeds | Unit | verifying it needs no navigation: it is component state against a controllable pending promise, which jsdom renders deterministically |
| 3 | After a failed save the button is enabled again and a retry stores exactly one note | Unit | verifying it needs no navigation: the failure path is a rejected mock, and forcing a backend failure in the browser adds nothing the component test does not prove |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double click stores one note | Hold POST /api/notes with page.route, dblclick `note-submit`, release, count POSTs equal 1 and list items with the text equal 1 | Given the landing page, When I type a note and double-click "Save note", Then exactly one copy appears in the list and after reload still one |
| 2 | Disabled while saving, enabled after success | covered at Unit, see Criterion coverage (E2E edge-case spec also saves a second note) | Given a save in progress, When I look at "Save note", Then it is disabled, And after the note appears it is enabled |
| 3 | Re-enabled after failure, retry stores one | covered at Unit, see Criterion coverage | Given the backend is down, When I save, Then an error shows and the button is enabled, When the backend is back and I click once, Then one note is stored |

## Manual verification plan
### Criterion 1: a quick double click stores exactly one note
Prerequisites: backend, database and frontend running (`docker compose up`), app open at http://localhost:5183.
1. Open `http://localhost:5183/` → the "Task Notes" heading, the "New note" field and the "Save note" button are visible.
2. Type `BUG-04 double click check` in the "New note" field → the text shows in the field.
3. Double-click "Save note" as fast as you can → the field clears and `BUG-04 double click check` appears in the "Saved notes" list exactly once.
4. Reload the page → `BUG-04 double click check` is still listed exactly once.
5. Optional, DevTools Network tab open before step 3, filter `api/notes` → exactly one `POST /api/notes` with status 201.

### Criterion 2: disabled while saving, enabled after success
Prerequisites: as Criterion 1; DevTools open, Network tab, throttling set to "Slow 3G" so the save stays visible.
1. Type `BUG-04 slow save` in "New note" and click "Save note" once → the button turns faded (disabled) and clicking it again does nothing.
2. Wait for the request to finish → `BUG-04 slow save` appears once in the list, the field clears, and "Save note" is back to full opacity.
3. Type `BUG-04 second note` and click "Save note" → it saves and appears once below the first.
4. Set throttling back to "No throttling".

### Criterion 3: re-enabled after a failure, retry stores one
Prerequisites: frontend running at http://localhost:5183, backend stopped (`docker compose stop backend`).
1. Type `BUG-04 retry check` in "New note" and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and "Save note" is enabled.
2. Start the backend again (`docker compose start backend`) and wait until `http://localhost:8010/health` answers.
3. Click "Save note" once → the error disappears, the field clears and `BUG-04 retry check` appears in the list exactly once.

### Automated check for all criteria
1. From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → the NoteForm tests, including `does not send a second save while the first is still in flight`, report 0 failed.
