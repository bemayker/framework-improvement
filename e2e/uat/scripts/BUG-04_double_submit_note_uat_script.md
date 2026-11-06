# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- The app stack is running: frontend on `http://localhost:5183`, with its backend and database up.
- A Chromium-based browser with dev tools open on the **Network** tab, filtered to `api/notes`.
- Branch `feature/BUG-04-double-submit-note` (or `main` once merged).
- Node dependencies installed in `frontend/` for step 14.

## Test Environment Setup

1. Start the stack as described in `docs/DEVELOPMENT.md`, and wait until the notes list loads at `http://localhost:5183/`.
2. Notes from earlier runs may already be listed. Every step below concerns the notes you add.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" title, the note field with placeholder "What needs doing?", the **Save note** button and the notes list are shown | [ ] Pass [ ] Fail |
| 2 | In dev tools Network, set throttling to `Slow 3G` | The throttling indicator shows on the Network tab | [ ] Pass [ ] Fail |
| 3 | Type `Double click check 1` in the "New note" field and double-click **Save note** quickly | Exactly one `POST /api/notes` row appears in the Network tab | [ ] Pass [ ] Fail |
| 4 | Wait for that request to finish (status 201) | `Double click check 1` appears once at the bottom of the list and the field is empty | [ ] Pass [ ] Fail |
| 5 | Set throttling to `No throttling` and reload the page (F5) | The list still shows `Double click check 1` exactly once | [ ] Pass [ ] Fail |
| 6 | Type `Enter twice check`, set throttling to `Slow 3G` again, and press Enter twice quickly | One `POST /api/notes` row appears and, once it finishes, `Enter twice check` is listed once | [ ] Pass [ ] Fail |
| 7 | With throttling still on `Slow 3G`, type `Pending state check` and click **Save note** once | While the request is pending the button is greyed out (reduced opacity, not-allowed cursor) and clicking it again adds no new `POST /api/notes` row | [ ] Pass [ ] Fail |
| 8 | Wait for the request to finish | `Pending state check` appears in the list, the field is empty, and **Save note** is back to its normal dark style and clickable | [ ] Pass [ ] Fail |
| 9 | Set Network throttling to `Offline`, type `Offline check` and click **Save note** | The red message "The note could not be saved. Please try again." appears, `Offline check` stays in the field, and **Save note** is enabled again | [ ] Pass [ ] Fail |
| 10 | Set throttling to `No throttling` and click **Save note** | The message disappears and `Offline check` is added to the list once | [ ] Pass [ ] Fail |
| 11 | Type `Repeat text check`, click **Save note** and wait for it to finish. Type `Repeat text check` again and click **Save note** (edge case) | `Repeat text check` is listed twice: only simultaneous submits are ignored, deliberate repeat saves are kept | [ ] Pass [ ] Fail |
| 12 | Click **Save note** with an empty field (edge case) | The validation message appears, no request is sent, and **Save note** stays enabled | [ ] Pass [ ] Fail |
| 13 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root | 0 failed, including the double-click, double-Enter, pending-disabled, retry-after-failure and empty-note cases | [ ] Pass [ ] Fail |
| 14 | Run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` from the repository root, with the stack running | The E2E spec passes: one POST and one stored note for a double click, and a deliberate second save stores a second note | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. A quick double save sends one request and stores the note once | 3, 4, 5, 6, 14 |
| 2. Save note is disabled while a save is pending and enabled again after success or failure | 7, 8, 9, 10, 13 |
| Edge case: a deliberate repeat save of the same text stores a second note | 11, 14 |
| Edge case: an empty note leaves the button enabled | 12, 13 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
