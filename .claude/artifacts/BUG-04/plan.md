# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m has an empty description; the acceptance criteria below are derived from the title. See `## Re-Plan Feedback`.)

## Acceptance Criteria
- [ ] Submitting the note form a second time while the first save of that note is still in progress (a double click on "Save note", or pressing Enter twice) sends exactly one create request, so the note is stored once and appears once in the list.
- [ ] Once a save has completed, successfully or with an error, the form accepts the next submission again: a further note can be saved, and a failed save can be retried.

## Re-Plan Feedback
- Comment (tracker): 38 comments on the ClickUp task, all framework PR notices from earlier runs (recorded in `.claude/artifacts/BUG-04/decisions.md`) → Addressed by: not acted on, because none states a requirement or correction for this item.
- Assumption (no tracker description): the criteria are derived from the title alone. "Twice quickly" is read as a second submission that happens while the first `POST /api/notes` is still pending; two deliberate submissions of the same text after the first has completed remain two notes, because nothing in the item or in TEST-03 makes note text unique.
- Assumption (where the fix lives): the defect is fixed client-side, in `NoteForm`, with an in-flight guard (a synchronous ref checked at the top of the submit handler) plus a disabled "Save note" button while the save is pending. A server-side idempotency key or a uniqueness constraint on note text is not planned: it is not asked for, it would change the API contract TEST-03 shipped, and it would reject legitimate repeated notes (`user_story_alignment.md` Section 3, no gold plating). No backend changes.
- Assumption (reproduction): the defect is reproduced by a Vitest test on `NoteForm` that holds `createNote` pending, submits twice, and asserts one call. It fails on the current code (two calls) and passes after the fix. The E2E spec reproduces it end to end by holding the `POST /api/notes` route until the second click has happened.
- Merged since the last plan: n/a (fresh plan, branched from current main at 44390963b2fa400af53a898b04f63d5d9b502a4b, which already contains TEST-08's footer change).

## Plan Overview
A frontend-only fix in `frontend/src/components/NoteForm.tsx`. `handleSubmit` currently awaits `createNote` with no guard, so every submit event fired before the first response arrives issues another `POST /api/notes`, and each response is appended to the list by `LandingPage`'s `onCreated`. The fix adds an in-flight guard: a `useRef<boolean>` set synchronously before the request and cleared in a `finally`, so a second submit event in the same tick is ignored even before React re-renders, plus an `isSaving` state that disables the submit button for the duration so the user sees that the save is underway. `LandingPage.tsx`, the notes API client and the backend are untouched.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (modify). Add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`, after `event.preventDefault()`, return immediately when `isSavingRef.current` is true; keep the existing empty and whitespace validation unchanged (it sends no request, so it does not set the guard); before `await createNote(...)` set `isSavingRef.current = true` and `setIsSaving(true)`; in a `finally` block set `isSavingRef.current = false` and `setIsSaving(false)`. The success and failure branches stay as they are (clear text and call `onCreated` on success; show `SAVE_FAILED_MESSAGE` and keep the text on failure). The submit button gets `disabled={isSaving}` and `aria-busy={isSaving}`, and a disabled style variant. Its label stays "Save note" and its `data-testid="note-submit"` is unchanged, so TEST-03's E2E spec and unit tests keep their locators.
- Routes: none.
- State management: local component state (`useState`) for the rendered disabled state, plus a `useRef` for the synchronous guard; no shared state, and `LandingPage`'s `onCreated` wiring is unchanged.
- Design reference notes: AI freestyle. Disabled "Save note" button: the existing `buttonStyle` values (padding 0.5rem 1rem, font-size 1rem, weight 600, color #ffffff, background #1a1a1a, radius 0.375rem) plus `opacity: 0.6` and `cursor: "not-allowed"` while a save is in progress; no other visual change.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; this fix consumes the existing internal endpoint exactly as TEST-03 defined it.
- Method: POST
- URL: /api/notes
- Request: `{ "text": string }` (trimmed, 1 to 500 characters)
- Response: 201 with the stored note, e.g. `{ "id": 12, "text": "Buy milk" }`

## Technology Selection
- In-flight submit guard: chose React's built-in `useRef` and `useState` plus the native `disabled` attribute on the `<button type="submit">` over a debounce/throttle utility or a new form library, because a pending-request flag is a few lines of code with what React already provides, and a native disabled submit button also blocks the Enter-key resubmission path; no new dependency.
- No other net-new component, module or dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: E2E reproduction, a double click on "Save note" while the POST is held stores and lists the note once
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-04/uat_script.md: the artifact copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus `isSaving` state), disabled and `aria-busy` submit button while saving, disabled style variant
- [A] frontend/src/components/NoteForm.test.tsx: reproduction test (two submits while `createNote` is pending produce one call) and the re-enable-after-success, retry-after-failure and disabled-while-saving tests

No dependency changes, so no lockfile is regenerated.
Neither README.md nor docs/DEVELOPMENT.md needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.
`frontend/src/components/LandingPage.tsx` is deliberately not modified: the duplicate is prevented at its source in `NoteForm`, so the `onCreated` wiring in `LandingPage` stays as it is.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (Vitest + Testing Library), extending the existing file. The reproduction holds the mocked `createNote` on a promise the test resolves manually, fires `note-submit` twice, and asserts one call; on the current code it fails with two calls.
  - Directory: frontend/src/components/ (co-located Vitest files, matching the existing `NoteForm.test.tsx`; CLAUDE.md's unit directory `backend/tests/unit/` is the backend's)
  - Naming: `{Component}.test.tsx`, the existing frontend convention
- Integration tests: not warranted. No repository, model, migration or router changes (`testing_standards.md` Section 6); the backend's existing `test_notes_integration.py` is untouched.
  - Directory: backend/tests/integration/ (no new file)
- E2E tests: one spec reproducing the double click end to end. It intercepts `POST /api/notes` with `page.route`, holds the first request until the second click has been dispatched (no fixed timeout: the handler awaits a promise the test resolves after the double click), then lets it continue; asserts exactly one POST was issued and exactly one `note-list` item carries the unique note text, then that the button is enabled again.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus an edge case (pressing Enter twice while saving).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A second submission while the first save is in progress sends one create request; the note is stored and listed once | E2E | `stores a note once when Save note is clicked twice quickly`, `sends only one create request when the form is submitted twice before the first save completes` | — |
| 2 | Once a save has completed (success or error) the form accepts the next submission again | Unit | `accepts a new submission once the previous save has completed`, `accepts a retry once a failed save has completed`, `disables the save button while a save is in progress` | verifying it needs no navigation through the app: it is the form component's own state after a resolved or rejected `createNote`, fully observable with the API client mocked |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double submission stores the note once | Hold `POST /api/notes` via `page.route`, fill a unique text, `dblclick` on `note-submit`, release the route, assert one recorded POST and one list item with that text | Given the landing page with a slow network, When I click "Save note" twice quickly for "Buy milk", Then "Buy milk" appears once in the list |
| 2 | Form accepts the next submission after completion | covered at Unit, see Criterion coverage | Given a note was just saved, When I save "Walk dog", Then "Walk dog" appears in the list |

## Manual verification plan
### Criterion 1: A second submission while the first save is in progress stores the note once
Prerequisites: the app stack is running (frontend at http://localhost:5183, backend reachable at its configured API base URL), Chrome with DevTools open on the Network tab.
1. Navigate to `http://localhost:5183/` → the "Task Notes" heading, the "New note" field and the "Save note" button are shown.
2. In DevTools Network, set throttling to `Slow 3G` → the page stays as it is; saves will now take a few seconds.
3. Enter `Buy milk BUG-04` in the "New note" field → the text is shown in the field.
4. Double-click "Save note" quickly → the button greys out (disabled) immediately and the Network tab shows exactly one `POST /api/notes` request.
5. Wait for that request to finish → `Buy milk BUG-04` appears exactly once in the note list, the field is empty and the button is enabled again.
6. Set throttling back to `No throttling` and reload the page → `Buy milk BUG-04` is still listed exactly once.
7. Repeat steps 2 to 5 with `Call mum BUG-04`, but press Enter twice in the field instead of clicking → one `POST /api/notes` request, and `Call mum BUG-04` appears once.

### Criterion 2: Once a save has completed, the form accepts the next submission again
Prerequisites: as for Criterion 1, throttling set to `No throttling`.
1. Navigate to `http://localhost:5183/` → the form is shown with "Save note" enabled.
2. Enter `Walk dog BUG-04` and click "Save note" → `Walk dog BUG-04` appears in the list and the field clears.
3. Enter `Feed cat BUG-04` and click "Save note" → `Feed cat BUG-04` appears below `Walk dog BUG-04`; the second save was not blocked.
4. Stop the backend (for example `docker compose stop backend` from the repository root), enter `Water plants BUG-04` and click "Save note" → the red message "The note could not be saved. Please try again." appears, the text stays in the field and the button is enabled again.
5. Start the backend again (`docker compose start backend`), then click "Save note" → `Water plants BUG-04` appears once in the list, the error message is gone and the field clears.
6. Optional automated check: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → `0 failed`, running the NoteForm tests including the four BUG-04 tests named in `### Criterion coverage`.
