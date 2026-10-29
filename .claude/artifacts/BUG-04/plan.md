# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice

(ClickUp task 123k99cx47m. The tracker item carries a title only: no description and no acceptance criteria. The criteria below are derived from the title and recorded as assumptions, per user_story_alignment.md Section 4, autonomous mode.)

## Acceptance Criteria
- [ ] 1. Submitting the same note twice in quick succession (a second click on "Save note", or a second Enter, before the first save has finished) sends exactly one save request, so the note is stored once and appears once in the list, also after a page reload.
- [ ] 2. While a save is in flight the "Save note" button is disabled, and once that save finishes (stored or failed) the form accepts the next submit again: a following note can be saved, and after a failed save the kept text can be retried.

## Re-Plan Feedback
- Comment (tracker): 13 comments read, all earlier runs' PR-opened notes → not acted on because none describes the defect or adds a criterion; recorded in decisions.md by the dispatching session.
- Assumption (no description, no criteria on the item): the defect is the client-side double submit in frontend/src/components/NoteForm.tsx, whose handleSubmit has no in-flight guard, so a second click or Enter during the pending POST /api/notes sends a second POST and the backend stores two rows. The fix is to make one user action produce one request, which is the minimal change that removes the symptom in the title.
- Assumption (scope): no server-side deduplication, idempotency key or unique constraint on note text. Two deliberate saves of the same text, each after the previous one finished, are legitimate notes and stay allowed; a text-based unique constraint would reject them and is gold plating beyond the title (user_story_alignment.md Section 3). This also keeps BUG-04 disjoint from TEST-12's backend files.
- Assumption (concurrency): frontend/src/components/LandingPage.test.tsx is not needed. The guard lives entirely in NoteForm, so its component test covers it, and the page-level behaviour is covered by the E2E spec. BUG-04 therefore shares no file with TEST-10.

## Plan Overview
Frontend-only defect fix in the note form. NoteForm gains an in-flight guard: a ref flag that is set synchronously at the start of a save and cleared when it settles (so two submits dispatched before React re-renders cannot both pass), mirrored in an isSaving state that disables the submit button for the visible part of the fix. The existing validation (empty and whitespace-only text), trimming, error message and text-kept-on-failure behaviours are unchanged. No backend, API contract, dependency or configuration change.

