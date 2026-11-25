# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> Saving a note twice quickly stores it twice
>
> (ClickUp task 123k99cx47m. The tracker description is empty: the title above is the whole authored text of the item. Defect item, BUG- prefix.)

## Acceptance Criteria
<!--
  Derived from the title, because the item carries no authored criteria. Recorded
  as a scope change (user_story_alignment.md Sections 2 and 4): see Plan Overview,
  "Scope decision".
-->
- [ ] Clicking **Save note** twice in quick succession (a double click, or a second click before the first save has answered) with a non-empty note sends exactly one `POST /api/notes` and the note appears exactly once in the list, also after a page reload.
- [ ] After a save finishes, whether it succeeded or failed, the **Save note** button is usable again and the next submit is sent.
- [ ] A deliberate second save of the same text, submitted after the first save has finished, still stores a second note: the fix suppresses concurrent submits only, never duplicate text.

## Re-Plan Feedback
- Comment (tracker): none actionable. The thread holds only bot PR-opened notes from earlier runs (53, all pages read per `decisions.md`), which are not instructions → Addressed by: not acted on because they carry no feedback on this item.
- Assumption (no authored criteria): the three criteria above are derived from the title alone → Addressed by: recorded as a scope change under Plan Overview; the review grades against these three.

## Plan Overview
The defect: `frontend/src/components/NoteForm.tsx` `handleSubmit` has no in-flight guard. Each submit event awaits `createNote` independently, and the **Save note** button stays enabled while the request is pending, so a double click sends two `POST /api/notes` calls and the backend (correctly, as it has no idempotency contract) stores two rows. `LandingPage.tsx` then appends both responses to the list.

The fix is client-side and confined to `NoteForm.tsx`:
1. A `useRef<boolean>` in-flight flag checked and set synchronously at the top of `handleSubmit` (after the empty-text validation), cleared in a `finally`. A ref, not only state, because a state update is not visible to a second event handler that runs before React re-renders; the ref is read synchronously and closes the gap for every submit path (click, double click, Enter key, programmatic `requestSubmit`).
2. An `isSaving` state that sets the native `disabled` attribute on the **Save note** button while the request is pending, so the user sees that the click registered and the browser itself drops further clicks.

Layers: frontend component only. No backend, API client or `LandingPage.tsx` change.

**Scope decision (recorded per user_story_alignment.md Section 4; no gold plating per Section 3):** the item has no description, so the criteria are derived from the title. Two alternatives were considered and rejected:
- Server-side deduplication (unique constraint on text, or a time-window dedupe in `note_service.py`): rejected, because it would forbid a user from deliberately saving the same text twice (criterion 3), changes the API contract TEST-03 shipped, and would collide with TEST-12, FEAT-2, FEAT-3 and TEST-14 on the notes router, service and repository.
- An idempotency key header on `POST /api/notes`: rejected as gold plating for a double-click defect; nothing in the item asks for retry-safe semantics across page loads or network retries.
No new UI text, no spinner, no "Saving..." label: the button keeps its label `Save note` and only gains `disabled` while pending.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight ref guard, `isSaving` state, `disabled={isSaving}` on the `note-submit` button, `finally` that clears both). `frontend/src/components/NoteForm.test.tsx` (new unit tests). **`frontend/src/components/LandingPage.tsx` is NOT touched**: its `onCreated` append is correct once the form emits one note per save. `frontend/src/api/notes.ts`, `AppFooter.tsx`, `version.ts` and `baseUrl.ts` are NOT touched.
- Routes: none (single page at `/`).
- State management: local component state (`useState` for `isSaving`, `useRef` for the synchronous guard), as `NoteForm` already holds `text` and `error` locally.
- Design reference notes: AI freestyle. Design Reference mode is NONE. The only visual change is the native disabled state of the existing button: keep `buttonStyle` unchanged and add `cursor: "not-allowed"` and `opacity: 0.6` only while `isSaving` is true (a merged style object, no new colour token).

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; recorded so the builder does not alter it.
- Method: POST
- URL: /api/notes
- Request: JSON body with one field, `text` (string, 1 to 500 characters after trimming). Example body: {"text": "Buy milk"}
- Response: 201 with the stored note. Example: {"id": 7, "text": "Buy milk"}
The fix changes how often the frontend calls this endpoint (at most once per user save), not its shape.

## Technology Selection
- In-flight guard: chose React's built-in `useRef` (already installed, part of `react`) over a debounce or throttle helper (no installed dependency offers one, and a time window would either still let a slow second click through or swallow a legitimate later save), because a boolean flag tied to the request's own lifetime is exact.
- Disabled button while saving: chose the native `disabled` attribute on `<button>` over a click-ignoring handler or an overlay, because the browser then drops further clicks and blocks implicit Enter submission by itself, and assistive technology announces the state.
- No net-new dependency is added; no new module or component is created.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec, double click on Save note sends one POST and stores one note (criterion 1)
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus the Enter-key edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard, isSaving state, disabled Save note button while a save is pending, cleared in finally
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the guard, the disabled state, re-enable after success and after failure, and same-text resave

