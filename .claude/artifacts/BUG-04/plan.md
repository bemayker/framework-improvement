# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task carries no description; the acceptance criteria below are derived from the title. See Re-Plan Feedback.)

## Acceptance Criteria
- [ ] 1. Submitting the note form twice in quick succession (a second click on "Save note", or Enter in the field, before the first save has completed) sends exactly one create request, stores exactly one note, and the list shows that note once.
- [ ] 2. While a save is in progress, the "Save note" button is disabled, so the form cannot be submitted again until the save completes.
- [ ] 3. Once the save completes, successfully or with an error, the "Save note" button is enabled again, so the user can save another note or retry the failed one.

## Re-Plan Feedback
- Comment (tracker): "mayker-dev: PR opened for BUG-04, https://github.com/bemayker/framework-improvement/pull/95 (branch feature/BUG-04-double-submit-note). Autonomous delivery run deliver-20261005T151552Z ..." → Not acted on because it is a framework PR-link note from an earlier, reset run, not stakeholder feedback. PR #95 is not on main: in this worktree (cut from origin/main 366d535) `frontend/src/components/NoteForm.tsx` `handleSubmit` has no in-flight guard and the submit button is never disabled, so the defect is present and this plan is not duplicate work.
- Assumption (no description on the item): acceptance criteria derived from the title, as listed above. The defect is a client-side double submit, so the fix is in the note form only.
- Assumption: no server-side deduplication or idempotency key. Two notes with the same text saved deliberately, one after the other, remain legitimate; only a second submit while the first is still in flight is suppressed. Adding backend dedupe would be scope the title does not ask for.
- Assumption: the button label stays "Save note" while saving (no "Saving..." text), the minimum visible change being the disabled state.
- Assumption: `frontend/src/components/LandingPage.tsx` is not modified. The guard lives entirely in `NoteForm`, which lowers the shared-file risk with TEST-08 and TEST-10 to none on that file.

