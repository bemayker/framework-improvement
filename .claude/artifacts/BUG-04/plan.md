# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice
>
> (Tracker task 123k99cx47m. The tracker description is empty: the title is the whole feature text. The acceptance criteria below are derived from the title and the current code, and every assumption behind them is recorded under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] Submitting the note form a second time (a second click on "Save note", or Enter in the field) while the first save is still in flight sends no second `POST /api/notes`: the note is stored once and appears once in the on-page list.
- [ ] The "Save note" button is disabled while a save is in flight and enabled again once that save succeeds.
- [ ] When a save fails, the form is usable again: the button is re-enabled, the existing error message and the typed text stay, and submitting again sends a new `POST /api/notes`.

## Re-Plan Feedback
- Comment (tracker): 12 comments on the item, all prior-run bot notes; none actionable, per the dispatch. → Not acted on because none carries a requirement or a correction; no comment text was supplied to this dispatch.
- Assumption (empty description, autonomous-mode ambiguity rule): the defect is the client-side double submit. Root cause read from `frontend/src/components/NoteForm.tsx`: `handleSubmit` has no in-flight state, and the submit button is never disabled, so a second submit event before `createNote` resolves calls `createNote` again; `POST /api/notes` (`backend/app/routers/notes.py`) inserts unconditionally, so each call stores a row. → Addressed by: a synchronous in-flight guard (a `useRef` flag) plus a disabled button in `NoteForm.tsx`, criteria 1 to 3.
- Assumption: the fix stays in the frontend. Backend de-duplication (an idempotency key, or a uniqueness rule on note text) is not planned: it would change the API contract, and a uniqueness rule would also reject a user deliberately saving the same text twice, which nothing in the item asks to forbid. → Not acted on; recorded for the PR description. The backend, its schema and its tests are unchanged.
- Assumption: criteria 2 and 3 are the observable parts of the fix rather than extra scope. Without criterion 3 a guard that is never released after a failure would turn this bug into "the form stops working after one error", so the release is part of fixing the defect, not a new feature. The button keeps its "Save note" label while saving (no "Saving…" text, no spinner): a label change was not asked for.
- Assumption: the disabled button gets a visible cue (opacity and cursor, values on the Design reference notes line), since a disabled button that looks identical to an enabled one gives no feedback; this is the only style change.
- Merged since the last plan: n/a (fresh plan, base 795b836d3fbd3a009b943c69b904462a1e21ddd4). The previous run's merged BUG-04 work (#351) was reverted by c5a6e64 and is not on main; `NoteForm.tsx` on main has no guard, confirmed by reading it.

## Plan Overview
A frontend-only fix in one component. `NoteForm` gains an in-flight guard: a `useRef<boolean>` checked and set synchronously at the top of `handleSubmit` (after the empty-note check, so the validation path is unchanged), and an `isSaving` state that disables the submit button and gives it a visible disabled style. The guard and the state are released in a `finally` block, so success and failure both re-enable the form. The ref, not the state alone, is what blocks the second submit: two submit events dispatched before React re-renders both see the old `isSaving` value, while a ref is updated immediately. The `disabled` attribute also suppresses the browser's implicit submission on Enter while saving.

The reproduction is a local automated Vitest component test in `frontend/src/components/NoteForm.test.tsx`: `createNote` mocked with a promise the test holds open, the form submitted twice, and `createNote` asserted called once. It fails on main today and passes after the fix. An E2E spec covers the end-to-end symptom (one stored, one listed note) with the `POST` held open by `page.route`.

No backend change, no new module, no new dependency. `LandingPage.tsx`, `frontend/src/api/notes.ts` and every file TEST-08 lists are left untouched.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/NoteForm.tsx` (modify): add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`, after `event.preventDefault()` and the existing empty-note check, `if (isSavingRef.current) return;` then set `isSavingRef.current = true` and `setIsSaving(true)` before calling `createNote`. Wrap the existing `try`/`catch` with `finally { isSavingRef.current = false; setIsSaving(false); }`. The existing success path (clear error, clear text, `onCreated`) and failure path (`SAVE_FAILED_MESSAGE`, keep the text) are unchanged. The submit button gets `disabled={isSaving}` and `style={isSaving ? disabledButtonStyle : buttonStyle}`, where `disabledButtonStyle` spreads `buttonStyle` and overrides `opacity` and `cursor`. A one-line "why" comment on the ref explains that state alone cannot stop two submits dispatched before the re-render. `data-testid` values are unchanged.
  - `frontend/src/components/NoteForm.test.tsx` (modify): add the reproduction and the guard tests (Testing Strategy).
