# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m carries no description; the acceptance criteria below are derived from the title, see Re-Plan Feedback.)

## Acceptance Criteria
- [ ] 1. Submitting a note twice in quick succession (double-clicking "Save note", or clicking it again while the first save is still pending) sends exactly one save request, so the note is stored once and appears once in the list.
- [ ] 2. While a save is pending the "Save note" button is disabled, and it becomes usable again as soon as that save finishes, whether it succeeded or failed, so the next deliberate submit (including a new note with the same text) is saved normally.

## Re-Plan Feedback
- Comment (tracker): 46 comments on the ClickUp task, all framework PR notices from earlier runs, none about the defect → Addressed by: not acted on because none states a requirement, correction or reproduction detail.
- Comment (tracker): the task description is empty → Addressed by: assumption recorded here. The criteria are derived from the title only: the defect is a client-side double submit (the form has no in-flight guard, read in frontend/src/components/NoteForm.tsx, where handleSubmit awaits createNote with nothing stopping a second submit meanwhile). The fix is therefore a client-side guard. Server-side deduplication is deliberately NOT planned: two notes with the same text are a legitimate user action in this app, and nothing in the item asks for an idempotency key or a uniqueness rule (user_story_alignment.md Section 3, no gold plating). This also keeps the item off the notes router, service and repository that TEST-12's row names.
- Merged since the last plan: n/a (fresh plan, branched from current main c9f192a4).

## Plan Overview
Frontend-only defect fix in the note form. `NoteForm` gains an in-flight guard: a synchronous `useRef` flag that makes a second submit a no-op while the first `createNote` call is pending, plus an `isSaving` state that sets the native `disabled` attribute on the "Save note" button for the same window. Both are released in a `finally` block, so success and failure each re-open the form. No backend, API, routing or LandingPage change. Covered by Vitest unit tests on the component (including the reproduction test) and one Playwright spec that double-clicks against a deliberately delayed POST.

