# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- The app stack is running: frontend at `http://localhost:5183`, backend and database up.
- Chrome with DevTools (Network tab) to observe requests and throttle the connection.
- Note how many notes the list holds before you start.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183`, open DevTools, Network tab, set throttling to "Slow 3G" | The page shows the "New note" field and the "Save note" button | [ ] Pass [ ] Fail |
| 2 | Type `Double click test` into the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The Network tab lists exactly one POST to `/api/notes` | [ ] Pass [ ] Fail |
| 4 | Wait for the request to finish | Exactly one `Double click test` entry is added to the list and the field is empty | [ ] Pass [ ] Fail |
| 5 | Type `Double enter test`, keep focus in the field and press Enter twice quickly | Exactly one POST to `/api/notes` is listed, and one `Double enter test` entry appears once it finishes | [ ] Pass [ ] Fail |
| 6 | Set throttling to "No throttling" and reload the page | The list shows each of `Double click test` and `Double enter test` exactly once | [ ] Pass [ ] Fail |
| 7 | Set throttling to "Slow 3G", type `Disabled state test` into the field | The "Save note" button looks enabled | [ ] Pass [ ] Fail |
| 8 | Click "Save note" once | The button turns faded, clicking it again does nothing, and in the Elements panel the `note-submit` button carries the `disabled` attribute | [ ] Pass [ ] Fail |
| 9 | Wait for the request to finish | `Disabled state test` appears in the list, and the button returns to its normal look and is clickable | [ ] Pass [ ] Fail |
| 10 | Set throttling to "No throttling", then stop the backend (`docker compose stop backend` from the repository root) | The page stays open | [ ] Pass [ ] Fail |
| 11 | Type `Retry after failure` into the field and click "Save note" | The red message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled | [ ] Pass [ ] Fail |
| 12 | Start the backend again (`docker compose start backend`) and wait until it answers | The backend responds again | [ ] Pass [ ] Fail |
| 13 | Click "Save note" once | The error message disappears, `Retry after failure` appears once in the list, and the field is empty | [ ] Pass [ ] Fail |
| 14 | With the field empty, click "Save note" (edge case) | The validation message appears, no request to `/api/notes` is sent, and the button stays enabled | [ ] Pass [ ] Fail |
| 15 | From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run passes: no failed or errored test and exit code 0 | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. A second submit while the first save is in flight sends no second request; one note stored and listed | 2, 3, 4, 5, 6, 15 |
| 2. The "Save note" button is disabled while a save is in flight and enabled again after | 7, 8, 9, 15 |
| 3. The guard is released after a failed save, so the user can submit again | 10, 11, 12, 13, 15 |
| Edge case: an empty note is still refused | 14 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
