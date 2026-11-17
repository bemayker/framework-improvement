# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Backend (port 8010), database and frontend (port 5183) running.
- Repository checked out on branch `feature/BUG-04-double-submit-note` (or `main` once merged).
- Browser dev tools open on the **Network** tab, filtered on `notes`. The request counts below are only observable there.

## Test Environment Setup

1. Start the database, backend and frontend as described in `docs/DEVELOPMENT.md`.
2. Open `http://localhost:5183/`. Notes from earlier runs may already be listed; every step is about the note you add.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the note list | [ ] Pass [ ] Fail |
| 2 | Type `Double click check 1` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The Network tab shows exactly one `POST /api/notes` with status 201; the field empties; "Double click check 1" appears once in the list | [ ] Pass [ ] Fail |
| 4 | Reload the page | After the list loads, "Double click check 1" is listed exactly once | [ ] Pass [ ] Fail |
| 5 | In dev tools Network, set throttling to "Slow 3G", then reload the page | The page loads (slowly) | [ ] Pass [ ] Fail |
| 6 | Type `Slow save check` and click "Save note" once | The button turns greyed out (disabled, not-allowed cursor) while the request is pending | [ ] Pass [ ] Fail |
| 7 | While it is still greyed out, click the field and press Enter, then click the button again | Nothing happens; the Network tab still shows a single `POST /api/notes` | [ ] Pass [ ] Fail |
| 8 | Wait for the request to finish, then set throttling back to "No throttling" | "Slow save check" appears once in the list | [ ] Pass [ ] Fail |
| 9 | Type `First after fix` and click "Save note" | The note is listed and the button is enabled again (full colour, pointer cursor) | [ ] Pass [ ] Fail |
| 10 | Type `Second after fix` and click "Save note" | The note is listed below "First after fix"; one POST per note in the Network tab | [ ] Pass [ ] Fail |
| 11 | Stop the backend (or enable "Offline" in dev tools), type `Retry me`, click "Save note" | The red message "The note could not be saved. Please try again." appears, the field still reads `Retry me`, and the button is enabled | [ ] Pass [ ] Fail |
| 12 | Start the backend again (or disable "Offline") and click "Save note" | "Retry me" is listed once and the error message disappears | [ ] Pass [ ] Fail |
| 13 | Type `Enter twice check`, then press Enter twice in quick succession in the field | One `POST /api/notes` in the Network tab; "Enter twice check" is listed once | [ ] Pass [ ] Fail |
| 14 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run passes: no failed or errored test on its summary line, exit code 0 | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| Clicking "Save note" twice quickly sends a single `POST /api/notes`; the note is stored and listed once, also after reload | 2, 3, 4 |
| While a save is in progress the button is disabled and a second submit (click or Enter) is ignored | 5, 6, 7, 8 |
| Once the save finishes, successfully or not, the button is enabled again; the next note can be saved and a failed one retried | 9, 10, 11, 12, 14 |
| Edge case: pressing Enter twice quickly stores the note once | 13 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