## Frontend Plan
- Components to create/modify: frontend/src/components/NoteForm.tsx (modify only). Add `const isSubmittingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`, after `event.preventDefault()` and before the empty-text check, return immediately when `isSubmittingRef.current` is true. After the empty-text check passes, set `isSubmittingRef.current = true` and `setIsSaving(true)`, then run the existing try/catch, and add `finally { isSubmittingRef.current = false; setIsSaving(false); }`. The button gets `disabled={isSaving}` and `aria-disabled` is not needed (native `disabled` already exposes it). The ref, not the state, is the guard: state updates land on the next render, so two submits dispatched before React re-renders would both read `isSaving === false`; the ref is read and written synchronously. Keep the existing validation, trim, error message and `onCreated` behaviour exactly as they are; keep the button label "Save note" unchanged (TEST-03's spec and UAT script rely on it).
- Routes: none.
- State management: local component state plus one ref inside NoteForm; LandingPage is untouched (its `onCreated` callback is still called once per stored note).
- Design reference notes: AI freestyle. Disabled "Save note" button only, while a save is pending: existing buttonStyle unchanged plus opacity 0.6 and cursor not-allowed; enabled state exactly as today (bg #1a1a1a, text #ffffff, padding 0.5rem 1rem, radius 0.375rem, cursor pointer).

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: POST (unchanged, existing TEST-03 endpoint; this item changes how often the frontend calls it, not its contract)
- URL: /api/notes
- Request: JSON body with one string field `text` (1 to 500 characters after the frontend trims it)
- Response: 201 with the stored note, e.g. {"id": 7, "text": "Buy milk"}

## Technology Selection
- In-flight submit guard: chose React's own `useRef` and `useState` (react is already installed) over a debounce or throttle helper (lodash or a hand-written timer), because a time window either still lets a slow second request through or drops a fast deliberate one, while a flag tied to the pending promise matches the actual condition exactly.
- Blocking the button during the save: chose the native `disabled` attribute on the existing `<button type="submit">` over a JavaScript click-swallowing overlay or custom pointer-events styling, because the platform already stops click and implicit (Enter-key) submission through a disabled default button and exposes the state to assistive technology.
- No net-new dependency, module or component is introduced; the E2E spec uses Playwright's built-in `page.route` to delay the POST rather than any mock server.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec that delays POST /api/notes via page.route, double-clicks "Save note", and asserts one POST and one list item
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-04/uat_script.md: the artifact copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: add the useRef in-flight guard, the isSaving state, the finally release and disabled={isSaving} with the disabled style
- [A] frontend/src/components/NoteForm.test.tsx: add the reproduction test and the guard-release tests listed in Criterion coverage; existing six tests stay unchanged

No dependency changes, so no lockfile is touched. Neither README.md nor docs/DEVELOPMENT.md needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure. frontend/src/components/LandingPage.tsx and LandingPage.test.tsx are deliberately NOT modified.

## Testing Strategy
- Unit tests: NoteForm component behaviour with `createNote` mocked (Vitest + Testing Library, the existing vi.mock in NoteForm.test.tsx). A deferred promise (resolve/reject captured from `new Promise`) keeps the first save pending while the second submit is fired, so the double submit is deterministic.
  - Directory: frontend/src/components/ (tests beside their module, per project standards; CLAUDE.md's unit directory backend/tests/unit/ is the backend's)
  - Naming: NoteForm.test.tsx (existing file)
- Integration tests: not warranted for this item: no repository, model, migration or endpoint changes (testing_standards.md Section 6, questions two and three answer no). The existing backend/tests/integration/test_notes_integration.py stays as is.
  - Directory: backend/tests/integration/
- E2E tests: one spec for criterion 1, the only criterion whose bug is visible solely through a real browser interaction against the real backend (a double click producing two stored notes). The spec makes the race deterministic by holding the POST in `page.route` (await a short promise, then `route.continue()`), counts POST /api/notes requests by exact pathname and method (the same matcher TEST-03's spec uses, because Vite serves src/api/notes.ts under a URL containing the same substring), and uses a uniquely suffixed note text so specs stay parallel-safe. Edge-case spec: after the delayed save completes, saving the same text again stores a second note (guard released, no server dedupe).
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus the same-text-again edge case.
  - Directory: e2e/uat/scenarios/

Reproduction (defect item): `npm --prefix frontend test -- src/components/NoteForm.test.tsx -t "sends one save request when Save note is clicked twice while saving"`, run from the worktree root. Before the fix it fails (createNote is called twice); after the fix it passes. Class: local-automated (Vitest unit test, no backing service needed).

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | Submitting a note twice in quick succession sends exactly one save request; the note is stored and listed once | E2E | `stores a double-clicked note only once`, `sends one save request when Save note is clicked twice while saving` | — |
| 2 | The button is disabled while a save is pending and usable again after success or failure, so the next submit (including the same text) saves | Unit | `disables the save button while a save is pending`, `accepts a new submit after a failed save`, `accepts a new submit after a successful save` | verifying it needs no navigation and no real backend: it is the form's own state transition around one mocked promise, fully observable in the component test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double submit stores the note once | Open `/`, wait for the mount GET, hold POST /api/notes in page.route, fill a unique text, dblclick `note-submit`, release the route, assert exactly one recorded POST and exactly one `note-list-item-*` with that text, then reload and assert still one | Given the landing page is open, When I double-click "Save note" with "Buy milk BUG-04", Then exactly one "Buy milk BUG-04" appears in the list, also after a reload |
| 2 | Button disabled while pending, re-enabled after | covered at Unit, see Criterion coverage; the E2E edge-case spec additionally saves the same text again after the first save and expects two items | Given a save is pending, Then "Save note" is disabled; When it finishes, Then "Save note" is enabled and saving "Buy milk BUG-04" again adds a second item |

## Manual verification plan
### Criterion 1: Submitting a note twice in quick succession stores it once
Prerequisites: the stack is running (backend on its configured port, frontend at http://localhost:5183) and PostgreSQL is up. To make the race easy to hit by hand, open the browser DevTools Network tab and set throttling to "Slow 3G".
1. Open `http://localhost:5183/` → the "Task Notes" landing page shows the "New note" field, the "Save note" button and the notes list.
2. Type `Buy milk BUG-04` into the "New note" field → the text appears in the field.
3. Double-click "Save note" quickly → the button greys out (disabled) straight after the first click; in the Network tab exactly one POST request to `/api/notes` appears.
4. Wait for the request to finish → exactly one list item reading `Buy milk BUG-04` appears and the field is empty.
5. Reload the page (with throttling switched back to "No throttling") → the list still shows `Buy milk BUG-04` exactly once.
6. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root → the run passes: no failed or errored test on the summary line, exit code 0.

### Criterion 2: The button is disabled while saving and usable again afterwards
Prerequisites: as for Criterion 1, with "Slow 3G" throttling on.
1. On `http://localhost:5183/`, type `Walk dog BUG-04` and click "Save note" once → while the request is pending the button is greyed out and a second click does nothing (no second POST in the Network tab).
2. Wait for the request to finish → `Walk dog BUG-04` appears once, the field is empty and "Save note" is dark again (enabled).
3. Type `Walk dog BUG-04` again and click "Save note" once → a second list item reading `Walk dog BUG-04` appears; same text twice is allowed when submitted deliberately.
4. In DevTools Network, set throttling to "Offline", type `Offline note BUG-04` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field and "Save note" is enabled again.
5. Set throttling back to "No throttling" and click "Save note" → `Offline note BUG-04` is saved and appears once in the list, and the error message disappears.
6. Run `npm run e2e -- e2e/tests/BUG-04_double_submit_note.spec.ts` from the repository root with the stack running → the run passes: no failed test on the summary line, exit code 0.
