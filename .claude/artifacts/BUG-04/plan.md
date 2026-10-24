# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice

(ClickUp task 123k99cx47m, a defect item. The tracker item carries no description; the title above is the whole feature text. Its 9 comments are framework run notes from earlier, reverted runs and carry no stakeholder content.)

## Acceptance Criteria
- [ ] 1. Submitting the note form a second time while the first save of that note is still in progress (a fast double click on `Save note`, or `Enter` pressed again) stores the note only once: exactly one `POST /api/notes` is sent and the note appears once in the on-page list.
- [ ] 2. Once the in-progress save has finished, successfully or with an error, the form accepts the next submit again, so a new note can be saved and a failed save can be retried.

## Re-Plan Feedback
- Comment (tracker): 9 comments read, all framework run notes from earlier reverted runs, none carrying stakeholder content → Addressed by: not acted on because none states a requirement, a correction or a reproduction.
- Assumption (no description on the item): criterion 1 is derived from the title alone. "Twice quickly" is read as a second submit fired while the first `POST /api/notes` has not yet answered, which is the only window in which the current `NoteForm` (no in-flight guard, button never disabled) can send two requests for one note. → Addressed by: criterion 1 plus a client-side in-flight guard in `NoteForm.tsx`.
- Assumption: the fix is client-side only. A server-side dedupe (rejecting a second identical text) is not planned, because the title does not ask for it and it would also reject a user who deliberately saves the same text twice later, which TEST-03 allows. → Addressed by: no backend change, so the shared-risk overlap with TEST-12 (notes router, service and repository) does not materialise.
- Assumption: criterion 2 is not new scope but the non-regression bound on criterion 1: a guard that never releases would break TEST-03's save flow and NoteForm's existing "error message and keeps the text when saving fails" behaviour. → Addressed by: criterion 2, guard released in a `finally`.
- Reproduction (for /fix Section R1): class `local-automated`, source `none` in the item (derived from the title). Command: `npm --prefix frontend test -- src/components/NoteForm.test.tsx -t "submits only once"`. The new Vitest case mocks `createNote` with a promise left pending, submits the form twice, and asserts `createNote` was called once; on the code at plan base 9a6bfd7 it fails with two calls, and passes once the guard lands. Manual reproduction: run the stack, throttle the network in the browser devtools (Slow 3G), type a note and double-click `Save note`: before the fix the list shows the note twice and `GET /api/notes` returns two rows with the same text.
- Merged since the last plan: n/a (fresh plan, planned against main 9a6bfd7, which already carries TEST-08's `frontend/src/api/baseUrl.ts` and `version.ts`; this plan touches neither).

## Plan Overview
A frontend-only defect fix in `frontend/src/components/NoteForm.tsx`. `handleSubmit` currently awaits `createNote` with nothing stopping a second submit from starting a second request. The fix adds an in-flight guard: a `useRef` boolean checked and set synchronously at the top of `handleSubmit` (so a second submit event is ignored even before React re-renders), plus an `isSaving` state that sets the native `disabled` attribute on the `Save note` button while the request is pending. Both are released in a `finally`, after success or failure. No backend, API contract, or `LandingPage.tsx` change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard: `savingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`; at the top of `handleSubmit`, after `event.preventDefault()`, return early when `savingRef.current` is true; the empty-note validation stays before the guard is taken, so an empty submit never locks the form; set both before `await createNote(...)`, clear both in `finally`; `disabled={isSaving}` on the `note-submit` button). The existing validation, trim, error and success behaviour is unchanged.
- Routes: none.
- State management: local component state and a ref inside `NoteForm`; `LandingPage`'s `onCreated` wiring is unchanged.
- Design reference notes: AI freestyle (Design Reference mode NONE). The disabled button keeps the existing `buttonStyle` and adds `opacity: 0.6` and `cursor: "not-allowed"` only while `isSaving` is true; label stays `Save note`.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The existing internal contract (TEST-03) is what the guard protects:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

This fix guarantees the form sends at most one such request per submitted note while one is in flight.

