# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m carries no description, no checklist and no custom fields. The acceptance criteria below are derived from the title alone; see Assumptions in the Plan Overview.)

## Acceptance Criteria
- [ ] Clicking "Save note" twice in quick succession with a non-empty note stores exactly one note, and the note appears exactly once in the list
- [ ] While a save is in progress, the "Save note" button is disabled, so a second submission (click or Enter) sends no second request
- [ ] Once the save finishes, successfully or not, the form accepts a new submission again (on failure the typed text is kept and the error message is shown, as before)

## Re-Plan Feedback
- Comment (tracker): earlier runs' bot PR notices only, 0 actionable comments → Addressed by: not acted on because they carry no feedback on this item's scope.
- Comment (tracker): no description on the item → Addressed by: assumption recorded in Plan Overview; criteria derived from the title, kept to the minimum that makes the title false.

## Plan Overview
Root cause (read from `frontend/src/components/NoteForm.tsx`): `handleSubmit` awaits `createNote(trimmedText)` with no in-flight guard. Every submit event that arrives before the first request resolves passes the empty check (the text is only cleared after the response) and issues its own `POST /api/notes`, so a double click or a click followed by Enter stores two identical notes, and `onCreated` appends both to the list.

Fix, frontend only, in `NoteForm.tsx`:
- Add a synchronous in-flight guard: a `useRef<boolean>` set to true before `createNote` is called and reset in a `finally` block. `handleSubmit` returns immediately when it is already true. A ref, not only state, because it is read synchronously in the second submit event regardless of whether React has re-rendered between the two events.
- Mirror it into an `isSaving` state that sets `disabled` on the submit button (native `disabled` attribute) and `aria-busy` on the form, so the user sees the save is in progress and implicit Enter submission is also blocked by the browser.
- Disabled button styling: `opacity: 0.6`, `cursor: "not-allowed"` while saving (AI freestyle, Design Reference mode NONE).
- Behaviour after completion is unchanged: success clears the input and calls `onCreated`; failure keeps the text and shows `SAVE_FAILED_MESSAGE`. Either way the guard is released.

Assumptions (no item description):
- "Stores it twice" is fixed at the source of the duplicate (the form). No backend deduplication or idempotency key is added: two deliberate saves of the same text, one after another, remain two notes, which is the existing TEST-03 behaviour and not in scope (`user_story_alignment.md` Section 3).
- No button label change (e.g. "Saving...") is required; the disabled state is the feedback.

Files touched in `frontend/`: exactly `frontend/src/components/NoteForm.tsx` and `frontend/src/components/NoteForm.test.tsx`. `LandingPage.tsx`, `LandingPage.test.tsx` and `AppFooter.tsx` are NOT touched (the `onCreated` wiring in LandingPage stays as is), so there is no file overlap with TEST-10.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight ref guard, `isSaving` state, `disabled` on `note-submit`, `aria-busy` on `note-form`, disabled button style)
- Routes: none
- State management: local component state (`useState` for `isSaving`) plus a `useRef` guard; no new store
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; documented for the builder. The form still makes one call per accepted submission.
- Method: POST
- URL: /api/notes
- Request: JSON body with one field, text (string, 1 to 500 chars after trimming)
- Response: 201 with the stored note, e.g. id 7 and text "Buy milk"

## Technology Selection
- Submit-in-progress guard: chose React's built-in `useRef` and `useState` (already installed) over a debounce/throttle utility or a new form library, because a boolean flag held for the request's lifetime is the exact need and no new dependency is warranted.
- Blocking repeat submission in the UI: chose the native `disabled` attribute on the submit button (native platform feature, which also suppresses implicit Enter submission) over a JS click-counter or overlay.
- No net-new component, module or dependency otherwise.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: double-click "Save note" against a delayed POST, assert exactly one POST request and exactly one matching list item
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard, isSaving state, disabled submit button and its style, aria-busy on the form
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the guard (two submits while pending give one createNote call), disabled state while pending, re-enabled after success and after failure

No dependency changes, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md needs an edit: no project structure, run configuration, dependency or test-infrastructure change.

