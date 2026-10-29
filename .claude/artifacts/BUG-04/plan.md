# Implementation Plan, BUG-04: Saving a note twice quickly stores it twice

## Feature
> BUG-04: Saving a note twice quickly stores it twice
>
> (The ClickUp task 123k99cx47m carries no description and no acceptance criteria: its title is the whole report. The criteria below are derived from the title and recorded as an assumption, per `user_story_alignment.md` Section 4, autonomous mode.)

## Acceptance Criteria
- [ ] Submitting the note form twice in quick succession (double-click on "Save note", or a click followed by Enter) while the first save is still in flight sends exactly one `POST /api/notes` and stores exactly one note, which appears once in the list.
- [ ] The "Save note" button is disabled while a save is in flight and enabled again once the save succeeds, so the next note can be saved.
- [ ] When the in-flight save fails, the form becomes usable again: the button is re-enabled, the typed text is kept and the error message is shown, so the user can retry.

## Re-Plan Feedback
- Comment (tracker): 14 comments read, all framework pull-request link notices from earlier runs → Addressed by: not acted on because none states a requirement, a correction or a reproduction for this item.
- Assumption (empty tracker description): the item's title is the only report. Assumed the duplicate comes from the client firing a second `POST /api/notes` before the first resolves (confirmed by reading `frontend/src/components/NoteForm.tsx`: `handleSubmit` has no in-flight guard and the submit button is never disabled). The fix is therefore client-side; server-side deduplication (an idempotency key or a uniqueness rule on note text) is out of scope, because two identical notes saved deliberately are legitimate and nothing in the item asks the API to reject them.

## Plan Overview
Root cause: `NoteForm.handleSubmit` awaits `createNote(trimmedText)` with no record that a save is in progress, and the `note-submit` button has no `disabled` state. A second submit event that arrives before the first response (double-click, or click plus Enter) runs `handleSubmit` again with the same, not-yet-cleared text, so the API receives two POSTs and stores two rows.

Fix, frontend only, inside `NoteForm.tsx`:
- A `useRef<boolean>` in-flight guard checked and set synchronously at the top of `handleSubmit` (after the empty-text validation), so a second submit event dispatched before React re-renders is still ignored. A ref and not only state, because two events in one frame both read the stale state value.
- A `useState<boolean>` `isSaving` mirror that renders `disabled={isSaving}` on the `note-submit` button and a disabled look (see Design reference notes).
- Both are reset in a `finally` block, so success and failure both release the guard (criteria 2 and 3).

No backend, API or `LandingPage.tsx` change: `onCreated` is already called once per stored note, and with one POST there is one note appended to the list.

Reproduction (defect item):
- Repro: local-automated: `npm --prefix frontend test -- src/components/NoteForm.test.tsx` (source: item title; the new unit tests below encode it). On the base commit the new test "sends one request when the form is submitted twice before the first save settles" fails because `createNote` is called twice; after the fix it passes. Exit 1 on a failing test is Vitest's failing-test exit, as `repro-check.sh` requires.

## Frontend Plan
- Components to create/modify: `frontend/src/components/NoteForm.tsx` (in-flight ref guard, `isSaving` state, `disabled` on the submit button, `finally` reset); `frontend/src/components/NoteForm.test.tsx` (new unit tests, existing ones untouched).
- Routes: none.
- State management: local component state (`useState` for the rendered disabled flag, `useRef` for the synchronous guard). No context, no store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Disabled state of the existing `note-submit` button only: keep the existing button values, add `opacity: 0.6` and `cursor: "not-allowed"` while `isSaving` is true; no new label text, no spinner.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged, consumed as-is (TEST-03):
- Method: POST
- URL: /api/notes
- Request: JSON body with one field, `text` (string, 1 to 500 characters after trimming)
- Response: 201 with `{"id": 12, "text": "Buy milk"}`

The fix changes how many times the client calls it per user action (exactly once per in-flight save), not the contract.

## Technology Selection
- In-flight submit guard: chose React `useRef` plus `useState` (already installed) over a debounce or throttle helper (lodash or a hand-written timer), because a time window either still lets a slow response through or blocks a legitimate quick second note; the guard must last exactly as long as the request.
- Disabled submit button: chose the native `disabled` attribute on the existing `<button>` over a custom overlay or pointer-events CSS, because the native attribute also blocks keyboard activation and is exposed to assistive technology.
- No new dependency, component or module is introduced.

## File Manifest
### New files
- [D] e2e/tests/BUG-04_double_submit_note.spec.ts: Playwright spec, double-click and click-plus-Enter on a delayed save send one POST and render the note once
- [G] e2e/uat/scenarios/BUG-04_double_submit_note.feature: Gherkin scenarios, one per acceptance criterion plus one edge case
- [G] e2e/uat/scripts/BUG-04_double_submit_note_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/NoteForm.tsx: in-flight ref guard, `isSaving` state, `disabled` and disabled style on `note-submit`, guard released in `finally`
- [A] frontend/src/components/NoteForm.test.tsx: unit tests for the double submit (the reproduction), the disabled-while-saving state and the re-enable after success and after failure

