# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, on `main`).
- The stack is running with `docker compose up --build`; the frontend is at `http://localhost:5183` and the backend and PostgreSQL are up.
- Browser dev tools open on the **Network** tab, filtered to `notes`. Throttling can be set to "Slow 3G" so a save stays pending long enough to click again.

## Steps

### Criterion 1: a quick second submit stores the note only once

Set throttling to "Slow 3G" first.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the note list | [ ] Pass [ ] Fail |
| 2 | Type `BUG-04 double click check` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Click "Save note" and immediately click it again, then also press Enter in the field while the request is pending | The button appears greyed out after the first click; the Network tab shows exactly one `POST /api/notes` | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | `BUG-04 double click check` appears once in the list and the field is empty | [ ] Pass [ ] Fail |
| 5 | Set throttling back to "No throttling" and reload the page | `BUG-04 double click check` is still listed exactly once | [ ] Pass [ ] Fail |

### Criterion 2: the button is disabled while saving and usable again afterwards

Set throttling to "Slow 3G" again.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | On `http://localhost:5183/`, type `BUG-04 first note` and click "Save note" | While the request is pending the button is greyed out, shows a not-allowed cursor and does not respond to clicks | [ ] Pass [ ] Fail |
| 7 | Wait for the save to finish | `BUG-04 first note` is listed, the field is empty and the button is enabled again | [ ] Pass [ ] Fail |
| 8 | Type `BUG-04 second note` and click "Save note" | After it finishes `BUG-04 second note` is listed as well (two new notes in total, one of each) | [ ] Pass [ ] Fail |
| 9 | In the Network tab, enable "Offline", type `BUG-04 failed save` and click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field and the button is enabled again | [ ] Pass [ ] Fail |
| 10 | Disable "Offline" and click "Save note" again | `BUG-04 failed save` is listed once and the error message disappears | [ ] Pass [ ] Fail |
| 11 | Edge case: with no throttling, save `BUG-04 same text`, wait until it is listed, then save `BUG-04 same text` again | The text is listed twice: two deliberate saves, one after the other, are two notes | [ ] Pass [ ] Fail |
| 12 | Run `npm --prefix frontend test -- NoteForm` | Vitest reports the NoteForm.test.tsx tests with 0 failed | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. A quick second submit sends one save request; the note is stored and listed once, also after reload | 1 to 5 |
| 2. The button is disabled while a save is in flight and the form accepts the next submit after success or failure | 6 to 10, 12 |
| Edge case: two deliberate saves of the same text stay allowed | 11 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