No dependency manifest changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour with `createNote` mocked (Vitest + Testing Library, as the existing file does). Use a deferred promise (a `new Promise` whose resolve or reject the test holds) so the save stays pending while the second click and the Enter key are fired.
  - Directory: frontend/src/components/ (co-located, per project-standards.md Layout)
  - Naming: NoteForm.test.tsx (existing file)
- Integration tests: not warranted. No repository, model, migration or router changes (testing_standards.md Section 6); the backend behaviour is unchanged.
  - Directory: backend/tests/integration/ (unused by this item)
- E2E tests: criterion 1 only, the browser-level double click against the real stack. Use `page.route` on `POST /api/notes` to hold the first request until both clicks have been fired, then `route.continue()`, so the spec deterministically fails before the fix (two POSTs) and passes after (one). Count POSTs with a `page.on("request")` recorder matching the exact pathname (the TEST-03 spec's `isNotesApiRequest` pattern, copied locally into the new spec, not imported). Use a unique note text per run (`randomUUID`), assert exactly one `note-list-item-*` with that text, reload and assert exactly one again.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus one edge-case scenario (Enter pressed twice while saving).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | Two quick clicks on Save note send one POST and store the note once, also after reload | E2E | `double-clicking Save note stores the note once`, `sends one create request when Save note is clicked twice while saving`, `sends one create request when Enter is pressed twice while saving` | E2E is the covering tier: verifying it needs a real browser double click against the running backend and a reload |
| 2 | After a save finishes (success or failure) Save note is usable again and the next submit is sent | Unit | `disables Save note while a save is in flight`, `re-enables Save note after a successful save so the next note is sent`, `re-enables Save note after a failed save so the user can retry` | verifying it needs no navigation: it is the component's own state transition around one mocked request, fully observable in a rendered NoteForm |
| 3 | A deliberate second save of the same text after the first finished stores a second note | Unit | `sends the same text again on a later, separate submit` | verifying it needs no navigation: it is a rule about when the form calls createNote, observable as two mock calls; the backend already stores duplicates (TEST-03) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Two quick clicks store the note once | Hold POST with page.route, dblclick note-submit, release, assert one POST, one list item, one after reload | Given the landing page with a note typed When I double click Save note Then the note appears once and once after reload |
| 2 | Save note usable again after the save finishes | covered at Unit, see Criterion coverage | Given a save has just finished When I type another note and click Save note Then it is saved |
| 3 | Same text saved again later stores a second note | covered at Unit, see Criterion coverage | Given "Buy milk" was saved When I type "Buy milk" again and click Save note once Then the list shows it twice |

## Manual verification plan
### Criterion 1: Two quick clicks on Save note send one POST and store the note once
Prerequisites: the stack is running (`docker compose up --build` from the repository root), the app is reachable at `http://localhost:5183`, and the browser dev tools Network tab is open and filtered on `notes`. Throttling set to "Slow 4G" in the Network tab makes the second click land while the first save is pending.
1. Navigate to `http://localhost:5183` → the "Task Notes" title, the note field and the **Save note** button are shown; note how many entries the list holds.
2. Type `BUG-04 double click 1` in the **New note** field → the text is in the field.
3. Double click **Save note** quickly → the button turns greyed out (disabled) while the request is pending; the Network tab shows exactly one `POST /api/notes`, answered 201.
4. Read the list → `BUG-04 double click 1` appears exactly once at the bottom; the field is empty again.
5. Reload the page (F5) → after the `GET /api/notes` completes, `BUG-04 double click 1` is still listed exactly once.
6. Type `BUG-04 enter twice` in the field, then press Enter twice quickly → the Network tab shows exactly one `POST /api/notes`, and the note appears once.

### Criterion 2: After a save finishes, Save note is usable again
Prerequisites: as for criterion 1, throttling back to "No throttling".
1. On `http://localhost:5183`, type `BUG-04 next note` and click **Save note** once → the note appears and the button is enabled again (not greyed out).
2. Type `BUG-04 after that` and click **Save note** once → a second `POST /api/notes` is sent and the note appears below the previous one.
3. Stop the backend only (`docker compose stop backend`), type `BUG-04 offline`, click **Save note** → the message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again.
4. Start the backend (`docker compose start backend`), wait until it answers, then click **Save note** again → the error disappears and `BUG-04 offline` is added to the list.

### Criterion 3: A deliberate second save of the same text stores a second note
Prerequisites: as for criterion 2.
1. On `http://localhost:5183`, type `BUG-04 same text` and click **Save note** once → it appears in the list.
2. Wait until the button is enabled again, type `BUG-04 same text` again and click **Save note** once → the Network tab shows a second `POST /api/notes`, and the list now shows `BUG-04 same text` twice.

### Automated check
1. From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → the run passes: no failed or errored test on its summary line, exit code 0.
2. With the stack running, from the repository root run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` → the run passes: no failed test on its summary line, exit code 0.
