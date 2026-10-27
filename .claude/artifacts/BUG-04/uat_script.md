# UAT script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- The stack is running (`docker compose up`) and the app is open at `http://localhost:5183/`.
- Chrome DevTools is open on the Network tab. Criteria 1 and 2 need throttling set to "Slow 3G" so a save takes a few seconds; Criterion 3 runs without throttling.
- Steps that stop the backend use `docker compose stop backend`; start it again with `docker compose start backend`.

## Steps

### Criterion 1: A second submit while a save is in progress stores the note once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | With "Slow 3G" on, click the "New note" field and type `Double submit check` | The text is in the field | [ ] Pass [ ] Fail |
| 2 | Press Enter, then press Enter again immediately (within one second) | The Network tab shows exactly one `POST notes` request | [ ] Pass [ ] Fail |
| 3 | Wait for the request to finish | The note list shows `Double submit check` exactly once and the field is empty | [ ] Pass [ ] Fail |
| 4 | Set throttling to "No throttling" and reload the page | The list still shows `Double submit check` exactly once | [ ] Pass [ ] Fail |
| 5 | Set "Slow 3G" again, type `Double click check` and double-click the "Save note" button | One `POST notes` request, and after it finishes one list entry | [ ] Pass [ ] Fail |
| 6 | Set "No throttling" and reload the page | `Double click check` is still listed exactly once | [ ] Pass [ ] Fail |

### Criterion 2: The Save note button is disabled while saving

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | With "Slow 3G" on, type `Disabled button check` and click "Save note" | The button turns faded (reduced opacity), the pointer over it shows the not-allowed cursor, and clicking it does nothing | [ ] Pass [ ] Fail |
| 8 | Wait for the request to finish | The button returns to full opacity with the normal pointer cursor and the note appears once in the list | [ ] Pass [ ] Fail |
| 9 | Run `docker compose stop backend`, type `Failure check` and click "Save note" | The button is disabled until the request fails, then enabled again; the message "The note could not be saved. Please try again." appears under the form with `Failure check` still in the field | [ ] Pass [ ] Fail |

### Criterion 3: After a save finishes, the next submit works normally

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `docker compose start backend`, set "No throttling", reload, type `First note` and click "Save note" | `First note` appears in the list and the field is empty | [ ] Pass [ ] Fail |
| 11 | Type `Second note` and click "Save note" | `Second note` appears below `First note`; each appears once | [ ] Pass [ ] Fail |
| 12 | Run `docker compose stop backend`, type `Retry note` and click "Save note" | The error message appears and `Retry note` stays in the field | [ ] Pass [ ] Fail |
| 13 | Run `docker compose start backend` and click "Save note" again | `Retry note` appears in the list exactly once and the error message disappears | [ ] Pass [ ] Fail |
| 14 | From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run reports `0 failed` for `src/components/NoteForm.test.tsx` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
