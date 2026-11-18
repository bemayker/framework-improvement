# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (ClickUp task 123k99cx47m. The item carries no description, checklist or acceptance criteria beyond its title; the criteria below are derived from the title and recorded as assumptions under Re-Plan Feedback.)

## Acceptance Criteria
- [ ] 1. Submitting the note form a second time while the first save is still in flight (a second click on "Save note", or a second Enter press in the field) sends no second save request, so exactly one note is stored and exactly one appears in the list.
- [ ] 2. While a save is in flight the "Save note" button is disabled, and it is enabled again once that save has finished.
- [ ] 3. The in-flight guard is released when a save fails as well as when it succeeds, so the user can submit again after an error without reloading the page.

## Re-Plan Feedback
- Comment (tracker): 45 comments read across 2 pages by the dispatching session, all framework-authored "PR opened" notes from earlier runs → not acted on because none carries feedback on this item's behaviour (recorded in `.claude/artifacts/BUG-04/decisions.md`).
- Assumption (no description on the item): the criteria above are derived from the title alone. "Twice quickly" is read as a duplicate submit while the first request is still pending, which is the race in `NoteForm.handleSubmit` today (it awaits `createNote` with no in-flight guard, and the button stays enabled). → Addressed by: a client-side in-flight guard in `NoteForm.tsx`.
- Assumption (fix location): the fix is client-side only. A server-side dedupe (rejecting identical text within a time window) is not planned: saving the same text twice on purpose, seconds apart, is legitimate and nothing in the item asks for it to be refused; it would also widen this item onto `backend/app/routers/notes.py`, `note_service.py` and `note_repository.py`, which the map's shared-risk note flags against TEST-12. → Addressed by: no backend changes.
- Assumption (criterion 3): releasing the guard after a failure is included because a guard that only resets on success would turn this fix into a new defect (a dead form after one network error); it is the minimum needed to keep the existing "shows an error message and keeps the text when saving fails" behaviour usable, not a new feature.

## Plan Overview
Frontend-only fix in one component. `NoteForm` gains an in-flight guard: a `useRef<boolean>` checked and set synchronously at the top of `handleSubmit` (after the empty-text validation), so a second submit event that arrives before React re-renders is dropped, plus an `isSaving` state that disables the submit button for visible feedback. Both are released in a `finally` block, so success and failure both re-open the form. No backend, API client, page or E2E changes.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/NoteForm.tsx` (modify): add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`, after `event.preventDefault()` and the existing empty-text check, return early when `isSavingRef.current` is true; otherwise set `isSavingRef.current = true` and `setIsSaving(true)` before `await createNote(...)`, and reset both in a `finally`. The ref is the guard (state alone does not stop two submit events dispatched before the re-render, e.g. a double Enter); the state drives `disabled={isSaving}` on the `note-submit` button. Add one short "why" comment on the ref. Leave the validation order unchanged: an empty submit still shows `EMPTY_NOTE_MESSAGE` and sends nothing.
  - `frontend/src/components/NoteForm.test.tsx` (modify): three new Vitest cases (see Testing Strategy).
  - `frontend/src/components/LandingPage.tsx`: NOT touched. The fix lives entirely inside `NoteForm`; `LandingPage`'s `onCreated` wiring stays as is, because once `NoteForm` calls `onCreated` exactly once per stored note the page appends exactly one.
  - `frontend/src/components/LandingPage.test.tsx`: NOT touched.
  - `frontend/src/api/notes.ts`: NOT touched (the client is correct; the duplicate comes from the caller issuing two calls).
- Routes: none.
- State management: local component state (`useState`) plus a `useRef` guard inside `NoteForm`; no shared state.
- Design reference notes: AI freestyle. Disabled "Save note" button: same `buttonStyle` with `opacity: 0.6` and `cursor: "default"` while `isSaving` is true; label text unchanged ("Save note").

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form keeps calling the existing endpoint through `createNote`, now at most once per in-flight save:
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight submit guard: chose React's own `useRef` plus `useState` (already installed) over a debounce or throttle utility (lodash.debounce or a hand-written timer), because a time window both lets a slow request through twice and blocks a legitimate fast second note, while a guard tied to the pending request covers exactly the race.
- Disabled-while-saving feedback: chose the native `disabled` attribute on the existing `<button type="submit">` over a JS-styled pseudo-disabled state, because the platform already blocks clicks and announces the state to assistive technology.
- No new dependency, module or component is introduced.

## File Manifest
### New files
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (UAT Generation is ENABLED)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (useRef plus isSaving state), button disabled while saving, guard released in finally
- [A] frontend/src/components/NoteForm.test.tsx: three new cases covering the double click, the double Enter submit, the disabled state, and the release after failure

No dependency changes, so no lockfile. Neither README.md nor docs/DEVELOPMENT.md changes: the fix alters no project structure, run configuration, dependency or test infrastructure.
Explicitly not touched: frontend/src/components/LandingPage.tsx, frontend/src/components/LandingPage.test.tsx, frontend/src/api/notes.ts, frontend/src/components/AppFooter.tsx, frontend/src/api/version.ts, and every file under e2e/tests/ and e2e/helpers/ (no new or shared E2E spec or helper).

