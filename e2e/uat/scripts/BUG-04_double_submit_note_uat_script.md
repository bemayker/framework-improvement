# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, on `main`).
- `.env` present in the repository root (copy `.env.example`; defaults are usable).
- The app is served at `http://localhost:5183` (frontend) with the backend reachable behind it.
- Chrome with DevTools open on the **Network** tab, filtered to `notes`. Steps that count requests are only observable there.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d
   ```
2. Wait until the `db`, `backend` and `frontend` services are up.
3. Notes from earlier runs may already be in the list. Every step below is about the note you add.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" heading, the "New note" field and the "Save note" button are shown | [ ] Pass [ ] Fail |
| 2 | Type `Double click check 1` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" rapidly | The field clears and `Double click check 1` appears exactly once in the list; the Network tab shows exactly one `POST` to `/api/notes` with status 201 | [ ] Pass [ ] Fail |
| 4 | Reload the page | `Double click check 1` is listed exactly once | [ ] Pass [ ] Fail |
| 5 | Click in the "New note" field and type `Enter twice check 1` | The text appears in the field | [ ] Pass [ ] Fail |
| 6 | Press Enter twice in quick succession | The field clears and `Enter twice check 1` appears exactly once in the list; the Network tab shows exactly one `POST` to `/api/notes` | [ ] Pass [ ] Fail |
| 7 | Reload the page | `Enter twice check 1` is listed exactly once | [ ] Pass [ ] Fail |
| 8 | In DevTools Network, set throttling to "Slow 3G". Type `Slow save check 1` and click "Save note" once, then click it again while the request is pending | While the request is pending the "Save note" button appears faded and the second click does nothing (still one `POST` in the Network tab) | [ ] Pass [ ] Fail |
| 9 | Wait for the request to finish, then set throttling back to "No throttling" | `Slow save check 1` appears once and the button returns to full opacity | [ ] Pass [ ] Fail |
| 10 | Type `Second note check 1` and click "Save note" | It is saved and listed; the list holds both notes, each once | [ ] Pass [ ] Fail |
| 11 | Stop the backend with `docker compose stop backend`. Type `Retry check 1` and click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field and the button is enabled again | [ ] Pass [ ] Fail |
| 12 | Start the backend with `docker compose start backend`, then click "Save note" again | The error message disappears and `Retry check 1` is listed exactly once | [ ] Pass [ ] Fail |
| 13 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root | `0 failed` for the NoteForm tests | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. Double-clicking "Save note" stores the note exactly once (one POST, one list item, one after reload) | 1, 2, 3, 4 |
| 2. Pressing Enter twice quickly stores the note exactly once | 5, 6, 7 |
| 3. Button disabled while saving; the form accepts the next submission after success or failure | 8, 9, 10, 11, 12, 13 |
| Edge case: a failed save can be retried and the note is stored once | 11, 12 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
