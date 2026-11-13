# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- The stack is running: backend on its configured port, database up, and the frontend reachable at `http://localhost:5183`.
- Repository checked out on branch `feature/BUG-04-double-submit-note` (or `main` once merged).
- A browser with dev tools. The **Network** tab, filtered to `notes`, is how you count save requests and throttle or cut the connection.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" page shows the "New note" field and the "Save note" button | [ ] Pass [ ] Fail |
| 2 | Enter `Double click check 1` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | Exactly one `POST /api/notes` row appears in the Network tab, the field clears, and "Double click check 1" appears once in the list | [ ] Pass [ ] Fail |
| 4 | Reload the page | "Double click check 1" appears exactly once in the list | [ ] Pass [ ] Fail |
| 5 | Enter `Double enter check 2` in the field and press Enter twice rapidly | One `POST /api/notes` row; "Double enter check 2" appears once, and once again after a reload | [ ] Pass [ ] Fail |
| 6 | In dev tools Network, set throttling to "Slow 3G". Enter `Slow save check` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 7 | Click "Save note" once | The button turns greyed out (disabled); clicking it again does nothing and no second `POST /api/notes` appears | [ ] Pass [ ] Fail |
| 8 | Wait for the request to finish | "Slow save check" appears once in the list, the field clears, and "Save note" is enabled again | [ ] Pass [ ] Fail |
| 9 | Set throttling back to "No throttling", then enable "Offline" in the Network tab | The browser is offline | [ ] Pass [ ] Fail |
| 10 | Enter `Retry check` in the "New note" field and click "Save note" | The red message "The note could not be saved. Please try again." appears, the field still reads `Retry check`, and "Save note" is enabled | [ ] Pass [ ] Fail |
| 11 | Disable "Offline", then click "Save note" once | The error message disappears, the field clears, and "Retry check" appears once in the list | [ ] Pass [ ] Fail |
| 12 | From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | `0 failed`, including the three BUG-04 tests named in the plan's criterion coverage | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| A quick double submit sends one save request and stores the note once | 2, 3, 4, 5 |
| The button is disabled while a save is in progress and enabled once it completes | 6, 7, 8 |
| After a failed save the button is enabled again and the note can be saved by submitting once more | 9, 10, 11, 12 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
