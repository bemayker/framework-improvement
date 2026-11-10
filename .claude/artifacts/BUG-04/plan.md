# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice
>
> (ClickUp task 123k99cx47m. The task description is empty: the title above is the whole written item. The acceptance criteria below are derived from the title and are assumptions, recorded under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] 1. Submitting the note form twice in quick succession (a double-click on "Save note", or a second click or Enter while the first save is still in flight) sends exactly one `POST /api/notes` and stores the note exactly once, so it appears once in the list and once after a page reload.
- [ ] 2. While a save is in flight the "Save note" button is disabled, and it is enabled again once the save finishes, whether it succeeded or failed, so the user can save the next note or retry a failed one.

## Re-Plan Feedback
- Comment (tracker): all tracker comments on the task (33, read by the dispatching session in /deliver 6.1) are framework PR notices from earlier runs → not acted on because none carries product feedback; recorded here so the count is visible.
- Assumption (no description): the defect is a client-side double submit in `frontend/src/components/NoteForm.tsx`. `handleSubmit` has no in-flight guard, so every submit event while `createNote` is pending sends another POST, and the backend stores each one (it has no uniqueness rule on note text, and none is wanted: two notes with the same text saved deliberately are legitimate). → Addressed by: an in-flight guard in NoteForm, criterion 1.
- Assumption (scope): the fix is frontend-only. A server-side dedupe (idempotency key, unique constraint on text, time-window dedupe) is out of scope: the title reports a UI double save, a unique constraint would forbid legitimate repeated notes, and an idempotency key is a new API contract nobody asked for (`user_story_alignment.md`, no gold plating). → Addressed by: Backend Plan reads "No backend changes required", which keeps this item disjoint from TEST-12's notes router, service and repository edits.
- Assumption (visible feedback): disabling the button while saving is the minimal visible signal that a save is under way, and is what makes criterion 2 checkable by a person. No spinner, no "Saving..." label change, no toast. → Addressed by: criterion 2.
- Merged since the last plan: n/a (fresh plan on this run, branched from current main 81d1be2, which includes BUG-01 and TEST-09; neither touches a file this plan lists).
- Open PR not yet merged: TEST-08 (PR #700) edits `frontend/src/api/notes.ts`, `frontend/src/components/AppFooter.tsx` and `frontend/src/components/LandingPage.test.tsx`. → unchanged because this plan lists none of those three files; the build is held behind TEST-08 by the run and the overlap is named in shared_risks.md.

## Plan Overview
One frontend component change. `NoteForm` gains an in-flight guard: a synchronous ref flag checked at the top of `handleSubmit` (so a second submit event dispatched before React re-renders is dropped), plus an `isSaving` state that disables the submit button while `createNote` is pending and is cleared in a `finally` block so it re-enables after success and after failure. The API client, the landing page and the backend are untouched. Covered by new NoteForm unit cases (the reproduction) and one Playwright spec that double-clicks the real button against the real backend.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` only.
  - Add `const isSubmittingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`.
  - In `handleSubmit`, after `event.preventDefault()`: if `isSubmittingRef.current` is true, return immediately (no request, no state change). The empty and whitespace-only validation path stays as it is and sets neither flag, so it sends no request and never disables the button.
  - Before `await createNote(trimmedText)`: set `isSubmittingRef.current = true` and `setIsSaving(true)`. Wrap the existing try/catch in `try { ... } finally { isSubmittingRef.current = false; setIsSaving(false); }`. Success and failure behaviour inside the try/catch is unchanged (clear text and error and call `onCreated` on success; set `SAVE_FAILED_MESSAGE` and keep the text on failure).
  - On the submit button: `disabled={isSaving}`. Keep `data-testid="note-submit"`, `type="submit"` and the label "Save note" unchanged.
  - Comment the ref with the why: state alone is not enough, because a second submit event can run before the re-render that applies `disabled`.
- Routes: none.
- State management: local component state plus one ref, inside NoteForm. No context, no store.
- Design reference notes: AI freestyle. Design Reference mode is NONE. The disabled button keeps the existing `buttonStyle` values; the only added style is `cursor: "not-allowed"` and `opacity: 0.6` while `isSaving` is true, applied by spreading over `buttonStyle`, so a disabled button reads as disabled.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; the existing internal endpoint is the one the form calls, once per save after this fix.
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}` (trimmed, 1 to 500 characters)
- Response: 201 `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard: chose React's own `useRef` and `useState` plus the native `disabled` attribute on the existing `<button>` over a debounce or throttle helper (none is installed, and a time window either drops a legitimate quick second note or lets a slow first request through) and over a form or mutation library (e.g. react-hook-form or TanStack Query, neither installed); the native attribute also blocks implicit form submission by Enter while disabled, and the ref covers the event that arrives before the re-render.
- No net-new dependency, module or component: the change lives in the existing NoteForm component and the existing test and E2E tooling (Vitest, Testing Library, Playwright).

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec; double-click on "Save note" sends one POST and the note appears once, before and after reload; button disabled while a delayed save is in flight and enabled after
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus one edge case (a failed save re-enables the button)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script build-feature writes alongside the scripts-directory one

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard in handleSubmit, isSaving state cleared in finally, submit button disabled while saving
- [A] frontend/src/components/NoteForm.test.tsx: unit cases for the double submit (one createNote call while the first is pending), the disabled-while-saving button, and re-enable after success and after failure

No dependency changes, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md changes: the fix alters no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` in Vitest with `createNote` mocked (existing `vi.mock("../api/notes")` in the file). New cases, named for the scenario:
  - a second submit while the first save is pending (mock returns a promise the test resolves later) calls `createNote` exactly once and `onCreated` exactly once after resolving; this is the reproduction and fails on current main.
  - the submit button is disabled while the save is pending and enabled after it resolves.
  - the submit button is enabled again after a failed save, the error message shows and the text is kept, and a retry calls `createNote` a second time.
  - an empty submit does not disable the button (validation path untouched).
  - Directory: frontend/src/components/ (co-located, as the existing frontend tests are; CLAUDE.md's unit directory names the backend only)
  - Naming: {Component}.test.tsx, the existing frontend convention
- Integration tests: no new integration tests. No router, repository, model or migration changes (`testing_standards.md` Section 6, second and third questions answered no); the existing `backend/tests/integration/test_notes_integration.py` keeps covering `POST /api/notes`.
  - Directory: backend/tests/integration/
- E2E tests: one spec for criterion 1 (and the in-browser half of criterion 2). Open `/`, wait for the mount `GET /api/notes`, fill a unique text (`BUG-04 double <uuid8>`), record every `POST /api/notes`, `dblclick()` the `note-submit` button, wait for the 201, assert exactly one POST was sent, exactly one `note-list` item has that text, then reload and assert it is still exactly one. A second test holds the POST with `page.route` (continue after a short gate the test releases) and asserts `note-submit` is disabled while held and enabled after release. Reuse the TEST-03 spec's exact-path request matcher pattern (pathname equality, not substring). An edge case: the held-request test doubles as the edge case.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus an edge-case scenario for re-enable after a failed save.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A quick double submit sends exactly one POST and stores the note once | E2E | — |
| 2 | Save button disabled while the save is in flight, enabled again after success or failure | Unit | verifying it needs no navigation: it is component state against a mocked pending and rejected createNote, which a browser cannot hold or fail deterministically without stubbing the backend; the E2E spec's held-request test adds the in-browser check of the disabled state |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | A quick double submit sends exactly one POST and stores the note once | Double-click `note-submit` after filling a unique text; count `POST /api/notes` requests (expect 1); count list items with that text before and after reload (expect 1) | Given the landing page with the note form, When I type a note and double-click "Save note", Then the note appears once in the list, and once after reloading |
| 2 | Save button disabled while in flight, enabled after success or failure | covered at Unit, see Criterion coverage (plus the held-request E2E test for the disabled state) | Given a save is in progress, When I look at "Save note", Then it is disabled, and When the save finishes, Then it is enabled again |

## Manual verification plan
### Criterion 1: A quick double submit sends exactly one POST and stores the note once
Prerequisites: the app stack is running (`docker compose up -d` at the repository root), the frontend is open at http://localhost:5183, and the browser's developer tools are open on the Network tab filtered to `notes`.
1. Navigate to `http://localhost:5183/` → the "Task Notes" heading, the "New note" field and the "Save note" button are visible, and the saved notes list shows any existing notes.
2. Click the "New note" field and type `Double click check 1` → the text appears in the field.
3. Double-click "Save note" as fast as you can → the field clears and `Double click check 1` appears exactly once at the bottom of the list.
4. Read the Network tab → exactly one `POST` request to `/api/notes`, with status 201.
5. Reload the page → `Double click check 1` is still listed exactly once.
6. Type `Enter key check 1` in the "New note" field, then press Enter twice in quick succession → `Enter key check 1` appears exactly once in the list, and the Network tab shows one more `POST /api/notes`, not two.

### Criterion 2: Save button disabled while in flight, enabled again after success or failure
Prerequisites: as for criterion 1, plus the developer tools Network tab throttling set to "Slow 3G" so a save stays in flight long enough to see.
1. Navigate to `http://localhost:5183/` → the "Save note" button is enabled.
2. Type `Slow save check` in the "New note" field and click "Save note" once → while the request is pending the button is greyed out and does not respond to further clicks.
3. Wait for the save to finish → `Slow save check` appears once in the list, the field is empty and "Save note" is enabled again.
4. Set Network throttling to "Offline", type `Offline save check` and click "Save note" → the message "The note could not be saved. Please try again." appears, the field still holds `Offline save check`, and "Save note" is enabled again.
5. Set Network throttling back to "No throttling" and click "Save note" → `Offline save check` appears once in the list and the error message disappears.
6. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → expected result `0 failed` for `src/components/NoteForm.test.tsx`.
