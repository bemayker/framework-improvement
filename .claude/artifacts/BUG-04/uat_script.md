# UAT Script: BUG-04 Saving a note twice quickly stores it twice

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/BUG-04-double-submit-note` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root if it does not exist yet (defaults are usable as-is).
- No other process bound to ports `5183` (frontend), `8010` (backend) or `5442` (PostgreSQL).
- Chrome (or another browser) with DevTools open on the **Network** tab. Throttling is set to "Slow 3G" where a step says so, so a save takes several seconds.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend` and `frontend` services report as started (the `frontend` log shows the Vite dev server listening on port 5183).
3. Notes from earlier runs stay in the database volume, so the list may already contain entries. Every step below is about the note you add yourself.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Set Network throttling to "Slow 3G", then open `http://localhost:5183/` | The "Task Notes" landing page shows the "New note" field, the "Save note" button and the current note list | [ ] Pass [ ] Fail |
| 2 | Type `BUG-04 double click check` in the "New note" field | The text appears in the field | [ ] Pass [ ] Fail |
| 3 | Click "Save note", then immediately click it again, then press Enter in the field, all before the first save finishes | The Network tab shows exactly one `POST /api/notes` request | [ ] Pass [ ] Fail |
| 4 | Wait for the request to complete | The field clears and `BUG-04 double click check` appears exactly once in the note list | [ ] Pass [ ] Fail |
| 5 | Set throttling to "No throttling" and reload the page | `BUG-04 double click check` still appears exactly once | [ ] Pass [ ] Fail |
| 6 | Set throttling back to "Slow 3G", type `BUG-04 disabled check` in the field and check the "Save note" button | The button is enabled (solid dark background, pointer cursor) | [ ] Pass [ ] Fail |
| 7 | Click "Save note" once, and while the `POST /api/notes` request is pending, hover and click the button again | The button is visibly dimmed, shows a not-allowed cursor, and clicking it does nothing (no second request in the Network tab) | [ ] Pass [ ] Fail |
| 8 | Wait for the save to finish | `BUG-04 disabled check` appears in the list and the "Save note" button is enabled again (solid, pointer cursor) | [ ] Pass [ ] Fail |
| 9 | Type `BUG-04 second note` and click "Save note" | It saves and appears in the list once, and the button is enabled again afterwards | [ ] Pass [ ] Fail |
| 10 | Error path: in DevTools set the network to "Offline", type `BUG-04 offline check` and click "Save note" | The message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again | [ ] Pass [ ] Fail |
| 11 | Set the network back to "No throttling" and click "Save note" | The note saves and appears once in the list | [ ] Pass [ ] Fail |
| 12 | Automated check: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` from the repository root | Vitest reports `0 failed` | [ ] Pass [ ] Fail |
| 13 | Automated check: run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` from the repository root | The E2E spec passes: one POST, one list item, and a second distinct note saves normally | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| 1. Submitting the form twice in quick succession sends one create request, stores one note, and the list shows it once | 1, 2, 3, 4, 5, 13 |
| 2. While a save is in progress, the "Save note" button is disabled | 6, 7, 12 |
| 3. Once the save completes, successfully or with an error, the button is enabled again | 8, 10, 11, 12 |
| Edge case: a second, different note can be saved after the first completes | 9, 13 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
