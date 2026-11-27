# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m has an empty description and no acceptance criteria. The criteria below are derived from the title; see Assumptions.)

## Acceptance Criteria
- [ ] Submitting the note form twice in quick succession (a double click on "Save note", or a click followed by Enter) while the first save is still in flight sends exactly one save request, so the note is stored and listed once.
- [ ] While a save is in flight, the "Save note" button is disabled.
- [ ] Once the save finishes, the "Save note" button is enabled again: after a success the input is cleared and a new note can be saved; after a failure the error message shows, the typed text is kept and the user can retry.

### Assumptions (scope change: criteria derived from the title)
The tracker description is empty, so the three criteria above are this plan's assumption, recorded as a scope change (`user_story_alignment.md` Sections 2 and 4).

Assumption 1: the defect is a client-side double submit on one form (double click, or click plus Enter) in one browser tab. Two tabs submitting the same text are two separate user actions and are out of scope.

Assumption 2: server-side de-duplication or idempotency keys are out of scope. Two notes with the same text are legitimate, so the backend keeps accepting them. No backend, schema or API contract change.

Assumption 3: the button keeps its "Save note" label while disabled. A "Saving..." label or spinner is not asked for (no gold plating).

Assumption 4: the empty-note and whitespace-only validation paths are unchanged; they send no request, so they never disable the button.

## Re-Plan Feedback
All 56 comments on the tracker task (3 pages: 25, 25, 6; no threaded replies) start with "mayker-dev:" and are framework notices of earlier runs' PRs, so per the dispatch none is carried as feedback. Human comments: 0. No PR review comments exist (first plan in this run), and no merged-since notice was passed.

## Plan Overview
Frontend-only fix in `frontend/src/components/NoteForm.tsx`. The form gains an in-flight guard: a `useRef<boolean>` flag that `handleSubmit` checks and sets synchronously before calling `createNote`, so a second submit event in the same tick returns early, plus an `isSaving` state that drives `disabled` on the submit button. Both are cleared in a `finally` block, so success and failure both re-enable the form. A ref is needed because React state set by the first submit is not yet visible to a second submit event dispatched before the re-render; the `disabled` attribute alone does not stop an Enter-key implicit submission in every browser. Tests: a component test that reproduces the double submit (fails before the fix), component tests for the disabled and re-enabled states, and one Playwright spec that double-clicks against the real backend and checks one request and one stored note.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard ref, `isSaving` state, `disabled={isSaving}` on the `note-submit` button, a disabled style variant, `finally` reset). No change to `LandingPage.tsx`, `NoteList.tsx` or `api/notes.ts`.
- Routes: none.
- State management: local component state (`useState` for `isSaving`, `useRef` for the synchronous guard). No new context or store.
- Design reference notes: AI freestyle. Disabled "Save note" button: same `buttonStyle`, plus opacity 0.6 and cursor not-allowed while `isSaving` is true; label unchanged.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form still calls the existing `POST /api/notes` through `createNote` in `frontend/src/api/notes.ts`.
- Method: POST
- URL: /api/notes
- Request: JSON body with one field, text (string, trimmed, 1 to 500 characters)
- Response: 201 with the stored note, an object with id (number) and text (string), e.g. id 7 and text "Buy milk"

## Technology Selection
- Double-submit guard: chose React's built-in `useRef` and `useState` with the native `disabled` attribute on the submit button over a debounce/throttle dependency (none is installed, and `lodash.debounce` would be a new dependency for a two-line guard) and over a server-side idempotency key (Assumption 2). No net-new module or dependency is added.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec that double-clicks "Save note" with a delayed POST and asserts one request and one stored note
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case (click then Enter)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard ref, isSaving state, disabled submit button with disabled style, finally reset
- [A] frontend/src/components/NoteForm.test.tsx: reproduction test (double submit sends one request) and the disabled / re-enabled state tests

