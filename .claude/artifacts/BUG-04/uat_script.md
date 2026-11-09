# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- The stack is running (frontend at `http://localhost:5183`, backend at `http://localhost:8010`), on branch `feature/BUG-04-double-submit-note` (or later, once merged, on `main`).
- Chrome DevTools open on the **Network** tab, with throttling set to "Slow 3G" for Criteria 1 and 2 so a save stays pending long enough to submit twice. The request count is only observable there.
- Docker Compose available for steps 12 and 13 (stopping and starting the backend).
- Notes from earlier runs may already be in the list. That is expected: every step is about the note you add.
- Pick a short suffix that is new for this run (for example the current time, `1432`) and write it in the Notes row of the Summary. Every note text below ends with `{suffix}`, so a repeat run on the same database never meets a note from an earlier run.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" heading, the "New note" field and the "Save note" button are shown | [ ] Pass [ ] Fail |
| 2 | Type `BUG-04 double click {suffix}` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" quickly | In the Network tab exactly one `POST` to `/api/notes` appears, and once it completes `BUG-04 double click {suffix}` appears in the note list exactly once | [ ] Pass [ ] Fail |
| 4 | Reload the page | `BUG-04 double click {suffix}` is still listed exactly once | [ ] Pass [ ] Fail |
| 5 | Type `BUG-04 enter key {suffix}` in the field, click "Save note", then immediately press Enter in the field | One `POST /api/notes` in the Network tab, and `BUG-04 enter key {suffix}` appears once in the list | [ ] Pass [ ] Fail |
| 6 | Open `http://localhost:8010/api/notes` in a new tab | The JSON array holds exactly one entry with text `BUG-04 double click {suffix}` and exactly one with `BUG-04 enter key {suffix}` | [ ] Pass [ ] Fail |
| 7 | Go back to `http://localhost:5183/` | The form is shown and "Save note" is enabled (dark background, pointer cursor) | [ ] Pass [ ] Fail |
| 8 | Type `BUG-04 disabled check {suffix}` and click "Save note" once | While the request is pending, the button is greyed (reduced opacity), hovering shows the not-allowed cursor, and clicking it again does nothing | [ ] Pass [ ] Fail |
| 9 | Wait for the request to complete | The note appears in the list and the button returns to its normal look | [ ] Pass [ ] Fail |
| 10 | Set throttling to "No throttling". Type `BUG-04 first {suffix}` and click "Save note" | The note appears and the field is empty | [ ] Pass [ ] Fail |
| 11 | Type `BUG-04 second {suffix}` and click "Save note" | The note is saved and listed once; the button is enabled again | [ ] Pass [ ] Fail |
| 12 | Stop the backend with `docker compose stop backend`, type `BUG-04 retry {suffix}` and click "Save note" | The message "The note could not be saved. Please try again." appears, the field still reads `BUG-04 retry {suffix}`, and "Save note" is enabled | [ ] Pass [ ] Fail |
| 13 | Start the backend with `docker compose start backend`, wait until `http://localhost:8010/api/health` answers, then click "Save note" once | One `POST /api/notes` in the Network tab, the error disappears, and `BUG-04 retry {suffix}` appears in the list once | [ ] Pass [ ] Fail |
| 14 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | `0 failed` for the NoteForm tests | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. A second submit while the first save is in flight sends exactly one `POST /api/notes` and stores the note once | 1 to 6 |
| 2. While a save is in flight the "Save note" button is disabled | 7 to 9 |
| 3. Once the save settles the form accepts a new submission; after a failure the text is kept and a retry sends one request | 10 to 14 |
| Edge case: Enter pressed right after a click | 5 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes (record the `{suffix}` used) | ___________________ |
