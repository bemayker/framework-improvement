# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- The stack is running: frontend at http://localhost:5183, backend and PostgreSQL up.
- A browser with devtools; the Network tab open and filtered to `notes`.

## Test Environment Setup

1. Open `http://localhost:5183/` and confirm the "Task Notes" heading, the "New note" field and the "Save note" button are shown.
2. Note which notes are already listed, so new entries are easy to tell apart.

## Steps

### Criterion 1: Double-clicking "Save note" stores exactly one note

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Type `Double click check 1` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 2 | Double-click "Save note" as fast as possible | The field clears and `Double click check 1` appears once at the bottom of the list | [ ] Pass [ ] Fail |
| 3 | In the Network tab, count requests with method POST to `/api/notes` | Exactly one, status 201 | [ ] Pass [ ] Fail |
| 4 | Reload the page | `Double click check 1` is listed exactly once | [ ] Pass [ ] Fail |

### Criterion 2: "Save note" is disabled while a save is in flight

Set devtools Network throttling to "Slow 3G" so the save stays pending for a few seconds.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Type `Slow save check` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 6 | Click "Save note" once | The button turns greyed out and cannot be clicked; the POST to `/api/notes` shows as pending | [ ] Pass [ ] Fail |
| 7 | While it is pending, click "Save note" again, then click into the field and press Enter | Nothing new happens; the Network tab still shows a single POST to `/api/notes` | [ ] Pass [ ] Fail |
| 8 | Wait for the POST to complete | `Slow save check` appears once in the list | [ ] Pass [ ] Fail |
| 9 | Set throttling back to "No throttling" | Throttling is off | [ ] Pass [ ] Fail |

### Criterion 3: "Save note" is enabled again after the save finishes

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Type `First after fix` and click "Save note" | The note appears in the list, the field clears, and the button is no longer greyed out | [ ] Pass [ ] Fail |
| 11 | Type `Second after fix` and click "Save note" | It saves and appears once below `First after fix` | [ ] Pass [ ] Fail |
| 12 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The summary reports `0 failed` | [ ] Pass [ ] Fail |

### Edge case: a failed save re-enables the button and a retry stores one note

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | In devtools Network, enable "Offline". Type `Offline retry` and click "Save note" | The message "The note could not be saved. Please try again." appears, `Offline retry` stays in the field, and the button is enabled again | [ ] Pass [ ] Fail |
| 14 | Disable "Offline" and click "Save note" | The error message disappears and `Offline retry` appears once in the list | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
