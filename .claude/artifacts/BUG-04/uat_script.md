# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, once merged, on `main`).
- Chrome with DevTools open on the **Network** tab: steps 4, 7 and 12 count the `POST` requests, which is only observable there.
- The frontend is served at `http://localhost:5183` and the backend at `http://localhost:8010`.

## Test Environment Setup

1. From the repository root, run `docker compose up --build`.
2. Wait until the `db`, `backend` and `frontend` services report as started.
3. Notes from earlier runs may already be listed. That is expected: every step below is about the note you add, and each uses a unique text.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the saved-notes list | [ ] Pass [ ] Fail |
| 2 | In DevTools Network, set throttling to `Slow 3G` | Requests from the page now take several seconds | [ ] Pass [ ] Fail |
| 3 | Type `Double click check 1` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 4 | Double-click "Save note" quickly | In the Network tab exactly one `POST` to `notes` appears; the button looks dimmed while it is pending | [ ] Pass [ ] Fail |
| 5 | Wait for that request to finish | `Double click check 1` appears once in the list and the field is empty | [ ] Pass [ ] Fail |
| 6 | Set throttling back to `No throttling` and reload the page | `Double click check 1` is listed exactly once | [ ] Pass [ ] Fail |
| 7 | Set throttling to `Slow 3G`, type `Enter check 1`, and press Enter twice in the field | One `POST` is sent, and after it finishes `Enter check 1` is listed once | [ ] Pass [ ] Fail |
| 8 | Still on `Slow 3G`, type `Disabled check 2` and click "Save note" once | While the request is pending the button is dimmed (reduced opacity), the cursor over it shows "not allowed", and clicking it does nothing | [ ] Pass [ ] Fail |
| 9 | Wait for the request to finish | `Disabled check 2` appears in the list, and the button returns to its normal dark style and accepts clicks again | [ ] Pass [ ] Fail |
| 10 | Set throttling back to `No throttling`. In a terminal run `docker compose stop backend` | The backend is stopped | [ ] Pass [ ] Fail |
| 11 | In the page, type `Retry check 3` and click "Save note" | The message "The note could not be saved. Please try again." appears below the field, the field still holds `Retry check 3`, and the button is enabled | [ ] Pass [ ] Fail |
| 12 | Run `docker compose start backend` and wait until `http://localhost:8010/api/health` answers. Click "Save note" again | A new `POST` to `notes` is sent, `Retry check 3` appears once in the list, the error message disappears and the field is empty | [ ] Pass [ ] Fail |
| 13 | In a separate terminal, run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | `0 failed` across the NoteForm tests, including the double-submit reproduction | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| A second submit while the first save is in flight sends no second `POST`; the note is stored and listed once | 3, 4, 5, 6 |
| Edge case: Enter pressed twice while saving sends one `POST` | 7 |
| The "Save note" button is disabled while a save is in flight and enabled again after success | 8, 9 |
| After a failed save the button is re-enabled, the error and text stay, and a resubmit sends a new request | 11, 12 |
| Automated check of all three criteria | 13 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
