# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Backend and frontend running; the frontend is served at `http://localhost:5183`.
- Browser DevTools open on the **Network** tab, filtered to `notes`.
- For criteria 1 and 2, network throttling set to "Slow 3G" so a save stays in flight long enough to click twice.
- For criterion 3, the ability to stop and start the backend (for example `docker compose stop backend` and `docker compose start backend`).
- Notes from earlier runs may already be listed; every step concerns the note you add.

## Steps

### Criterion 1: A second submit while the first save is in flight sends one request

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The "Task Notes" page with the "New note" field and the "Save note" button | [ ] Pass [ ] Fail |
| 2 | Type `Buy milk twice-test` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Double-click "Save note" | The Network tab shows exactly one POST to `/api/notes`; after it returns, `Buy milk twice-test` appears once in the note list and the field is cleared | [ ] Pass [ ] Fail |
| 4 | Set throttling to "No throttling" and reload the page | `Buy milk twice-test` is listed exactly once | [ ] Pass [ ] Fail |
| 5 | Set throttling back to "Slow 3G". Type `Walk dog enter-test`, press Enter in the field, then immediately click "Save note" | One POST to `/api/notes`; `Walk dog enter-test` is listed once | [ ] Pass [ ] Fail |

### Criterion 2: Button disabled during the save, enabled again after success

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | With "Slow 3G" on, type `Call the plumber` in "New note" | The text is in the field | [ ] Pass [ ] Fail |
| 7 | Click "Save note" once | While the POST is pending the button is greyed out (reduced opacity, not-allowed cursor) and clicking it does nothing | [ ] Pass [ ] Fail |
| 8 | Wait for the POST to complete | `Call the plumber` appears in the list, the field is empty, and "Save note" is at full opacity and clickable | [ ] Pass [ ] Fail |
| 9 | Click "Save note" with the field empty | The message "Enter a note before saving." appears and the button stays enabled | [ ] Pass [ ] Fail |

### Criterion 3: After a failed save the button is enabled, text kept, retry sends one request

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Set throttling to "No throttling", reload `http://localhost:5183/`, then stop the backend (`docker compose stop backend`) | The page stays open; the backend no longer answers | [ ] Pass [ ] Fail |
| 11 | Type `Pay rent` in "New note" and click "Save note" | "The note could not be saved. Please try again." appears, the field still holds `Pay rent`, and "Save note" is enabled | [ ] Pass [ ] Fail |
| 12 | Start the backend again (`docker compose start backend`) and, with the Network tab open, click "Save note" once | Exactly one new POST to `/api/notes`; `Pay rent` appears once in the list and the error message disappears | [ ] Pass [ ] Fail |

### Edge case: a deliberate second save of the same text

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Type `Water plants`, click "Save note" and wait until it is listed. Type `Water plants` again, click "Save note" and wait | `Water plants` is listed twice: two separate saves are two notes | [ ] Pass [ ] Fail |

### Automated check

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 14 | From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | 0 failed | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| A second submit while the first save is in flight sends exactly one request; one note stored and shown | 1 to 5 |
| While a save is in flight the button is disabled, and enabled again after success | 6 to 9 |
| After a failed save the button is enabled, text kept, and a retry sends exactly one new request | 10 to 12 |
| Edge case: deliberate repeat of the same text after completion stays allowed | 13 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
