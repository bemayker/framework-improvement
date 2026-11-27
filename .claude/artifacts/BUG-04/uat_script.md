# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, once merged, on `main`).
- App stack running (`docker compose up`), frontend at `http://localhost:5183`.
- Browser DevTools open on the **Network** tab, filtered to `notes`. Throttling can be switched between "Slow 3G" and "No throttling".

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Set throttling to "Slow 3G". Navigate to `/` | The "Task Notes" title, the "New note" field and the "Save note" button are visible | [ ] Pass [ ] Fail |
| 2 | Type `BUG-04 double click check` in the "New note" field | The text shows in the field | [ ] Pass [ ] Fail |
| 3 | Double click "Save note" quickly | The Network tab shows exactly one `POST /api/notes` | [ ] Pass [ ] Fail |
| 4 | Wait for the POST to finish (201) | `BUG-04 double click check` appears once in the list and the field is empty | [ ] Pass [ ] Fail |
| 5 | Set throttling to "No throttling" and reload the page | `BUG-04 double click check` is still listed exactly once | [ ] Pass [ ] Fail |
| 6 | Set throttling to "Slow 3G". Type `BUG-04 disabled check` and click "Save note" once | While the POST is pending the button looks faded and the pointer shows "not allowed" when hovering it; clicking it again sends no second POST | [ ] Pass [ ] Fail |
| 7 | Wait for the 201 | The note is listed and "Save note" is enabled again (normal look and pointer) | [ ] Pass [ ] Fail |
| 8 | Set throttling to "No throttling". Stop only the backend (`docker compose stop backend`), type `BUG-04 retry check` and click "Save note" | The message "The note could not be saved. Please try again." appears, the field still holds `BUG-04 retry check`, and "Save note" is enabled | [ ] Pass [ ] Fail |
| 9 | Start the backend again (`docker compose start backend`) and click "Save note" once | The Network tab shows exactly one new `POST /api/notes` answered 201, the error disappears and `BUG-04 retry check` is listed once | [ ] Pass [ ] Fail |
| 10 | Type `BUG-04 same text` and click "Save note" | `BUG-04 same text` appears once in the list and the field is empty | [ ] Pass [ ] Fail |
| 11 | Type `BUG-04 same text` again and click "Save note" | `BUG-04 same text` now appears twice in the list | [ ] Pass [ ] Fail |
| 12 | Reload the page | Both `BUG-04 same text` notes are still listed | [ ] Pass [ ] Fail |
| 13 | Set throttling to "Slow 3G". Type `BUG-04 enter check` in the field and press Enter twice quickly | The Network tab shows exactly one `POST /api/notes`, and `BUG-04 enter check` is listed once after it finishes | [ ] Pass [ ] Fail |
| 14 | From the repository root, run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run reports no failed or errored test and exits 0 | [ ] Pass [ ] Fail |
| 15 | From the repository root, run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` | The run reports no failed or errored test and exits 0 | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. Two quick clicks send one `POST /api/notes` and the note appears once, also after reload | 1, 2, 3, 4, 5, 13 |
| 2. Save note is disabled while a save is pending and enabled again after success or failure | 6, 7, 8 |
| 3. After a failed save the form can be submitted again, text and error kept, one new POST | 8, 9 |
| 4. A deliberate second save after the first completed is still stored, same text allowed | 10, 11, 12 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
