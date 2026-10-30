# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (ClickUp task 123k99cx47m, list Validation sandbox. The tracker description is empty: the title above is the whole item text. The acceptance criteria below are derived from the title and recorded as an assumption, see Plan Overview.)

## Acceptance Criteria
- [ ] 1. Submitting the same note twice in quick succession (a double-click on "Save note", or Enter pressed twice before the first save returns) sends exactly one create request and stores exactly one note, which appears once in the list.
- [ ] 2. While a save is in flight, the "Save note" button is disabled, so no second submission can start until the first one has finished.
- [ ] 3. Once the save finishes, the form accepts a new submission again: after a success the input is cleared and the button is enabled; after a failure the typed text is kept, the existing error message is shown and the button is enabled so the user can retry.

## Re-Plan Feedback
- Comment (tracker): 15 comments read on ClickUp task 123k99cx47m, all framework PR notices from earlier runs (PR links of previous BUG-04 attempts) → not acted on because none states a requirement, correction or reproduction; no actionable tracker or PR feedback exists for this plan.
- Merged since the last plan: none → fresh plan against main at 3d7efb9, the current tip; no `[merged-since]` lines were handed to this dispatch.

## Plan Overview
The defect is client-side. `frontend/src/components/NoteForm.tsx` calls `createNote` from `handleSubmit` with no guard, and the "Save note" button stays enabled while the request is pending, so a second click or a second Enter fires a second `POST /api/notes` before the first one resolves, and the backend stores both. The fix adds an in-flight guard to `NoteForm`:

1. A synchronous `useRef<boolean>` flag (`isSubmittingRef`) checked at the top of `handleSubmit`, after `event.preventDefault()`: if a save is already in flight the handler returns without calling `createNote`. A ref is required in addition to state because two click events dispatched in the same tick both run before React re-renders, so a state-only check would let the second through.
2. A `useState<boolean>` flag (`isSaving`) that drives `disabled={isSaving}` on the `note-submit` button, the visible half of the guard, and stops a native implicit (Enter) submission while it is set.
3. Both flags are set immediately before `await createNote(...)` and released in a `finally` block, so a rejected save re-enables the form (criterion 3). The empty and whitespace-only validation path returns before the flags are set and is unchanged.

