# UAT Script: TEST-03 Simple note form

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-03-simple-note-form` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5173` (frontend), `8000` (backend), or `5432` (database).
- **Rebuild the backend image before testing.** TEST-03 is the first feature to add backend dependencies (`sqlalchemy`, `psycopg[binary]`), and the compose backend keeps its virtualenv in an anonymous volume. A compose stack created before TEST-03 reuses that stale volume and the backend fails with `ModuleNotFoundError: No module named 'sqlalchemy'`. Start with `docker compose up -d --build` (or `docker compose down -v` first) so the dependencies are installed.
- The notes API has no delete endpoint, so notes written during UAT stay in the database. Use recognizable texts (for example prefixed with the tester's initials) so they can be told apart from earlier runs; `docker compose down -v` clears the database entirely if a clean slate is wanted.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (the `frontend` log shows the Vite dev server listening on port 5173, and `docker compose ps` shows `db` as healthy).
3. Open the browser's dev tools on the Network tab before starting the steps: steps 4 and 6 read the requests the page makes.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open a browser and navigate to `http://localhost:5173` | The landing page loads without errors, with the "Task Notes" title, the note form below the subtitle, and the footer at the bottom | [ ] Pass [ ] Fail |
| 2 | Inspect the form area in dev tools | A `<form data-testid="note-form">` holds a text input `data-testid="note-input"` (placeholder "What needs doing?") and a button `data-testid="note-submit"` labelled "Add note"; an empty list `data-testid="note-list"` follows it | [ ] Pass [ ] Fail |
| 3 | Type `Buy milk` into the note field and click "Add note" | "Buy milk" appears as an item in the notes list, and the input clears itself | [ ] Pass [ ] Fail |
| 4 | Look at the Network tab for the request that step 3 caused | Exactly one `POST http://localhost:8000/api/notes` returning `201`, with the note in its response; the document itself was **not** reloaded (no new page-load entry, and the Network log from step 1 is still there) | [ ] Pass [ ] Fail |
| 5 | Clear the note field so it is empty, then click "Add note" | A validation message "Please enter a note before submitting." is shown below the form (`data-testid="note-validation-error"`), and the notes list is unchanged | [ ] Pass [ ] Fail |
| 6 | Check the Network tab again for the click in step 5 | No request to `/api/notes` was made at all — the empty note was rejected in the browser | [ ] Pass [ ] Fail |
| 7 | Type three spaces into the note field and click "Add note" | The same validation message appears, no request is made, and no blank item is added to the list | [ ] Pass [ ] Fail |
| 8 | Start typing a real note again (for example `Walk the dog`) | The validation message disappears as soon as you type | [ ] Pass [ ] Fail |
| 9 | Submit `Walk the dog`, then reload the page (F5) | After the reload, both "Buy milk" and "Walk the dog" are still listed, oldest first, and the Network tab shows a `GET http://localhost:8000/api/notes` returning `200` with both notes | [ ] Pass [ ] Fail |
| 10 | Confirm the notes really come from PostgreSQL: run `docker compose exec db psql -U tasknotes -d tasknotes -c "select id, text from notes order by id;"` (the `tasknotes` user and database are the `.env.example` defaults; substitute `POSTGRES_USER` / `POSTGRES_DB` if they were overridden) | The table lists the notes written above, in the same order the page shows them | [ ] Pass [ ] Fail |
| 11 | Verify the notes survive a backend restart: run `docker compose restart backend`, wait for it to come back up, then reload `http://localhost:5173` | The same notes are still listed (they live in the database, not in the backend's memory) | [ ] Pass [ ] Fail |
| 12 | Resize the browser window to a mobile width (e.g. 375px) | The note field, the button, and the notes list stay readable and usable, with no horizontal scrolling or overlapping text | [ ] Pass [ ] Fail |
| 13 | In a separate terminal, run `cd backend && uv run pytest -q` | The backend unit and integration suites pass (integration tests need the `db` service from the setup step running) | [ ] Pass [ ] Fail |
| 14 | In a separate terminal, run `cd frontend && npm test` | The Vitest suite passes, including the `Notes`, `notesClient`, and updated `LandingPage` tests | [ ] Pass [ ] Fail |
| 15 | From the repository root, run `npx playwright test e2e/tests/TEST-03_simple_note_form.spec.ts` | All four E2E specs pass (note saved without reload, empty note rejected, whitespace-only note rejected, note still listed after reload) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |

## Acceptance criteria coverage

| Acceptance criterion | Covered by steps |
|---|---|
| Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload | 3, 4 |
| Submitting an empty note is rejected with a visible validation message and no API call | 5, 6 (and 7 for whitespace-only input) |
| Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL) | 9, 10, 11 |