## Frontend Plan
- Components to create/modify: frontend/src/components/NoteForm.tsx. Add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In handleSubmit, after `event.preventDefault()`: return immediately when `isSavingRef.current` is true (no validation message, no request). After the empty-text check passes, set `isSavingRef.current = true` and `setIsSaving(true)` before awaiting createNote, and reset both in a `finally` block so success and failure both re-open the form. Render the submit button with `disabled={isSaving}` and `aria-busy={isSaving}`; keep its label "Save note" and its data-testid "note-submit". The empty-note check stays ahead of the guard flag so a rejected empty submit never locks the form.
- Routes: none (landing page `/` only).
- State management: local component state plus a ref, as today; no new store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The disabled button reuses the existing buttonStyle values (padding 0.5rem 1rem, font 1rem 600, color #ffffff, background #1a1a1a, radius 0.375rem) and adds only `opacity: 0.6` and `cursor: not-allowed` while disabled, so the in-flight state is visible.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; listed for reference only. The form still makes one call per accepted submit.
- Method: POST
- URL: /api/notes
- Request: JSON body with a single `text` string (trimmed, 1 to 500 characters)
- Response: 201 with the stored note, for example `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight submit guard in NoteForm: chose a React `useRef` flag plus the native `disabled` attribute on the existing submit button (React is already installed, `disabled` is a native platform feature that also blocks implicit Enter submission when it is the form's default button) over a debounce utility or a new dependency such as a form library, because neither covers it better: a debounce delays the first save and still allows a second request after the delay, and the ref is needed in addition to `disabled` only because two events can be dispatched before React re-renders the button as disabled.
- No other net-new component, module or dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser spec for criterion 1, holding the POST open while two quick submits happen and asserting one request and one stored note
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: the copy of the manual UAT script build-feature writes alongside it

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus isSaving state), submit button disabled and aria-busy while saving, reset in finally
- [A] frontend/src/components/NoteForm.test.tsx: component tests for the double-submit guard, the disabled state, and the re-enable after success and after failure

No dependency changes, so no lockfile is regenerated. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: NoteForm component behaviour in Vitest with createNote mocked (the file's existing pattern). Use a deferred promise for createNote so the save stays pending: two clicks on note-submit (and, separately, two form submit events, which bypass the disabled button and exercise the ref guard) call createNote once and onCreated once; the button is disabled while pending and enabled after resolve; after a rejected save the button is enabled, the text is kept, and a retry calls createNote a second time; an empty submit does not disable the button. The existing six NoteForm tests stay green unchanged.
  - Directory: frontend/src/components/ (co-located, as the existing NoteForm.test.tsx)
  - Naming: {Component}.test.tsx (existing frontend convention)
- Integration tests: none added. The backend is untouched, so no repository or router behaviour changes (testing_standards.md Section 6: integration tier not warranted).
- E2E tests: one spec for criterion 1. Intercept POST /api/notes with page.route and hold the first request until both submits have been issued (no fixed timeout: release the route after the second submit action resolves), fill a unique text, click note-submit then press Enter in note-input, release, then assert exactly one POST was recorded, exactly one list item carries the text, and after page.reload still exactly one. Edge case: after that save completes, a second unique note saves normally (one more POST, one more item). Reuse TEST-03's exact path-and-method matcher shape so the Vite module URL for src/api/notes.ts is not mistaken for the API call.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: rapid double save stores one note; save button disabled while saving and usable again after success and after failure; edge case of saving the same text twice deliberately, one after the other, stores two notes.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A quick second submit sends no second request; the note is stored and listed once, also after reload | E2E (plus Unit) | — |
| 2 | The button is disabled while a save is in flight and the form accepts the next submit after success or failure | Unit | verifying it needs no real browser or backend: it is the component's own state transitions (disabled while the mocked createNote is pending, enabled after it resolves or rejects), which a Vitest component test with a deferred promise observes directly and deterministically |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Quick double submit stores one note | Hold POST /api/notes via page.route, click Save note then press Enter, release; assert one POST, one list item, one item after reload | Given the landing page is open, When I type a note and save it twice in quick succession, Then the note appears once and still once after reloading |
| 2 | Button disabled while saving, usable again after | covered at Unit, see Criterion coverage | Given a save is in progress, Then the Save note button is disabled, And when the save finishes I can save another note |

## Manual verification plan
### Criterion 1: a quick second submit stores the note only once
Prerequisites: the stack is running (frontend at http://localhost:5183, backend and PostgreSQL up); browser devtools open on the Network tab, filtered to `notes`; throttling set to "Slow 3G" so the save stays pending long enough to click again.
1. Navigate to `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the note list.
2. Type `BUG-04 double click check` in the "New note" field → the text is in the field.
3. Click "Save note" and immediately click it again, then also press Enter in the field while the request is pending → the button appears greyed out after the first click; the Network tab shows exactly one `POST /api/notes`.
4. Wait for the request to finish → `BUG-04 double click check` appears once in the list and the field is empty.
5. Set throttling back to "No throttling" and reload the page → `BUG-04 double click check` is still listed exactly once.

### Criterion 2: the button is disabled while saving and usable again afterwards
Prerequisites: as for criterion 1, with "Slow 3G" throttling on.
1. On `http://localhost:5183/`, type `BUG-04 first note` and click "Save note" → while the request is pending the button is greyed out, shows a not-allowed cursor and does not respond to clicks.
2. Wait for the save to finish → `BUG-04 first note` is listed, the field is empty and the button is enabled again.
3. Type `BUG-04 second note` and click "Save note" → after it finishes `BUG-04 second note` is listed as well (two new notes in total, one of each).
4. In the Network tab, enable "Offline", type `BUG-04 failed save` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field and the button is enabled again.
5. Disable "Offline" and click "Save note" again → `BUG-04 failed save` is listed once and the error message disappears.
6. Run `npm --prefix frontend test -- NoteForm` → Vitest reports the NoteForm.test.tsx tests with 0 failed.