No dependency changes, so no lockfile is regenerated. README.md and docs/DEVELOPMENT.md need no edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component tests (Vitest + Testing Library, `createNote` mocked with a promise the test resolves or rejects by hand so a save can be held in flight).
  - Directory: frontend/src/components/ (tests beside the component, per project standards; backend/tests/unit/ is the backend's directory)
  - Naming: NoteForm.test.tsx (existing file, extended)
- Integration tests: not warranted. No router, service, repository or migration changes; the backend behaviour is unchanged.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: one spec for criterion 1, double-clicking "Save note" against the real backend with the POST response delayed via `page.route` so the second click lands while the first is in flight; asserts one POST /api/notes request and, after a reload, exactly one list item with the unique note text. Reuse the TEST-03 spec's exact-path request matcher pattern (method plus pathname equals /api/notes).
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one per criterion plus an edge case (click then Enter in the input).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A double submit while a save is in flight sends one request and stores the note once | E2E | `stores a double-clicked note once`, `sends one save request when the form is submitted twice before the first save finishes` | — |
| 2 | "Save note" is disabled while a save is in flight | Unit | `disables Save note while a save is in flight` | verifying it needs no navigation: it is the component's own disabled attribute, observable in a component render with a pending mocked save |
| 3 | "Save note" re-enables after success (input cleared) and after failure (error shown, text kept) | Unit | `re-enables Save note after a successful save`, `re-enables Save note and keeps the text after a failed save` | verifying it needs no navigation: it is component state after a resolved or rejected mocked save |

## Reproduction
- Class: local-automated (fix skill Section R1; source: item title, no steps in the item).
- Repro: local-automated: npm --prefix frontend test -- src/components/NoteForm.test.tsx (source: item)
- The builder writes the test `sends one save request when the form is submitted twice before the first save finishes` in `frontend/src/components/NoteForm.test.tsx` first, before any source change: it holds `createNote` pending, fires two submits on `note-form` (two `fireEvent.submit` calls, which bypass the button's disabled attribute exactly as an Enter key implicit submission can), and asserts `createNote` was called once. On the base it records two calls, so the run exits 1 (fail); after the fix it passes. The command runs from the worktree root, paths relative to it.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double submit sends one request, note stored once | Delay POST /api/notes with page.route, fill a unique text, dblclick note-submit, count POST requests (one), reload, count list items with that text (one) | Given the landing page is open, When I type a note and double-click "Save note", Then the note appears once and once after a reload |
| 2 | Button disabled while saving | covered at Unit, see Criterion coverage | Given a save is in flight, When I look at "Save note", Then it is disabled |
| 3 | Button re-enabled after success or failure | covered at Unit, see Criterion coverage | Given a save has finished, When I look at "Save note", Then it is enabled, and after a failure my text is still in the input |

## Manual verification plan
### Criterion 1: A double submit while a save is in flight sends one request and stores the note once
Prerequisites: the stack is running (backend on its port, frontend at http://localhost:5183), browser DevTools open on the Network tab filtered to `api/notes`, throttling set to "Slow 3G" so a save stays in flight for a few seconds.
1. Navigate to `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the current list.
2. Type `Double click check 1` in the "New note" field → the text appears in the field.
3. Double-click "Save note" quickly → the Network tab shows exactly one POST request to `/api/notes`.
4. Wait for that request to finish → `Double click check 1` appears once in the list and the field is empty.
5. Reload the page → `Double click check 1` is still listed exactly once.
6. Type `Enter key check 1`, click "Save note", then immediately press Enter in the field → one POST request to `/api/notes`, and the note is listed once.

### Criterion 2: "Save note" is disabled while a save is in flight
Prerequisites: as for Criterion 1, with "Slow 3G" throttling on.
1. Navigate to `http://localhost:5183/` → the form is shown and "Save note" is enabled (full opacity, pointer cursor).
2. Type `Disabled check 1` and click "Save note" → while the POST is pending, "Save note" is greyed out (reduced opacity), shows a not-allowed cursor on hover, and clicking it does nothing (no second POST in the Network tab).

### Criterion 3: "Save note" re-enables after success (input cleared) and after failure (error shown, text kept)
Prerequisites: as for Criterion 1; for the failure step, the backend can be stopped (for example `docker compose stop backend` from the repo root) and restarted afterwards.
1. Navigate to `http://localhost:5183/`, type `Reenable check 1` and click "Save note" → once the POST finishes, the note is listed, the field is empty and "Save note" is enabled again.
2. Type `Reenable check 2` and click "Save note" → a second note is saved, proving the form accepts a new save.
3. Stop the backend, type `Reenable check 3` and click "Save note" → the error "The note could not be saved. Please try again." appears, `Reenable check 3` is still in the field, and "Save note" is enabled.
4. Start the backend again and click "Save note" → the note is saved, listed once, and the error disappears.
5. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repo root → the run passes: its summary line reports no failed or errored test and the command exits 0.
