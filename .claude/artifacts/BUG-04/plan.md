# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task, 123k99cx47m, carries no description. The criteria below are derived from the title and each is recorded as an assumption under `## Re-Plan Feedback`.)

## Acceptance Criteria
- [ ] Submitting the note form twice in quick succession (a double click on "Save note", or a second click or Enter while the first save is still in flight) sends exactly one `POST /api/notes`, stores exactly one note, and the note appears once in the on-page list.
- [ ] Once the in-flight save settles, whether it succeeded or failed, the form accepts the next submit again (the guard never leaves the form stuck).

## Re-Plan Feedback
- Comment (tracker): none actionable. The dispatch reports the item's tracker comments as none actionable (decisions.md: 16 read, 0 actionable, all framework PR notices from earlier runs) → Addressed by: nothing to act on.
- Assumption (no description on the item): criterion 1 is the title restated as an observable outcome. "Quickly" is read as "before the first save's response has arrived", which is the only window in which the current `NoteForm` can issue a second request for the same text → Addressed by: an in-flight guard in `NoteForm`.
- Assumption: the fix is client-side only. Two notes with identical text submitted deliberately, one after the other, remain legitimate; a server-side duplicate rule (unique text, an idempotency key) would change the API contract and reject that, which nothing in the item asks for (`user_story_alignment.md` scope containment) → Addressed by: no backend change.
- Assumption: criterion 2 is included because a guard that is never released would turn this defect into a worse one (a form that saves only once per page load). It adds no behaviour beyond what the existing TEST-03 flow already does after one submit.
- Merged since the last plan: n/a (fresh plan, branched from current main at 043121a).

## Plan Overview
`NoteForm` (`frontend/src/components/NoteForm.tsx`) awaits `createNote` with no guard, so every submit event fired before the first response returns issues another `POST /api/notes`, and the backend stores each one. The fix is confined to that component:

- A `useRef<boolean>` in-flight flag, checked and set synchronously at the top of `handleSubmit` (after the empty-text validation), and cleared in a `finally` once `createNote` settles. A ref, not only state, because two submit events can be dispatched before React re-renders, and a state value read in the second handler would still be the stale `false`.
- An `isSaving` state mirroring the flag, used only to set `disabled` on the submit button while a save is in flight, so the user gets the standard native affordance and the browser itself drops clicks on the disabled button.

No backend, API, LandingPage or list changes. Reproduction class: `local-automated`, a new Vitest component test in `frontend/src/components/NoteForm.test.tsx` that holds `createNote` pending, submits twice, and asserts one call; it fails on today's code (two calls) and passes on the fix.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight ref guard, `isSaving` state, `disabled={isSaving}` on the `note-submit` button, `finally` that releases both). `frontend/src/components/NoteForm.test.tsx` (reproduction test and the release test, see Testing Strategy).
- Routes: none.
- State management: local component state plus one ref inside `NoteForm`; `LandingPage`'s `onCreated` wiring is unchanged and is called once per stored note.
- Design reference notes: AI freestyle (Design Reference mode NONE). The disabled button keeps the existing `buttonStyle`; the only visual addition is `cursor: "not-allowed"` and `opacity: 0.6` while `isSaving` is true, so the in-flight state is visible.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The existing internal contract the fix relies on:
- Method: POST
- URL: /api/notes
- Request: `{ "text": string }` (1 to 500 characters after trimming)
- Response: 201 with `{ "id": number, "text": string }`

The fix changes only how many times the frontend calls it per user intent (once).

## Technology Selection
- In-flight guard: chose a React `useRef` flag plus the native `disabled` attribute on the submit button over a debounce or throttle helper (none is installed, and a time window either blocks a legitimate second note or lets a slow first save through) and over a new dependency such as a form library, because a ref and a native attribute cover the need with what React and HTML already provide.
- Reproduction test: no new test dependency; Vitest and `@testing-library/react`, both already installed in `frontend/package.json`, drive it with a manually resolved promise.

