# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- The stack is running (`docker compose up`) and the frontend is reachable at http://localhost:5183.
- Browser devtools open on the Network tab, filtered on `notes`.
- Criterion 2 steps 7 and 8 stop and start the backend with `docker compose stop backend` and `docker compose start backend`.

## Steps

### Criterion 1: Submitting the same note twice in quick succession stores exactly one note and shows it exactly once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the current note list | [ ] Pass [ ] Fail |
| 2 | Enter `BUG-04 double click check` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The button greys out briefly, the field clears, and `BUG-04 double click check` appears once at the bottom of the list | [ ] Pass [ ] Fail |
| 4 | Look at the Network tab | Exactly one `POST /api/notes` with status 201 was sent | [ ] Pass [ ] Fail |
| 5 | Reload the page | `BUG-04 double click check` is still listed exactly once | [ ] Pass [ ] Fail |

### Criterion 2: Once a save has finished, successfully or not, the form accepts the next submit

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Enter `BUG-04 second note` and click "Save note" once | The button is enabled again after the save, the field clears, and `BUG-04 second note` appears once in the list below `BUG-04 double click check` | [ ] Pass [ ] Fail |
| 7 | Run `docker compose stop backend`, enter `BUG-04 retry note` and click "Save note" | The message "The note could not be saved. Please try again." appears, the field still holds `BUG-04 retry note`, and the "Save note" button is enabled | [ ] Pass [ ] Fail |
| 8 | Run `docker compose start backend`, wait until `http://localhost:8010/health` answers, then click "Save note" | The error message disappears and `BUG-04 retry note` appears once in the list | [ ] Pass [ ] Fail |
| 9 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | `0 failed`, including the re-enable after success and after failure cases | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
