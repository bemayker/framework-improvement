# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root if it does not exist yet (defaults are usable as-is).
- A way to see the app's network traffic: the browser dev tools **Network** tab (filter on `notes`). Steps 5, 7 and 9 verify that only one request is sent, which is only observable there.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started. The frontend is served at `http://localhost:5183`, the backend at `http://localhost:8010`.
3. Notes from earlier runs stay in the database volume, so the list may already contain entries. That is expected: every step below is about the note you add.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" landing page shows the "New note" field, the "Save note" button and the notes list | [ ] Pass [ ] Fail |
| 2 | Type `Double click check 1` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The field clears and `Double click check 1` appears in the list exactly once | [ ] Pass [ ] Fail |
| 4 | Reload the page and wait for the list to load | `Double click check 1` is in the list exactly once | [ ] Pass [ ] Fail |
| 5 | Optional, for a developer: with the Network tab open, repeat steps 2 and 3 with `Double click check 2` | Exactly one `POST /api/notes` with status 201 | [ ] Pass [ ] Fail |
| 6 | Open dev tools, set throttling to "Slow 3G", reload `http://localhost:5183/` and wait for the list to load | The form is shown and "Save note" is enabled | [ ] Pass [ ] Fail |
| 7 | Type `Slow save check` in the field and click "Save note" once | "Save note" turns dimmed and does not react to the pointer (disabled) while the request is pending | [ ] Pass [ ] Fail |
| 8 | While it is still dimmed, click "Save note" again, then click into the field and press Enter | Nothing happens; the Network tab shows one `POST /api/notes` only | [ ] Pass [ ] Fail |
| 9 | Wait for the request to finish, set throttling back to "No throttling" and reload | `Slow save check` is in the list exactly once | [ ] Pass [ ] Fail |
| 10 | Type `First after fix` and click "Save note" | The note appears in the list and "Save note" is enabled (not dimmed) again | [ ] Pass [ ] Fail |
| 11 | Type `Second after fix` and click "Save note" | The second note appears below the first; both are in the list once | [ ] Pass [ ] Fail |
| 12 | Stop the backend (`docker compose stop backend`), type `Retry after failure` and click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field, and "Save note" is enabled again | [ ] Pass [ ] Fail |
| 13 | Start the backend again (`docker compose start backend`), wait a few seconds, click "Save note" | The message disappears, the field clears and `Retry after failure` appears in the list once | [ ] Pass [ ] Fail |
| 14 | Edge case: type `Enter after click` and click "Save note", then immediately press Enter in the field | `Enter after click` appears in the list exactly once | [ ] Pass [ ] Fail |
| 15 | In a separate terminal, run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | 0 failed | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| Clicking "Save note" twice in quick succession stores the note once (shown once, once after reload) | 2, 3, 4, 5 |
| While a save is in progress the button is disabled and a further submit sends no second request | 6, 7, 8, 9, 15 |
| Once the save completes or fails the button is enabled again, so a next note or a retry can be saved | 10, 11, 12, 13, 15 |
| Edge case: Enter pressed right after a click stores the note once | 14 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