## Testing Strategy
- Unit tests: Vitest component tests of `NoteForm` through its real entry point (rendered component, user events via Testing Library), with `createNote` mocked to return a deferred promise the test resolves or rejects, so the "first save still in flight" moment is deterministic.
  - Directory: frontend/src/components/ (tests beside their module, per project standards)
  - Naming: NoteForm.test.tsx (existing file)
  - Cases: `sends one request when Save note is clicked twice before the first save finishes` (two `fireEvent.click` on `note-submit` while pending; assert `createNote` called once, then resolve and assert `onCreated` called once); `sends one request when the form is submitted twice before the first save finishes` (two `fireEvent.submit` on `note-form`, which bypasses the disabled button and so pins the ref guard; assert one call); `disables the Save note button while the save is in flight and re-enables it afterwards`; `allows saving again after a failed save` (first call rejects, second resolves; assert two calls in total and the error then cleared).
- Integration tests: enabled in CLAUDE.md but not warranted: no repository, model, migration or router changes.
  - Directory: backend/tests/integration/ (no new file)
- E2E tests: enabled in CLAUDE.md but no criterion's covering tier is E2E (see Criterion coverage): the double submit is a component-state race that the jsdom test reproduces deterministically, while a browser double-click against a fast local backend is timing-dependent and would pass on today's code most of the time. No spec is added and no shared spec or helper is edited.
  - Directory: e2e/tests/ (no new file)
  - File: none
- UAT scenarios: one scenario per criterion plus one edge case (submitting an empty note still shows the validation message and stores nothing).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | A second submit while the first save is in flight sends no second request; one note stored and listed | Unit | `sends one request when Save note is clicked twice before the first save finishes`, `sends one request when the form is submitted twice before the first save finishes` | the defect is a component-state race; a deferred mock reproduces it deterministically through the rendered form, where a browser run against a fast backend would race and pass on unfixed code |
| 2 | The Save note button is disabled while a save is in flight and enabled again after | Unit | `disables the Save note button while the save is in flight and re-enables it afterwards` | it is a render state of one component, observable from the rendered button's disabled attribute with no navigation |
| 3 | The guard is released after a failed save, so the user can submit again | Unit | `allows saving again after a failed save` | it is the component's error path, driven by a rejected mock; no navigation or real backend failure is needed |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | One request and one stored note on a quick double submit | covered at Unit, see Criterion coverage | Given the notes page is open, When I type "Buy milk" and click "Save note" twice quickly, Then exactly one "Buy milk" note appears in the list and remains one after reload |
| 2 | Button disabled while saving, enabled after | covered at Unit, see Criterion coverage | Given a slow network, When I click "Save note", Then the button is disabled until the note appears, and enabled after |
| 3 | Guard released after a failure | covered at Unit, see Criterion coverage | Given the backend is stopped, When I save "Buy milk" and see the error, and the backend is started again and I click "Save note", Then the note is saved once |

## Manual verification plan
### Criterion 1: a quick double submit stores one note
Prerequisites: the app stack is running (frontend at http://localhost:5183, backend and database up); note the current number of notes in the list.
1. Open http://localhost:5183 in Chrome, then open DevTools → Network and set throttling to "Slow 3G" → the notes page shows the "New note" field and the "Save note" button.
2. Type `Double click test` into the "New note" field → the text appears in the field.
3. Double-click "Save note" as fast as you can → in the Network tab exactly one POST request to `/api/notes` is listed.
4. Wait for the request to finish → exactly one `Double click test` entry is added to the list and the field is empty.
5. Type `Double enter test`, click into the field and press Enter twice quickly → exactly one POST to `/api/notes` is listed, and one `Double enter test` entry appears once it finishes.
6. Set throttling back to "No throttling" and reload the page → the list shows each of `Double click test` and `Double enter test` exactly once.

### Criterion 2: the button is disabled while saving
Prerequisites: as for Criterion 1, with DevTools throttling set to "Slow 3G".
1. On http://localhost:5183 type `Disabled state test` into the "New note" field → the "Save note" button looks enabled.
2. Click "Save note" once → the button turns faded (reduced opacity) and clicking it again does nothing; in the Elements panel the `note-submit` button carries the `disabled` attribute.
3. Wait for the request to finish → `Disabled state test` appears in the list and the button returns to its normal look and is clickable again.

### Criterion 3: the form can be used again after a failed save
Prerequisites: the frontend is running at http://localhost:5183; stop the backend (for example `docker compose stop backend` from the repository root) after the page has loaded.
1. Type `Retry after failure` into the "New note" field and click "Save note" → the red message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled.
2. Start the backend again (`docker compose start backend`) and wait until it answers.
3. Click "Save note" once → the error message disappears, `Retry after failure` appears once in the list, and the field is empty.

### Automated check for all three criteria
1. From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → the run passes: its summary line reports no failed or errored test and the command exits 0.
