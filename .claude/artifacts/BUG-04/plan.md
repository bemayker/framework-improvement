# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m carries no description; the title is the whole report. The criteria below are derived from it and from the code on main at 2ce35f0; see Re-Plan Feedback for the assumptions.)

## Acceptance Criteria
- [ ] Submitting the note form a second time while the first save of that note is still in flight (a double click on "Save note", or Enter followed by a click) sends exactly one save request, so exactly one note is stored and shown in the list.
- [ ] While a save is in flight the "Save note" button is disabled, and it is enabled again once the save succeeds, so the next note can be saved.
- [ ] When the save fails, the "Save note" button is enabled again and the typed text is kept, so the user can retry, and that retry sends exactly one new request.

## Re-Plan Feedback
- Comment (tracker): 22 comments on the ClickUp task, all earlier runs' "PR opened" notices with no content about the defect → Addressed by: not acted on, because none states a requirement; none of those PRs left code on main (the BUG-04 fix merged in #522 was reverted by the reset commit 1f1df4f, so frontend/src/components/NoteForm.tsx on main is the unfixed version and this plan re-scopes nothing).
- Assumption (empty description): "twice quickly" means a second submit while the first POST /api/notes has not yet returned. The root cause is in NoteForm.tsx: handleSubmit has no in-flight guard and the submit button is never disabled, so each submit awaits its own createNote call → Addressed by: a client-side in-flight guard plus a disabled button (Frontend Plan).
- Assumption (scope): saving the same text again deliberately after the first save has completed is a legitimate second note and stays allowed. No backend uniqueness constraint or idempotency key is added: the report is about an accidental double submit, and server-side deduplication of identical text would change the product's behaviour beyond the defect (user_story_alignment.md Section 3) → Addressed by: backend unchanged.
- Assumption (failure path): a guard that stays engaged after a failed save would turn the bug into a dead form, so criterion 3 makes release-on-failure explicit.

## Plan Overview
Frontend-only fix in the note form component. NoteForm gains an in-flight guard: a ref that is set synchronously when a save starts and cleared in a finally block, so a second submit event arriving before React re-renders is ignored, plus an `isSaving` state that sets the native `disabled` attribute on the submit button for the duration of the save. The validation path (empty or whitespace-only note) never engages the guard. No API, backend, schema or dependency change.

Reproduction (local-automated, run from the repository root): `npm --prefix frontend test -- src/components/NoteForm.test.tsx`. The new test "sends one save request when the form is submitted twice while saving" holds createNote on an unresolved promise, clicks "Save note" twice, and asserts createNote was called once. On main at 2ce35f0 it fails (createNote is called twice); after the fix it passes with 0 failed.

