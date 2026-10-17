# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp item carries no description; read 2026-10-17, workspace 30307190, task 123k99cx47m. The acceptance criteria below are derived from the title, see Assumptions in the Plan Overview.)

## Acceptance Criteria
- [ ] 1. Submitting the note form a second time while the first save of that note is still in flight sends no second create request, so the note is stored once and shown once in the list.
- [ ] 2. The Save note button is disabled while a save is in flight and enabled again once that save succeeds or fails.
- [ ] 3. After a failed save the user can submit the same note again, and that retry sends exactly one create request.

## Re-Plan Feedback
- Comment (tracker): 3 comments on the item, all framework PR-link comments from earlier runs → not acted on because none states a requirement or correction about the defect.

## Plan Overview
Frontend-only fix in the note form. Today `NoteForm.handleSubmit` awaits `createNote` with nothing stopping a second submit (button click or Enter in the field) while the first request is pending, so two `POST /api/notes` calls are sent and two rows are stored. The fix adds an in-flight guard to `NoteForm`: a `useRef` boolean checked and set synchronously at the top of the submit handler (a ref, not only state, because two submit events can arrive before React re-renders), plus an `isSaving` state that sets the native `disabled` attribute on the submit button for the visible feedback. Both are released in a `finally` block, so a failed save does not lock the form.

LandingPage.tsx: NOT touched by this plan. The guard lives entirely inside `frontend/src/components/NoteForm.tsx`; the `onCreated` wiring in LandingPage stays as is. TEST-08 therefore has no file overlap with BUG-04 through LandingPage.tsx.

Reproduction (fix skill Section R1):
- Repro: local-automated: npm --prefix frontend test -- src/components/NoteForm.test.tsx -t "double submit" (source: none, derived from the title because the item has no steps)
- The reproduction is a new Vitest test in NoteForm.test.tsx whose name contains `double submit`: `createNote` is mocked with a promise that stays pending, the form is submitted twice, and the test asserts `createNote` was called exactly once. On the current code it fails (called twice); on the fix it passes. It is written before any source change.

