# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, once merged, on `main`).
- The stack is running (`docker compose up`) and the app is open at `http://localhost:5183/`.
- The browser DevTools **Network** panel is open, filtered on `notes`. Most steps verify how many `POST /api/notes` requests are sent, which is only observable there.

## Steps

### Criterion 1: Clicking "Save note" twice quickly stores the note once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | On `/`, type `Double click check 1` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 2 | Double-click "Save note" as fast as possible | The Network panel shows exactly one `POST /api/notes` with status 201 | [ ] Pass [ ] Fail |
| 3 | Look at the note list under the form | `Double click check 1` appears exactly once and the field is empty | [ ] Pass [ ] Fail |
| 4 | Reload the page | After the list loads, `Double click check 1` still appears exactly once | [ ] Pass [ ] Fail |

### Criterion 2: While a save is in progress the button is disabled and further submits are ignored

Extra prerequisite: in the DevTools Network panel set throttling to `Slow 3G` so the save takes a few seconds.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | On `/`, type `Slow save check` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 6 | Click "Save note" once | A `POST /api/notes` appears as pending and the "Save note" button turns greyed out and cannot be clicked | [ ] Pass [ ] Fail |
| 7 | While the request is still pending, click "Save note" three more times, then click into the field and press Enter twice | No further `POST /api/notes` appears in the Network panel | [ ] Pass [ ] Fail |
| 8 | Wait for the request to finish | `Slow save check` appears exactly once in the list | [ ] Pass [ ] Fail |
| 9 | Set throttling back to `No throttling` | Throttling is off | [ ] Pass [ ] Fail |
| 10 | In a separate terminal, run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | `0 failed` | [ ] Pass [ ] Fail |

### Criterion 3: The form accepts a new submit once the save finishes

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | On `/`, type `After success check` and click "Save note" once | The note appears in the list, the field is empty and "Save note" is enabled (not greyed out) | [ ] Pass [ ] Fail |
| 12 | Type `Second note` and click "Save note" | `Second note` appears in the list, so the form accepted a new submit | [ ] Pass [ ] Fail |
| 13 | Stop the backend container (`docker compose stop backend`), type `After failure check` and click "Save note" | The red message "The note could not be saved. Please try again." appears, the field still holds `After failure check`, and "Save note" is enabled again | [ ] Pass [ ] Fail |
| 14 | Start the backend again (`docker compose start backend`), wait for it to answer, and click "Save note" | `After failure check` appears once in the list and the red message is gone | [ ] Pass [ ] Fail |
| 15 | In a separate terminal, run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | `0 failed` | [ ] Pass [ ] Fail |

### Edge case: Enter pressed twice

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 16 | With throttling on `Slow 3G`, type `Enter twice check` in the field and press Enter twice in quick succession | Exactly one `POST /api/notes` appears and, once it finishes, `Enter twice check` appears exactly once in the list. Set throttling back to `No throttling` afterwards | [ ] Pass [ ] Fail |
| 17 | From the repository root, run `npm exec --no -- playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` | `0 failed` for `e2e/tests/BUG-04_double_submit_note.spec.ts` | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. A quick double "Save note" stores the note once (one POST, one list item, also after reload) | 1, 2, 3, 4, 17 |
| 2. While a save is in progress the button is disabled and further submits send no request | 5, 6, 7, 8, 10 |
| 3. After the save finishes the form accepts a new submit (cleared on success; text and error kept on failure) | 11, 12, 13, 14, 15 |
| Edge case: Enter pressed twice sends one request | 16, 17 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 17 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