## File Manifest
<!-- Phase tags are the template's: [A] Frontend Plan, [G] Acceptance Test Outline. -->
### New files
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (Enter key pressed twice)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script build-feature writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard in `handleSubmit`, `isSaving` state, `disabled` and in-flight style on the `note-submit` button, release in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: reproduction test (two submits while `createNote` is pending produce one call and one `onCreated`) and release tests (after success and after failure the next submit calls `createNote` again; the button is disabled while pending)

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: `NoteForm` component tests with `createNote` mocked (Vitest + Testing Library), in the existing colocated file.
  - Reproduction (written first, must fail before the fix): `createNote` returns a promise the test resolves manually; type `Buy milk`, click `note-submit` twice before resolving; assert `createNote` was called once with `Buy milk`; resolve; assert `onCreated` was called once.
  - Disabled while pending: after the first click and before resolving, `note-submit` is disabled; after resolving it is enabled again.
  - Release after success: after a resolved save, typing `Walk dog` and submitting calls `createNote` a second time.
  - Release after failure: first save rejects, the error message shows and the text is kept; submitting again calls `createNote` a second time.
  - Directory: frontend/src/components/ (colocated `*.test.tsx`, this project's existing frontend convention; the backend unit directory in CLAUDE.md does not apply to frontend code)
  - Naming: `NoteForm.test.tsx`, the existing file
- Integration tests: none warranted. No repository, model, migration or endpoint changes (`testing_standards.md` Section 6); the existing `backend/tests/integration/test_notes_integration.py` stays as it is.
- E2E tests: none warranted for this item. Both criteria are verified deterministically at the component level by holding the API promise open, which a browser run against the fast local backend cannot reproduce without intercepting the route; the existing `e2e/tests/TEST-03_simple_note_form.spec.ts` specs keep covering the single-submit flow as a regression check.
  - Directory: e2e/tests/
  - File: none new
- UAT scenarios: one per criterion plus an edge case (Enter pressed twice in the input).
  - Directory: e2e/uat/scenarios/

Reproduction: class `local-automated`, source `item` (the title; the item has no description). Command, run from the repository root: `npm --prefix frontend test -- src/components/NoteForm.test.tsx`. Expected before the fix: exit 1, the reproduction test fails with `createNote` called 2 times. Expected after the fix: 0 failed.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Two quick submits send one POST, store one note, list it once | Unit | The defect is `NoteForm` issuing a second `createNote` call; a component test that holds the call pending drives the double submit deterministically, and one call is one stored note because the backend path is unchanged and already covered by TEST-03's integration and E2E tests |
| 2 | After the save settles (success or failure) the form accepts the next submit | Unit | It is the guard's release logic inside `NoteForm`; resolving or rejecting the mocked call and submitting again verifies it with no navigation |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Two quick submits send one POST, store one note, list it once | covered at Unit, see Criterion coverage | Given the landing page with a slow network, When I type "Buy milk" and double-click Save note, Then exactly one "Buy milk" appears in the list and after a reload still exactly one |
| 2 | After the save settles the form accepts the next submit | covered at Unit, see Criterion coverage | Given a note was just saved, When I type "Walk dog" and click Save note, Then "Walk dog" is added to the list |

## Manual verification plan
### Criterion 1: Two quick submits send one POST, store one note, list it once
Prerequisites: the stack running locally (frontend at http://localhost:5183, backend reachable), Chrome or Edge with DevTools; the text `Buy milk BUG-04` not yet in the list (use a new suffix such as `Buy milk BUG-04 a1` if it is).
1. Open http://localhost:5183/ and open DevTools → Network, filter `notes`, set throttling to `Slow 3G` → the landing page shows the "New note" field, the "Save note" button and the note list.
2. Type `Buy milk BUG-04 a1` into the "New note" field → the text shows in the field.
3. Double-click "Save note" quickly → the button turns greyed out (disabled) right after the first click; the Network panel shows exactly one `POST /api/notes` request.
4. Wait for the request to finish → `Buy milk BUG-04 a1` appears once in the list, the field is empty, the button is enabled again.
5. Set throttling back to `No throttling` and reload the page → `Buy milk BUG-04 a1` is listed exactly once.
6. Repeat steps 1 to 4 with `Call mum BUG-04 a1`, but press Enter twice in the field instead of double-clicking → one `POST /api/notes` in the Network panel and `Call mum BUG-04 a1` listed once.
7. From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → 0 failed, including the double-submit reproduction test.

### Criterion 2: After the save settles the form accepts the next submit
Prerequisites: as for Criterion 1, throttling `No throttling`.
1. On http://localhost:5183/ type `Walk dog BUG-04 a1` and click "Save note" once → it appears in the list and the field clears.
2. Type `Feed cat BUG-04 a1` and click "Save note" → a second `POST /api/notes` is sent and `Feed cat BUG-04 a1` appears below `Walk dog BUG-04 a1`.
3. Stop the backend (for example `docker compose stop backend`), type `Water plants BUG-04 a1` and click "Save note" → the red message "The note could not be saved. Please try again." appears, the text stays in the field and the button is enabled again.
4. Start the backend again (`docker compose start backend`), click "Save note" → the message disappears and `Water plants BUG-04 a1` appears in the list once.
5. From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → 0 failed, including the release-after-success and release-after-failure tests.
