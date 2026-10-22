# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- The app stack is running (frontend at `http://localhost:5183`, backend and database up).
- Browser DevTools open on the **Network** tab. For steps 1 to 6 set throttling to "Slow 3G" so the save stays in flight long enough to click twice.
- For steps 7 to 9 you can stop and start the backend service (for example its compose service).
- Notes from earlier runs may already be in the list. Every step below concerns the note you add.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the saved-notes list | [ ] Pass [ ] Fail |
| 2 | Type `BUG-04 double click check` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The Network tab shows exactly one `POST /api/notes` request | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | `BUG-04 double click check` appears once in the saved-notes list and the field is cleared | [ ] Pass [ ] Fail |
| 5 | Set throttling to "No throttling" and reload the page | `BUG-04 double click check` is still listed exactly once | [ ] Pass [ ] Fail |
| 6 | Set throttling to "Slow 3G", type `BUG-04 enter key check`, click "Save note" and immediately press Enter in the field | One `POST /api/notes` in the Network tab, and the note appears once | [ ] Pass [ ] Fail |
| 7 | Type `BUG-04 disabled check` and click "Save note" once, then watch the button while the request is pending | The button is greyed out (reduced opacity, not-allowed cursor) and clicking it does nothing. When the request finishes it returns to its normal dark style, is clickable, and the note is listed once | [ ] Pass [ ] Fail |
| 8 | Stop the backend, type `BUG-04 retry check` and click "Save note" | The message "The note could not be saved. Please try again." appears, the field still holds `BUG-04 retry check`, and the "Save note" button is enabled again | [ ] Pass [ ] Fail |
| 9 | Start the backend again and click "Save note" | `BUG-04 retry check` appears once in the list and the error message disappears | [ ] Pass [ ] Fail |
| 10 | With the field empty, click "Save note" | "Enter a note before saving." appears and the Network tab shows no `POST /api/notes` | [ ] Pass [ ] Fail |
| 11 | Type three spaces and click "Save note" | The same validation message, and no `POST /api/notes` | [ ] Pass [ ] Fail |
| 12 | Type `  BUG-04 trim check  ` (leading and trailing spaces) and click "Save note" | The list shows `BUG-04 trim check` without the surrounding spaces | [ ] Pass [ ] Fail |
| 13 | From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | NoteForm.test.tsx runs, expected `0 failed` | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| A rapid second submit sends exactly one `POST /api/notes`, stores the note once and shows it once | 2, 3, 4, 5, 6 |
| The "Save note" button is disabled while a save is in flight and enabled after success or failure | 7, 8, 13 |
| A failed save is retryable and TEST-03 behaviour is unchanged (validation, trimming, error keeps text) | 8, 9, 10, 11, 12 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
