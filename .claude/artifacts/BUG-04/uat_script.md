# UAT Script: BUG-04 Saving a note twice quickly stores it once

## Prerequisites

- App stack running (frontend at `http://localhost:5183`, backend and database reachable from it), on branch `feature/BUG-04-double-submit-note` or later `main`.
- A Chromium-based browser with DevTools. Steps 2 to 12 need the **Network** tab, to throttle requests and to count the `POST /api/notes` requests.
- Notes from earlier runs may already be in the list. That is expected: every step below is about the note you add.

## Steps

### Criterion 1: a second submit while a save is in flight stores the note once

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 1 | Open `http://localhost:5183/` | The Task Notes page shows the New note field and the Save note button | [ ] Pass [ ] Fail |
| 2 | Open DevTools, Network tab, set throttling to **Slow 3G** | Requests now take several seconds | [ ] Pass [ ] Fail |
| 3 | Type `Double save check 1` in the New note field | The text is in the field | [ ] Pass [ ] Fail |
| 4 | Click **Save note**, then immediately click **Save note** again and press Enter in the field | The Network tab shows exactly one `POST` request to `/api/notes` | [ ] Pass [ ] Fail |
| 5 | Wait for the request to finish | `Double save check 1` appears exactly once in the list and the field is empty | [ ] Pass [ ] Fail |
| 6 | Set throttling back to **No throttling** and reload the page | `Double save check 1` is still listed exactly once | [ ] Pass [ ] Fail |

### Criterion 2: the Save note button is disabled while saving

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 7 | Set throttling to **Slow 3G**. Type `Disabled button check` in the New note field | The text is in the field | [ ] Pass [ ] Fail |
| 8 | Click **Save note** | The button turns dimmed and the cursor over it shows not-allowed while the request is pending | [ ] Pass [ ] Fail |
| 9 | Wait for the request to finish | The note is listed and the button is back to its normal look and clickable | [ ] Pass [ ] Fail |

### Criterion 3: a failed save can be retried

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 10 | Set throttling to **No throttling**. In DevTools Network, right-click any request, choose **Block request URL** and enter `localhost:8010/api/notes` (or the notes API URL the Network tab shows) | That URL is blocked | [ ] Pass [ ] Fail |
| 11 | Type `Retry check` and click **Save note** | The red message `The note could not be saved. Please try again.` appears, the text stays in the field and the button is enabled | [ ] Pass [ ] Fail |
| 12 | Remove the block in the Network request blocking panel, then click **Save note** once | Exactly one `POST` to `/api/notes` succeeds, `Retry check` appears once in the list and the error message is gone | [ ] Pass [ ] Fail |

### Edge case: empty submit while idle

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 13 | With the note field empty, click **Save note** | The message `Enter a note before saving.` appears, the button stays enabled and no request to `/api/notes` is sent | [ ] Pass [ ] Fail |

### Automated check

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 14 | Run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | 0 failed | [ ] Pass [ ] Fail |
| 15 | With the app stack up, run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` | 0 failed | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. A second submit while a save is in flight sends no second create request, the note is stored and shown once | 1 to 6, 14, 15 |
| 2. The Save note button is disabled while a save is in flight and enabled again after it succeeds or fails | 7 to 9, 11, 14 |
| 3. After a failed save the user can resubmit, and the retry sends exactly one create request | 10 to 12, 14 |
| Edge case: empty submit while idle still validates | 13, 14 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