## Testing Strategy
- Unit tests: `NoteForm` behaviour with `createNote` mocked (Vitest + Testing Library), in the existing `frontend/src/components/NoteForm.test.tsx`: (a) two submits while the first `createNote` promise is still pending result in exactly one `createNote` call and one `onCreated` call after it resolves; (b) `note-submit` is disabled while pending; (c) `note-submit` is enabled again after a successful save; (d) after a rejected save, the button is enabled, the text is kept, and a second submit calls `createNote` again. Existing tests stay green.
  - Directory: frontend/src/components/ (co-located Vitest, the project's existing frontend convention; the backend unit directory backend/tests/unit/ is not involved)
  - Naming: {Component}.test.tsx, as the existing frontend tests
- Integration tests: not warranted; no repository, model, migration or endpoint changes (`testing_standards.md` Section 6).
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: one spec reproducing the user-visible bug: open `/`, wait for the mount `GET /api/notes`, delay the `POST /api/notes` with `page.route` (continue after a short hold) so the first request is still in flight, fill a unique note text, double-click `note-submit` (`dblclick`), wait for the 201, then assert exactly one POST was recorded and exactly one `note-list` item has that text. Reuse the request-matching approach of the TEST-03 spec (exact pathname and method), copied locally, since `e2e/helpers/` holds no shared helper.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (Enter pressed right after clicking Save)
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Double click on "Save note" stores exactly one note, shown once | E2E | — |
| 2 | Button disabled while a save is in progress; a second submission sends no request | Unit | verifying it needs no navigation: it is component state and a guard on the mocked client call, asserted deterministically with a pending promise |
| 3 | After success or failure, the form accepts a new submission (text kept on failure) | Unit | verifying it needs no navigation: it is the guard's release in a finally block, asserted with resolved and rejected mocks; a failure path cannot be produced deterministically in the browser without stubbing the API |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double click stores exactly one note | Delay POST via page.route, dblclick note-submit, assert one POST and one list item with the unique text | Given the landing page is open When I type a note and double-click Save note Then the note appears once in the list |
| 2 | Button disabled while saving | covered at Unit, see Criterion coverage | Given a save is in progress When I look at Save note Then it is disabled |
| 3 | Form usable again after save completes | covered at Unit, see Criterion coverage | Given a note was just saved When I type another note and click Save note Then it is saved too |

## Manual verification plan
### Criterion 1: Clicking "Save note" twice in quick succession stores exactly one note, shown once
Prerequisites: app stack running (frontend at http://localhost:5183, backend and database up); browser DevTools Network tab open, filtered on `notes`.
1. Navigate to `http://localhost:5183/` → the "Task Notes" title, the "New note" field and the "Save note" button are visible, with any existing notes listed below.
2. Type `Double click check 1` in the "New note" field → the text shows in the field.
3. Double-click "Save note" as fast as possible → the field clears and `Double click check 1` appears exactly once at the bottom of the list.
4. Look at the Network tab → exactly one `POST /api/notes` request with status 201 was sent.
5. Reload the page → `Double click check 1` is still listed exactly once.

### Criterion 2: While a save is in progress the button is disabled and a second submission sends nothing
Prerequisites: as Criterion 1; in DevTools set network throttling to "Slow 3G" so the save visibly takes time.
1. Navigate to `http://localhost:5183/` and wait for the page to load.
2. Type `Slow save check` in the "New note" field.
3. Click "Save note" once → the button turns greyed out (disabled) and the pointer shows a not-allowed cursor while the request is pending.
4. While it is still greyed out, click "Save note" again and press Enter in the field → nothing further happens; the Network tab still shows exactly one `POST /api/notes`.
5. Wait for the request to finish → `Slow save check` appears exactly once in the list and the button is enabled again. Set throttling back to "No throttling".

### Criterion 3: After the save finishes, successfully or not, the form accepts a new submission
Prerequisites: as Criterion 1.
1. On `http://localhost:5183/`, type `First after fix` and click "Save note" → it appears once in the list and the button is enabled.
2. Type `Second after fix` and click "Save note" → it also appears once in the list (a second, separate save still works).
3. Failure path: in the DevTools Network tab, right-click the earlier `POST /api/notes` request and choose "Block request URL" (or stop the backend container), type `Failure check`, click "Save note" → the red message "The note could not be saved. Please try again." appears, `Failure check` stays in the field, and the button is enabled again.
4. Unblock the URL (or restart the backend), click "Save note" again → `Failure check` is saved and appears once in the list; the error message disappears.
5. Automated check: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → `0 failed`.
