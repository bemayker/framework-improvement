# UAT Script: TEST-03 Simple note form

## Prerequisites

- Docker and Docker Compose installed and running (the notes are stored in PostgreSQL, so the `db` service is required — this feature does not work without it).
- Repository checked out locally, on branch `feature/TEST-03-simple-note-form` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT: user/password/database all `tasknotes`).
- No other process bound to ports `5173` (frontend), `8000` (backend), or `5432` (database).
- A browser with developer tools available (steps 8 and 9 read the Network tab).
- The app has no login and no seeded data: every note in the list is one a tester created.

## Test Environment Setup

1. From the repository root, start from a clean database so the list begins empty:
   ```bash
   docker compose down -v
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (the `frontend` log shows the Vite dev server listening on port 5173; the `backend` log shows Uvicorn listening on port 8000).
3. Confirm the API is reachable before testing the UI:
   ```bash
   curl http://localhost:8000/api/notes
   ```
   It must return `[]` on a clean database.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open a browser and navigate to `http://localhost:5173` | The page loads without errors, showing the "Task Notes" title and the "Notes" section | [ ] Pass [ ] Fail |
| 2 | Look at the notes section (`data-testid="notes-section"`) | It shows the "Note" label, a text input with placeholder "What needs doing?", a "Save note" button, and the empty-state text "No notes saved yet." (`data-testid="note-list-empty"`) | [ ] Pass [ ] Fail |
| 3 | Click the "Save note" button (`data-testid="note-form-submit"`) while the input is empty | The validation message "Enter some text before saving a note." appears below the button (`data-testid="note-form-error"`), and no note is added | [ ] Pass [ ] Fail |
| 4 | Open dev tools, go to the Network tab, filter on `notes`, and click "Save note" again with the input still empty | The validation message is shown again and **no** `POST http://localhost:8000/api/notes` request appears in the Network tab | [ ] Pass [ ] Fail |
| 5 | Type three spaces into the note input (`data-testid="note-form-input"`) and click "Save note" | The same validation message is shown, no `POST /api/notes` request fires, and the three spaces are still in the input | [ ] Pass [ ] Fail |
| 6 | Clear the input, type `Buy milk`, and click "Save note" | "Buy milk" appears as an entry in the notes list (`data-testid="note-list"`), the empty-state text disappears, and the input is cleared | [ ] Pass [ ] Fail |
| 7 | While watching the browser during step 6 | The page does not reload: the browser's reload/spinner indicator does not fire and the rest of the page (title, subtitle, footer) never blanks out | [ ] Pass [ ] Fail |
| 8 | Check the Network tab entry created by step 6 | One `POST http://localhost:8000/api/notes` request with status `201`, whose response body contains `"text": "Buy milk"` and an `id` | [ ] Pass [ ] Fail |
| 9 | Add a second note, `Call the dentist` | It appears below "Buy milk" in the list (oldest first), and the earlier note is still shown | [ ] Pass [ ] Fail |
| 10 | Reload the page (F5 or Cmd+R) | Both "Buy milk" and "Call the dentist" are still listed, in the same order, and the Network tab shows a `GET http://localhost:8000/api/notes` returning `200` with both notes | [ ] Pass [ ] Fail |
| 11 | Confirm the notes really came from PostgreSQL: `docker compose exec db psql -U tasknotes -d tasknotes -c "select id, text from notes order by id;"` | The two notes are returned by the database, matching what the page shows | [ ] Pass [ ] Fail |
| 12 | Restart only the frontend and backend, keeping the database volume: `docker compose restart backend frontend`, wait for both to be up, then reload `http://localhost:5173` | Both notes are still listed: they are persisted in the database, not in browser state | [ ] Pass [ ] Fail |
| 13 | Narrow the browser window to a phone width (e.g. 375px) | The input, button, and note entries remain fully visible and readable; nothing is cut off or overlapping | [ ] Pass [ ] Fail |
| 14 | With the backend stopped (`docker compose stop backend`), reload the page | The error line "Your notes could not be loaded." is shown (`data-testid="notes-error"`) instead of the page failing silently. Restart it afterwards with `docker compose start backend` | [ ] Pass [ ] Fail |
| 15 | In a separate terminal, run `cd frontend && npm test` | The Vitest suite passes, including the `NoteForm`, `NoteList`, and `LandingPage` tests | [ ] Pass [ ] Fail |
| 16 | From the repository root, run `npx playwright test e2e/tests/TEST-03_simple_note_form.spec.ts` | The E2E spec passes, covering all three acceptance criteria plus the whitespace-only edge case | [ ] Pass [ ] Fail |

## Acceptance Criteria Coverage

| Acceptance Criterion | Covered by steps |
|---|---|
| Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload | 6, 7, 8, 9 |
| Submitting an empty note is rejected with a visible validation message and no API call | 3, 4, 5 |
| Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL) | 10, 11, 12 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 16 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
