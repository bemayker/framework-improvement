# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- The stack is running: backend on its port and frontend at `http://localhost:5183`.
- Browser DevTools open on the Network tab, filtered to `api/notes`, with throttling set to "Slow 3G" so a save stays in flight for a few seconds.
- Criterion 3 failure step: the backend can be stopped (for example `docker compose stop backend` from the repo root) and restarted afterwards.

## Steps

### Criterion 1: A double submit while a save is in flight sends one request and stores the note once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the current list | [ ] Pass [ ] Fail |
| 2 | Type `Double click check 1` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" quickly | The Network tab shows exactly one POST request to `/api/notes` | [ ] Pass [ ] Fail |
| 4 | Wait for that request to finish | `Double click check 1` appears once in the list and the field is empty | [ ] Pass [ ] Fail |
| 5 | Reload the page | `Double click check 1` is still listed exactly once | [ ] Pass [ ] Fail |
| 6 | Type `Enter key check 1`, click "Save note", then immediately press Enter in the field (edge case) | One POST request to `/api/notes`, and the note is listed once | [ ] Pass [ ] Fail |

### Criterion 2: "Save note" is disabled while a save is in flight

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Navigate to `http://localhost:5183/` | The form is shown and "Save note" is enabled (full opacity, pointer cursor) | [ ] Pass [ ] Fail |
| 8 | Type `Disabled check 1` and click "Save note" | While the POST is pending, "Save note" is greyed out (reduced opacity), shows a not-allowed cursor on hover, and clicking it does nothing (no second POST in the Network tab) | [ ] Pass [ ] Fail |

### Criterion 3: "Save note" re-enables after success (input cleared) and after failure (error shown, text kept)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Navigate to `http://localhost:5183/`, type `Reenable check 1` and click "Save note" | Once the POST finishes, the note is listed, the field is empty and "Save note" is enabled again | [ ] Pass [ ] Fail |
| 10 | Type `Reenable check 2` and click "Save note" | A second note is saved, proving the form accepts a new save | [ ] Pass [ ] Fail |
| 11 | Stop the backend, type `Reenable check 3` and click "Save note" | The error "The note could not be saved. Please try again." appears, `Reenable check 3` is still in the field, and "Save note" is enabled | [ ] Pass [ ] Fail |
| 12 | Start the backend again and click "Save note" | The note is saved, listed once, and the error disappears | [ ] Pass [ ] Fail |
| 13 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repo root | The run passes: its summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
