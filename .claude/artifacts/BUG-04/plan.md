# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task [BUG-04: Saving a note twice quickly stores it twice](https://app.clickup.com/t/123k99cx47m) has an empty description. The acceptance criteria below are derived from the title; the assumptions are recorded under `## Re-Plan Feedback`.)

## Acceptance Criteria
- [ ] Clicking "Save note" twice in quick succession with the same text stores that note exactly once: one `POST /api/notes` is sent and one new item appears in the note list, also after a page reload.
- [ ] While a save is in progress, the "Save note" button is disabled and any further submit (a click or pressing Enter in the field) sends no additional request.
- [ ] Once the save finishes, the form accepts a new submit again: after success the button is enabled and the input is cleared; after a failure the button is enabled, the typed text is kept and the error message is shown, so the user can retry.

## Re-Plan Feedback
- Comment (tracker): none actionable. The item carries only automated PR notices from earlier runs, recorded in `.claude/artifacts/BUG-04/decisions.md`. → Addressed by: not acted on because they carry no requirement.
- Assumption (empty description): the defect is the client-side double submit in `frontend/src/components/NoteForm.tsx`, whose `handleSubmit` has no in-flight guard, so a second click before the first `createNote` resolves sends a second `POST /api/notes`. → Addressed by: an in-flight guard in the form (criteria 1 and 2) and a defined recovery after the save (criterion 3).
- Assumption (no server-side dedupe): the backend keeps accepting two identical notes. Two notes with the same text are a legitimate state in a task-notes app (the same task twice), and a server-side idempotency key or uniqueness constraint is not asked for (`user_story_alignment.md` Section 3). → Addressed by: no backend change; recorded so the plan reviewer can overturn it.
- Assumption (no new loading label): the button keeps its "Save note" text while disabled; no spinner or "Saving..." copy is added, since the item asks only that the note is not stored twice. → Addressed by: `disabled` on the button and `aria-busy` on the form only.