## Plan Overview
Frontend-only defect fix. `NoteForm.handleSubmit` awaits `createNote` with nothing preventing a second submit during the await, so two quick submits send two `POST /api/notes` and store two notes. The fix adds an in-flight guard to `NoteForm`: a `useRef` flag checked and set synchronously at the top of the submit handler (so a re-entrant submit in the same tick is rejected before any state has re-rendered), plus an `isSaving` state that sets `disabled` on the submit button for the duration of the save (which also blocks implicit submission by Enter, per the HTML form rules). Both are cleared in a `finally` block so success and failure each re-enable the form. No backend, no API contract change, no new dependency.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard: `isSubmittingRef` via `useRef(false)`, `isSaving` via `useState(false)`; early return in `handleSubmit` when the ref is set; set both before `await createNote(...)`, clear both in `finally`; `disabled={isSaving}` and `aria-busy={isSaving}` on the `note-submit` button; disabled button style). The empty/whitespace validation path stays before the guard is set, so it never disables the button.
- Routes: none.
- State management: local component state plus one ref inside `NoteForm`; `LandingPage` and its `onCreated` wiring are unchanged.
- Design reference notes: AI freestyle (Design Reference mode NONE). Disabled state of the existing primary button: `opacity 0.6`, `cursor not-allowed`; every other button value unchanged (padding 0.5rem 1rem, font 1rem 600, color #ffffff, background #1a1a1a, radius 0.375rem).

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; the existing internal endpoint from TEST-03 is consumed as-is.
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201 with `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard: chose a React `useRef` flag plus `useState` (React is already installed) over a debounce/throttle helper (lodash or similar) or a request-dedupe library, because the need is "one request while one is pending", which a ref covers in a few lines and a time-based debounce would get wrong (a slow save outlasts any debounce window).
- Blocking resubmission in the UI: chose the native `disabled` attribute on the existing `<button type="submit">` over intercepting clicks and keydown in JavaScript, because a disabled default button also blocks implicit submission by Enter natively.
- No new dependency is introduced; no stdlib or platform alternative is displaced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser regression spec, holds the create request and submits twice, asserts one POST and one stored note
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus `isSaving`), `disabled` and `aria-busy` on the submit button, disabled style, reset in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the double-submit guard, the disabled state while saving, and re-enable after success and after failure
No dependency change, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component (Vitest + Testing Library, `createNote` mocked as in the existing file). Add: (a) two submits while `createNote` returns a pending promise call `createNote` exactly once; (b) the submit button is disabled while the promise is pending; (c) the button is enabled again after the promise resolves, and (d) after it rejects (error message shown, text kept); (e) an empty submit does not disable the button. The existing six tests stay green unchanged.
  - Directory: frontend/src/components/ (co-located, matching the existing `NoteForm.test.tsx`)
  - Naming: `{Component}.test.tsx`, the established frontend convention (the CLAUDE.md `test_{module}_unit.py` naming is the backend's)
- Integration tests: not warranted. No repository, model, migration or router changes (`testing_standards.md` Section 6); the backend accepting two POSTs is correct behaviour and is not what is being fixed.
- E2E tests: one spec reproducing the defect through the real UI and backend. Hold `POST /api/notes` with `page.route` (continue the request only after the second submit has been attempted), fire a second submit while the first is pending (two synchronous `click()` calls on the button via `locator.evaluate`, then Enter in the input), release, and assert exactly one recorded POST and exactly one `note-list-item-*` carrying the unique text. Reuse the TEST-03 spec's patterns (exact-path request matcher, `randomUUID` note text, wait for the mount GET). Edge case: after the held save completes, a second distinct note saves normally (button re-enabled end to end).
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus the edge case "a second, different note can be saved after the first completes".
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Two quick submits send one request, store one note, list shows it once | E2E (plus Unit) | — |
| 2 | Save note button disabled while a save is in progress | Unit | verifying it needs no navigation: it is a component state observable with a pending mocked `createNote`, deterministic in jsdom where a browser would need a held network request |
| 3 | Button enabled again after the save completes, on success and on error | Unit | verifying it needs no navigation: both outcomes are a component state transition driven by a resolved or rejected mock; the failure path is not reproducible against the real backend without fault injection |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Two quick submits store one note | Hold POST via `page.route`, double submit (click, click, Enter), release, assert one POST and one list item with the unique text | Given the landing page with a slow save, When I click Save note twice quickly, Then exactly one note with my text appears |
| 2 | Button disabled while saving | covered at Unit, see Criterion coverage | Given I submitted a note, When the save is still in progress, Then the Save note button is disabled |
| 3 | Button re-enabled after completion | covered at Unit, see Criterion coverage | Given a save just finished (or failed), When I look at the form, Then the Save note button is enabled again |

## Manual verification plan
### Criterion 1: Two quick submits store exactly one note
Prerequisites: the stack is running (`docker compose up`), the frontend is at http://localhost:5183, and Chrome DevTools is open on the Network tab with throttling set to "Slow 3G" so a save takes several seconds.
1. Open http://localhost:5183/ → the "Task Notes" landing page shows the "New note" field, the "Save note" button and the current note list.
2. Type `BUG-04 double click check` in the "New note" field → the text appears in the field.
3. Click "Save note", then immediately click it again, then press Enter in the field, all before the first save finishes → the Network tab shows exactly one `POST /api/notes` request.
4. Wait for the request to complete → the field clears and `BUG-04 double click check` appears exactly once in the note list.
5. Set throttling back to "No throttling" and reload the page → `BUG-04 double click check` still appears exactly once.

### Criterion 2: Save note is disabled while saving
Prerequisites: as for Criterion 1, with "Slow 3G" throttling on.
1. Open http://localhost:5183/ and type `BUG-04 disabled check` in the "New note" field → the "Save note" button is enabled (solid dark background, pointer cursor).
2. Click "Save note" once → while the `POST /api/notes` request is pending, the button is visibly dimmed, shows a not-allowed cursor on hover, and clicking it does nothing (no second request in the Network tab).

### Criterion 3: Save note is enabled again after the save completes
Prerequisites: as for Criterion 1.
1. With "Slow 3G" on, type `BUG-04 re-enable check` and click "Save note" → the button is dimmed while saving.
2. Wait for the save to finish → the note appears in the list and the "Save note" button is enabled again (solid, pointer cursor).
3. Type `BUG-04 second note` and click "Save note" → it saves and appears in the list; the button is enabled again afterwards.
4. Error path: in DevTools set the network to "Offline", type `BUG-04 offline check` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again.
5. Set the network back to "No throttling" and click "Save note" → the note saves and appears once in the list.
6. Automated check: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → expected result `0 failed`.
