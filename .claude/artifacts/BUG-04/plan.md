# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m has an empty description; the title is the whole feature text. The acceptance criteria below are derived from the title and recorded as an assumption, per `user_story_alignment.md` Section 4, autonomous mode.)

## Acceptance Criteria
- [ ] Submitting the same note twice in quick succession (double-clicking "Save note", or clicking it again before the first save has answered) sends exactly one `POST /api/notes` and stores exactly one note, which appears once in the note list, also after a page reload.
- [ ] Once a save has finished, successfully or with an error, the form accepts the next submission again: the "Save note" button is disabled only while a save is in flight.

## Re-Plan Feedback
- Comment (tracker): 25 comments read across 2 pages, all framework PR notices from earlier runs; none actionable → Addressed by: not acted on because none carries feedback on the item's behaviour or scope.
- Comment (tracker): the item has no description (noted by earlier runs) → Addressed by: assumption recorded; criteria derived from the title. Criterion 2 is not new scope but the guard against the fix's obvious regression (a form that stays locked after one save or one failure).
- Assumption: the fix is client-side only (an in-flight guard in `NoteForm`). Server-side de-duplication (an idempotency key, or a uniqueness rule on note text) is out of scope: two identical notes saved deliberately, seconds apart, are legitimate, and the title describes an accidental double submit from the form. No backend change.
- Merged since the last plan: n/a (fresh plan, branched from current main ddd64fd; TEST-09 and BUG-01 merged there are backend-only and disjoint from this item).

## Plan Overview
Frontend-only fix in `frontend/src/components/NoteForm.tsx`. Today `handleSubmit` awaits `createNote` with nothing preventing a second submit while the first request is pending, so a double click sends two POSTs and stores two notes. The fix adds a synchronous in-flight guard (a `useRef<boolean>` checked and set at the top of the submit path, after the empty-note check) plus a `isSaving` state that renders the submit button `disabled` while the request is pending. Both are cleared in a `finally` block, so success and failure both re-enable the form. The ref is what makes the guard hold for two events dispatched before React re-renders; the disabled button is the visible cue and also blocks Enter-key implicit submission per HTML. No backend, API contract or dependency change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard: `const savingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`; in `handleSubmit`, after `event.preventDefault()` and the empty-note check, `if (savingRef.current) return;` then set ref and state to true, `try { await createNote… } catch { … } finally { savingRef.current = false; setIsSaving(false); }`; the submit `<button>` gets `disabled={isSaving}` and, while disabled, `opacity: 0.6` and `cursor: "not-allowed"` merged onto `buttonStyle`). The empty-note path must never set the guard, so an empty submit cannot lock the form. Existing behaviour (trim, clear input on success, keep text and show `SAVE_FAILED_MESSAGE` on failure, `onCreated(savedNote)`) is unchanged.
- Routes: none.
- State management: local component state plus one ref in `NoteForm`; nothing lifted, `LandingPage.tsx` untouched.
- Design reference notes: AI freestyle (Design Reference mode NONE). Disabled "Save note" button: existing `buttonStyle` with `opacity: 0.6` and `cursor: "not-allowed"`; label unchanged ("Save note").

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The existing internal endpoint is used as is:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

The fix changes how many times the frontend calls it per user submit (exactly once), not its shape.

## Technology Selection
- In-flight guard: chose React's built-in `useRef` and `useState` over any debounce/throttle helper or new dependency, because a boolean ref checked synchronously covers the need in a few lines and the project already depends on React.
- Disabled submit: chose the native `disabled` attribute on the existing `<button type="submit">` over a JS click-swallowing overlay or a custom button component, because the platform already blocks clicks and implicit (Enter-key) submission on a disabled default button.
- No new dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser spec for criterion 1 (double-click "Save note" on `/`, assert one POST, one list item, one after reload) plus an edge case (a second, different note saved after the first completes is stored, proving the form re-enables)
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the ref-based in-flight guard, the `isSaving` state, `disabled={isSaving}` and the disabled style on the submit button
- [A] frontend/src/components/NoteForm.test.tsx: add the repro test (two submits while `createNote` is pending call it once) and tests for the disabled-while-pending state, re-enable after success, re-enable after rejection, and that an empty submit never disables the button

