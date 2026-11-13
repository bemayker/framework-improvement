# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- The stack is running: backend on its configured port and the frontend at `http://localhost:5183`.
- Repository checked out on branch `feature/BUG-04-double-submit-note` (or `main` once merged).
- Browser DevTools open on the **Network** tab, filtered to `notes`.
- Network throttling set to "Slow 3G" for steps 3 to 8, so a save stays in flight long enough to submit again. Set it back to "No throttling" at step 9.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" title, the "New note" field and the "Save note" button are shown, with the existing notes listed below | [ ] Pass [ ] Fail |
| 2 | Type `Double click check 1` in the "New note" field | The text is shown in the field | [ ] Pass [ ] Fail |
| 3 | Click "Save note", then click it again immediately | After the first click the button turns greyed out and cannot be clicked; the Network tab shows exactly one `POST /api/notes` request | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | `Double click check 1` appears exactly once at the end of the list, the field is empty, and the button is enabled again | [ ] Pass [ ] Fail |
| 5 | Type `Enter key check 1` in the field and press Enter twice quickly | The Network tab shows exactly one new `POST /api/notes`, and `Enter key check 1` appears once in the list | [ ] Pass [ ] Fail |
| 6 | Turn throttling off and reload the page | `Double click check 1` and `Enter key check 1` are each listed exactly once | [ ] Pass [ ] Fail |
| 7 | Type `First after fix` and click "Save note" | `First after fix` appears in the list and the button is enabled | [ ] Pass [ ] Fail |
| 8 | Type `Second after fix` and click "Save note" | `Second after fix` is appended below `First after fix` | [ ] Pass [ ] Fail |
| 9 | Stop the backend container (or set DevTools Network to "Offline"), type `Retry after failure` and click "Save note" | The red message "The note could not be saved. Please try again." appears, the field keeps `Retry after failure`, and the button is enabled again | [ ] Pass [ ] Fail |
| 10 | Start the backend again (or set the Network back to "No throttling") and click "Save note" | The error message disappears, `Retry after failure` appears once in the list and the field is empty | [ ] Pass [ ] Fail |
| 11 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | `0 failed` for `frontend/src/components/NoteForm.test.tsx` | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. A second submit while the first save is in flight sends no second `POST /api/notes`; the note is stored and listed once | 2, 3, 4, 5, 6 |
| 2. After the in-flight save finishes (success or failure) the form accepts the next submission | 7, 8, 9, 10, 11 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