Assumptions (the item has no description):
- "Twice quickly" means a second submit while the first create request is still pending; two deliberate saves of identical text after the first completes are two notes and stay allowed (no backend uniqueness on note text, which would block legitimate duplicates).
- The fix is client-side only. A server-side idempotency key was considered and not planned: nothing in the title asks for protection against non-browser clients, and Architecture Notes ask for the smallest change.
- Disabling the button while saving is the accepted visible behaviour; no spinner or label change is added.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` only. Add `const submittingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`, after `event.preventDefault()` return early when `submittingRef.current` is true. Keep the existing empty and whitespace validation ahead of the guard being set (a rejected empty note sends nothing and must not lock the form). Before calling `createNote`, set `submittingRef.current = true` and `setIsSaving(true)`; in a `finally` block reset both. Add `disabled` bound to `isSaving` on the submit button.
- Routes: none.
- State management: local component state plus one ref, inside NoteForm. No change to LandingPage.tsx or to `frontend/src/api/notes.ts`.
- Design reference notes: AI freestyle. Design Reference mode is NONE. The disabled button reuses the existing button style; the only visual addition is `cursor: not-allowed` and `opacity: 0.6` while disabled, applied in NoteForm.tsx only.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The form keeps calling the existing `POST /api/notes` through `createNote(text)` in `frontend/src/api/notes.ts`, with the same request body (the trimmed note text) and the same 201 response (the stored note with its id and text). The only change is that the client sends at most one such request per pending save.

## Technology Selection
- In-flight submit guard in NoteForm: chose React `useRef` plus `useState` (already installed) and the native button `disabled` attribute over a debounce or throttle helper or a new dependency, because a native disabled submit button also blocks implicit Enter submission and the ref closes the window before React re-renders; no new module or dependency is introduced.
- No net-new component, module or dependency otherwise: the fix edits one existing component and its existing test file.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser spec for criterion 1 (second submit while the POST is held sends no second request; the note is listed once, also after reload)
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus isSaving state), released in finally; submit button disabled while saving
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for criteria 1 to 3, including the reproduction test named with `double submit`

No dependency changes, so no lockfile entry. README.md and docs/DEVELOPMENT.md need no edit: no project structure, run configuration, dependency or test infrastructure change.
frontend/src/components/LandingPage.tsx is deliberately absent from this manifest.

## Testing Strategy
- Unit tests: NoteForm component (Vitest plus Testing Library, `createNote` mocked as the existing file already does).
  - Directory: frontend/src/components/ (co-located, the existing frontend convention; CLAUDE.md unit test directory covers the backend)
  - Naming: added `it` blocks in the existing NoteForm.test.tsx
  - (a) reproduction, name contains `double submit`: `createNote` returns a promise that is never resolved during the assertion; type `Buy milk`, click submit twice; expect `createNote` called once.
  - (b) button disabled while pending: after one submit with a pending promise the submit button is disabled; after the promise resolves it is enabled again (and the input is cleared, existing behaviour).
  - (c) failure releases the guard: first call rejects, the error shows, the button is enabled; a second submit calls `createNote` again, exactly once more (two calls in total).
  - (d) edge: an empty submit while idle still shows the validation message and leaves the button enabled.
- Integration tests: not warranted. No router, repository or model changes (testing_standards.md Section 6).
- E2E tests: criterion 1 only, and it is also the feature edge-case spec.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
  - Approach: reuse the TEST-03 spec patterns (exact-path matcher for `POST /api/notes`, wait for the mount GET, unique note text). Hold the POST with `page.route` until both submit attempts are made: click `note-submit`, then press Enter in `note-input` and try a forced click on `note-submit`; then let the route continue. Assert exactly one recorded POST, exactly one list item with that text, and still exactly one after `page.reload()`.
- UAT scenarios: one per criterion plus the reload edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A second submit while a save is in flight sends no second create request; the note is stored and shown once | E2E (plus Unit reproduction) | — |
| 2 | Save note button disabled while a save is in flight, enabled again after success or failure | Unit | verifying it needs no navigation: it is the disabled attribute of one component across a mocked pending and settled promise |
| 3 | After a failed save the user can resubmit, and the retry sends exactly one create request | Unit | verifying it needs no navigation: it is the guard release in the component, driven by a mocked rejected call |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Second submit while in flight stores the note once | Hold POST via page.route, click then Enter then forced click, release; one POST, one list item, one after reload | Given the landing page, When I save a note and press save again before it completes, Then the note appears once |
| 2 | Button disabled while saving | covered at Unit, see Criterion coverage | Given a slow save, When I click Save note, Then the button is disabled until the save finishes |
| 3 | Retry after failure works | covered at Unit, see Criterion coverage | Given the save failed, When I click Save note again, Then the note is saved once |

## Manual verification plan
### Criterion 1: a second submit while a save is in flight stores the note once
Prerequisites: app stack running, frontend at http://localhost:5183, backend reachable; a Chromium-based browser with DevTools.
1. Open http://localhost:5183/ → the Task Notes page shows the New note field and the Save note button.
2. Open DevTools, Network tab, set throttling to Slow 3G → requests now take several seconds.
3. Type `Double save check 1` in the New note field.
4. Click Save note, then immediately click Save note again and press Enter in the field → the Network tab shows exactly one POST request to /api/notes.
5. Wait for the request to finish → `Double save check 1` appears exactly once in the list and the field is empty.
6. Set throttling back to No throttling and reload the page → `Double save check 1` is still listed exactly once.

### Criterion 2: the Save note button is disabled while saving
Prerequisites: as for criterion 1, throttling set to Slow 3G.
1. On http://localhost:5183/ type `Disabled button check` in the New note field.
2. Click Save note → the button turns dimmed and the cursor over it shows not-allowed while the request is pending.
3. Wait for the request to finish → the note is listed and the button is back to its normal look and clickable.

### Criterion 3: a failed save can be retried
Prerequisites: as for criterion 1, no throttling.
1. In DevTools, Network tab, right-click any request and choose Block request URL, entering `localhost:8000/api/notes` (or the notes API URL the Network tab shows) → that URL is blocked.
2. Type `Retry check` and click Save note → the red message `The note could not be saved. Please try again.` appears, the text stays in the field and the button is enabled.
3. Remove the block in the Network request blocking panel, then click Save note once → exactly one POST to /api/notes succeeds, `Retry check` appears once in the list and the error message is gone.

### Automated check
1. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → 0 failed.
2. Run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` with the app stack up → 0 failed.
