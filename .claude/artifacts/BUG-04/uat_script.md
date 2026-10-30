# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- The stack running locally (frontend at http://localhost:5183, backend reachable).
- Chrome or Edge with DevTools.
- Test texts not already in the list; if they are, use a new suffix such as `a2`.
- Steps 1 to 4 and 6 use network throttling `Slow 3G`; steps 5 and 8 to 11 use `No throttling`.

## Steps

### Criterion 1: Two quick submits send one POST, store one note, list it once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:5183/, open DevTools, Network tab, filter `notes`, set throttling to `Slow 3G` | The landing page shows the "New note" field, the "Save note" button and the note list | [ ] Pass [ ] Fail |
| 2 | Type `Buy milk BUG-04 a1` into the "New note" field | The text shows in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" quickly | The button turns greyed out (disabled) right after the first click; the Network panel shows exactly one `POST /api/notes` request | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | `Buy milk BUG-04 a1` appears once in the list, the field is empty, the button is enabled again | [ ] Pass [ ] Fail |
| 5 | Set throttling to `No throttling` and reload the page | `Buy milk BUG-04 a1` is listed exactly once | [ ] Pass [ ] Fail |
| 6 | Set throttling to `Slow 3G`, type `Call mum BUG-04 a1`, press Enter twice in the field (edge case) | One `POST /api/notes` in the Network panel; once finished, `Call mum BUG-04 a1` is listed once | [ ] Pass [ ] Fail |
| 7 | From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run ends with 0 failed, including the double-submit reproduction test | [ ] Pass [ ] Fail |

### Criterion 2: After the save settles the form accepts the next submit

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Set throttling to `No throttling`. Type `Walk dog BUG-04 a1` and click "Save note" once | It appears in the list and the field clears | [ ] Pass [ ] Fail |
| 9 | Type `Feed cat BUG-04 a1` and click "Save note" | A second `POST /api/notes` is sent and `Feed cat BUG-04 a1` appears below `Walk dog BUG-04 a1` | [ ] Pass [ ] Fail |
| 10 | Stop the backend (for example `docker compose stop backend`), type `Water plants BUG-04 a1` and click "Save note" | The red message "The note could not be saved. Please try again." appears, the text stays in the field and the button is enabled again | [ ] Pass [ ] Fail |
| 11 | Start the backend again (`docker compose start backend`) and click "Save note" | The message disappears and `Water plants BUG-04 a1` appears in the list once | [ ] Pass [ ] Fail |
| 12 | From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run ends with 0 failed, including the release-after-success and release-after-failure tests | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
