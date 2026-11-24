# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- Repository checked out on branch `feature/BUG-04-double-submit-note` (or, once merged, on `main`).
- The stack is running with `docker compose up`: frontend at `http://localhost:5183`, backend at `http://localhost:8010`.
- Chrome with DevTools open on the Network tab. Criterion 1 needs throttling set to "Slow 3G" so the save takes long enough to click twice; Criterion 2 starts with "No throttling".
- `npm` installed and frontend dependencies installed (for the test run in step 11).

## Steps

### Criterion 1: Submitting twice quickly stores exactly one note and the list shows it once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Set Network throttling to "Slow 3G", then navigate to `http://localhost:5183/` | The "Task Notes" page shows the "New note" field and the "Save note" button | [ ] Pass [ ] Fail |
| 2 | Type `Double click check 1` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The button turns dimmed (disabled) while the request is pending, and the Network tab shows exactly one `POST /api/notes` request | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | `Double click check 1` appears once in the list below the form, the field is empty and the button is enabled again | [ ] Pass [ ] Fail |
| 5 | Type `Enter check 1` in the field and press Enter twice quickly (edge case) | The Network tab shows exactly one new `POST /api/notes`, and `Enter check 1` appears once in the list | [ ] Pass [ ] Fail |
| 6 | Reload the page | `Double click check 1` and `Enter check 1` each appear exactly once | [ ] Pass [ ] Fail |

### Criterion 2: After a save finishes, successfully or not, the form accepts the next submission

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Set throttling to "No throttling", reload `http://localhost:5183/`, type `Repeat me` and click "Save note" once | `Repeat me` appears once in the list and the button is enabled again | [ ] Pass [ ] Fail |
| 8 | Type `Repeat me` again and click "Save note" once | A second `Repeat me` entry appears (a deliberate second save is still allowed) | [ ] Pass [ ] Fail |
| 9 | Set throttling to "Offline", type `Offline check` and click "Save note" (edge case: failed save) | The message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again | [ ] Pass [ ] Fail |
| 10 | Set throttling back to "No throttling" and click "Save note" | `Offline check` appears once in the list and the error message disappears | [ ] Pass [ ] Fail |
| 11 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root | The run passes: its summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
