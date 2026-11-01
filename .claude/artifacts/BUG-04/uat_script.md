# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/BUG-04-double-submit-note` (or `main` once merged).
- The stack is running (`docker compose up`) and the app is open at `http://localhost:5183`.
- A browser with DevTools. Open the **Network** tab, filter it to `notes`, and for steps 1 to 6 set throttling to "Slow 3G" so a save stays pending long enough to click twice.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | On `/`, type `Double click check 1` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 2 | Double-click "Save note" quickly | The button turns greyed out (disabled) while the save is pending | [ ] Pass [ ] Fail |
| 3 | Look at the Network tab | Exactly one `POST /api/notes` request appears, answered 201 | [ ] Pass [ ] Fail |
| 4 | Clear the Network tab, type `Enter then click 1` in the field, press Enter and immediately click "Save note" | Again exactly one `POST /api/notes` request appears | [ ] Pass [ ] Fail |
| 5 | Type `Shows once 2` and double-click "Save note" | The button is disabled until the save completes, then the field clears | [ ] Pass [ ] Fail |
| 6 | Read the note list below the form, then reload the page (F5) and read it again | `Shows once 2` appears exactly once, before and after the reload, so only one note was stored | [ ] Pass [ ] Fail |
| 7 | Set throttling back to "No throttling". Type `First after fix 3` and click "Save note" once | The note appears in the list, the field clears, and "Save note" is enabled again | [ ] Pass [ ] Fail |
| 8 | Type `Second after fix 3` and click "Save note" | This note also appears in the list, once | [ ] Pass [ ] Fail |
| 9 | Stop the backend (`docker compose stop backend`), type `Fails then retries 3`, click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field, and "Save note" is enabled again | [ ] Pass [ ] Fail |
| 10 | Start the backend (`docker compose start backend`), wait a few seconds, click "Save note" again | The note `Fails then retries 3` appears in the list and the error message disappears | [ ] Pass [ ] Fail |
| 11 | From the repository root, run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | `0 failed` for NoteForm.test.tsx | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| A quick double submit sends exactly one create request | 1, 2, 3, 4 |
| After a quick double submit the note appears exactly once in the list | 5, 6 |
| After the pending save finishes, successfully or not, the form accepts the next submission | 7, 8, 9, 10, 11 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
