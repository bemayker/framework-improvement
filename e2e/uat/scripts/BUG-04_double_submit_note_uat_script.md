# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- App stack running: backend and database up, frontend at `http://localhost:5183`.
- Browser DevTools open on the Network tab, filtered to `notes`.
- Criteria 1 and 2: optionally set Network throttling to "Slow 3G" so the in-flight window is wide enough to hit by hand.
- Criterion 3 step 13: `npm` available at the repository root.

## Steps

### Criterion 1: A quick double submit sends one create request and stores the note once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" landing page shows the "New note" field and the "Save note" button | [ ] Pass [ ] Fail |
| 2 | Type `Double click check 1` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as possible | The Network tab shows exactly one `POST /api/notes` request | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | The list shows `Double click check 1` exactly once and the field is empty | [ ] Pass [ ] Fail |
| 5 | Reload the page | The list still shows `Double click check 1` exactly once | [ ] Pass [ ] Fail |
| 6 | Type `Enter twice check 1` in the field and press Enter twice quickly | One `POST /api/notes` in the Network tab, and the note appears once in the list | [ ] Pass [ ] Fail |

### Criterion 2: Save is disabled while a save is in flight and re-enabled after success or failure

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | With throttling on "Slow 3G", type `Disabled check` and click "Save note" once | While the request is pending the button is greyed out and does not respond to clicks | [ ] Pass [ ] Fail |
| 8 | Wait for the request to finish | The note appears in the list and "Save note" is clickable again | [ ] Pass [ ] Fail |
| 9 | Stop the backend container (or in DevTools right-click the `/api/notes` request and choose "Block request URL"), type `Failure retry check`, click "Save note" | The error "The note could not be saved. Please try again." appears, the text stays in the field, and "Save note" is clickable again | [ ] Pass [ ] Fail |
| 10 | Restore the backend (or unblock the URL) and click "Save note" | The note `Failure retry check` appears once in the list | [ ] Pass [ ] Fail |

### Criterion 3: A save after the previous one finished is stored normally, identical text included

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | With no throttling, type `Same text twice` and click "Save note" | The note appears in the list | [ ] Pass [ ] Fail |
| 12 | Type `Same text twice` again and click "Save note" | A second `Same text twice` entry appears, so the list shows it twice | [ ] Pass [ ] Fail |
| 13 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root | The NoteForm tests run with `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
