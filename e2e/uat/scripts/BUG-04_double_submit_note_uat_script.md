# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or, once merged, on `main`).
- The stack is running: backend on http://localhost:8010, frontend on http://localhost:5183, and the database reachable.
- A browser with DevTools. For criteria 1 and 2, open the Network tab and set throttling to "Slow 3G" so the save stays pending long enough to see.
- Criterion 3 step 3 needs Docker Compose to stop and start the backend (`docker compose stop backend`, `docker compose start backend`).
- Node dependencies installed (`npm --prefix frontend install`) for the unit test run in criterion 2.

## Steps

### Criterion 1: Submitting twice in quick succession stores the note once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the notes list | [ ] Pass [ ] Fail |
| 2 | Type `BUG-04 double click check` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double click "Save note" quickly | In the Network tab exactly one `POST /api/notes` request appears | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | The list shows `BUG-04 double click check` exactly once and the field is empty | [ ] Pass [ ] Fail |
| 5 | Reload the page and wait for the list to load | `BUG-04 double click check` is still shown exactly once (one row stored) | [ ] Pass [ ] Fail |
| 6 | Type `BUG-04 enter check`, click in the field and press Enter twice quickly | One `POST /api/notes` appears in the Network tab, and after it finishes the note is listed exactly once | [ ] Pass [ ] Fail |

### Criterion 2: The Save note button is disabled while saving

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:5183/` | The "Save note" button is dark and clickable | [ ] Pass [ ] Fail |
| 8 | Type `BUG-04 disabled check` and click "Save note" once | While the `POST /api/notes` is pending, the button turns semi-transparent and the cursor over it shows "not allowed" | [ ] Pass [ ] Fail |
| 9 | Click "Save note" again while the request is still pending | Nothing happens: no second `POST /api/notes` appears | [ ] Pass [ ] Fail |
| 10 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run reports no failed or errored test and exits 0 | [ ] Pass [ ] Fail |

### Criterion 3: The button is enabled again after success or failure

Throttling may be off for these steps.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Open `http://localhost:5183/`, type `BUG-04 first` and click "Save note" | The note appears in the list and the button is dark and clickable again | [ ] Pass [ ] Fail |
| 12 | Type `BUG-04 second` and click "Save note" | The second note is saved and listed; no reload was needed | [ ] Pass [ ] Fail |
| 13 | Stop the backend with `docker compose stop backend`, type `BUG-04 offline` and click "Save note" | The red message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is clickable again | [ ] Pass [ ] Fail |
| 14 | Start the backend with `docker compose start backend` and click "Save note" again | The note `BUG-04 offline` is saved and listed once, and the error message disappears | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
