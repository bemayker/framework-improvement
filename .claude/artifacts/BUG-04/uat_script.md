# UAT Script: BUG-04 Saving a note twice quickly stores it twice

Verifies that a second submit while a save is in flight does not store the note again, and that the form accepts a new submission once a save has finished, whether it succeeded or failed.

## Prerequisites

- The stack is running: backend on http://localhost:8010, frontend on http://localhost:5183.
- Branch `feature/BUG-04-double-submit-note` checked out (or, once merged, `main`).
- A browser with devtools open on the Network tab, filtered to `notes`.
- Criterion 2, failure path only: you can stop and start the backend container.
- Reading the Network tab: the dev server may run mount effects twice in development, so count only the `POST /api/notes` requests triggered by your clicks, not `GET /api/notes`.

## Steps

### Criterion 1: Submitting a note twice in quick succession stores it exactly once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the current list of notes | [ ] Pass [ ] Fail |
| 2 | Type `BUG-04 double click check` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The button greys out (disabled) while saving, then the field clears | [ ] Pass [ ] Fail |
| 4 | Look at the note list | `BUG-04 double click check` appears exactly once | [ ] Pass [ ] Fail |
| 5 | Look at the Network tab | Exactly one `POST /api/notes` request from your double-click, status 201 | [ ] Pass [ ] Fail |
| 6 | Reload the page | `BUG-04 double click check` still appears exactly once | [ ] Pass [ ] Fail |
| 7 | Optional: in devtools set throttling to "Slow 3G", type `BUG-04 slow network check`, click "Save note" and press Enter in the field before the save finishes | One `POST /api/notes` is sent and the note appears once | [ ] Pass [ ] Fail |

### Criterion 2: Once a save has finished, the form accepts a new submission again

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | On `http://localhost:5183/`, type `BUG-04 first note` and click "Save note" | The note appears in the list and the button is enabled again | [ ] Pass [ ] Fail |
| 9 | Type `BUG-04 second note` and click "Save note" | It appears in the list below the first one | [ ] Pass [ ] Fail |
| 10 | Stop the backend container, type `BUG-04 offline note` and click "Save note" | The red message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again | [ ] Pass [ ] Fail |
| 11 | Start the backend again and click "Save note" | The message clears, the field empties, and `BUG-04 offline note` appears once in the list | [ ] Pass [ ] Fail |
| 12 | Run `npm --prefix frontend test -- --run src/components/NoteForm.test.tsx` | The summary reports `0 failed`, including the duplicate-submit and re-enable tests | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 (step 7 optional) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
