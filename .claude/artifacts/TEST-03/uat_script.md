# UAT Script: TEST-03 Simple note form

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-03-simple-note-form` (or later, once merged, on `main`).
- **No `.env` file in the repository root.** `docker-compose.yml` supplies a working default for every value it reads, so Compose needs no `.env` for UAT. If a root `.env` already exists (an earlier UAT script asked for one), either move it aside for this run or make sure it sets `DATABASE_URL=postgresql://tasknotes:tasknotes@db:5432/tasknotes`: Compose reads the root `.env` for interpolation, and the `localhost` value shipped in `.env.example` points the backend container at itself, so it cannot reach the database.
- No other process bound to ports `5173` (frontend), `8000` (backend), or `5432` (database).
- A browser with developer tools available: two steps below read the **Network** tab to confirm what the page does and does not send to the server.
- The notes database is shared and persistent, so the list may already contain notes from an earlier session. Every check below is written against the note **you** enter, never against the list being empty.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (`db` passes its healthcheck, and the `frontend` log shows the Vite dev server listening on port 5173).
3. Open a browser, then open developer tools and select the **Network** tab, with recording on. Leave it open for the whole run.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Navigate to `http://localhost:5173` | The landing page loads without errors, and below the subtitle there is a "Notes" section containing a "New note" field, an "Add note" button, and a list of saved notes | [ ] Pass [ ] Fail |
| 2 | In the Network tab, find the request the page made on load | There is one `GET http://localhost:8000/api/notes` returning `200` | [ ] Pass [ ] Fail |
| 3 | Read the notes list | It shows either the text "No notes yet." (empty database) or the notes saved previously, newest first | [ ] Pass [ ] Fail |
| 4 | Type `Buy milk` into the "New note" field and click **Add note** | "Buy milk" appears in the notes list as the top entry, the field is cleared, and the page does **not** reload (the browser tab shows no reload spinner and the rest of the page never blanks out) | [ ] Pass [ ] Fail |
| 5 | In the Network tab, inspect the request that step 4 produced | There is one `POST http://localhost:8000/api/notes` returning `201`, whose response body contains `"text": "Buy milk"` plus an `id` and a `created_at`. There is **no** new document/navigation request for `http://localhost:5173` | [ ] Pass [ ] Fail |
| 6 | Leave the "New note" field empty and click **Add note** | The red message "Note text is required" appears directly under the field, and the notes list is unchanged (no new entry, nothing removed) | [ ] Pass [ ] Fail |
| 7 | In the Network tab, check for requests produced by step 6 | **No** request to `/api/notes` was sent at all — the empty note was rejected in the browser | [ ] Pass [ ] Fail |
| 8 | Type three spaces (`   `) into the "New note" field and click **Add note** | The same message "Note text is required" appears, no request to `/api/notes` is sent, and no note is added to the list | [ ] Pass [ ] Fail |
| 9 | Clear the field, type `Call the dentist`, and click **Add note** | "Call the dentist" appears at the top of the list, above "Buy milk" | [ ] Pass [ ] Fail |
| 10 | Reload the page (F5 / Cmd+R) | After the reload, both "Call the dentist" and "Buy milk" are still shown in the notes list, newest first | [ ] Pass [ ] Fail |
| 11 | In the Network tab, inspect the reloaded page's request to the API | There is a `GET http://localhost:8000/api/notes` returning `200`, and its response body contains both notes — so the list was read back from the server, not from anything kept in the browser | [ ] Pass [ ] Fail |
| 12 | In a separate terminal, read the notes straight out of PostgreSQL:<br>`docker compose exec db psql -U tasknotes -d tasknotes -c "select id, text, created_at from notes order by id desc limit 5;"` | The rows for "Call the dentist" and "Buy milk" are present in the `notes` table, confirming the notes are persisted in the database | [ ] Pass [ ] Fail |
| 13 | With developer tools' element inspector, inspect the form, the input, the button, the error message, and the list | They carry the test attributes `data-testid="note-form"`, `note-input`, `note-submit`, `note-error` (while a message is shown), and `note-list`, and each saved note is a list item `note-item-{id}` | [ ] Pass [ ] Fail |
| 14 | Check the existing landing-page content above the Notes section | The title "Task Notes" and the subtitle "A minimal task-notes app for keeping track of what needs doing." are present and worded exactly as before this feature | [ ] Pass [ ] Fail |
| 15 | Resize the browser window to a mobile width (e.g. 375px) | The field, the button, and the notes list stay fully visible and usable; nothing is cut off or overlapping, and long note text wraps instead of overflowing | [ ] Pass [ ] Fail |
| 16 | Using the keyboard only, Tab to the "New note" field, type `Keyboard note`, and press Enter | The note is submitted and appears in the list, and the field carries a visible label ("New note") associated with it | [ ] Pass [ ] Fail |
| 17 | In a separate terminal, run `cd frontend && npm test` | The Vitest suite passes, including the `NoteForm`, `NoteList`, `useNotes`, and updated `LandingPage` tests | [ ] Pass [ ] Fail |
| 18 | In a separate terminal, run `cd backend && DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5432/tasknotes uv run pytest -q` | The backend unit and integration suites pass, including the note service, repository, and router tests | [ ] Pass [ ] Fail |
| 19 | From the repository root, run `npx playwright test e2e/tests/TEST-03_simple_note_form.spec.ts` | The E2E specs pass, covering all three acceptance criteria plus the whitespace-only edge case | [ ] Pass [ ] Fail |

## Acceptance Criteria Coverage

| Acceptance Criterion | Covered by steps |
|---|---|
| Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload | 4, 5, 9 |
| Submitting an empty note is rejected with a visible validation message and no API call | 6, 7 |
| Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL) | 10, 11, 12 |
| Edge case: a note of only whitespace is rejected the same way as an empty one | 8 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 19 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