## Technology Selection
- In-flight submit guard in `NoteForm`: chose the native `disabled` attribute on the submit button (a disabled default button also blocks implicit `Enter` submission per HTML) plus React's built-in `useRef` and `useState`, over a debounce or throttle helper from a library, because none is installed and a debounce would still allow a second request once its window expired while the first was pending.
- No new dependency, module or component is introduced.

## File Manifest
### New files
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus the failed-save-then-retry edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus `isSaving` state), `disabled={isSaving}` and disabled styling on the `note-submit` button, guard released in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: new cases: two submits while `createNote` is pending call it once (the reproduction, named "submits only once while a save is in progress"); button disabled while pending and enabled after success; after a rejected save the button is enabled and a retry calls `createNote` again; an empty submit does not disable the button

No dependency change, so no lockfile entry. README.md and docs/DEVELOPMENT.md need no edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `../api/notes` mocked (existing Vitest + Testing Library setup), using a manually resolved or rejected deferred promise for `createNote` to hold the save in flight.
  - Directory: frontend/src/components/ (co-located, as the existing `NoteForm.test.tsx`)
  - Naming: {Component}.test.tsx, the frontend's existing convention
- Integration tests: none added. The backend is unchanged, and `backend/tests/integration/test_notes_integration.py` keeps covering `POST /api/notes` as it stands.
  - Directory: backend/tests/integration/
- E2E tests: none added; no criterion is assigned to E2E (see Criterion coverage). The existing `e2e/tests/TEST-03_simple_note_form.spec.ts` keeps covering the single-submit save flow and must stay green.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one per criterion plus the failed-save-then-retry edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A second submit while the first save is in progress stores the note only once | Unit | The defect is the component's missing in-flight guard; a component test holding `createNote` pending and submitting twice proves exactly one call deterministically, whereas a browser double click depends on real network latency to hit the window |
| 2 | After the save finishes (success or error) the form accepts the next submit | Unit | It is the guard's release rule, verified by resolving or rejecting the mocked `createNote` and submitting again; no navigation is involved |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | A second submit while the first save is in progress stores the note only once | covered at Unit, see Criterion coverage | Given the landing page with a slow backend, When I type "Buy milk" and click Save note twice quickly, Then "Buy milk" appears once in the list and once after a reload |
| 2 | After the save finishes the form accepts the next submit | covered at Unit, see Criterion coverage | Given a note was just saved, When I type "Walk dog" and click Save note, Then "Walk dog" is saved; Given the backend is stopped and a save failed, When I restart it and click Save note again, Then the note is saved |

## Manual verification plan
### Criterion 1: A second submit while the first save is in progress stores the note only once
Prerequisites: the stack is running (`docker compose up`), the frontend is open at `http://localhost:5183/`, and the browser devtools Network tab is open with throttling set to `Slow 3G` so the save stays in flight long enough to click again.
1. On the landing page, type `Double click check` in the `New note` field → the text is in the field.
2. Double-click `Save note` quickly → while the request is pending the `Save note` button is greyed out and does not respond; the Network tab shows exactly one `POST /api/notes`.
3. Wait for the request to finish → `Double click check` appears exactly once in the list and the field is empty.
4. Set throttling back to `No throttling` and reload the page → `Double click check` appears exactly once in the list.
5. Repeat steps 1 to 3 with `Enter twice check`, pressing `Enter` twice quickly in the field instead of clicking → one `POST /api/notes`, and `Enter twice check` appears once.
6. Automated check: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → `0 failed`, including "submits only once while a save is in progress".

### Criterion 2: Once the save has finished, the form accepts the next submit
Prerequisites: as for criterion 1, throttling `No throttling`.
1. On the landing page, type `First note` and click `Save note` → `First note` appears in the list and the `Save note` button is enabled again.
2. Type `Second note` and click `Save note` → `Second note` appears below `First note`; two notes were saved by two clicks.
3. Stop the backend (`docker compose stop backend`), type `Retry note` and click `Save note` → the message "The note could not be saved. Please try again." appears, the field still holds `Retry note`, and the `Save note` button is enabled.
4. Start the backend (`docker compose start backend`) and click `Save note` once → `Retry note` appears once in the list and the error message is gone.
5. Automated check: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → `0 failed`, including the enabled-after-success and retry-after-failure cases.
