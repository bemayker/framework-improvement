# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, once merged, on `main`).
- No other process bound to ports `5183` (frontend), `8000` (backend) or `5432` (PostgreSQL).
- Browser developer tools open on the **Network** tab, filtered to `notes`. The number of `POST /api/notes` requests is only observable there.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d
   ```
2. Wait until the `db`, `backend` and `frontend` services are running.
3. Notes from earlier runs stay in the database volume, so the list may already hold entries. Every step below is about the notes you add.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" heading, the "New note" field and the "Save note" button are shown; the Network tab shows one `GET /api/notes` | [ ] Pass [ ] Fail |
| 2 | Type `BUG-04 double click 1` in the "New note" field | The text is shown in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The field clears and `BUG-04 double click 1` appears once at the end of the note list; the Network tab shows exactly one `POST /api/notes` with status 201 | [ ] Pass [ ] Fail |
| 4 | Type `BUG-04 double enter 1` in the "New note" field, then press Enter twice quickly | `BUG-04 double enter 1` appears once in the list; the Network tab shows one more `POST /api/notes`, not two | [ ] Pass [ ] Fail |
| 5 | Reload the page | `BUG-04 double click 1` and `BUG-04 double enter 1` are each listed exactly once | [ ] Pass [ ] Fail |
| 6 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repo root | The run passes: its summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 7 | Type `BUG-04 after success A` and click "Save note" once | The note appears in the list and the field clears | [ ] Pass [ ] Fail |
| 8 | Type `BUG-04 after success B` and click "Save note" once | `BUG-04 after success B` appears in the list; the button was not left disabled by the first save | [ ] Pass [ ] Fail |
| 9 | In the Network tab set throttling to "Slow 3G", type `BUG-04 slow save` and click "Save note" once | While the request is pending the "Save note" button is disabled and a second click does nothing; when it completes the note appears once and the button is enabled again. Set throttling back to "No throttling" | [ ] Pass [ ] Fail |
| 10 | Run `docker compose stop backend` at the repo root, type `BUG-04 retry` and click "Save note" | The message "The note could not be saved. Please try again." appears, the field still holds `BUG-04 retry`, and the "Save note" button is enabled | [ ] Pass [ ] Fail |
| 11 | Run `docker compose start backend`, wait until `docker compose ps backend` shows it running, then click "Save note" again | The error message disappears and `BUG-04 retry` appears once in the list | [ ] Pass [ ] Fail |
| 12 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repo root | The run passes: no failed or errored test on its summary line, exit code 0 | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. Submitting the form twice in quick succession (double-click, or Enter twice) sends one save request and the note appears once, also after reload | 1, 2, 3, 4, 5, 6 |
| 2. Once a save has completed or failed, the form accepts the next save | 7, 8, 9, 10, 11, 12 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
