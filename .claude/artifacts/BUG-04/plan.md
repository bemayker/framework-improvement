# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m carries no description. The acceptance criteria below are derived from the title, kept minimal, and every assumption is recorded under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] 1. Clicking "Save note" twice in quick succession with the same text stores the note only once: exactly one create request is sent, exactly one list entry appears, and after a page reload the note is still listed exactly once.
- [ ] 2. While a save is in progress the "Save note" button is disabled, and it is enabled again once the save has succeeded or failed, so a next note (or a retry after an error) can be saved normally.

## Re-Plan Feedback
- Comment (tracker): 4 comments on the item, all mayker-dev PR notices from earlier runs (recorded in decisions.md) → not acted on because none states a requirement or correction for this defect.
- Assumption (no description): the defect is a client-side double submit in frontend/src/components/NoteForm.tsx, whose submit handler has no in-flight guard, so a second click before the first POST /api/notes resolves sends a second POST. The fix is a submit guard in the form, not backend de-duplication: two genuinely separate saves of the same text remain allowed, since nothing in the item asks to forbid duplicate note texts.
- Assumption (scope): no idempotency key, no unique constraint on notes.text and no backend change. Either would be gold plating against a title that names the double-save gesture only (user_story_alignment.md Section 3).
- Assumption (re-plan context): an earlier run fix for this item was reverted by eed558f; this plan is written fresh against main at eed558f, where NoteForm.tsx has no guard.
- Merged since the last plan: n/a (fresh plan against current main eed558f, no merged-since lines in the dispatch).

## Plan Overview
Frontend-only fix in NoteForm. Add an in-flight flag: a ref checked and set synchronously at the top of handleSubmit (so a second submit event that arrives before React re-renders is dropped), mirrored into state so the "Save note" button renders disabled while the request is open. The flag is cleared in a finally block, so success and failure both re-enable the button. Covered by Vitest component tests on NoteForm and one Playwright spec that double-clicks Save note against the real backend. No backend, schema or API change; LandingPage.tsx is not touched.

