# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- Backend running at `http://localhost:8010` with the database up, frontend running at `http://localhost:5183`.
- Browser developer tools available; steps 6 to 8 use the **Network** tab with throttling set to "Slow 3G" (Chrome) or an equivalent preset.
- For steps 13 and 14, the ability to stop and start the backend (process or container) while the frontend keeps running.
- Notes from earlier runs may already be in the list; every step is about the note you add.

## Steps

### Criterion 1: Clicking "Save note" twice in quick succession stores the note once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" title, the "New note" field and the "Save note" button are shown | [ ] Pass [ ] Fail |
| 2 | Type `BUG-04 double click check` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The field clears and `BUG-04 double click check` appears exactly once in the list below the form | [ ] Pass [ ] Fail |
| 4 | Reload the page | `BUG-04 double click check` is still listed exactly once | [ ] Pass [ ] Fail |

### Criterion 2: While a save is in flight, the button is disabled and a further submit sends no second request

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Open dev tools on the Network tab, set throttling to "Slow 3G", open `http://localhost:5183/` | The form is shown and "Save note" is enabled | [ ] Pass [ ] Fail |
| 6 | Type `BUG-04 slow save` in the "New note" field and click "Save note" once | While the request is pending the button is greyed out (reduced opacity) and the cursor over it shows "not allowed" | [ ] Pass [ ] Fail |
| 7 | While it is still pending, click "Save note" again, then click into the field and press Enter | Nothing happens; the Network tab shows exactly one `POST /api/notes` request for this note | [ ] Pass [ ] Fail |
| 8 | Wait for the request to finish | `BUG-04 slow save` appears once in the list | [ ] Pass [ ] Fail |

### Criterion 3: Once the save finishes, successfully or not, the button is enabled again

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Turn throttling off. Type `BUG-04 first note` and click "Save note" | The note appears in the list and the button is enabled again (full opacity) | [ ] Pass [ ] Fail |
| 10 | Type `BUG-04 second note` and click "Save note" | This second, different note is saved and appears below the first | [ ] Pass [ ] Fail |
| 11 | Stop the backend, type `BUG-04 retry note` and click "Save note" | The red message "The note could not be saved. Please try again." appears, the field still holds `BUG-04 retry note`, and the button is enabled | [ ] Pass [ ] Fail |
| 12 | Start the backend again and click "Save note" | The message disappears and `BUG-04 retry note` appears once in the list | [ ] Pass [ ] Fail |
| 13 | From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run passes: no failed test and the command exits 0 | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| Clicking "Save note" twice quickly stores the note once, and it appears once in the list | 2, 3, 4 |
| While a save is in flight, the button is disabled and a further submit sends no second request | 6, 7, 8 |
| Once the save finishes, successfully or not, the button is enabled again | 9, 10, 11, 12, 13 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
