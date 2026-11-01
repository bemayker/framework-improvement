# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- The stack is running: frontend on `http://localhost:5183`, backend reachable at its configured API URL, database up.
- Chrome with DevTools available (Network tab, throttling and request blocking are used).
- Repository root as the working directory for the test commands in step 11.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/`, open DevTools, Network tab, set throttling to "Slow 3G" and filter on `notes` | The "Task Notes" page shows the "New note" field and the "Save note" button | [ ] Pass [ ] Fail |
| 2 | Type `Double click check 1` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Click "Save note" twice, quickly (a double click) | The button turns disabled (greyed, not clickable) after the first click | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | The Network panel shows exactly one `POST /api/notes` row with status 201, the field is empty, and the list shows `Double click check 1` once | [ ] Pass [ ] Fail |
| 5 | Set throttling back to "No throttling" and reload the page | The list still shows `Double click check 1` exactly once | [ ] Pass [ ] Fail |
| 6 | Repeat steps 1 to 4 with `Double enter check 1`, pressing Enter twice in the field instead of clicking | One `POST /api/notes` row, the note listed once | [ ] Pass [ ] Fail |
| 7 | With throttling on "No throttling", type `After success 1` and click "Save note" once | The note is listed and the button is enabled again | [ ] Pass [ ] Fail |
| 8 | Type `After success 2` and click "Save note" | The second note is listed below the first, one `POST /api/notes` per save in the Network panel | [ ] Pass [ ] Fail |
| 9 | In DevTools Network, right-click the `POST /api/notes` request and choose "Block request URL", then type `After failure 1` and click "Save note" | The red message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again | [ ] Pass [ ] Fail |
| 10 | Unblock the URL (DevTools Network request blocking, untick the entry) and click "Save note" again | The message disappears, `After failure 1` is listed once | [ ] Pass [ ] Fail |
| 11 | From the repository root run `npm --prefix frontend test` | `NoteForm.test.tsx` runs, including "sends one create request when submitted twice before the first save answers", "disables the save button while a save is pending and re-enables it after" and "accepts a new submission after a failed save", `0 failed` | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| Submitting the same note twice in quick succession sends one `POST /api/notes`, stores one note, and shows it once, also after a reload | 1, 2, 3, 4, 5, 11 |
| Edge case: Enter pressed twice stores the note once | 6 |
| Once a save has finished, successfully or with an error, the form accepts the next submission again | 7, 8, 9, 10, 11 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