- Routes: none.
- State management: local component state (`useState`) plus a `useRef` flag in `NoteForm`; no context, no store, no change to `LandingPage`'s `onCreated` wiring.
- Design reference notes: AI freestyle (Design Reference mode NONE). Save note button, enabled: unchanged from TEST-03 (padding 0.5rem 1rem, font-size 1rem, font-weight 600, color #ffffff, background #1a1a1a, border none, radius 0.375rem, cursor pointer). Save note button, disabled while saving: the same values with opacity 0.6 and cursor not-allowed. Label stays "Save note" in both states. No other component changes style.

## Backend Plan
No backend changes required.

`POST /api/notes` keeps inserting one row per request; the fix guarantees the form sends one request per save. Backend de-duplication was considered and not planned (Re-Plan Feedback).

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form keeps calling the existing endpoint through `createNote` in `frontend/src/api/notes.ts`, now at most once per in-flight save.
- Method: POST
- URL: `/api/notes` (base from `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: `{ "text": string }`, trimmed, 1 to 500 characters
- Response: `201 Created`, `{ "id": number, "text": string }`

## Technology Selection
- In-flight submit guard: chose a `useRef` flag and `useState` from React (installed) over a debounce or throttle helper (a hand-written timer or a new dependency such as lodash), because a timer guesses how long a save takes while the ref is released exactly when the request settles.
- Disabled-while-saving behaviour: chose the native `disabled` attribute on the existing `<button type="submit">` over hand-built click suppression, because the platform already blocks clicks and implicit (Enter) submission on a disabled default button.
- No net-new component, module or dependency: the change lives in the existing `NoteForm.tsx` and its existing test file, plus the new E2E spec and UAT artifacts the lifecycle requires.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec: with the first `POST /api/notes` held open by `page.route`, a second click on Save note sends no second POST, the button is disabled while held, and after release the note appears exactly once in the list
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus the Enter-key edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script build-feature writes alongside it

### Modified files
- [A] frontend/src/components/NoteForm.tsx: synchronous in-flight guard (`useRef`), `isSaving` state, `disabled` submit button with its disabled style, guard released in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: reproduction test (two submits while the save is pending call `createNote` once and `onCreated` once), disabled-while-saving and re-enabled-after-success test, re-enabled-after-failure and resubmit test, Enter (form submit) double-submit test

No lockfile changes: no dependency is added or removed.

No documentation edit: this item changes no project structure, run configuration, dependency or test infrastructure (build-feature Section 15's condition).

## Testing Strategy
- Unit tests: `NoteForm` component tests in `frontend/src/components/NoteForm.test.tsx`, `../api/notes` mocked as today. New cases, named by scenario:
  - reproduction: `createNote` returns a promise the test resolves by hand; type `Buy milk`, click `note-submit` twice before resolving; assert `createNote` called exactly once; resolve with `{ id: 7, text: "Buy milk" }`; assert `onCreated` called exactly once.
  - Enter edge case: same, with `fireEvent.submit` on `note-form` twice instead of two clicks; `createNote` called once.
  - disabled while saving: with the promise pending, `note-submit` is disabled; after it resolves, it is enabled.
  - failure releases the guard: first call rejects; `note-form-error` shows, `note-input` keeps `Buy milk`, `note-submit` is enabled; a second submit calls `createNote` a second time.
  - the existing six cases stay unchanged and must still pass (the empty and whitespace cases prove the guard is not taken on the validation path).
  - Directory: frontend tests live beside their components under `frontend/src/` (existing convention, run by `npm --prefix frontend test`); `backend/tests/unit/` gets nothing new.
  - Naming: `{Component}.test.tsx`, matching the existing frontend files.
- Integration tests: no new integration test; no backend code changes. The existing `backend/tests/integration/test_notes_integration.py` is untouched.
  - Directory: backend/tests/integration/
- E2E tests: criterion 1 end to end. Match the notes call by exact pathname `/api/notes` and method (the TEST-03 spec's `isNotesApiRequest` reasoning: Vite serves `src/api/notes.ts` from a URL containing the same substring). Hold the first `POST` with `page.route` on a promise the test releases after the second click (no fixed timeout), count POST requests with `page.on("request")`, assert `note-submit` is disabled while held, release, wait for the `201`, and assert exactly one POST was sent and exactly one `note-list` item carries the unique note text. Wait for the mount `GET /api/notes` before interacting, as the TEST-03 spec does. Edge case in the same spec: pressing Enter in `note-input` twice while held sends one POST.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per acceptance criterion plus the Enter-key edge case.
  - Directory: e2e/uat/scenarios/
- Reproduction (fix Section R1, local automated): `npm --prefix frontend test -- src/components/NoteForm.test.tsx`. On main the reproduction case fails (`createNote` called twice); after the fix it expects `0 failed`.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A second submit while the first save is in flight sends no second POST; the note is stored once and listed once | E2E | — |
| 2 | The Save note button is disabled while a save is in flight and enabled again after success | Unit | verifying it needs no navigation: it is the button's `disabled` state around a mocked pending and resolved `createNote`, which a component render observes directly |
| 3 | After a failed save the button is re-enabled, the error and text stay, and a resubmit sends a new request | Unit | verifying it needs no navigation: a rejected `createNote` mock and a second submit exercise the guard's release fully in a component render; a browser adds only a way to force a server failure |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Second submit in flight sends no second POST; one note stored and listed | Hold the first POST via `page.route`, click Save note twice (and Enter twice), release, assert one POST and one list item with the text | Given the landing page with the save request slowed, When I click Save note twice quickly, Then one note with my text appears in the list |
| 2 | Button disabled while saving, enabled after success | covered at Unit, see Criterion coverage (the E2E spec also asserts the disabled state while held) | Given a save in progress, When I look at Save note, Then it is disabled, and When the save completes, Then it is enabled |
| 3 | After a failed save the form is usable again | covered at Unit, see Criterion coverage | Given the backend is stopped, When I save a note, Then I see the error, my text stays, and Save note is enabled for a retry |

## Manual verification plan
### Criterion 1: A second submit while the first save is in flight stores the note once
Prerequisites: the stack is running (`docker compose up`), the frontend at `http://localhost:5183` and the backend at `http://localhost:8010`; Chrome with DevTools open on the Network tab.
1. Open `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the saved-notes list.
2. In DevTools Network, set throttling to `Slow 3G` → requests from the page now take several seconds.
3. Type `Double click check 1` in the "New note" field → the text is in the field.
4. Double-click "Save note" quickly → in the Network tab exactly one `POST` to `notes` appears; the button looks dimmed while it is pending.
5. Wait for that request to finish → `Double click check 1` appears once in the list and the field is empty.
6. Set throttling back to `No throttling` and reload the page → `Double click check 1` is listed exactly once.
7. Repeat steps 2 to 5 with `Enter check 1`, pressing Enter twice in the field instead of double-clicking → one `POST`, and `Enter check 1` is listed once.

### Criterion 2: Save note is disabled while saving and enabled after success
Prerequisites: as for criterion 1, throttling `Slow 3G`.
1. On `http://localhost:5183/`, type `Disabled check 2` and click "Save note" once → while the request is pending the button is dimmed (reduced opacity), the cursor over it shows "not allowed", and clicking it does nothing.
2. Wait for the request to finish → `Disabled check 2` appears in the list, and the button returns to its normal dark style and accepts clicks again.

### Criterion 3: After a failed save the form is usable again
Prerequisites: the frontend running at `http://localhost:5183`, the backend stopped (`docker compose stop backend`).
1. Open `http://localhost:5183/`, type `Retry check 3` and click "Save note" → the message "The note could not be saved. Please try again." appears below the field, the field still holds `Retry check 3`, and the button is enabled.
2. Start the backend again (`docker compose start backend`) and wait until `http://localhost:8010/api/health` answers.
3. Click "Save note" again → a new `POST` to `notes` is sent, `Retry check 3` appears once in the list, the error message disappears and the field is empty.

Automated check for all three criteria: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → `0 failed` across the NoteForm tests, including the double-submit reproduction.
