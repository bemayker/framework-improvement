# UAT Script, BUG-04: Saving a note twice quickly stores it twice

Both criteria are verified locally in a desktop browser with DevTools. Frontend at http://localhost:5183, backend on port 8010.

## Criterion 1: a double-click on "Save note" stores the note once

Prerequisites: the app stack is running (`docker compose up` from the repo root: frontend at http://localhost:5183, backend reachable from it, database up); a desktop browser with DevTools.

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Open http://localhost:5183/ | The "Task Notes" landing page shows the "New note" field, the "Save note" button and the notes list | [ ] | [ ] |
| 1.2 | Open DevTools, Network, filter on `notes` | The page's initial `GET /api/notes` is listed | [ ] | [ ] |
| 1.3 | Type `BUG-04 double click 1` in the "New note" field | The text shows in the field | [ ] | [ ] |
| 1.4 | Double-click "Save note" quickly | Exactly one `POST /api/notes` row appears in Network with status 201; the field clears; the list shows `BUG-04 double click 1` exactly once | [ ] | [ ] |
| 1.5 | Reload the page | The list still shows `BUG-04 double click 1` exactly once | [ ] | [ ] |
| 1.6 | Type `BUG-04 enter twice` in the field and press Enter twice quickly instead of double-clicking | One `POST /api/notes`, and `BUG-04 enter twice` is listed once | [ ] | [ ] |

## Criterion 2: no submission while a save is in flight, and the form recovers afterwards

Prerequisites: as for criterion 1; the repository's frontend dependencies installed for step 2.6.

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | On http://localhost:5183/, in DevTools, Network, set throttling to "Slow 3G" | The throttling selector shows Slow 3G | [ ] | [ ] |
| 2.2 | Type `BUG-04 slow save` in "New note" and click "Save note" once | While the `POST /api/notes` is pending, the "Save note" button is greyed out (reduced opacity, not-allowed cursor) and clicking it again sends no second request | [ ] | [ ] |
| 2.3 | Wait for the request to finish | The button returns to its normal look, the field is empty, and `BUG-04 slow save` is listed once | [ ] | [ ] |
| 2.4 | Set throttling to "Offline", type `BUG-04 retry after failure` and click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again | [ ] | [ ] |
| 2.5 | Set throttling back to "No throttling" and click "Save note" | The error message disappears, the field clears, and `BUG-04 retry after failure` is listed once | [ ] | [ ] |
| 2.6 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root | The run reports `0 failed` for `src/components/NoteForm.test.tsx` | [ ] | [ ] |

## Summary

| Criterion | Where | Result |
|---|---|---|
| 1. Double-click stores the note once | Local browser | [ ] Pass [ ] Fail |
| 2. No submission in flight; form recovers after success or failure | Local browser and Vitest | [ ] Pass [ ] Fail |

Tester: ____________  Date: ____________
