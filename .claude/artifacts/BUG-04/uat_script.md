# UAT Script: BUG-04 Saving a note twice quickly stores it once

Browser-based checks on the landing page, plus two test runs. To make the race easy to hit by hand, use the browser DevTools Network tab throttling.

## Prerequisites

- Repository checked out locally on branch `feature/BUG-04-double-submit-note` (or, once merged, on `main`).
- The stack is running: backend on its configured port, frontend at `http://localhost:5183`, PostgreSQL up.
- A browser with DevTools (Network tab, throttling menu).
- `npm` installed, for steps 6 and 12.

## Test Environment Setup

1. Open `http://localhost:5183/` in the browser and open DevTools, Network tab.
2. Set throttling to "Slow 3G" for Criterion 1 and Criterion 2.

## Steps

### Criterion 1: Submitting a note twice in quick succession stores it once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" landing page shows the "New note" field, the "Save note" button and the notes list | [ ] Pass [ ] Fail |
| 2 | Type `Buy milk BUG-04` into the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" quickly | The button greys out (disabled) straight after the first click; the Network tab shows exactly one POST request to `/api/notes` | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | Exactly one list item reading `Buy milk BUG-04` appears and the field is empty | [ ] Pass [ ] Fail |
| 5 | Switch throttling to "No throttling" and reload the page | The list still shows `Buy milk BUG-04` exactly once | [ ] Pass [ ] Fail |
| 6 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root | No failed or errored test on the summary line, exit code 0 | [ ] Pass [ ] Fail |

### Criterion 2: The button is disabled while saving and usable again afterwards

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | With "Slow 3G" on, type `Walk dog BUG-04` and click "Save note" once | While the request is pending the button is greyed out and a second click does nothing (no second POST in the Network tab) | [ ] Pass [ ] Fail |
| 8 | Wait for the request to finish | `Walk dog BUG-04` appears once, the field is empty and "Save note" is dark again (enabled) | [ ] Pass [ ] Fail |
| 9 | Type `Walk dog BUG-04` again and click "Save note" once (edge case: same text) | A second list item reading `Walk dog BUG-04` appears; the same text twice is allowed when submitted deliberately | [ ] Pass [ ] Fail |
| 10 | In DevTools Network set throttling to "Offline", type `Offline note BUG-04` and click "Save note" (edge case: failed save) | The message "The note could not be saved. Please try again." appears, the text stays in the field and "Save note" is enabled again | [ ] Pass [ ] Fail |
| 11 | Set throttling back to "No throttling" and click "Save note" | `Offline note BUG-04` is saved and appears once in the list, and the error message disappears | [ ] Pass [ ] Fail |
| 12 | Run `npm run e2e -- e2e/tests/BUG-04_double_submit_note.spec.ts` from the repository root with the stack running | No failed test on the summary line, exit code 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
