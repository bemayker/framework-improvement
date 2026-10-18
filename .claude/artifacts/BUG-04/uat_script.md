# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- The app stack is running: frontend at `http://localhost:5183`, backend and PostgreSQL up.
- Chrome or Edge with DevTools available (Network tab for request counts and throttling, Elements panel for the `disabled` attribute).
- Notes from earlier runs may already be in the list. That is expected: every step is about the note you add.

## Steps

### Criterion 1: A second submit while the first save is in flight sends one POST and the note is listed once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" heading, the "New note" field and the "Save note" button are visible, with any existing notes listed below | [ ] Pass [ ] Fail |
| 2 | Open DevTools, Network tab, set throttling to "Slow 3G" and type `fetch` in the filter box | The request list is empty or shows only earlier calls | [ ] Pass [ ] Fail |
| 3 | Type `Double click check 1` in the "New note" field and double-click "Save note" quickly | Exactly one `notes` request with method POST appears in the Network tab | [ ] Pass [ ] Fail |
| 4 | Wait for that request to finish | `Double click check 1` appears exactly once in the note list and the field is empty | [ ] Pass [ ] Fail |
| 5 | Type `Enter check 1` in the field, click "Save note", then immediately press Enter while the field still has focus | Still exactly one new POST in the Network tab, and `Enter check 1` appears once in the list after it finishes | [ ] Pass [ ] Fail |
| 6 | Set throttling back to "No throttling" and reload the page | Each of the two notes from steps 3 and 5 is listed exactly once | [ ] Pass [ ] Fail |

### Criterion 2: Save note is disabled while a save is in flight and enabled again once it completes

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Set DevTools throttling to "Slow 3G". Type `Disabled check 2` in the "New note" field and click "Save note" once | The button stops responding: clicking it again does nothing, and in the Elements panel the `note-submit` button carries the `disabled` attribute | [ ] Pass [ ] Fail |
| 8 | Wait until `Disabled check 2` appears in the list | The `disabled` attribute is gone and the button responds to clicks again | [ ] Pass [ ] Fail |
| 9 | With the field empty, click "Save note" | The message "Enter a note before saving." appears and the button stays enabled (an empty submit never disables it) | [ ] Pass [ ] Fail |

### Criterion 3: After a save completes (success or error) the form accepts the next submit

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Set throttling to "Offline", type `Retry check 3` in the "New note" field and click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again | [ ] Pass [ ] Fail |
| 11 | Set throttling back to "No throttling" and click "Save note" again | `Retry check 3` appears once in the list and the error message disappears | [ ] Pass [ ] Fail |
| 12 | Type `Second note 3` and click "Save note" | `Second note 3` appears once in the list below `Retry check 3` | [ ] Pass [ ] Fail |
| 13 | Type `Second note 3` again (identical text) and click "Save note" | A second `Second note 3` entry appears: deliberate repeated saves are still allowed, only the accidental double submit is blocked | [ ] Pass [ ] Fail |

### Automated checks

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 14 | From the repo root run `npm --prefix frontend test -- NoteForm` | The `NoteForm.test.tsx` cases run with `0 failed` | [ ] Pass [ ] Fail |
| 15 | With the app stack running, run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` | Both BUG-04 specs run with `0 failed` | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. A second submit while the first save is in flight sends one POST and the note is stored and listed once | 3, 4, 5, 6, 15 |
| 2. Save note is disabled while a save is in flight and enabled again once it completes | 7, 8, 9, 14 |
| 3. After a save completes (success or error) the form accepts the next submit | 10, 11, 12, 13, 14 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
