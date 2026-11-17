# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- The stack is running: backend on its configured port, frontend at `http://localhost:5183`, PostgreSQL reachable by the backend.
- Repository checked out on branch `feature/BUG-04-double-submit-note` (or `main` once merged).
- Browser DevTools open on the **Network** tab, filtered to `notes`. Steps 3, 7 and 8 are only observable there.
- Network throttling set to "Slow 3G" for steps 6 to 9, so a save takes a few seconds (optional for step 3, but it widens the window).
- For steps 11 to 13: the ability to stop and start the backend (for example by stopping its container).

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" landing page shows the "New note" field, the "Save note" button and the note list | [ ] Pass [ ] Fail |
| 2 | Type `Double click check 1` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" quickly | The Network tab shows exactly one `POST /api/notes` with status 201 | [ ] Pass [ ] Fail |
| 4 | Look at the note list and the field | `Double click check 1` appears exactly once, and the field is empty | [ ] Pass [ ] Fail |
| 5 | Reload the page | `Double click check 1` is still listed exactly once | [ ] Pass [ ] Fail |
| 6 | Type `Slow save check` in the "New note" field and click "Save note" once | While `POST /api/notes` is still pending, the button is greyed out (reduced opacity) and the cursor over it shows "not allowed" | [ ] Pass [ ] Fail |
| 7 | While still pending, click the field and press Enter | No second `POST /api/notes` appears in the Network tab | [ ] Pass [ ] Fail |
| 8 | While still pending, click "Save note" again | No second `POST /api/notes` appears in the Network tab | [ ] Pass [ ] Fail |
| 9 | Wait for the request to finish | `Slow save check` appears exactly once in the list | [ ] Pass [ ] Fail |
| 10 | Type `After success` and click "Save note" | Once the note appears in the list, the "Save note" button is fully opaque and clickable again | [ ] Pass [ ] Fail |
| 11 | Stop the backend, type `Retry after failure`, click "Save note" | The message "The note could not be saved. Please try again." appears under the field, `Retry after failure` is still in the field, and the button is enabled again | [ ] Pass [ ] Fail |
| 12 | Start the backend again and click "Save note" | `Retry after failure` appears exactly once in the list and the error message disappears | [ ] Pass [ ] Fail |
| 13 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run passes: no failed or errored test on its summary line, exit code 0 | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. Two quick clicks send one create request and store the note once, also after reload | 2, 3, 4, 5 |
| 2. The button is disabled while a save is in flight, and a second submit sends no request | 6, 7, 8, 9 |
| 3. The button is enabled again after the save finishes, and a failed save keeps the text and can be retried | 10, 11, 12, 13 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