No dependency change, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: `NoteForm` component tests with `createNote` mocked (existing `vi.mock("../api/notes")` pattern) and a manually resolved promise to hold the save in flight. Repro first: `fireEvent.click` on `note-submit` twice before resolving → `createNote` called once (fails on current main, passes after the fix). Then: button disabled while pending; enabled again after the promise resolves; enabled again after it rejects (error message shown, text kept); empty submit leaves the button enabled and calls nothing.
  - Directory: frontend/src/components/ (co-located Vitest files, the frontend's existing convention; `backend/tests/unit/` is the backend's)
  - Naming: `{Component}.test.tsx` (existing frontend convention)
- Integration tests: not warranted. No repository, model, migration or router code changes; the notes router's existing integration tests in `backend/tests/integration/test_notes_integration.py` are unaffected.
  - Directory: backend/tests/integration/
- E2E tests: criterion 1 in the browser, since the defect is an interaction timing defect. Use `page.getByTestId("note-submit").dblclick()` after filling a unique note text, record every `POST /api/notes` with the exact-path matcher pattern from `TEST-03_simple_note_form.spec.ts` (path equality, not substring), and assert exactly one request, exactly one list item with that text, and exactly one after `page.reload()`. To make the double click land while the first save is pending, delay the first POST's response with `page.route` on the exact `/api/notes` POST and `route.continue()` after the second click (no fixed waits). Edge case: after the first save completes, fill and save a second distinct note → it is stored and listed (form re-enabled).
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (Enter pressed twice quickly), no duplication of the E2E interaction assertions.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A double submit sends one POST and stores one note, listed once, also after reload | E2E | — |
| 2 | After a save finishes (success or error) the form accepts the next submission; the button is disabled only while a save is in flight | Unit | verifying it needs no navigation: it is component state across a resolved and a rejected `createNote`, which a mocked promise drives deterministically and a browser cannot make fail on demand without stubbing the API anyway |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double submit stores one note | Delay the first POST via `page.route`, `dblclick` "Save note", release; assert one POST recorded, one `note-list-item-*` with the text, one after reload | Given the landing page is open, When I type a note and double-click "Save note", Then the note appears once in the list and once after reloading |
| 2 | Form re-enables after a save finishes | covered at Unit, see Criterion coverage | Given a note has just been saved, When I type a second note and click "Save note", Then the second note is saved and listed too |

## Manual verification plan
### Criterion 1: Submitting the same note twice in quick succession stores it once
Prerequisites: the app stack is running (frontend at http://localhost:5183, backend and database up); browser DevTools open on the Network tab, filtered to `notes`.
1. Navigate to `http://localhost:5183/` → the page shows the "New note" field, the "Save note" button and the note list (possibly empty).
2. In DevTools Network, set throttling to "Slow 3G" so the save stays in flight long enough to click twice.
3. Type `Double click check 1` in the "New note" field → the text is in the field.
4. Double-click "Save note" → while the request is pending the button looks dimmed and does not react to the second click; the Network tab shows exactly one `POST` to `/api/notes`.
5. Wait for the request to finish → `Double click check 1` appears exactly once in the note list and the field is empty.
6. Set throttling back to "No throttling" and reload the page → `Double click check 1` still appears exactly once.
7. Repeat steps 2 to 5 with `Double click check 2`, this time pressing Enter twice quickly in the field instead of double-clicking → exactly one `POST`, and the note appears once.

### Criterion 2: The form accepts the next submission once a save has finished
Prerequisites: same as Criterion 1, no throttling.
1. On `http://localhost:5183/`, type `First note` and click "Save note" → `First note` appears in the list, the field empties and the button is enabled (not dimmed) again.
2. Type `Second note` and click "Save note" → `Second note` appears in the list below `First note`; both are listed once.
3. Stop the backend container (or, in DevTools Network, enable "Offline"), type `Failing note` and click "Save note" → the message "The note could not be saved. Please try again." appears under the field, `Failing note` stays in the field and the button is enabled again.
4. Restart the backend (or disable "Offline") and click "Save note" again → `Failing note` is saved, appears once in the list, and the error message disappears.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → expected result `0 failed`, including the BUG-04 tests for disabled-while-pending and re-enable after success and after failure.