## Frontend Plan
- Components to create/modify: frontend/src/components/NoteForm.tsx — add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In handleSubmit, after `event.preventDefault()`: return immediately when `isSavingRef.current` is true; after the empty-note check passes, set the ref and the state to true before `await createNote(...)`, and reset both in a `finally` block so success and failure both release the guard. The submit button gets `disabled={isSaving}`. The ref is what blocks a second submit dispatched before the re-render that disables the button; the state is what makes the lock visible and blocks further clicks.
- Routes: none (the form stays on `/`, rendered by LandingPage.tsx, which is not modified).
- State management: local component state plus one ref, as above; LandingPage's onCreated handler is unchanged and is now called once per stored note.
- Design reference notes: AI freestyle. Disabled submit button: keeps the existing buttonStyle values (padding 0.5rem 1rem, font-size 1rem, weight 600, color #ffffff, background #1a1a1a, radius 0.375rem) with opacity 0.6 and cursor not-allowed while disabled; label stays "Save note".

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; the fix only changes how often the client calls it.
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201 `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight guard: chose a React `useRef` boolean plus `useState`, both already provided by the installed react dependency, over a debounce/throttle utility or a new dependency, because the defect is overlapping requests rather than event frequency, and a debounce would still allow a second request after its window.
- Visible lock: chose the native `disabled` attribute on the existing button element over a custom overlay or spinner component; the native attribute also blocks implicit form submission by Enter through a disabled default button.
- Server-side deduplication (database unique constraint or idempotency key): considered and not chosen, because identical notes saved deliberately must stay allowed (Re-Plan Feedback); no other net-new component, module or dependency is introduced.

## File Manifest
<!--
  Phase tags: [0S]=Infrastructure Scaffolding, [A]=Frontend Plan, [B]=Backend Plan, [C]=API Integration Plan, [D]=Testing Strategy, [G]=Acceptance Test Outline, [Docs]=-
-->
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: E2E spec for criterion 1, double click on "Save note" with the POST held back, one note in the list and after a reload
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation is ENABLED)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard, isSaving state, `disabled={isSaving}` on the submit button with the disabled style
- [A] frontend/src/components/NoteForm.test.tsx: reproduction test plus the disabled and re-enabled cases for criteria 2 and 3

No dependency manifest changes, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: Vitest component tests in frontend/src/components/NoteForm.test.tsx, with createNote mocked as the existing tests do. New cases: (a) the reproduction, createNote held on a never-resolved promise, two clicks on note-submit, createNote called exactly once; (b) note-submit is disabled while createNote is pending and enabled after it resolves; (c) after createNote rejects, note-submit is enabled, the input keeps "Buy milk", and a second click calls createNote a second time (exactly two calls in total); (d) an empty submit leaves note-submit enabled (the guard is not engaged by validation). Reproduction command, from the repository root: `npm --prefix frontend test -- src/components/NoteForm.test.tsx`.
  - Directory: frontend/src/components/ (colocated, the existing frontend convention; CLAUDE.md's unit directory is the backend's)
  - Naming: {Component}.test.tsx, as the existing file
- Integration tests: none added. No router, repository or migration changes, so testing_standards.md Section 6's integration questions answer no; the existing backend/tests/integration/test_notes_integration.py stays as is.
  - Directory: backend/tests/integration/
- E2E tests: criterion 1 only. Seed nothing; read the note count through the UI. Use `page.route` on `**/api/notes` to hold the first POST for a short, awaited promise (no fixed timeout) and count POST requests, `dblclick` note-submit after typing a unique text (for example `BUG-04 double ${Date.now()}`), release the route, then assert one POST was sent and the note list shows that text exactly once, also after `page.reload()`.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus the edge case of saving the same text deliberately twice after the first save completes (two notes stored).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A second submit while the first save is in flight sends one request; one note stored and shown | E2E (plus the Unit reproduction) | — |
| 2 | Button disabled during the save, enabled again after success | Unit | verifying it needs no navigation: it is the component's own disabled attribute across a pending and a resolved createNote, deterministic only with a controlled promise |
| 3 | After a failed save the button is enabled, text kept, retry sends exactly one new request | Unit | verifying it needs no navigation: a rejected createNote is simulated by the mock, which a browser run could only produce by stubbing the backend |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | One request and one stored note on a double submit | Hold POST /api/notes with page.route, dblclick note-submit, release, assert one POST and one list entry before and after reload | Given the landing page, When I type a note and click "Save note" twice quickly, Then the note appears once and still once after a reload |
| 2 | Button disabled while saving, enabled after success | covered at Unit, see Criterion coverage | Given a note typed, When I click "Save note", Then the button is disabled until the note appears, and enabled afterwards |
| 3 | Button enabled and text kept after a failure; retry sends one request | covered at Unit, see Criterion coverage | Given the backend is stopped, When I save a note, Then the error shows, the text stays, and the button is enabled for a retry |

## Manual verification plan
### Criterion 1: A second submit while the first save is in flight sends one request; one note stored and shown
Prerequisites: backend and frontend running (frontend at http://localhost:5183), browser DevTools open on the Network tab filtered to `notes`, throttling set to "Slow 3G" so the save stays in flight long enough to click twice.
1. Open `http://localhost:5183/` → the "Task Notes" page with the "New note" field and the "Save note" button.
2. Type `Buy milk twice-test` in the "New note" field → the text appears in the field.
3. Double-click "Save note" → the Network tab shows exactly one POST to `/api/notes`; after it returns, `Buy milk twice-test` appears once in the note list and the field is cleared.
4. Set throttling back to "No throttling" and reload the page → `Buy milk twice-test` is listed exactly once.
5. Repeat steps 2 and 3 with `Walk dog enter-test`, this time pressing Enter in the field and then immediately clicking "Save note" → one POST, the note listed once.

### Criterion 2: Button disabled during the save, enabled again after success
Prerequisites: as for criterion 1, throttling "Slow 3G".
1. On `http://localhost:5183/`, type `Call the plumber` in "New note" → the text is in the field.
2. Click "Save note" once → while the POST is pending the button is greyed out (reduced opacity, not-allowed cursor) and clicking it does nothing.
3. Wait for the POST to complete → `Call the plumber` appears in the list, the field is empty, and "Save note" is at full opacity and clickable again.
4. Click "Save note" with the field empty → the message "Enter a note before saving." appears and the button stays enabled.

### Criterion 3: After a failed save the button is enabled, text kept, retry sends one request
Prerequisites: frontend running, page loaded at `http://localhost:5183/`, then the backend stopped (for example `docker compose stop backend`).
1. Type `Pay rent` in "New note" and click "Save note" → "The note could not be saved. Please try again." appears, the field still holds `Pay rent`, and "Save note" is enabled.
2. Start the backend again (`docker compose start backend`) and, with DevTools on the Network tab, click "Save note" once → exactly one new POST to `/api/notes`, `Pay rent` appears once in the list and the error message disappears.

Automated check for all three criteria, from the repository root: `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → expected result 0 failed.
