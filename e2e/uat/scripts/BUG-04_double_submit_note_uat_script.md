# UAT Script: BUG-04 Saving a note twice quickly stores it once

The acceptance criteria were derived from the item title (its description is empty), see the plan's Re-Plan Feedback.

## Prerequisites

- The app stack is running (`docker compose up -d` at the repository root) and the frontend is open at http://localhost:5183.
- The browser's developer tools are open on the Network tab, filtered to `notes`.
- Criterion 2 also needs the Network throttling dropdown (Slow 3G, Offline, No throttling).

## Steps

### Criterion 1: A quick double submit sends exactly one POST and stores the note once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" heading, the "New note" field and the "Save note" button are visible; the saved notes list shows any existing notes | [ ] Pass [ ] Fail |
| 2 | Click the "New note" field and type `Double click check 1` | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" as fast as you can | The field clears and `Double click check 1` appears exactly once at the bottom of the list | [ ] Pass [ ] Fail |
| 4 | Read the Network tab | Exactly one `POST` request to `/api/notes`, with status 201 | [ ] Pass [ ] Fail |
| 5 | Reload the page | `Double click check 1` is still listed exactly once | [ ] Pass [ ] Fail |
| 6 | Type `Enter key check 1` in the "New note" field, then press Enter twice in quick succession | `Enter key check 1` appears exactly once in the list, and the Network tab shows one more `POST /api/notes`, not two | [ ] Pass [ ] Fail |

### Criterion 2: Save button disabled while in flight, enabled again after success or failure

Set Network throttling to "Slow 3G" before step 8 so a save stays in flight long enough to see.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Navigate to `http://localhost:5183/` | The "Save note" button is enabled | [ ] Pass [ ] Fail |
| 8 | Type `Slow save check` in the "New note" field and click "Save note" once | While the request is pending the button is greyed out and does not respond to further clicks | [ ] Pass [ ] Fail |
| 9 | Wait for the save to finish | `Slow save check` appears once in the list, the field is empty and "Save note" is enabled again | [ ] Pass [ ] Fail |
| 10 | Set Network throttling to "Offline", type `Offline save check` and click "Save note" | The message "The note could not be saved. Please try again." appears, the field still holds `Offline save check`, and "Save note" is enabled again | [ ] Pass [ ] Fail |
| 11 | Set Network throttling back to "No throttling" and click "Save note" | `Offline save check` appears once in the list and the error message disappears | [ ] Pass [ ] Fail |
| 12 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root | `0 failed` for `src/components/NoteForm.test.tsx` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
