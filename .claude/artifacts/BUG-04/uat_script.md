# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- The stack is running: backend on `http://localhost:8010`, frontend on `http://localhost:5183`, database on port `5442` (see `docker-compose.yml`).
- Repository checked out on branch `feature/BUG-04-double-submit-note` (or `main` once merged).
- Chrome with DevTools open on the **Network** tab. The network throttling dropdown is used in every criterion: "Slow 3G" so a save takes a few seconds, "Offline" to force a failed save, and "No throttling" otherwise.
- The notes list may already hold entries from earlier runs. Every step is about the note you add, not about the list being empty.

## Steps

### Criterion 1: Clicking Save note twice quickly stores the note exactly once

Throttling: "Slow 3G".

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the notes list | [ ] Pass [ ] Fail |
| 2 | Type `BUG-04 double click check` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The Network tab shows exactly one `POST` to `/api/notes` | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | `BUG-04 double click check` appears once in the list and the field is empty | [ ] Pass [ ] Fail |
| 5 | Set throttling to "No throttling" and reload the page | `BUG-04 double click check` is still listed exactly once | [ ] Pass [ ] Fail |

### Criterion 2: Save note is disabled while a save is in progress

Throttling: "Slow 3G".

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Open `http://localhost:5183/` and type `BUG-04 disabled check` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 7 | Click "Save note" once | While the request is pending the button is faded (reduced opacity) and the mouse pointer over it shows the not-allowed cursor | [ ] Pass [ ] Fail |
| 8 | While it is still pending, click the field and press Enter twice | The Network tab still shows only the one `POST` to `/api/notes` | [ ] Pass [ ] Fail |
| 9 | Wait for the request to finish | `BUG-04 disabled check` is listed once | [ ] Pass [ ] Fail |

### Criterion 3: Save note is enabled again after the save finishes

Throttling: "No throttling".

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Open `http://localhost:5183/`, type `BUG-04 next note one` and click "Save note" | The note is listed and the button is back to full opacity and clickable | [ ] Pass [ ] Fail |
| 11 | Type `BUG-04 next note two` and click "Save note" | The second note is listed below the first | [ ] Pass [ ] Fail |
| 12 | In DevTools set the network to "Offline", type `BUG-04 retry check` and click "Save note" | The red message "The note could not be saved. Please try again." appears, the text stays in the field and the button is enabled | [ ] Pass [ ] Fail |
| 13 | Set the network back to "No throttling" and click "Save note" again | `BUG-04 retry check` is listed once and the error message is gone | [ ] Pass [ ] Fail |
| 14 | From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| Clicking "Save note" twice quickly stores the note exactly once, also after a reload | 1, 2, 3, 4, 5 |
| While a save is in progress the button is disabled and a second submit (click or Enter) sends no request | 6, 7, 8, 9 |
| After the save finishes, successfully or with an error, the button is enabled again and a failed save can be retried | 10, 11, 12, 13, 14 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
