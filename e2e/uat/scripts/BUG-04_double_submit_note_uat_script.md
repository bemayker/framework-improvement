# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root if it does not exist yet (defaults are usable as-is for local UAT).
- No other process bound to ports `5183` (frontend) or `8010` (backend), the host ports `docker-compose.yml` publishes.
- A desktop browser with developer tools. The **Network** tab is how steps 2, 6 and 9 to 12 observe the requests, and its throttling menu is how steps 9 to 12 slow or cut the connection.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (`db` reaches "healthy", and the `frontend` log shows the Vite dev server listening).
3. Notes from earlier runs stay in the database volume, so the list may already contain entries. That is expected: every step below is about the note you add, not about the list being empty.

## Steps

### Criterion 1: Double-clicking "Save note" stores the note exactly once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in the browser | The "Task Notes" page shows the "New note" field, the "Save note" button and the list of saved notes | [ ] Pass [ ] Fail |
| 2 | Open the developer tools, Network tab, and type `api/notes` in its filter box | Only notes API requests are listed from now on | [ ] Pass [ ] Fail |
| 3 | Type `BUG-04 double click check` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 4 | Double-click "Save note" as fast as you can | The Network tab shows exactly one `POST` request to `/api/notes` with status 201, the field is cleared, and `BUG-04 double click check` appears exactly once in the list | [ ] Pass [ ] Fail |
| 5 | Reload the page | After the list loads, `BUG-04 double click check` is still listed exactly once | [ ] Pass [ ] Fail |
| 6 | Type `BUG-04 enter key check` in the field, click into it, and press Enter twice quickly | One new `POST /api/notes` (201) appears in the Network tab and the note is listed exactly once | [ ] Pass [ ] Fail |
| 7 | From the repository root, run `npm --prefix frontend test` | The summary line reports no failed test and the command exits 0 (this runs `frontend/src/components/NoteForm.test.tsx` among the others) | [ ] Pass [ ] Fail |

### Criterion 2: "Save note" is disabled while a save is in flight and enabled again afterwards

Before step 8, set the Network tab throttling to "Slow 3G" so a save takes a few seconds.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:5183/` again | The page loads (slowly) and the "Save note" button looks enabled (solid dark background, normal cursor) | [ ] Pass [ ] Fail |
| 9 | Type `BUG-04 slow save` in the "New note" field and click "Save note" once | The button turns faded (reduced opacity) and the cursor over it shows "not allowed"; clicking it again does nothing and no second `POST /api/notes` appears in the Network tab | [ ] Pass [ ] Fail |
| 10 | Wait for the request to finish | `BUG-04 slow save` appears once in the list, the field is cleared and the button is back to its solid, clickable look | [ ] Pass [ ] Fail |
| 11 | Type `BUG-04 second note` and click "Save note" | It is saved and listed, proving the button re-enabled after a success | [ ] Pass [ ] Fail |
| 12 | Set throttling to "Offline", type `BUG-04 offline save` and click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again | [ ] Pass [ ] Fail |
| 13 | Set throttling back to "No throttling" and click "Save note" | The note is saved once and listed, and the error message disappears | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. Double-clicking "Save note" (or submitting again while a save is in flight) stores the note exactly once: one `POST /api/notes`, one list entry, before and after a reload | 3, 4, 5, 6, 7 |
| 2. While a save is in flight the button is disabled, and it is enabled again once that save succeeds or fails | 9, 10, 11, 12, 13 |
| Edge case: a failed save re-enables the button so the note can be retried | 12, 13 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
