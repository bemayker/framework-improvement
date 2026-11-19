# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running; backend published on `http://localhost:8010` and frontend on `http://localhost:5183` (from `docker-compose.yml`).
- Repository checked out locally on branch `feature/BUG-04-double-submit-note` (or, once merged, on `main`).
- A browser with devtools; the Network tab open and filtered on `notes`.
- A terminal with `npm` installed (criterion 2, step 10).

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Run `docker compose ps` until the `backend` and `frontend` services report running.

## Steps

### Criterion 1: Double-clicking "Save note" stores the note exactly once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" title, the "New note" field and the "Save note" button are visible; the Network tab shows one `GET /api/notes` | [ ] Pass [ ] Fail |
| 2 | Enter `Double click check 1` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" quickly | Exactly one `POST /api/notes` row appears (status 201), the field clears, and `Double click check 1` appears once in the list | [ ] Pass [ ] Fail |
| 4 | Reload the page | `Double click check 1` appears exactly once in the list | [ ] Pass [ ] Fail |
| 5 | Set devtools throttling to "Slow 3G", repeat steps 2 to 4 with `Double click check 2` | Still one `POST /api/notes` and one list entry | [ ] Pass [ ] Fail |

### Criterion 2: While a save is in flight the button is disabled and further submits send nothing

Keep devtools throttling on "Slow 3G" so the save stays in flight for a few seconds.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Navigate to `http://localhost:5183/` | The form is visible and "Save note" is enabled | [ ] Pass [ ] Fail |
| 7 | Enter `In flight check` and click "Save note" once | The button turns greyed out (disabled, not-allowed cursor) while the `POST /api/notes` row is pending | [ ] Pass [ ] Fail |
| 8 | While it is still pending, click "Save note" again and press Enter in the field | Nothing happens; the Network tab still shows a single `POST /api/notes` | [ ] Pass [ ] Fail |
| 9 | Wait for the POST to finish | `In flight check` appears once in the list | [ ] Pass [ ] Fail |
| 10 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run passes: no failed or errored test on its summary line, exit code 0 | [ ] Pass [ ] Fail |

### Criterion 3: After the save finishes the button is enabled again

Turn devtools throttling back to "No throttling".

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Navigate to `http://localhost:5183/`, enter `First after fix`, click "Save note" | The note appears in the list and "Save note" is enabled again (normal colour, pointer cursor) | [ ] Pass [ ] Fail |
| 12 | Enter `Second after fix`, click "Save note" | It is saved and appears below `First after fix` | [ ] Pass [ ] Fail |
| 13 | Run `docker compose stop backend`, enter `Fails to save`, click "Save note" | "The note could not be saved. Please try again." appears, the text stays in the field, and "Save note" is enabled again | [ ] Pass [ ] Fail |
| 14 | Run `docker compose start backend`, wait a few seconds, click "Save note" | `Fails to save` is saved once and appears in the list | [ ] Pass [ ] Fail |

### Edge case: a second distinct note can be saved after the first completes

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 15 | Save `First distinct note`, then `Second distinct note`, each with a single click | Both appear once each in the list and "Save note" is enabled after each save | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