## Frontend Plan
- Components to create/modify: frontend/src/components/NoteForm.tsx only.
  - Add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`.
  - In handleSubmit, after `event.preventDefault()`: if `isSavingRef.current` is true, return immediately (no request, no error message). Keep the existing empty and whitespace validation before the guard is set, so an empty submit never locks the form.
  - Immediately before `createNote(trimmedText)`: set `isSavingRef.current = true` and `setIsSaving(true)`. Wrap the existing try/catch in try/catch/finally; the finally sets `isSavingRef.current = false` and `setIsSaving(false)`.
  - Submit button: add `disabled={isSaving}`; keep data-testid note-submit and the label "Save note" unchanged. While disabled, the button style uses `cursor: "not-allowed"` and `opacity: 0.6` (merged over buttonStyle) so the state is visible.
  - The ref is the actual guard (it is set synchronously, before any re-render); the state only drives rendering. Both are needed: state alone leaves a window where a second event reads the stale value.
- Routes: none.
- State management: local component state plus one ref inside NoteForm; LandingPage and its onCreated callback are unchanged.
- Design reference notes: AI freestyle (Design Reference mode NONE). Disabled Save note button: existing buttonStyle values unchanged, plus opacity 0.6 and cursor not-allowed while a save is in progress.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form still calls the existing endpoint through frontend/src/api/notes.ts createNote:
- Method: POST
- URL: /api/notes
- Request: JSON body with one string field `text` (1 to 500 characters after trimming)
- Response: 201 with the stored note, fields `id` (integer) and `text` (string)
The fix changes how many times the form calls it per user gesture (once), not the contract.

## Technology Selection
- In-flight submit guard in NoteForm: chose React useRef plus useState (already installed, React) and the native `disabled` attribute on the submit button over a debounce or throttle helper (lodash or a hand-written timer), because a time window either still lets a slow request double up or blocks a legitimate next save, while the in-flight flag matches exactly the request lifetime. The native disabled attribute also stops implicit form submission by the Enter key, since a form whose default button is disabled does not submit implicitly.
- No new dependency, module or component is introduced; the Vitest, Testing Library and Playwright setup already installed covers every test.

## File Manifest
Phase tags as defined by the plan template; one tag per entry.

### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec that double-clicks Save note and asserts one POST /api/notes, one list entry, and one entry after reload; plus the edge case that the button is enabled again after the save.
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard and isSaving state; Save note button disabled while saving; finally block clears the flag.
- [A] frontend/src/components/NoteForm.test.tsx: Vitest cases for the double submit, the disabled state while pending, and re-enabling after success and after failure.
No lockfile changes: no dependency is added or upgraded.
No README.md or docs/DEVELOPMENT.md change: the fix alters no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: NoteForm component behaviour with createNote mocked (vi.mock of ../api/notes), using a deferred promise so the request stays pending under test control.
  - Directory: frontend/src/components/ (co-located Vitest files, the existing frontend convention; the backend unit directory backend/tests/unit/ is not touched)
  - Naming: NoteForm.test.tsx (existing file, extended)
  - Cases: (a) two submit clicks while the first createNote is pending call createNote exactly once and onCreated exactly once; (b) the button is disabled while pending; (c) the button is enabled again after the save resolves, and a second note can then be saved (createNote called twice in total); (d) the button is enabled again after the save rejects, the error message shows and the text is kept, and a retry sends a new request; (e) an empty submit does not disable the button (guard set only after validation).
- Integration tests: not warranted. No repository, model, migration or router code changes (testing_standards.md Section 6); the existing backend/tests/integration/test_notes_integration.py stays as is.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: one spec for the double-click gesture against the real backend.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
  - Approach: reuse the TEST-03 spec patterns (exact-path matcher for POST /api/notes, unique note text per test, wait for the mount GET before interacting). Double-click via `page.getByTestId("note-submit").dblclick()` after filling a unique text; wait for the 201 response; assert exactly one recorded POST, exactly one list item with that text, then reload and assert still exactly one. Edge-case spec: after the save completes the button is enabled and a second unique note saves.
- UAT scenarios: one scenario per criterion plus one edge case (retry after a failed save is covered by the manual script; the Gherkin edge case is saving a second distinct note right after the first).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Double-clicking Save note stores the note once (one request, one list entry, one entry after reload) | E2E (plus Unit) | — |
| 2 | Save note is disabled while a save is in progress and enabled again after success or failure | Unit | Verifying the in-flight window needs the request held open and a forced failure, which a component test with a deferred createNote mock does deterministically in milliseconds; a browser would need network interception to do the same. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double-click stores the note once | Fill unique text, dblclick note-submit, wait for 201, assert one POST recorded, one note-list-item with that text, reload, still one | Given the landing page is open, When I enter a note and click Save note twice quickly, Then the note appears once in the list and once after reload |
| 2 | Button disabled while saving, re-enabled after | covered at Unit, see Criterion coverage; the E2E edge-case spec checks the button is enabled after a completed save | Given I saved a note, When the save completes, Then Save note is enabled and a second note can be saved |

## Manual verification plan

### Criterion 1: Double-clicking Save note stores the note only once
Prerequisites: the app stack is running (frontend at http://localhost:5183, backend reachable at its configured API base URL); a desktop browser with DevTools.
1. Open http://localhost:5183/ → the "Task Notes" page shows the "New note" field, the "Save note" button and the saved notes list.
2. Open DevTools, Network tab, filter on `api/notes`, and set throttling to "Slow 3G" → the throttling selector shows Slow 3G.
3. Type `Double click check 1` in the New note field → the field shows the text.
4. Double-click "Save note" as fast as possible → the Network tab shows exactly one POST request to /api/notes.
5. Wait for the request to finish → `Double click check 1` appears exactly once in the saved notes list and the field is empty.
6. Set throttling back to "No throttling" and reload the page → `Double click check 1` is still listed exactly once.

### Criterion 2: Save note is disabled while saving and enabled again after success or failure
Prerequisites: as for Criterion 1, DevTools Network tab open.
1. Set throttling to "Slow 3G", type `Disabled state check` in the New note field and click "Save note" once → while the POST is pending the button looks faded (reduced opacity) and clicking it again does nothing.
2. Wait for the request to finish → `Disabled state check` is listed once, and the button is back to full opacity.
3. Type `Second note after save` and click "Save note" → the note saves and is listed once (the button is usable again after success).
4. In the Network tab, set throttling to "Offline", type `Offline retry check` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again.
5. Set throttling back to "No throttling" and click "Save note" → the note saves, is listed once, the error message disappears and the field is empty.
6. Run `npm --prefix frontend test -- NoteForm` from the repository root → frontend/src/components/NoteForm.test.tsx runs with 0 failed.
