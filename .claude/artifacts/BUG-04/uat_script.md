# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root if it does not exist yet (defaults are usable as-is).
- No other process bound to ports `5183` (frontend), `8010` (backend), or the database port the compose file publishes.
- Chrome with DevTools (F12), to throttle the network and watch requests in the **Network** tab. Steps 4 and 8 are only observable there.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (`db` reaches "healthy", and the `frontend` log shows the Vite dev server listening).
3. Notes from earlier runs stay in the database volume, so the list may already contain entries, including notes with the same text from an earlier pass. That is expected.
4. Pick a unique suffix for this pass, for example the current time as `HHMMSS`. Append it, after a space, to every note text you type below (`BUG-04 double click check 142530`), and use that full text wherever a step names a note. Counts such as "exactly once" refer to that full text.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in Chrome | The "Task Notes" page shows the "New note" field, the "Save note" button and the notes list | [ ] Pass [ ] Fail |
| 2 | Open DevTools (F12), go to the **Network** tab and set throttling to `Slow 3G` | The throttling dropdown reads "Slow 3G" | [ ] Pass [ ] Fail |
| 3 | Type `BUG-04 double click check` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 4 | Double-click the "Save note" button quickly | In the Network tab exactly one `notes` request with method `POST` appears | [ ] Pass [ ] Fail |
| 5 | Wait until that request completes | `BUG-04 double click check` appears once in the notes list and the field is empty | [ ] Pass [ ] Fail |
| 6 | Set throttling back to `No throttling` and reload the page (F5) | `BUG-04 double click check` appears exactly once in the list | [ ] Pass [ ] Fail |
| 7 | Open `http://localhost:8010/api/notes` in a new tab | The JSON array holds exactly one object whose `text` is `BUG-04 double click check` | [ ] Pass [ ] Fail |
| 8 | Back on `http://localhost:5183/`, set throttling to `Slow 3G`, type `BUG-04 disabled state` in the "New note" field and click "Save note" once | While the request is pending the button turns faded (reduced opacity) and the mouse pointer over it shows "not-allowed" | [ ] Pass [ ] Fail |
| 9 | Wait for the request to complete | The note appears in the list, the field is empty and the "Save note" button is back to full opacity and clickable | [ ] Pass [ ] Fail |
| 10 | In the Network tab switch throttling to `Offline`, type `BUG-04 offline retry` and click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field, and the "Save note" button is enabled again | [ ] Pass [ ] Fail |
| 11 | Switch throttling to `No throttling` and click "Save note" again | `BUG-04 offline retry` appears once in the list and the error message disappears | [ ] Pass [ ] Fail |
| 12 | Type `BUG-04 second note` and click "Save note" once with no throttling | `BUG-04 second note` is added to the list; the earlier notes are still listed once each | [ ] Pass [ ] Fail |
| 13 | From the repository root, run `npm --prefix frontend test -- NoteForm` | The NoteForm tests in `frontend/src/components/NoteForm.test.tsx` run with 0 failed | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| Clicking "Save note" twice before the first save has finished stores the note only once (one POST, one list item, one item after reload) | 3, 4, 5, 6, 7 |
| The button is disabled while a save is in progress and enabled again after success or failure | 8, 9, 10, 11, 13 |
| Edge case: a second, different note saves normally after the first | 12 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
