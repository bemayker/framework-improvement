# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, once merged, on `main`).
- The stack is running: backend and database up, frontend at `http://localhost:5183`.
- A Chromium-based browser with DevTools. Steps 2 to 4 use the **Network** tab and its throttling selector, because the double click only lands inside the save when the save is slow.
- Notes from earlier runs may already be in the list. That is expected: every step is about the note you add.

## Test Environment Setup

1. Start the stack as for any local run (for example `docker compose up --build`) and wait until the frontend answers on `http://localhost:5183`.
2. Open `http://localhost:5183/` in the browser and open DevTools on the **Network** tab.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the notes list | [ ] Pass [ ] Fail |
| 2 | In DevTools Network, set throttling to "Slow 3G" | A save now takes a couple of seconds | [ ] Pass [ ] Fail |
| 3 | Type `BUG-04 double click check` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 4 | Double-click "Save note" quickly | The Network tab shows exactly one `POST /api/notes` request | [ ] Pass [ ] Fail |
| 5 | Wait for that request to finish | `BUG-04 double click check` appears exactly once in the list and the field is empty | [ ] Pass [ ] Fail |
| 6 | Set throttling back to "No throttling" and reload the page | `BUG-04 double click check` is listed exactly once | [ ] Pass [ ] Fail |
| 7 | Set throttling to "Slow 3G", type `BUG-04 enter check` in the "New note" field and press Enter | One `POST /api/notes` appears in the Network tab, still pending | [ ] Pass [ ] Fail |
| 8 | While it is pending, click into the field and press Enter twice more | No further `POST /api/notes` request appears | [ ] Pass [ ] Fail |
| 9 | Wait for the request to finish, reset throttling and reload | `BUG-04 enter check` is listed exactly once | [ ] Pass [ ] Fail |
| 10 | Set throttling to "Slow 3G", type `BUG-04 disabled check` and click "Save note" | While the request is pending the button is greyed out (dimmed) and shows a not-allowed cursor on hover | [ ] Pass [ ] Fail |
| 11 | Wait for the request to finish | The button is back to its normal dark style and the note is in the list | [ ] Pass [ ] Fail |
| 12 | Reset throttling. Stop the backend container (or enable "Offline" in the Network tab), type `BUG-04 retry check` and click "Save note" | The message "The note could not be saved. Please try again." appears, `BUG-04 retry check` is still in the field, and the button is enabled | [ ] Pass [ ] Fail |
| 13 | Start the backend again (or disable "Offline") and click "Save note" | `BUG-04 retry check` appears exactly once in the list and the field is empty | [ ] Pass [ ] Fail |
| 14 | Run `npm --prefix frontend test` from the repository root | The run passes: no failed or errored test in the summary, including the new tests in `frontend/src/components/NoteForm.test.tsx`, and the command exits 0 | [ ] Pass [ ] Fail |
| 15 | With the stack running, run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` from the repository root | The tests in the file pass: the summary line reports no failed or errored test, and the command exits 0. | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| Clicking "Save note" twice while the first save is in flight sends exactly one `POST /api/notes`, and the note is stored and shown once, also after a reload | 3, 4, 5, 6, 15 |
| Submitting the form again by keyboard (Enter) while a save is in flight sends no second request | 7, 8, 9, 14 |
| While a save is in flight the button is disabled, and it is enabled again once the save finishes, whether it succeeded or failed, so a failed save can be retried | 10, 11, 12, 13, 14 |
| Edge case: a failed save retried through the re-enabled button stores the note once | 12, 13, 15 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
