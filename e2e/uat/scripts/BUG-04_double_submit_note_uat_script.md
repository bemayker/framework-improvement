# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- The app stack is running: frontend at `http://localhost:5183`, backend reachable at its configured API base URL.
- Chrome with DevTools open on the **Network** tab (needed to count `POST /api/notes` requests and to throttle).
- Docker Compose available from the repository root (steps 4 and 5 of Criterion 2 stop and start the backend).

## Steps

### Criterion 1: A second submission while the first save is in progress stores the note once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" heading, the "New note" field and the "Save note" button are shown | [ ] Pass [ ] Fail |
| 2 | In DevTools Network, set throttling to `Slow 3G` | The page stays as it is; saves now take a few seconds | [ ] Pass [ ] Fail |
| 3 | Enter `Buy milk BUG-04` in the "New note" field | The text is shown in the field | [ ] Pass [ ] Fail |
| 4 | Double-click "Save note" quickly | The button greys out (disabled) immediately and the Network tab shows exactly one `POST /api/notes` request | [ ] Pass [ ] Fail |
| 5 | Wait for that request to finish | `Buy milk BUG-04` appears exactly once in the note list, the field is empty and the button is enabled again | [ ] Pass [ ] Fail |
| 6 | Set throttling back to `No throttling` and reload the page | `Buy milk BUG-04` is still listed exactly once | [ ] Pass [ ] Fail |
| 7 | Repeat steps 2 to 5 with `Call mum BUG-04`, but press Enter twice in the field instead of clicking | One `POST /api/notes` request, and `Call mum BUG-04` appears once | [ ] Pass [ ] Fail |

### Criterion 2: Once a save has completed, the form accepts the next submission again

Throttling set to `No throttling`.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Navigate to `http://localhost:5183/` | The form is shown with "Save note" enabled | [ ] Pass [ ] Fail |
| 9 | Enter `Walk dog BUG-04` and click "Save note" | `Walk dog BUG-04` appears in the list and the field clears | [ ] Pass [ ] Fail |
| 10 | Enter `Feed cat BUG-04` and click "Save note" | `Feed cat BUG-04` appears below `Walk dog BUG-04`; the second save was not blocked | [ ] Pass [ ] Fail |
| 11 | Stop the backend (`docker compose stop backend` from the repository root), enter `Water plants BUG-04` and click "Save note" | The red message "The note could not be saved. Please try again." appears, the text stays in the field and the button is enabled again | [ ] Pass [ ] Fail |
| 12 | Start the backend again (`docker compose start backend`), then click "Save note" | `Water plants BUG-04` appears once in the list, the error message is gone and the field clears | [ ] Pass [ ] Fail |
| 13 | Optional automated check: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | `0 failed`, including the BUG-04 tests named in the plan's criterion coverage | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| A second submission while the first save is in progress sends one create request; the note is stored and listed once | 1 to 7 |
| Once a save has completed (success or error) the form accepts the next submission again | 8 to 13 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
