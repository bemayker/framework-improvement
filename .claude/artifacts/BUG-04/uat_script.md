# UAT Script: BUG-04 Saving a note twice quickly stores it twice

Every criterion has a UI, so the steps are a browser clickthrough, plus one test run. The fix guards one form in one browser tab. **Two separate tabs, or two users saving the same text, are out of scope** and not tested here: they are not this defect, and the server deliberately does not deduplicate (plan assumptions A1 and A2).

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or, once merged, on `main`).
- No other process bound to host ports `5183` (frontend) or `8010` (backend), the ports `docker-compose.yml` publishes.
- A browser with DevTools. Open the Network tab and filter it to `notes`.
- Step 6 only: Node dependencies installed (`npm --prefix frontend install`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` and `frontend` services report running.

## Steps

### Criterion 1: Two quick saves send one create request and store one note

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the current note list | [ ] Pass [ ] Fail |
| 2 | Enter `Double click check` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | Exactly one `POST /api/notes` row appears in the Network tab, and "Double click check" appears once in the note list | [ ] Pass [ ] Fail |
| 4 | Enter `Click then enter check`, click "Save note" and press Enter immediately after | One `POST /api/notes` row for it, and the note appears once in the list | [ ] Pass [ ] Fail |
| 5 | Reload the page | Each of the two notes appears exactly once | [ ] Pass [ ] Fail |
| 6 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run passes: its summary line reports no failed test and the command exits 0 | [ ] Pass [ ] Fail |

### Criterion 2: Save button disabled while a save is in flight

Prerequisite for steps 8 to 10: in DevTools Network set throttling to "Slow 3G" so the save takes a few seconds.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Navigate to `http://localhost:5183/` | The page loads and "Save note" is enabled | [ ] Pass [ ] Fail |
| 8 | Enter `Slow save check` and click "Save note" | While the request is pending the button appears dimmed and clicking it does nothing | [ ] Pass [ ] Fail |
| 9 | Wait for the request to finish | "Slow save check" appears once in the list and the field is cleared | [ ] Pass [ ] Fail |
| 10 | Look at the "Save note" button | It is enabled again | [ ] Pass [ ] Fail |
| 11 | Set throttling back to "No throttling" | Throttling is off | [ ] Pass [ ] Fail |

### Criterion 3: After a failed save one more Save sends exactly one new request

Prerequisite: the page at `http://localhost:5183/` is loaded; then stop the backend with `docker compose stop backend`.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Enter `Retry check` and click "Save note" | The red message "The note could not be saved. Please try again." appears, the text stays in the field, and "Save note" is enabled again | [ ] Pass [ ] Fail |
| 13 | Run `docker compose start backend`, then wait until `http://localhost:8010/api/health` answers | The health endpoint answers with status 200 | [ ] Pass [ ] Fail |
| 14 | Click "Save note" once | Exactly one new `POST /api/notes` row in the Network tab, "Retry check" appears once in the list, and the error message is gone | [ ] Pass [ ] Fail |

### Edge case: two deliberate saves of the same text store two notes

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 15 | Enter `Same text twice`, click "Save note" and wait until the note appears in the list | One `POST /api/notes` row and one "Same text twice" in the list | [ ] Pass [ ] Fail |
| 16 | Enter `Same text twice` again and click "Save note" once | A second `POST /api/notes` row, and "Same text twice" now appears twice in the list | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 16 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
