# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- The stack is running (backend on http://localhost:8010, frontend on http://localhost:5183) per `docs/DEVELOPMENT.md`.
- Chrome or Edge with DevTools available.
- Criterion 3 only: `npm` available to run the frontend unit tests from the repository root.

## Test Environment Setup

1. Start the stack as described in `docs/DEVELOPMENT.md`.
2. Open `http://localhost:5183/` in the browser and confirm the "Task Notes" page loads.

## Steps

### Criterion 1: A quick double submission sends one create request and stores one note

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" page with the "New note" field and the "Save note" button is shown | [ ] Pass [ ] Fail |
| 2 | Open DevTools, Network, filter on `notes`, and clear the log | The request list is empty | [ ] Pass [ ] Fail |
| 3 | Type `Double click check 1` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 4 | Double-click "Save note" as fast as you can | Exactly one `POST` to `/api/notes` with status 201 appears in the Network list, "Double click check 1" appears once in the note list, and the field is cleared | [ ] Pass [ ] Fail |
| 5 | Type `Double enter check 1` in the field, then press Enter twice quickly | Exactly one more `POST /api/notes` appears, and "Double enter check 1" appears once in the list | [ ] Pass [ ] Fail |
| 6 | Reload the page | "Double click check 1" and "Double enter check 1" each appear exactly once in the list | [ ] Pass [ ] Fail |

### Criterion 2: Save note is disabled while a save is in flight

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | In DevTools, Network, set throttling to "Slow 3G". On `http://localhost:5183/`, type `Slow save check` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 8 | Click "Save note" once | The button turns faded (reduced opacity) and the cursor over it shows "not allowed" while the request is pending | [ ] Pass [ ] Fail |
| 9 | While it is still pending, click "Save note" three more times | Nothing happens; the Network list still shows a single pending `POST /api/notes` | [ ] Pass [ ] Fail |
| 10 | Wait for the request to finish | "Slow save check" appears once in the list and the button returns to its normal look | [ ] Pass [ ] Fail |
| 11 | Set throttling back to "No throttling" | Throttling is off | [ ] Pass [ ] Fail |

### Criterion 3: After the save finishes the form accepts a new submission; a failure keeps the text and re-enables the button

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | On `http://localhost:5183/`, type `First after fix` and click "Save note" | "First after fix" appears in the list, the field is cleared and "Save note" is enabled | [ ] Pass [ ] Fail |
| 13 | Type `Second after fix` and click "Save note" | "Second after fix" also appears in the list (the form accepted a new save) | [ ] Pass [ ] Fail |
| 14 | In DevTools, Network, right-click any `/api/notes` request and choose "Block request URL", then type `Blocked save check` and click "Save note" | The message "The note could not be saved. Please try again." appears, the field still holds "Blocked save check", and "Save note" is enabled | [ ] Pass [ ] Fail |
| 15 | Unblock the URL (DevTools, Network request blocking, untick the entry) and click "Save note" again | "Blocked save check" appears once in the list and the error message is gone | [ ] Pass [ ] Fail |
| 16 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root | The run reports 0 failed for `src/components/NoteForm.test.tsx` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 16 (all required; steps 5 and 6 cover the Enter-twice edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
