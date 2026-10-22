# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- The stack is running: backend on port `8010`, frontend at `http://localhost:5183`, and the database it needs.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, once merged, on `main`).
- A browser with developer tools open on the **Network** tab, filtered to `notes`. Steps 5, 8, 12 and 14 count requests, which is only observable there.
- Network throttling available in the browser (Slow 3G) so a save stays in flight long enough to double-click.
- For step 16, a way to stop and start the backend, or the Network tab's "Offline" option.

## Test Environment Setup

1. Start the stack the way the project's `docs/DEVELOPMENT.md` describes, with the backend on `8010` and the frontend on `5183`.
2. Notes from earlier runs stay in the database, so the list may already contain entries. That is expected: every step below is about the notes you add.

## Steps

### Criterion 1: a quick double submit stores one note

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the note list | [ ] Pass [ ] Fail |
| 2 | In the Network tab, set throttling to "Slow 3G" | Later requests take a visible moment to answer | [ ] Pass [ ] Fail |
| 3 | Type `BUG-04 double click check` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 4 | Double-click "Save note" as fast as you can | The button turns greyed out and the cursor shows not-allowed while the save is running | [ ] Pass [ ] Fail |
| 5 | Wait for the list to update | `BUG-04 double click check` appears exactly once in the list, the field is empty, and the Network tab shows exactly one `POST` to `/api/notes` with status 201 | [ ] Pass [ ] Fail |
| 6 | Reload the page | `BUG-04 double click check` is still in the list exactly once | [ ] Pass [ ] Fail |
| 7 | Type `BUG-04 enter check` in the field, click "Save note" and immediately press Enter in the field | The Network tab shows one `POST` to `/api/notes` for it | [ ] Pass [ ] Fail |
| 8 | Wait for the list to update | `BUG-04 enter check` appears exactly once in the list | [ ] Pass [ ] Fail |
| 9 | Set throttling back to "No throttling" | Requests answer at normal speed again | [ ] Pass [ ] Fail |

### Criterion 2: the button is disabled while saving and usable again afterwards

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Set throttling to "Slow 3G". On `http://localhost:5183/`, type `BUG-04 same text` and click "Save note" once | The button is greyed out and cannot be clicked while the request is pending | [ ] Pass [ ] Fail |
| 11 | Wait for the note to appear | `BUG-04 same text` is in the list once and the button is dark and clickable again | [ ] Pass [ ] Fail |
| 12 | Type `BUG-04 same text` again and click "Save note" once | A second `POST` is sent and the list now shows `BUG-04 same text` twice, because a deliberate second save is still allowed | [ ] Pass [ ] Fail |
| 13 | Set throttling back to "No throttling" | Requests answer at normal speed again | [ ] Pass [ ] Fail |
| 14 | Stop the backend (or switch the Network tab to "Offline"), type `BUG-04 retry check` and click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is clickable again | [ ] Pass [ ] Fail |
| 15 | Start the backend again (or set the Network tab back to "No throttling") and click "Save note" | `BUG-04 retry check` appears once in the list and the error message disappears | [ ] Pass [ ] Fail |
| 16 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | `0 failed`, and the `NoteForm` double submit, disabled button and retry tests are listed as passed | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| Submitting the note form twice in quick succession sends exactly one `POST /api/notes` and stores exactly one note, shown once in the list | 3, 4, 5, 6 |
| Edge case: a click followed by Enter while the save is in flight also sends one `POST` | 7, 8 |
| While a save is in flight the button is disabled, and enabled again once it settles | 4, 10, 11 |
| After a success or a failure a later deliberate save still creates a note (same text again, retry after failure) | 12, 14, 15 |
| The component behaviour is covered by the unit tests | 16 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 16 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
