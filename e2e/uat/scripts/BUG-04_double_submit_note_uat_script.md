# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- App stack running: frontend at `http://localhost:5183`, backend and database up.
- Browser DevTools open on the **Network** tab, filtered on `notes`.
- For steps 6 to 11, a way to throttle the network (DevTools network throttling "Slow 3G").

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" title, the "New note" field and the "Save note" button are visible, with any existing notes listed below | [ ] Pass [ ] Fail |
| 2 | Type `Double click check 1` in the "New note" field | The text shows in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as possible | The field clears and `Double click check 1` appears exactly once at the bottom of the list | [ ] Pass [ ] Fail |
| 4 | Look at the Network tab | Exactly one `POST /api/notes` request with status 201 was sent | [ ] Pass [ ] Fail |
| 5 | Reload the page | `Double click check 1` is still listed exactly once | [ ] Pass [ ] Fail |
| 6 | Set DevTools network throttling to "Slow 3G", reload, and type `Slow save check` in the "New note" field | The text shows in the field | [ ] Pass [ ] Fail |
| 7 | Click "Save note" once | The button turns greyed out (disabled) and the pointer shows a not-allowed cursor while the request is pending | [ ] Pass [ ] Fail |
| 8 | While it is still greyed out, click "Save note" again and press Enter in the field | Nothing further happens; the Network tab still shows exactly one `POST /api/notes` | [ ] Pass [ ] Fail |
| 9 | Wait for the request to finish | `Slow save check` appears exactly once in the list and the button is enabled again | [ ] Pass [ ] Fail |
| 10 | With throttling still on, type `Enter after click`, click "Save note", then immediately press Enter in the field | Exactly one `POST /api/notes` is sent and `Enter after click` appears exactly once once the save finishes | [ ] Pass [ ] Fail |
| 11 | Set throttling back to "No throttling" | Network behaves normally again | [ ] Pass [ ] Fail |
| 12 | Type `First after fix` and click "Save note" | It appears once in the list and the button is enabled | [ ] Pass [ ] Fail |
| 13 | Type `Second after fix` and click "Save note" | It also appears once in the list (a second, separate save still works) | [ ] Pass [ ] Fail |
| 14 | Failure path: in DevTools right-click the earlier `POST /api/notes` request and choose "Block request URL" (or stop the backend container), type `Failure check`, click "Save note" | The red message "The note could not be saved. Please try again." appears, `Failure check` stays in the field, and the button is enabled again | [ ] Pass [ ] Fail |
| 15 | Unblock the URL (or restart the backend) and click "Save note" again | `Failure check` is saved and appears once in the list; the error message disappears | [ ] Pass [ ] Fail |
| 16 | Automated check: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root | `0 failed` | [ ] Pass [ ] Fail |
