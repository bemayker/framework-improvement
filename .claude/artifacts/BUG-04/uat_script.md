# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites
- The app stack is running: frontend at http://localhost:5183, backend reachable at its configured API base URL.
- A desktop browser with DevTools (Network tab with throttling).
- No seeded records or credentials are needed. Use the note texts given below; leftover notes from earlier runs do not matter, but each text must appear only as often as stated.

## Criterion 1: Double-clicking Save note stores the note only once

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Open http://localhost:5183/ | The "Task Notes" page shows the "New note" field, the "Save note" button and the saved notes list | [ ] | [ ] |
| 1.2 | Open DevTools, Network tab, filter on `api/notes`, set throttling to "Slow 3G" | The throttling selector shows Slow 3G | [ ] | [ ] |
| 1.3 | Type `Double click check 1` in the New note field | The field shows the text | [ ] | [ ] |
| 1.4 | Double-click "Save note" as fast as possible | The Network tab shows exactly one POST request to /api/notes | [ ] | [ ] |
| 1.5 | Wait for the request to finish | `Double click check 1` appears exactly once in the saved notes list and the field is empty | [ ] | [ ] |
| 1.6 | Set throttling back to "No throttling" and reload the page | `Double click check 1` is still listed exactly once | [ ] | [ ] |

## Criterion 2: Save note is disabled while saving and enabled again after success or failure

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Set throttling to "Slow 3G", type `Disabled state check` in the New note field and click "Save note" once | While the POST is pending the button looks faded (reduced opacity) and clicking it again does nothing | [ ] | [ ] |
| 2.2 | Wait for the request to finish | `Disabled state check` is listed once, and the button is back to full opacity | [ ] | [ ] |
| 2.3 | Type `Second note after save` and click "Save note" | The note saves and is listed once (the button is usable again after success) | [ ] | [ ] |
| 2.4 | In the Network tab set throttling to "Offline", type `Offline retry check` and click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again | [ ] | [ ] |
| 2.5 | Set throttling back to "No throttling" and click "Save note" | The note saves, is listed once, the error message disappears and the field is empty | [ ] | [ ] |
| 2.6 | Run `npm --prefix frontend test -- NoteForm` from the repository root | frontend/src/components/NoteForm.test.tsx runs with 0 failed | [ ] | [ ] |

## Summary

| Criterion | Steps | Result (Pass / Fail) | Notes |
|-----------|-------|----------------------|-------|
| 1. Double-click stores the note once | 1.1 to 1.6 | | |
| 2. Disabled while saving, enabled after success or failure | 2.1 to 2.6 | | |

Overall result: [ ] Pass  [ ] Fail

Tester: ______________  Date: ______________
