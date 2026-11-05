# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The tracker task 123k99cx47m has an empty description and no acceptance criteria, re-confirmed by this planner with a direct read at plan time. The criteria below are derived from the title and from the current code; every derivation is recorded under `## Re-Plan Feedback` as an assumption.)

## Acceptance Criteria
- [ ] Clicking "Save note" twice in quick succession (a double-click) with a non-empty note sends exactly one `POST /api/notes`, stores exactly one note, and the note list shows that note once, also after a page reload.
- [ ] While a save is in flight, the "Save note" button is disabled and any further submit of the form (a click or pressing Enter in the field) is ignored: no second `POST /api/notes` is sent.
- [ ] Once the in-flight save finishes, the form accepts a new submit again: after a success the button is enabled for the next note, and after a failure the error message is shown, the typed text is kept, and the button is enabled so the user can retry.

## Re-Plan Feedback
- Comment (tracker): 26 comments read by the dispatching session, all framework PR-opened notes from earlier runs → Addressed by: not acted on because none carries feedback on this item's behaviour.
- Comment (tracker): description empty, no criteria → Addressed by: assumption, criteria 1 to 3 derived from the title. Root cause read in `frontend/src/components/NoteForm.tsx`: `handleSubmit` awaits `createNote` with no in-flight guard and the submit button is never disabled, so a second click before the first response returns sends a second POST and the backend (which has no uniqueness rule, by design) stores both.
- Comment (tracker): assumption on fix location → Addressed by: the fix is client-side only (an in-flight guard in `NoteForm`). Not acted on: a server-side idempotency key or a uniqueness constraint on `notes.text`. Two notes with identical text saved deliberately, minutes apart, are legitimate in a task-notes app, so a uniqueness rule would be a behaviour change nobody asked for, and an idempotency-key protocol is gold plating for a "quickly twice" defect (`user_story_alignment.md` Section 3). This keeps the backend, `frontend/src/api/notes.ts` and `LandingPage.tsx` untouched.
- Comment (tracker): assumption on criterion 3 → Addressed by: re-enabling after completion is included so the fix cannot turn into "the form locks forever"; it is the floor of the fix, not new scope.
- Merged since the last plan: n/a (fresh plan, branched from current main 5f90f89).

## Plan Overview
Frontend-only fix in `NoteForm`. Add an in-flight guard to `handleSubmit`: a `useRef<boolean>` checked and set synchronously at the top of the handler (React state alone is not enough, because two click events dispatched in the same tick both read the stale `isSaving === false` before the re-render), plus an `isSaving` state that drives the native `disabled` attribute on the submit button so the user sees the save is underway. Both are reset in a `finally` block, so success and failure both re-open the form. No backend, API client, routing or list change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight guard: `isSubmittingRef = useRef(false)`, `const [isSaving, setIsSaving] = useState(false)`; `handleSubmit` returns early when `isSubmittingRef.current` is true; sets ref and state to true only after the empty-note validation passes and before `await createNote`; resets both in `finally`; the submit `<button>` gets `disabled={isSaving}` and `aria-busy={isSaving}`, and a disabled style variant). Its unit tests in `frontend/src/components/NoteForm.test.tsx`.
- Routes: none.
- State management: local component state plus one ref, inside `NoteForm`; `LandingPage`'s `onCreated` contract is unchanged (it is called once per stored note, which is exactly what the guard ensures).
- Design reference notes: AI freestyle. Disabled submit button: same `buttonStyle` with `opacity: 0.6` and `cursor: "not-allowed"`; label stays "Save note" (no new copy).

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged, consumed as built by TEST-03:
- Method: POST
- URL: /api/notes
- Request: JSON body with one string field `text`, 1 to 500 characters after trimming
- Response: 201 with the stored note, e.g. `{"id": 7, "text": "Buy milk"}`

The fix changes how often the client calls it (at most once per in-flight save), never its shape.

## Technology Selection
- In-flight guard: chose a `useRef` flag plus React state (both already in the installed `react`) over a debounce/throttle utility or a new dependency such as lodash, because a time-window debounce would still let a slow second response through and would also block a legitimate fast second note; the guard is exact, a few lines, and needs nothing installed.
- Blocking repeat interaction: chose the native `disabled` attribute on the `<button type="submit">` over a JS overlay or click-swallowing wrapper, because the platform already stops a disabled submit button from submitting; the ref covers the same-tick and Enter-key cases the attribute alone cannot.
- No net-new dependency is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser spec, double-click on "Save note" sends one POST and the list (and the list after reload) holds the note once
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script, per build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard and `isSaving` state, `disabled`/`aria-busy` on the submit button, disabled style variant
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the guard (second submit while pending is ignored, button disabled while pending, re-enabled after success and after failure)

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` change: the fix alters no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` behaviour with `createNote` mocked to a manually resolved/rejected promise (Vitest + Testing Library, as the existing file does): two `fireEvent.click` on `note-submit` in the same tick result in one `createNote` call; `fireEvent.submit` on `note-form` while pending results in no further call; the button has the `disabled` attribute while pending; after the promise resolves the button is enabled and a second note can be saved (two calls total); after the promise rejects the error shows, the text is kept, the button is enabled, and a retry calls `createNote` again.
  - Directory: frontend/src/components/ (co-located, the project's established Vitest layout; `backend/tests/unit/` in CLAUDE.md is the backend's directory)
  - Naming: `{Component}.test.tsx`, extending the existing `NoteForm.test.tsx`
