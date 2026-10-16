# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites
- The stack is running with `docker compose up` (frontend on http://localhost:5183, backend on http://localhost:8010).
- A desktop browser with DevTools open on the Network tab.
- For Criteria 1 and 2, network throttling set to "Slow 3G" so a save stays pending long enough to click twice.
- Use text values unique to this run, or accept that earlier runs may leave the same text in the list.

## Criterion 1: a fast double submit stores the note once

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Navigate to http://localhost:5183/ | The "Task Notes" page shows the "New note" field, the "Save note" button and the notes list | [ ] | [ ] |
| 1.2 | Type `Double click check 1` in the "New note" field | The text appears in the field | [ ] | [ ] |
| 1.3 | Double click "Save note" quickly | The Network tab shows exactly one POST request to /api/notes | [ ] | [ ] |
| 1.4 | Wait for that request to finish | The list shows `Double click check 1` exactly once and the field is empty | [ ] | [ ] |
| 1.5 | Reload the page | The list still shows `Double click check 1` exactly once (one row was stored, not two) | [ ] | [ ] |
| 1.6 | Type `Enter key check 1`, click into the field and press Enter twice quickly | The Network tab shows one POST to /api/notes, and after it finishes the list shows `Enter key check 1` exactly once | [ ] | [ ] |

## Criterion 2: the button is disabled while a save is pending and enabled after success

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Navigate to http://localhost:5183/ | "Save note" is enabled | [ ] | [ ] |
| 2.2 | Type `Pending state check` and click "Save note" once | While the POST is pending, "Save note" is visibly dimmed, shows a not-allowed cursor on hover, and clicking it does nothing (no second POST in the Network tab) | [ ] | [ ] |
| 2.3 | Wait for the request to finish | `Pending state check` is in the list, the field is empty, and "Save note" is enabled again | [ ] | [ ] |
| 2.4 | Type `Second note` and click "Save note" (edge case: a different note after a completed save) | One more POST is sent and `Second note` appears once in the list | [ ] | [ ] |

## Criterion 3: a failed save re-enables the button and a retry sends one request

Throttling off for this criterion.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Navigate to http://localhost:5183/ and wait for the page to load | The form is shown | [ ] | [ ] |
| 3.2 | Stop the backend with `docker compose stop backend` from the repository root | The page stays open | [ ] | [ ] |
| 3.3 | Type `Retry check` and click "Save note" | The message "The note could not be saved. Please try again." appears, the field still holds `Retry check`, and "Save note" is enabled | [ ] | [ ] |
| 3.4 | Start the backend with `docker compose start backend` and wait until http://localhost:8010/api/health answers | The health endpoint responds | [ ] | [ ] |
| 3.5 | Click "Save note" once | The Network tab shows exactly one new POST to /api/notes, `Retry check` appears once in the list, the error message is gone, and the field is empty | [ ] | [ ] |

## Automated check for all three criteria

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| A.1 | From the repository root run `npm --prefix frontend test` | The run includes frontend/src/components/NoteForm.test.tsx, including the test "sends one save request when the form is submitted twice while the first save is pending", and reports 0 failed | [ ] | [ ] |
| A.2 | With the stack running, run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` from the repository root | 0 failed | [ ] | [ ] |

## Summary

| Section | Steps | Passed | Failed |
|---------|-------|--------|--------|
| Criterion 1 | 6 | | |
| Criterion 2 | 4 | | |
| Criterion 3 | 5 | | |
| Automated check | 2 | | |

Tester: ____________  Date: ____________  Overall result: [ ] Pass  [ ] Fail
