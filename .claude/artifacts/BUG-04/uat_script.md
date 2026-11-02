# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root if it does not exist yet (defaults are usable as-is).
- Browser dev tools available: the **Network** tab is used to count requests and to throttle the connection.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend` and `frontend` services have started. The frontend is served at `http://localhost:5183` and the backend at `http://localhost:8010`.
3. Notes from earlier runs stay in the database, so the list may already contain entries. Every step below is about the notes you add yourself.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/`. Open dev tools, Network tab, and filter on `api/notes` | The "Task Notes" heading, the "New note" field and the "Save note" button are visible | [ ] Pass [ ] Fail |
| 2 | Type `BUG-04 double click check` in the "New note" field | The text shows in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The field clears and `BUG-04 double click check` appears in the "Saved notes" list exactly once | [ ] Pass [ ] Fail |
| 4 | Look at the Network tab | Exactly one `POST /api/notes` with status 201 | [ ] Pass [ ] Fail |
| 5 | Reload the page | `BUG-04 double click check` is still listed exactly once | [ ] Pass [ ] Fail |
| 6 | In dev tools set throttling to "Slow 3G". Type `BUG-04 slow save` and click "Save note" once | The button turns faded (disabled) and clicking it again does nothing | [ ] Pass [ ] Fail |
| 7 | Wait for the request to finish | `BUG-04 slow save` appears once in the list, the field clears and "Save note" is back to full opacity | [ ] Pass [ ] Fail |
| 8 | Type `BUG-04 second note` and click "Save note" | It saves and appears once, below the first note | [ ] Pass [ ] Fail |
| 9 | Set throttling back to "No throttling". Stop the backend: `docker compose stop backend` | The page stays open | [ ] Pass [ ] Fail |
| 10 | Type `BUG-04 retry check` and click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field and "Save note" is enabled | [ ] Pass [ ] Fail |
| 11 | Start the backend again: `docker compose start backend`, and wait until `http://localhost:8010/health` answers | The health endpoint responds | [ ] Pass [ ] Fail |
| 12 | Click "Save note" once | The error disappears, the field clears and `BUG-04 retry check` appears in the list exactly once | [ ] Pass [ ] Fail |
| 13 | Type `BUG-04 same text`, click "Save note", wait for it to appear, then type the same text again and click "Save note" once more | `BUG-04 same text` is listed twice, and still twice after a reload (two deliberate saves are both kept) | [ ] Pass [ ] Fail |
| 14 | From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The NoteForm tests, including `does not send a second save while the first is still in flight`, report 0 failed | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| A quick double click on "Save note" stores exactly one note and the list shows it once | 2, 3, 4, 5, 14 |
| The button is disabled while a save is in progress and enabled again after it succeeds | 6, 7, 8, 14 |
| After a failed save the button is enabled again and a retry stores exactly one note | 9, 10, 11, 12, 14 |
| Edge case: two deliberate saves of the same text store two notes | 13 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
