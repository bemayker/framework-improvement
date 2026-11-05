# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- The app stack is running: frontend at `http://localhost:5183`, backend and database up.
- A browser with DevTools open on the Network tab, filtered to `notes`.
- Step 12: Node dependencies installed (`npm --prefix frontend install`).

## Steps

### Criterion 1: Submitting the same note twice in quick succession stores it once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The page shows the "New note" field, the "Save note" button and the note list (possibly empty) | [ ] Pass [ ] Fail |
| 2 | In DevTools Network, set throttling to "Slow 3G" | The save will stay in flight long enough to click twice | [ ] Pass [ ] Fail |
| 3 | Type `Double click check 1` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 4 | Double-click "Save note" | While the request is pending the button looks dimmed and does not react to the second click. The Network tab shows exactly one `POST` to `/api/notes` | [ ] Pass [ ] Fail |
| 5 | Wait for the request to finish | `Double click check 1` appears exactly once in the note list and the field is empty | [ ] Pass [ ] Fail |
| 6 | Set throttling back to "No throttling" and reload the page | `Double click check 1` still appears exactly once | [ ] Pass [ ] Fail |
| 7 | Set throttling to "Slow 3G" again, type `Double click check 2`, and press Enter twice quickly in the field (edge case) | Exactly one `POST` to `/api/notes` is shown, and after it finishes the note appears once in the list | [ ] Pass [ ] Fail |

### Criterion 2: The form accepts the next submission once a save has finished

Set throttling back to "No throttling" first.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Type `First note` and click "Save note" | `First note` appears in the list, the field empties and the button is enabled (not dimmed) again | [ ] Pass [ ] Fail |
| 9 | Type `Second note` and click "Save note" | `Second note` appears in the list below `First note`; both are listed once | [ ] Pass [ ] Fail |
| 10 | Stop the backend container (or enable "Offline" in DevTools Network), type `Failing note` and click "Save note" | The message "The note could not be saved. Please try again." appears under the field, `Failing note` stays in the field and the button is enabled again | [ ] Pass [ ] Fail |
| 11 | Restart the backend (or disable "Offline") and click "Save note" again | `Failing note` is saved, appears once in the list, and the error message disappears | [ ] Pass [ ] Fail |
| 12 | From the repository root, run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run ends with `0 failed`, including the BUG-04 tests for disabled-while-pending and re-enable after success and after failure | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
