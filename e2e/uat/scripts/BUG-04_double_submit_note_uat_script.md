# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/BUG-04-double-submit-note` (or `main` once merged).
- Browser DevTools open on the **Network** tab, filtered to `notes`.
- Ports `5183` (frontend), `8010` (backend) free.

## Test Environment Setup

1. From the repository root, run `docker compose up --build`.
2. Wait until `db`, `backend` and `frontend` are started.
3. Earlier notes may remain in the list; every step is about the notes you add.

## Steps

### Criterion 1: a rapid double submit stores exactly one note

Set Network throttling to "Slow 3G" so the save stays in flight long enough to click twice.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183` | The "Task Notes" landing page shows the "New note" field and the "Save note" button | [ ] Pass [ ] Fail |
| 2 | Type `Buy milk BUG-04` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The button turns greyed out and unclickable while the save runs; the Network tab shows exactly one `POST /api/notes` | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | One "Buy milk BUG-04" item appears in the list, the field is empty and the button is active again | [ ] Pass [ ] Fail |
| 5 | Reload the page | The list shows "Buy milk BUG-04" exactly once | [ ] Pass [ ] Fail |
| 6 | Type `Walk dog BUG-04`, then press Enter twice quickly | Exactly one new `POST /api/notes`; after it finishes "Walk dog BUG-04" is listed once, also after a reload | [ ] Pass [ ] Fail |
| 7 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root | The run reports `0 failed` | [ ] Pass [ ] Fail |

### Criterion 2: the form accepts the next submit after the save finishes

Turn network throttling off.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Type `Call Anna BUG-04` and click "Save note" once | "Call Anna BUG-04" is listed and the "Save note" button is active again | [ ] Pass [ ] Fail |
| 9 | Type `Pay rent BUG-04` and click "Save note" | "Pay rent BUG-04" is listed below "Call Anna BUG-04"; both appear once | [ ] Pass [ ] Fail |
| 10 | Run `docker compose stop backend`, type `Water plants BUG-04` and click "Save note" | The red message "The note could not be saved. Please try again." appears, the field still holds `Water plants BUG-04`, and the button is active (not greyed out) | [ ] Pass [ ] Fail |
| 11 | Run `docker compose start backend`, wait until `http://localhost:8010/api/health` answers, then click "Save note" | The error message disappears, "Water plants BUG-04" is listed once and the field is empty | [ ] Pass [ ] Fail |
| 12 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root | The run reports `0 failed` | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| A second submit while a save is in flight sends no further request; one note stored and listed once | 3, 4, 5, 6, 7 |
| After the save finishes, successfully or with an error, the form accepts the next submit | 8, 9, 10, 11, 12 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