Assumptions (recorded because the tracker item has no description, `user_story_alignment.md` Section 4, autonomous mode):
- A1. "Twice quickly" means two submissions of the same form before the first save has returned, from a double-click or a repeated Enter. Two deliberate saves of the same text after the first one finished remain two notes: the app has no uniqueness rule on note text and this item does not ask for one.
- A2. The fix is client-side only. A server-side dedupe (idempotency key, uniqueness constraint, time-window check) is not planned: the backend cannot tell an accidental double submit from an intentional repeated note without a new contract, which is beyond this item's scope (`user_story_alignment.md` Section 3). Consequence: no backend file is touched, so the TEST-12 / notes-router overlap the feature map flags does not apply.
- A3. The button label stays "Save note" while saving; no spinner or "Saving..." label is added (not asked for). A disabled visual cue (reduced opacity, `not-allowed` cursor) is added because a disabled button that looks enabled reads as broken.
- A4. History note, not a requirement: the same defect was fixed on main before (36e41ec, PR #398) and that code was removed by the sandbox reset a90e181. The current `NoteForm.tsx` at 3d7efb9 carries no guard, so the defect is live and this plan is written against the code as it stands, not against the earlier fix.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard: `isSubmittingRef` + `isSaving`, `disabled={isSaving}` on `note-submit`, release in `finally`, disabled button style); `frontend/src/components/NoteForm.test.tsx` (new unit tests for the guard, including the reproduction test).
- Routes: none (the form lives on `/`, rendered by `LandingPage`, which is not modified).
- State management: local component state, unchanged pattern: one `useRef` for the synchronous guard and one `useState` for the rendered disabled state. `LandingPage`'s `onCreated` callback is unchanged and is called once per stored note.
- Design reference notes: AI freestyle. Design Reference mode is NONE. Disabled state of the existing `note-submit` button: keep `buttonStyle` and add `opacity: 0.6` and `cursor: "not-allowed"` when `isSaving` is true; every other value of the button stays as it is.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; the fix only changes how often the frontend calls it.
- Method: POST
- URL: /api/notes
- Request: JSON body with one field, `text` (string, trimmed, 1 to 500 characters)
- Response: 201 with the stored note, e.g. `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard in `NoteForm`: chose React's built-in `useRef` and `useState` (already installed) plus the native `disabled` attribute on the submit button over a debounce or throttle dependency (`lodash.debounce` is not installed) and over a server-side idempotency key, because a debounce delays every legitimate save and guesses a time window, while the in-flight flag blocks exactly the overlap that causes the duplicate.
- Disabled styling: chose an inline `CSSProperties` override (the file's existing styling approach) over a CSS file or a styling library; no alternative was needed.
- No net-new module or dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec: a double-click on Save note stores one note and sends one POST; edge case: Enter pressed twice in the input stores one note
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the artifact copy of the manual UAT script that build-feature writes alongside it

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the synchronous in-flight guard (`isSubmittingRef`), the `isSaving` state, `disabled={isSaving}` and the disabled style on `note-submit`, and release both in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: add unit tests: two submits before the save resolves call `createNote` once (the reproduction); the button is disabled while the save is pending and enabled after it resolves; a rejected save re-enables the button, keeps the text and shows the error; a new save is accepted after the first one completes

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour under a pending, resolved and rejected `createNote` (mocked, as the existing tests do), using a manually controlled promise so the in-flight window is deterministic.
  - Directory: frontend/src/components/ (co-located Vitest tests, the existing convention for `NoteForm.test.tsx`)
  - Naming: existing file `NoteForm.test.tsx`, test names describe scenario and outcome
- Integration tests: none added. The backend is unchanged and `POST /api/notes` is already covered by `backend/tests/integration/test_notes_integration.py`; no repository, model or router changes (`testing_standards.md` Section 6).
  - Directory: backend/tests/integration/
- E2E tests: criterion 1 only, double-click and double-Enter through the real UI against the real backend, counting `POST /api/notes` requests and list items.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (Enter pressed twice).
  - Directory: e2e/uat/scenarios/

Reproduction (fix Section R1 class): local-automated. Command: `npm --prefix frontend test -- src/components/NoteForm.test.tsx`. The new unit test "submits only once when the form is submitted twice before the save resolves" fails on the current code (`createNote` is called twice) and passes after the fix.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A quick double submission sends one create request and stores one note | E2E | — |
| 2 | Save note is disabled while a save is in flight | Unit | verifying it needs no navigation: it is the button's disabled attribute during a pending promise, which a unit test holds open deterministically while a browser test would race the real response |
| 3 | After the save finishes the form accepts a new submission; on failure the text and error are kept and the button re-enabled | Unit | verifying it needs no navigation: it is the component's reaction to a resolved or rejected `createNote`, and a rejection cannot be produced on demand through the real backend |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Quick double submission stores one note | Fill `note-input` with a unique text, `dblclick` on `note-submit`, record every `POST /api/notes`; assert exactly one request, one `note-list-item-*` with that text, and one row after a reload. Edge case: press Enter twice in `note-input`, same assertions | Given the landing page is open, When I type a note and double-click Save note, Then the note appears once in the list and once after a reload |
| 2 | Disabled while in flight | covered at Unit, see Criterion coverage | Given a slow network, When I click Save note, Then the button is disabled until the note appears |
| 3 | Form usable again after success or failure | covered at Unit, see Criterion coverage | Given a save has finished, When I type another note and click Save note, Then it is saved; Given the backend is down, When I click Save note, Then the error shows, my text stays and the button is enabled |

## Manual verification plan
### Criterion 1: A quick double submission sends one create request and stores one note
Prerequisites: the stack is running (backend on http://localhost:8010, frontend on http://localhost:5183) per docs/DEVELOPMENT.md; Chrome or Edge with DevTools available.
1. Open `http://localhost:5183/` → the "Task Notes" page with the "New note" field and the "Save note" button is shown.
2. Open DevTools → Network, filter on `notes`, and clear the log → the request list is empty.
3. Type `Double click check 1` in the "New note" field → the text is in the field.
4. Double-click "Save note" as fast as you can → exactly one `POST` to `/api/notes` with status 201 appears in the Network list, and "Double click check 1" appears once in the note list; the field is cleared.
5. Type `Double enter check 1` in the field, then press Enter twice quickly → exactly one more `POST /api/notes` appears, and "Double enter check 1" appears once in the list.
6. Reload the page → "Double click check 1" and "Double enter check 1" each appear exactly once in the list.

### Criterion 2: Save note is disabled while a save is in flight
Prerequisites: as for Criterion 1, plus DevTools → Network throttling set to "Slow 3G" so the save takes a few seconds.
1. On `http://localhost:5183/`, type `Slow save check` in the "New note" field → the text is in the field.
2. Click "Save note" once → the button turns faded (reduced opacity) and the cursor over it shows "not allowed" while the request is pending.
3. While it is still pending, click "Save note" three more times → nothing happens; the Network list still shows a single pending `POST /api/notes`.
4. Wait for the request to finish → "Slow save check" appears once in the list and the button returns to its normal look.
5. Set throttling back to "No throttling".

### Criterion 3: After the save finishes the form accepts a new submission; a failure keeps the text and re-enables the button
Prerequisites: as for Criterion 1.
1. On `http://localhost:5183/`, type `First after fix`, click "Save note" → "First after fix" appears in the list, the field is cleared and "Save note" is enabled.
2. Type `Second after fix`, click "Save note" → "Second after fix" also appears in the list (the form accepted a new save).
3. In DevTools → Network, right-click any `/api/notes` request and choose "Block request URL", then type `Blocked save check` and click "Save note" → the message "The note could not be saved. Please try again." appears, the field still holds "Blocked save check", and "Save note" is enabled.
4. Unblock the URL (DevTools → Network request blocking, untick the entry) and click "Save note" again → "Blocked save check" appears once in the list and the error message is gone.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → the run reports 0 failed for `src/components/NoteForm.test.tsx`.
