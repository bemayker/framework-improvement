# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- The app stack is running: frontend at `http://localhost:5183`, backend on its configured port (8010), PostgreSQL reachable by the backend.
- Repository checked out on branch `feature/BUG-04-double-submit-note` (or `main` once merged).
- Browser dev tools open on the **Network** tab, filtered to `notes`. Request counts are only observable there.

## Test Environment Setup

1. Start the stack as described in `docs/DEVELOPMENT.md` and wait until the landing page loads.
2. Notes from earlier runs may already be listed. That is expected: every step below is about the note you add.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5183/` | The "Task Notes" page shows the "New note" field, the "Save note" button and the note list | [ ] Pass [ ] Fail |
| 2 | In dev tools Network, set throttling to "Slow 3G" | Later requests take a few seconds | [ ] Pass [ ] Fail |
| 3 | Type `Double click check 1` in the "New note" field | The text is in the field | [ ] Pass [ ] Fail |
| 4 | Double-click "Save note" quickly | Exactly one POST to `/api/notes` appears in the Network tab. After it completes, `Double click check 1` appears once in the note list and the field is empty | [ ] Pass [ ] Fail |
| 5 | Set throttling to "No throttling" and reload the page | `Double click check 1` is listed exactly once | [ ] Pass [ ] Fail |
| 6 | Set throttling to "Slow 3G", type `Double enter check 1` and press Enter twice quickly in the field | One POST, one list entry, still one after reloading with throttling off | [ ] Pass [ ] Fail |
| 7 | Set throttling to "Slow 3G", type `Disabled button check` and click "Save note" once | While the request is pending the button looks dimmed, the cursor over it is not-allowed, and clicking it again sends no second POST | [ ] Pass [ ] Fail |
| 8 | Wait for the note to appear in the list | The button is back to full opacity and clickable | [ ] Pass [ ] Fail |
| 9 | Set throttling to "Offline", type `Retry after failure` and click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again | [ ] Pass [ ] Fail |
| 10 | Set throttling to "No throttling" and click "Save note" | `Retry after failure` appears once in the list and the error message disappears | [ ] Pass [ ] Fail |
| 11 | In a separate terminal, run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | The run passes: its summary reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| A quick double submit sends one save request and stores the note once | 4, 5, 6, 11 |
| Save note is disabled while a save is in flight and enabled again after success or failure | 7, 8, 9, 10, 11 |
| Edge case: a failed save can be retried | 9, 10 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