- Integration tests: not warranted. No router, repository, model or migration changes (testing_standards.md Section 6, questions 2 and 3 answer no).
- E2E tests: criterion 1 only. Fill a unique note text, record every `POST /api/notes` (same exact-path matcher TEST-03's spec uses), `dblclick()` the `note-submit` button, wait for the 201, assert exactly one POST was recorded and `note-list` holds exactly one item with that text; reload and assert still exactly one. To make the race deterministic, the spec delays the POST with `page.route` on the exact notes URL (hold the request, perform the second click, then `route.continue()`), so the second click is guaranteed to land while the first is in flight; the request still reaches the real backend.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (pressing Enter twice quickly stores one note).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A double-click on "Save note" sends one POST, stores one note, list shows it once (also after reload) | E2E | — |
| 2 | While a save is in flight the button is disabled and further submits (click or Enter) are ignored | Unit | Verifying it needs control over the in-flight window, which a mocked pending `createNote` promise gives exactly and deterministically; the user-visible outcome of the same guard (one stored note) is already covered at E2E by criterion 1 |
| 3 | After the save finishes the form accepts a new submit (enabled after success; after failure: error shown, text kept, enabled, retry works) | Unit | It is component state after a resolved or rejected promise; the failure branch needs a forced API error, which a mock gives without a broken backend, and no navigation is involved |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double-click stores one note | Delay the POST via `page.route`, `dblclick()` `note-submit`, assert one recorded POST, one `note-list` item with the text, and one after reload | Given the landing page is open When I type a note and double-click "Save note" Then the note appears in the list once and still once after reload |
| 2 | Disabled and ignored while in flight | covered at Unit, see Criterion coverage | Given a save is in progress When I click "Save note" or press Enter again Then the button is disabled and no second note is stored |
| 3 | Form re-opens after the save finishes | covered at Unit, see Criterion coverage | Given a save has finished When I type another note and click "Save note" Then it is saved as a separate note |

## Manual verification plan
### Criterion 1: A double-click on "Save note" sends one POST, stores one note, and the list shows it once, also after a reload
Prerequisites: the stack is running (frontend at http://localhost:5183, backend reachable), a desktop browser with developer tools.
1. Open http://localhost:5183/ → the "Task Notes" page shows the "New note" field, the "Save note" button and the current list of notes.
2. Open the browser developer tools, Network tab, filter on `notes` → the initial `GET /api/notes` is listed.
3. Type `BUG-04 double click check` in the "New note" field → the text is in the field.
4. Double-click the "Save note" button quickly → exactly one `POST /api/notes` row appears in the Network tab with status 201, the field clears, and `BUG-04 double click check` appears once at the bottom of the list.
5. Reload the page (F5) → `BUG-04 double click check` is listed exactly once.

### Criterion 2: While a save is in flight the button is disabled and further submits are ignored
Prerequisites: as for criterion 1; in the Network tab set throttling to "Slow 3G" so a save takes a few seconds.
1. Open http://localhost:5183/ and wait for the page to load → the form and list are shown.
2. Type `BUG-04 slow save` in the "New note" field and click "Save note" once → the button turns faded (disabled) and the `POST /api/notes` row shows as pending.
3. While it is pending, click "Save note" three more times → nothing happens; the Network tab still shows a single `POST /api/notes`.
4. While it is still pending, click into the "New note" field and press Enter twice → still a single `POST /api/notes`.
5. Wait for the POST to finish → `BUG-04 slow save` appears once in the list. Set throttling back to "No throttling".

### Criterion 3: Once the save finishes the form accepts a new submit, after a success and after a failure
Prerequisites: as for criterion 1.
1. On http://localhost:5183/, type `BUG-04 first` and click "Save note" → `BUG-04 first` appears in the list, the field clears, the button is not faded.
2. Type `BUG-04 second` and click "Save note" → `BUG-04 second` appears in the list as a separate entry below `BUG-04 first`.
3. Stop the backend (for example `docker compose stop backend` from the repository root, or stop the backend dev server), type `BUG-04 offline` and click "Save note" → the red message "The note could not be saved. Please try again." appears, the field still reads `BUG-04 offline`, and the button is not faded.
4. Start the backend again, click "Save note" → the red message disappears, `BUG-04 offline` appears once in the list, and the field clears.
5. Run `npm --prefix frontend exec --no -- vitest run src/components/NoteForm.test.tsx` from the repository root → the NoteForm tests pass with `0 failed`.
