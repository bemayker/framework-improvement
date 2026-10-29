# UAT Script, BUG-04: Saving a note twice quickly stores it twice

Manual acceptance script. Mark Pass/Fail per step.

## Criterion 1: A rapid double submit sends one POST and stores one note shown once
Prerequisites: app stack running (`docker compose up`), frontend at http://localhost:5183, browser DevTools open on the Network tab with throttling set to "Slow 3G" so a save takes a few seconds.

| Step | Action | Expected result | Pass/Fail |
|---|---|---|---|
| 1 | Open `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the current list | |
| 2 | Type `BUG-04 double click` in the "New note" field | The text is in the field | |
| 3 | Double-click "Save note" quickly | The Network tab shows exactly one `POST /api/notes` request | |
| 4 | Wait for it to finish | `BUG-04 double click` appears once in the list and the field is empty | |
| 5 | Reload the page | `BUG-04 double click` is still listed exactly once | |
| 6 | Type `BUG-04 enter`, click "Save note", then immediately press Enter in the field | One `POST /api/notes` is sent and `BUG-04 enter` appears once | |

## Criterion 2: Button disabled while saving, enabled again after success
Prerequisites: as Criterion 1, "Slow 3G" throttling on.

| Step | Action | Expected result | Pass/Fail |
|---|---|---|---|
| 1 | Type `BUG-04 disabled` in the "New note" field and click "Save note" | While the request is pending the button is greyed out (reduced opacity, not-allowed cursor) and clicking it does nothing | |
| 2 | Wait for the note to appear in the list | "Save note" is back to full opacity and clickable | |
| 3 | Type `BUG-04 second` and click "Save note" | It saves and appears in the list | |
| 4 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The summary reports `0 failed` | |

## Criterion 3: After a failed save the form is usable again
Prerequisites: frontend running, backend stopped (`docker compose stop backend`) so the save fails.

| Step | Action | Expected result | Pass/Fail |
|---|---|---|---|
| 1 | Open `http://localhost:5183/`, type `BUG-04 retry` and click "Save note" | The message "The note could not be saved. Please try again." appears, the field still holds `BUG-04 retry`, and "Save note" is enabled | |
| 2 | Start the backend again (`docker compose start backend`) and click "Save note" | The error disappears and `BUG-04 retry` appears once in the list | |
