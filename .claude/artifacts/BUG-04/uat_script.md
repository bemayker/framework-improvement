# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- The backend, the database and the frontend are running: frontend at `http://localhost:5183`, backend at `http://localhost:8010`.
- Repository checked out on branch `feature/BUG-04-double-submit-note` (or later, on `main` once merged).
- Browser dev tools open on the **Network** tab, filtered to `notes`. Steps 4 and 8 count requests, which is only observable there.
- Notes from earlier runs may already be in the list. Every step below is about the note you add.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the current note list | [ ] Pass [ ] Fail |
| 2 | Type `Double click check 1` into the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double click "Save note" as fast as you can | The field clears and `Double click check 1` appears once at the bottom of the list | [ ] Pass [ ] Fail |
| 4 | In the Network tab, count the `POST` requests to `/api/notes` made by step 3 | Exactly one | [ ] Pass [ ] Fail |
| 5 | Reload the page | `Double click check 1` is still listed exactly once | [ ] Pass [ ] Fail |
| 6 | Optional slow-network variant: set throttling to "Slow 3G", type `Double click check 2`, click "Save note", then click it again before the field clears | The second click does nothing (the button is disabled while saving). After the save completes the note is listed once | [ ] Pass [ ] Fail |
| 7 | Remove the throttling, type `First after fix` and click "Save note" | The field clears and the note is listed | [ ] Pass [ ] Fail |
| 8 | Type `Second after fix` and click "Save note" | The field clears, `Second after fix` is listed below the first, the button is enabled again, and the Network tab shows one `POST` per save | [ ] Pass [ ] Fail |
| 9 | Stop the backend, type `Retry after failure` and click "Save note" | The red message "The note could not be saved. Please try again." appears and the field still holds `Retry after failure` | [ ] Pass [ ] Fail |
| 10 | Start the backend again and click "Save note" without retyping | The message disappears, the field clears and `Retry after failure` is listed once | [ ] Pass [ ] Fail |
| 11 | From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run reports `0 failed`, including `sends one save request when the form is submitted twice while saving`, `accepts a new note after the previous save has finished` and `lets the user retry after a failed save` | [ ] Pass [ ] Fail |
| 12 | Run the E2E spec `e2e/tests/BUG-04_double_submit_note.spec.ts` with the project's Playwright command against `http://localhost:5183` | The run reports `0 failed`, including `stores a double-clicked note only once` and `saves a second distinct note after a double-clicked save` | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. Clicking "Save note" twice in quick succession sends exactly one `POST /api/notes` and the note is stored and listed once | 2, 3, 4, 5, 6, 11, 12 |
| 2. After a save has finished, successfully or with an error, the form accepts the next submit again | 7, 8, 9, 10, 11 |
| Edge case: a second distinct note after a double-clicked save is stored normally | 12 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
