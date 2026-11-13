# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- The stack is running locally: backend on `http://localhost:8010`, frontend on `http://localhost:5183`.
- Browser is Chrome with DevTools available (Network tab; Network request blocking for steps 10 to 12).
- Notes from earlier runs may already be in the list. Every step below is about the note you add.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open DevTools, Network tab, filter `notes`. Set the throttling dropdown to "Slow 3G" | The dropdown shows "Slow 3G", so each save stays in flight for a few seconds | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` and wait for the page to load | The "Task Notes" heading, the "New note" field and the "Save note" button are visible | [ ] Pass [ ] Fail |
| 3 | Type `Double click check 1` in the "New note" field | The field shows the text | [ ] Pass [ ] Fail |
| 4 | Double-click "Save note" quickly | The Network tab lists exactly one `POST http://localhost:8010/api/notes` request | [ ] Pass [ ] Fail |
| 5 | Wait for that request to finish | The note list shows `Double click check 1` once, and the field is empty | [ ] Pass [ ] Fail |
| 6 | Type `Enter twice check 1` in the field, then press Enter twice quickly | Exactly one more `POST /api/notes` appears, and `Enter twice check 1` appears in the list once | [ ] Pass [ ] Fail |
| 7 | Set throttling back to "No throttling" and reload the page | `Double click check 1` and `Enter twice check 1` each appear exactly once in the list | [ ] Pass [ ] Fail |
| 8 | Set throttling to "Slow 3G", type `Disabled state check` in the field | "Save note" is dark (#1a1a1a) at full opacity | [ ] Pass [ ] Fail |
| 9 | Click "Save note" once and look at the button while the `POST /api/notes` is pending | The button is faded (opacity 0.6), the cursor over it is "not-allowed", and clicking it does nothing (no new request in the Network tab) | [ ] Pass [ ] Fail |
| 10 | Wait for the request to finish, then set throttling back to "No throttling" | The button returns to full opacity with a pointer cursor, and `Disabled state check` is in the list once | [ ] Pass [ ] Fail |
| 11 | Open `http://localhost:5183/`, open "Show Network request blocking" (Cmd+Shift+P), add the pattern `*/api/notes` and tick it | The pattern is listed and checked | [ ] Pass [ ] Fail |
| 12 | Type `Retry check` in the field and click "Save note" | The request shows as `(blocked:devtools)`, the red message "The note could not be saved. Please try again." appears, the field still reads `Retry check`, and "Save note" is enabled | [ ] Pass [ ] Fail |
| 13 | Untick the blocking pattern and click "Save note" again | A new `POST /api/notes` returns 201, `Retry check` appears in the list once, the field is empty and the red message is gone | [ ] Pass [ ] Fail |
| 14 | With the field empty, click "Save note" | "Enter a note before saving." appears and no `POST /api/notes` is sent | [ ] Pass [ ] Fail |
| 15 | Type three spaces in the field and click "Save note" | The same validation message appears and no request is sent | [ ] Pass [ ] Fail |
| 16 | Type `  Trim check  ` (two spaces either side) and click "Save note" | The list shows `Trim check` with no surrounding spaces | [ ] Pass [ ] Fail |
| 17 | Type `Same text`, click "Save note", wait for it to finish, type `Same text` again and click "Save note" again | `Same text` appears twice in the list: two deliberate saves are both stored (edge case, the fix does not detect duplicate text) | [ ] Pass [ ] Fail |
| 18 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run includes the double-submit, disabled-while-saving and retry-after-failure tests and reports `0 failed` | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. A second submit while the first save is in flight sends one POST and stores one note | 1 to 7, 18 |
| 2. The save button is disabled while a save is in flight and enabled again after | 8 to 10, 18 |
| 3. After a failed save the guard is released; TEST-03 behaviours unchanged | 11 to 16, 18 |
| Edge case: two deliberate saves of the same text both store | 17 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 18 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
