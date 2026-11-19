# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m carries no description, checklist or custom fields; the title is the whole report. The acceptance criteria below are derived from it and recorded as an assumption under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] Clicking "Save note" twice in quick succession stores the note once, and it appears once in the note list.
- [ ] While a save is in flight, the "Save note" button is disabled and a further submit of the form (click or Enter) sends no second save request.
- [ ] Once the save finishes, successfully or not, the "Save note" button is enabled again, so the next note can be saved or a failed save retried.

## Re-Plan Feedback
- Comment (tracker): 0 actionable comments; 48 bot notes dropped by the dispatching session (run deliver-20261119T010710Z, recorded in `.claude/artifacts/BUG-04/decisions.md`) → Addressed by: nothing to act on.
- Comment (tracker): the item has an empty description → Addressed by: assumption. The criteria above are derived from the title only; "stores it twice" is read as one user submitting the same form twice before the first save returns, which is what the current tree allows (verified on main at 7c61eb74: `frontend/src/components/NoteForm.tsx` `handleSubmit` has no in-flight guard and the submit button is never disabled).
- Merged since the last plan: n/a. This is a fresh plan on main at 7c61eb74. An earlier fix for this item (#911, f032fe47) was reset off main by 2bf4ad07; this plan was written against the current tree, not that fix.
- Scope assumption: the fix is client-side only. A server-side duplicate check (an idempotency key or a uniqueness constraint on note text) is not planned. Two different notes may legitimately share text, so a uniqueness constraint would change product behaviour no criterion asks for, and an idempotency key is a new API contract for a single-form defect. Keeping the fix out of `backend/app/routers/notes.py`, `note_service.py` and `note_repository.py` also leaves it disjoint from TEST-12.

## Plan Overview
A frontend-only fix in the note form component. `NoteForm` tracks whether a save is in flight. A second submit while one is pending returns early without calling `createNote`, the "Save note" button carries the native `disabled` attribute for the duration, and the flag is cleared in a `finally` so success and failure both re-enable the form. No backend, API contract, routing or `LandingPage` change. `LandingPage.tsx` and `LandingPage.test.tsx` are not touched (the TEST-10 footer area stays disjoint).

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx`. Add a `useRef<boolean>` in-flight guard that `handleSubmit` checks and sets synchronously, before the `await`. A ref, not state alone, because two submit events dispatched before React re-renders would both read a stale `false` from state. Add an `isSaving` state mirror that drives `disabled={isSaving}` on the `note-submit` button. Clear both in a `finally` around the `createNote` call. The empty and whitespace-only validation path stays first and unchanged, so it never sets the guard. The input stays editable while saving: no criterion asks to lock it.
- Routes: none.
- State management: component-local (`useRef` plus `useState`), as the component already holds `text` and `error`.
- Design reference notes: AI freestyle. Disabled "Save note" button: `opacity: 0.6`, `cursor: "not-allowed"`, all other button values unchanged (`backgroundColor #1a1a1a`, `color #ffffff`, `padding 0.5rem 1rem`, `borderRadius 0.375rem`). The label stays "Save note": no criterion asks for a "Saving..." text.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form still calls the existing endpoint, now at most once per pending save:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight submit guard: chose React's own `useRef` and `useState` (already installed) over a debounce or throttle helper (lodash or a hand-written timer). A time window either drops a legitimate second note or still lets a slow request through twice; the guard is tied to the real request's lifetime.
- Blocking the button while saving: chose the native `disabled` attribute on the existing `<button type="submit">` (native platform feature) over a CSS-only `pointer-events: none` or a custom overlay. `disabled` also stops keyboard activation and, per the HTML implicit-submission rule, Enter in the field, and it is exposed to assistive technology.
- No new dependency, module or component is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec. Holds the `POST /api/notes` response with `page.route`, clicks "Save note" twice, releases it, and asserts exactly one POST was sent and one list item carries the note text.
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard, `isSaving` state, `disabled` on the submit button with the disabled style, `finally` that clears both.
- [A] frontend/src/components/NoteForm.test.tsx: Vitest cases for a double submit, Enter during a save, disabled while pending, and re-enabled after success and after failure. A deferred promise on the mocked `createNote` keeps the save pending.

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (Vitest + Testing Library), using a deferred promise to hold a save pending.
  - Directory: frontend/src/components/ (co-located, as the project standards' layout says)
  - Naming: `NoteForm.test.tsx` (existing file, extended)
- Integration tests: not warranted. No router, service, repository or model changes (`testing_standards.md` Section 6: no row applies on the backend). The existing `backend/tests/integration/test_notes_integration.py` is untouched.
  - Directory: backend/tests/integration/
- E2E tests: one spec for the user-visible defect, a quick double click storing one note, against the real backend.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus a "second, different note saves normally after the first" edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | Clicking "Save note" twice in quick succession stores the note once, and it appears once in the note list | E2E | `stores a note once when Save note is clicked twice quickly`, `sends one save request when submitted twice while the first save is in flight` | — |
| 2 | While a save is in flight, the button is disabled and a further submit (click or Enter) sends no second request | Unit | `disables the Save note button while a save is in flight`, `sends no second request when the form is submitted with Enter during a save` | verifying it needs no navigation or real backend: it is component state observed with a held mock promise, which a browser can only reproduce by stubbing the network anyway |
| 3 | Once the save finishes, successfully or not, the button is enabled again | Unit | `re-enables the Save note button after the save succeeds`, `re-enables the Save note button after the save fails so the note can be retried` | verifying it needs no navigation: it is the `finally` branch of the submit handler, and the failure path needs a rejected request that a unit mock gives directly |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double click stores the note once | Hold the POST response with `page.route`, click `note-submit` twice, release, count POST requests (exactly 1) and `note-list-item-*` elements with the text (exactly 1) | Given the landing page, When I type a note and click Save note twice quickly, Then the note appears once in the list, and once more after a reload |
| 2 | Button disabled during save, no second request | covered at Unit, see Criterion coverage | Given a slow save, When I click Save note, Then the button is disabled until the save returns |
| 3 | Button enabled again after save ends | covered at Unit, see Criterion coverage | Given a save has finished, When I type a second note, Then Save note is enabled and saves it |

## Manual verification plan
### Criterion 1: Clicking "Save note" twice in quick succession stores the note once, and it appears once in the note list
Prerequisites: backend running at http://localhost:8010 with the database up, frontend running at http://localhost:5183.
1. Open `http://localhost:5183/` → the "Task Notes" title, the "New note" field and the "Save note" button are shown.
2. Type `BUG-04 double click check` in the "New note" field → the text appears in the field.
3. Double-click "Save note" as fast as you can → the field clears and `BUG-04 double click check` appears exactly once in the list below the form.
4. Reload the page → `BUG-04 double click check` is still listed exactly once.

### Criterion 2: While a save is in flight, the "Save note" button is disabled and a further submit sends no second save request
Prerequisites: as Criterion 1, with the browser developer tools open on the Network tab, throttling set to "Slow 3G" (Chrome) or an equivalent preset.
1. Open `http://localhost:5183/` → the form is shown and "Save note" is enabled.
2. Type `BUG-04 slow save` in the "New note" field and click "Save note" once → while the request is pending, the button is greyed out (reduced opacity) and the mouse cursor over it shows "not allowed".
3. While it is still pending, click "Save note" again, then click into the field and press Enter → nothing happens; the Network tab shows exactly one `POST /api/notes` request for this note.
4. Wait for the request to finish → `BUG-04 slow save` appears once in the list.

### Criterion 3: Once the save finishes, successfully or not, the "Save note" button is enabled again
Prerequisites: as Criterion 1; for the failure path, the ability to stop the backend (for example stop its process or container) while the frontend keeps running.
1. Open `http://localhost:5183/`, type `BUG-04 first note` and click "Save note" → the note appears in the list and the button is enabled again (full opacity).
2. Type `BUG-04 second note` and click "Save note" → this second, different note is saved and appears below the first.
3. Stop the backend, type `BUG-04 retry note` and click "Save note" → the red message "The note could not be saved. Please try again." appears, the field still holds `BUG-04 retry note`, and the button is enabled.
4. Start the backend again and click "Save note" → the message disappears and `BUG-04 retry note` appears once in the list.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → the run passes: its summary line reports no failed test and the command exits 0.
