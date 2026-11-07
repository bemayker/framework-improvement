# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task [BUG-04: Saving a note twice quickly stores it twice](https://app.clickup.com/t/123k99cx47m) has an empty description; the title is the whole feature text. Defect item, depends on TEST-03, which is done.)

## Acceptance Criteria
- [ ] 1. Double-clicking "Save note" on a non-empty note stores that note exactly once: the page sends one `POST /api/notes`, the list shows the note once, and it is still listed once after a page reload.
- [ ] 2. Pressing Enter twice in quick succession in the "New note" field stores that note exactly once, under the same three checks as criterion 1.
- [ ] 3. While a save is in flight the "Save note" button is disabled, and once the save finishes, successfully or with an error, the form accepts the next submission again (a failed save can be retried, a second note can be saved).

## Re-Plan Feedback
- Comment (tracker): none actionable. All 29 comments on the task are this framework's own PR-opened notes, per the dispatch → Addressed by: not acted on, because none states a requirement or a correction.
- Comment (tracker): the task has no description (re-checked at plan time: `description` and `text_content` are both empty) → Addressed by: acceptance criteria 1 to 3 are derived from the title. Assumption recorded: "twice quickly" means a second submit of the same form while the first `POST /api/notes` has not yet answered, reachable by a double-click on the button or a repeated Enter in the field; a deliberate second save of the same text after the first one finished is a new note and stays allowed (criterion 3), because the app has no uniqueness rule for note text and adding one would be a feature nobody asked for.
- Comment (tracker): fix location → Addressed by: assumed client-side. The defect is that `NoteForm.handleSubmit` has no in-flight guard, so every submit event issues its own `createNote` call. A server-side dedupe (idempotency key, uniqueness window) would add an API contract and touch `backend/app/routers/notes.py`, `note_service.py` and `note_repository.py`, which TEST-12 also edits; it is out of scope for a title-only bug on a minimal sandbox app (`CLAUDE.md` Architecture Notes: keep every feature as small as possible).
- Merged since the last plan: n/a (fresh plan, no earlier BUG-04 plan exists). Plan base origin/main a35fe14 was not present in the local clone (local origin/main at e8c6bac); the provider's compare of e8c6bac and a35fe14 lists only backend, `.env.example`, `docker-compose.yml`, UAT and BUG-01/TEST-09 artifact paths, none of which this plan lists, so every file read here is identical at the plan base.
- In flight: TEST-08 (PR #647) edits `frontend/src/components/AppFooter.tsx`, `frontend/src/components/LandingPage.test.tsx`, `frontend/src/api/notes.ts` and adds `frontend/src/api/version.ts` and `frontend/src/api/baseUrl.ts` → this plan lists none of them: the fix lives entirely in `NoteForm.tsx`, and `LandingPage.tsx` (named in the feature map's conflict note) needs no change either.

## Plan Overview
Frontend-only fix in the note form. `NoteForm` gains an in-flight guard: a `useRef` boolean checked and set synchronously at the top of the submit handler (so two submit events dispatched before React re-renders cannot both reach `createNote`), mirrored into an `isSaving` state that sets the native `disabled` attribute on the "Save note" button for the duration of the request. The guard is released in a `finally`, so success and failure both re-open the form. No backend, API, schema or migration change.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` — add `const isSavingRef = useRef(false)` and `const [isSaving, setIsSaving] = useState(false)`. In `handleSubmit`, after `event.preventDefault()`: return immediately when `isSavingRef.current` is true. The empty/whitespace validation stays before the guard is taken (an empty submit never locks the form). Then set `isSavingRef.current = true` and `setIsSaving(true)`, call `createNote` inside the existing `try`/`catch`, and in a new `finally` set `isSavingRef.current = false` and `setIsSaving(false)`. The submit button gets `disabled={isSaving}`; its style adds `opacity: 0.6` and `cursor: "default"` when `isSaving` is true (spread over `buttonStyle`). Label text, test ids, messages and all other behaviour are unchanged. Because the default button is disabled during the save, the browser's implicit submission on Enter is also suppressed; the ref guard covers the window before the re-render.
- Routes: none.
- State management: local component state plus one ref inside `NoteForm`; `LandingPage`'s `onCreated` wiring is unchanged (it is called once per stored note, so the list stays correct without edits there).
- Design reference notes: AI freestyle (Design Reference mode NONE). Disabled "Save note" button while saving: opacity 0.6, cursor default; every other value as in the existing `buttonStyle`.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged; recorded so the build does not alter it.
- Method: POST
- URL: /api/notes
- Request: `{"text": "Buy milk"}`
- Response: 201, `{"id": 7, "text": "Buy milk"}`

## Technology Selection
- In-flight submit guard: chose a React `useRef` flag plus the native `disabled` attribute on the existing `<button type="submit">` over a debounce/throttle utility or a new dependency (e.g. lodash.debounce), because a timing window would either still let a slow second request through or block a legitimate later save, while the ref and the native attribute track the request itself with stdlib-level React APIs already installed.
- No new dependency, module or component is introduced; the E2E spec reuses `@playwright/test` and `node:crypto` already used by the TEST-03 spec.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: browser specs for criteria 1 and 2 (double-click and repeated Enter each send one POST and list the note once, also after reload)
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight guard (ref plus `isSaving` state), `disabled` submit button with its disabled style, guard released in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the guard (two synchronous submits make one `createNote` call; button disabled while pending and enabled after resolve and after reject; a second note can be saved after the first)

No dependency changes, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `NoteForm` component behaviour in Vitest with `createNote` mocked (as the existing file does). Cases: two `fireEvent.submit`/click calls before the mocked promise resolves produce exactly one `createNote` call and one `onCreated` call; button has `disabled` while the promise is pending; button is enabled again after resolve and after reject; after a rejected save a retry calls `createNote` again; after a successful save a second note is saved (two calls in total). Existing cases stay green unchanged.
  - Directory: `frontend/src/components/` (colocated `*.test.tsx`, the established frontend convention; `CLAUDE.md`'s unit directory names the backend tree)
  - Naming: `NoteForm.test.tsx` (existing file)
- Integration tests: not warranted; no repository, model, migration or endpoint changes (`POST /api/notes` is already covered by `backend/tests/integration/test_notes_integration.py`).
  - Directory: `backend/tests/integration/` (no new file)
- E2E tests: double-click on `note-submit` and double Enter in `note-input` each record exactly one `POST /api/notes` (same exact-pathname matcher as the TEST-03 spec, since a substring match catches the Vite module URL), the list shows exactly one `note-list-item-*` with that unique text, and after `page.reload()` exactly one item with that text remains. Use unique note text per test (`randomUUID`) so specs stay parallel-safe; wait on responses, never fixed timeouts. Holding the POST with `page.route` until both input events have been dispatched makes "quickly" deterministic.
  - Directory: `e2e/tests/`
  - File: `BUG-04_double_submit_note.spec.ts`
- UAT scenarios: one per criterion plus an edge case (a failed save followed by a retry stores the note once).
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Double-click on "Save note" stores the note once (one POST, one list item, one after reload) | E2E | — |
| 2 | Repeated Enter in the field stores the note once | E2E | — |
| 3 | Button disabled while saving; form accepts the next submission after success or failure | Unit | verifying it needs no navigation or a running backend: it is the component's own state transition, observable in a rendered `NoteForm` with a controllable mocked `createNote` (pending, resolved, rejected), which a browser cannot hold deterministically |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Double-click stores once | Fill unique text, `dblclick()` on `note-submit` while the POST is held by `page.route`, release it, assert one recorded POST, one list item with the text, and one after reload | Given the landing page is open, When I type a note and double-click "Save note", Then the note appears once and is still listed once after reload |
| 2 | Repeated Enter stores once | Fill unique text, press Enter twice in `note-input` while the POST is held, same three assertions | Given the landing page is open, When I type a note and press Enter twice quickly, Then the note appears once |
| 3 | Disabled while saving, re-enabled after | covered at Unit, see Criterion coverage | Given a save is in progress, Then "Save note" is disabled; When the save fails, Then I can retry and the note is stored once |

## Manual verification plan
### Criterion 1: Double-clicking "Save note" stores the note exactly once
Prerequisites: the stack is running (`docker compose up -d` from the repo root); the app is open at http://localhost:5183/ in Chrome with DevTools open on the Network tab, filtered to `notes`.
1. Navigate to http://localhost:5183/ → the "Task Notes" heading, the "New note" field and the "Save note" button are shown.
2. Type `Double click check 1` in the "New note" field → the text appears in the field.
3. Double-click "Save note" rapidly → the field clears and `Double click check 1` appears exactly once in the notes list; the Network tab shows exactly one `POST` to `/api/notes` with status 201.
4. Reload the page → `Double click check 1` is listed exactly once.

### Criterion 2: Pressing Enter twice quickly stores the note exactly once
Prerequisites: same as Criterion 1.
1. Navigate to http://localhost:5183/ → the note form is shown.
2. Click in the "New note" field and type `Enter twice check 1` → the text appears in the field.
3. Press Enter twice in quick succession → the field clears and `Enter twice check 1` appears exactly once in the list; the Network tab shows exactly one `POST` to `/api/notes`.
4. Reload the page → `Enter twice check 1` is listed exactly once.

### Criterion 3: The button is disabled while saving and the form re-opens afterwards
Prerequisites: same as Criterion 1.
1. In DevTools Network, set throttling to "Slow 3G". Type `Slow save check 1` and click "Save note" once → while the request is pending the "Save note" button appears faded and clicking it again does nothing (still one `POST` in the Network tab).
2. Wait for the request to finish → `Slow save check 1` appears once, the button returns to full opacity. Set throttling back to "No throttling".
3. Type `Second note check 1` and click "Save note" → it is saved and listed; the list now holds both notes, each once.
4. Stop the backend with `docker compose stop backend`. Type `Retry check 1` and click "Save note" → the message "The note could not be saved. Please try again." appears, the text stays in the field and the button is enabled again.
5. Start the backend with `docker compose start backend`, then click "Save note" again → the error message disappears and `Retry check 1` is listed exactly once.
6. Automated check: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → expected result `0 failed` for the NoteForm tests.