## Plan Overview
Frontend-only bug fix in the existing note form. `NoteForm` gains an in-flight flag: a `useRef` guard checked synchronously at the top of `handleSubmit` (so two submit events dispatched in the same tick cannot both pass, which a state check alone would allow because React state updates are asynchronous) and a `useState` mirror that drives `disabled` on the submit button and `aria-busy` on the form. The flag is set before `createNote` is called and cleared in a `finally`, so success and failure both re-enable the form. The empty and whitespace-only validation path stays before the guard and never sets it. No backend, API or `LandingPage` change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify: in-flight guard via `useRef<boolean>`, `isSaving` state, `disabled={isSaving}` on the `note-submit` button, `aria-busy={isSaving}` on the `note-form` form, flag cleared in `finally`; a disabled-state button style of `cursor: "not-allowed"` and `opacity: 0.6`, applied only while saving)
- Routes: none (the form lives on `/`, rendered by `frontend/src/components/LandingPage.tsx`, which is unchanged)
- State management: local component state plus one ref, no context or library
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; the existing internal endpoint is called at most once per save.
- Method: POST
- URL: /api/notes
- Request: JSON object with one `text` string field (1 to 500 characters, trimmed by the form)
- Response: 201 with the stored note, for example `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard: chose a React `useRef` flag plus the native `disabled` attribute on the submit button over a debounce or throttle utility (none installed, and a time window would still allow a second request when the save takes longer than the window) and over a new form library, because the ref closes the same-tick race and `disabled` blocks both clicks and implicit Enter submission natively.
- No net-new dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser regression for criterion 1 (double click on "Save note" sends one POST and renders one list item, still one after reload)
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard, disabled submit button and `aria-busy` while saving, cleared on success and failure
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for criteria 2 and 3 (pending save blocks a second click and an Enter submit; button re-enabled after success and after failure)

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` changes: the fix alters no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` behaviour with `createNote` mocked to a promise the test resolves or rejects by hand: a second click and an Enter submit while pending call `createNote` once; the button is disabled while pending; after resolve the button is enabled and the input cleared; after reject the button is enabled, the text kept and the error shown; the empty-note path still never disables the button.
  - Directory: `frontend/src/components/` (co-located Vitest files, the existing frontend convention; `backend/tests/unit/` is the backend directory and is untouched)
  - Naming: `NoteForm.test.tsx` (existing file, extended)
- Integration tests: none warranted. No router, service, repository or model changes, so `testing_standards.md` Section 6's integration questions answer no; the existing `backend/tests/integration/test_notes_integration.py` is unchanged.
  - Directory: `backend/tests/integration/`
- E2E tests: criterion 1, plus one edge case. Open `/`, fill a unique text, double-click `note-submit`; the POST is held by a `page.route` handler that waits on a promise released after the double click (then `route.continue()` to the real backend), so the race is deterministic without a fixed wait. Assert exactly one `POST /api/notes` was issued, exactly one `note-list-item-*` carries the text, and the same after `page.reload()`. Edge-case spec: press Enter twice in `note-input` while the POST is held, assert one POST.
  - Directory: `e2e/tests/`
  - File: `BUG-04_double_submit_note.spec.ts`
- UAT scenarios: one scenario per criterion plus the Enter-key edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A quick double "Save note" stores the note once (one POST, one list item, also after reload) | E2E | — |
| 2 | While a save is in progress the button is disabled and further submits send no request | Unit | verifying it needs no navigation: it is the form's own state while a mocked `createNote` is pending, which a component test controls exactly and a browser only approximates with timing |
| 3 | After the save finishes the form accepts a new submit (cleared on success; text and error kept on failure) | Unit | verifying it needs no navigation: it is the form's state transition after a mocked `createNote` resolves or rejects, including a failure the real backend cannot be made to produce on demand |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Quick double save stores the note once | Hold the POST with `page.route`, double-click `note-submit`, release, assert one POST and one `note-list-item-*` with the text, reload and assert again | Given the landing page is open, When I type a note and double-click "Save note", Then the note appears once in the list, also after a reload |
| 2 | Button disabled and further submits ignored while saving | covered at Unit, see Criterion coverage | Given a save is in progress, When I click "Save note" again or press Enter, Then the button stays disabled and no second note is stored |
| 3 | Form usable again after the save finishes | covered at Unit, see Criterion coverage | Given a save has finished, When I type another note and click "Save note", Then it is saved; and Given the save failed, Then my text is kept, the error is shown and the button is enabled |

## Manual verification plan
### Criterion 1: Clicking "Save note" twice quickly stores the note once
Prerequisites: the stack is running (`docker compose up`), the app is open at `http://localhost:5183/`, and the browser DevTools Network panel is open, filtered on `notes`.
1. On `/`, type `Double click check 1` in the "New note" field → the text is in the field.
2. Double-click "Save note" as fast as possible → the Network panel shows exactly one `POST /api/notes` with status 201.
3. Look at the note list under the form → `Double click check 1` appears exactly once and the field is empty.
4. Reload the page → after the list loads, `Double click check 1` still appears exactly once.

### Criterion 2: While a save is in progress the button is disabled and further submits are ignored
Prerequisites: as for criterion 1, and in the DevTools Network panel set throttling to `Slow 3G` so the save takes a few seconds.
1. On `/`, type `Slow save check` in the "New note" field → the text is in the field.
2. Click "Save note" once → a `POST /api/notes` appears as pending and the "Save note" button turns greyed out and cannot be clicked.
3. While the request is still pending, click "Save note" three more times, then click into the field and press Enter twice → no further `POST /api/notes` appears in the Network panel.
4. Wait for the request to finish → `Slow save check` appears exactly once in the list.
5. Set throttling back to `No throttling`.
The same behaviour is also checked automatically: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → `0 failed`.

### Criterion 3: The form accepts a new submit once the save finishes
Prerequisites: as for criterion 1.
1. On `/`, type `After success check` and click "Save note" once → the note appears in the list, the field is empty and "Save note" is enabled (not greyed out).
2. Type `Second note` and click "Save note" → `Second note` appears in the list, so the form accepted a new submit.
3. Stop the backend container (`docker compose stop backend`), type `After failure check` and click "Save note" → the red message "The note could not be saved. Please try again." appears, the field still holds `After failure check`, and "Save note" is enabled again.
4. Start the backend again (`docker compose start backend`), wait for it to answer, and click "Save note" → `After failure check` appears once in the list and the red message is gone.
The same behaviour is also checked automatically: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → `0 failed`.