No dependency changes, so no lockfile entry. No project structure, run configuration, dependency or test-infrastructure change, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: `NoteForm` behaviour with `createNote` mocked to a deferred promise the test resolves or rejects by hand: (a) two `fireEvent.click` on `note-submit` before resolving gives one `createNote` call (the reproduction); (b) two `fireEvent.submit` on `note-form` before resolving gives one call (the Enter-key path, which bypasses the button); (c) the button is disabled while the promise is pending and enabled after it resolves; (d) after a rejection the button is enabled, the text is kept, the error is shown, and a third submit calls `createNote` again. Existing six tests unchanged.
  - Directory: frontend/src/components/ (Vitest, co-located `*.test.tsx`, the frontend convention; `backend/tests/unit/` is the backend directory)
  - Naming: `{Component}.test.tsx`
- Integration tests: no router, repository or schema change, so no integration test is warranted; the existing `backend/tests/integration/test_notes_integration.py` keeps covering `POST /api/notes`.
  - Directory: backend/tests/integration/
- E2E tests: criterion 1 in a real browser. `page.route` on `POST /api/notes` holds the request for a moment and then continues it to the real backend, so the save is reliably in flight; then `dblclick` on `note-submit` (test 1) and `click` followed by `press("Enter")` in `note-input` (test 2, the edge case). Assert one recorded POST and exactly one `note-list-item-{id}` with the unique text. Reuse the request-matching approach of `e2e/tests/TEST-03_simple_note_form.spec.ts` (exact pathname plus method), defined locally in the new spec; do not edit TEST-03's spec.
  - Directory: e2e/tests/
  - File: BUG-04_double_submit_note.spec.ts
- UAT scenarios: one scenario per criterion plus a click-then-Enter edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | A rapid double submit sends one POST and stores one note shown once | E2E (plus the Unit reproduction) | — |
| 2 | Button disabled while saving, enabled again after success | Unit | verifying it needs no navigation: it is the component's rendered `disabled` attribute against a pending and then resolved mocked promise |
| 3 | After a failed save the button is re-enabled, text kept, error shown | Unit | verifying it needs no navigation: a rejected mocked promise drives the failure deterministically, which a browser test could only do by stubbing the API anyway |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Rapid double submit stores one note | Delay `POST /api/notes` with `page.route`, double-click `note-submit`, assert one POST and one list item with the text | Given the landing page with a slow save, When I double-click "Save note" on "Buy milk", Then exactly one "Buy milk" appears in the list |
| 2 | Button disabled while saving | covered at Unit, see Criterion coverage | Given a save in flight, When I look at "Save note", Then it is disabled, and enabled again once the note appears |
| 3 | Form usable after a failed save | covered at Unit, see Criterion coverage | Given the backend is down, When I save "Buy milk", Then the error is shown, the text stays and "Save note" is enabled |

## Manual verification plan
### Criterion 1: A rapid double submit sends one POST and stores one note shown once
Prerequisites: app stack running (`docker compose up`), frontend at http://localhost:5183, browser DevTools open on the Network tab with throttling set to "Slow 3G" so a save takes a few seconds.
1. Open `http://localhost:5183/` → the "Task Notes" page shows the "New note" field, the "Save note" button and the current list.
2. Type `BUG-04 double click` in the "New note" field → the text is in the field.
3. Double-click "Save note" quickly → the Network tab shows exactly one `POST /api/notes` request.
4. Wait for it to finish → `BUG-04 double click` appears once in the list and the field is empty.
5. Reload the page → `BUG-04 double click` is still listed exactly once.
6. Type `BUG-04 enter`, click "Save note", then immediately press Enter in the field → one `POST /api/notes`, and `BUG-04 enter` appears once.

### Criterion 2: Button disabled while saving, enabled again after success
Prerequisites: as Criterion 1, "Slow 3G" throttling on.
1. Type `BUG-04 disabled` in the "New note" field and click "Save note" → while the request is pending the button is greyed out (reduced opacity, not-allowed cursor) and clicking it does nothing.
2. Wait for the note to appear in the list → "Save note" is back to full opacity and clickable.
3. Type `BUG-04 second` and click "Save note" → it saves and appears in the list.
4. Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → `0 failed`.

### Criterion 3: After a failed save the form is usable again
Prerequisites: frontend running, backend stopped (`docker compose stop backend`) so the save fails.
1. Open `http://localhost:5183/`, type `BUG-04 retry` and click "Save note" → the message "The note could not be saved. Please try again." appears, the field still holds `BUG-04 retry`, and "Save note" is enabled.
2. Start the backend again (`docker compose start backend`) and click "Save note" → the error disappears and `BUG-04 retry` appears once in the list.
