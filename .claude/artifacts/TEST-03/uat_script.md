# UAT Script: TEST-03 Simple note form

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-03-simple-note-form` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5173` (frontend), `8000` (backend), or `5432` (PostgreSQL) — this is the first feature that needs the database, so a PostgreSQL already listening on `5432` will make the `db` service fail to start.
- A way to see the app's network traffic: the browser dev tools **Network** tab. Steps 6 and 9 verify that *no* request is sent, which is only observable there.
- A 500-character and a 501-character piece of text on the clipboard for step 11. Any filler text works; generate them with e.g. `python3 -c "print('a'*500)"` and `python3 -c "print('a'*501)"`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (`db` reaches "healthy", and the `frontend` log shows the Vite dev server listening on port 5173).
3. Notes from earlier test runs stay in the database volume, so the list may already contain entries. That is expected: every step below is about the note *you* add, not about the list being empty.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open a browser and navigate to `http://localhost:5173` | Page loads without errors, with the "Task Notes" title, the note form, and the saved-notes list below it | [ ] Pass [ ] Fail |
| 2 | Open dev tools and inspect the form area | The form has `data-testid="note-form"`, the text field `data-testid="note-input"`, the button `data-testid="note-submit"`, and the list `data-testid="note-list"` | [ ] Pass [ ] Fail |
| 3 | Type `Buy milk` into the note field and click **Save note** | "Buy milk" appears as a new entry at the bottom of the notes list | [ ] Pass [ ] Fail |
| 4 | Look at the note field and the page as a whole immediately after step 3 | The field is empty again, no validation message is shown, and the page did not reload (the browser tab never showed a loading spinner, and dev tools' Network tab shows a single `POST /api/notes` returning 201 with no document request) | [ ] Pass [ ] Fail |
| 5 | Inspect the new list entry in dev tools | It is an `<li>` inside `data-testid="note-list"`, with `data-testid="note-list-item-{id}"` where `{id}` is the id the backend returned | [ ] Pass [ ] Fail |
| 6 | With the note field empty, click **Save note**. Watch the Network tab while you do | A visible validation message appears (`data-testid="note-form-error"`, wording: "Enter a note before saving."), nothing is added to the list, and **no** request to `/api/notes` is sent | [ ] Pass [ ] Fail |
| 7 | Type `Walk the dog` and click **Save note** | The validation message disappears and "Walk the dog" appears in the list | [ ] Pass [ ] Fail |
| 8 | Reload the page (F5), then read the notes list | Both "Buy milk" and "Walk the dog" are still listed. The Network tab shows a `GET /api/notes` on load returning them, so they came from PostgreSQL and not from the browser | [ ] Pass [ ] Fail |
| 9 | Type three spaces (nothing else) into the note field and click **Save note**. Watch the Network tab | The same validation message as step 6 appears, no entry is added, and **no** request to `/api/notes` is sent — a whitespace-only note counts as empty | [ ] Pass [ ] Fail |
| 10 | Stop the stack with `docker compose down` (without `-v`), start it again with `docker compose up`, and reload `http://localhost:5173` | Both notes are still listed: they live in the database volume, not in the containers | [ ] Pass [ ] Fail |
| 11 | Paste the 500-character text into the note field and click **Save note**. Then try to paste the 501-character text into the (now empty) field | The 500-character note is saved and appears in the list. The second paste is truncated by the field itself and never exceeds 500 characters (the field carries `maxLength="500"`, matching the limit the API enforces) | [ ] Pass [ ] Fail |
| 12 | In a separate terminal, run `cd frontend && npm test` | Vitest suite passes, including the `NoteForm`, `NoteList`, `notes` API client, and updated `LandingPage` tests | [ ] Pass [ ] Fail |
| 13 | In a separate terminal, run `cd backend && DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5432/tasknotes uv run pytest -q` | Backend unit and integration suites pass (the integration tier talks to the compose `db` service on `localhost:5432`; the assignment must come *after* the `cd`, or it never reaches pytest) | [ ] Pass [ ] Fail |
| 14 | From the repository root, run `npx playwright test e2e/tests/TEST-03_simple_note_form.spec.ts` | The E2E spec passes, confirming all three acceptance criteria plus the whitespace edge case | [ ] Pass [ ] Fail |

## Acceptance criteria coverage

| Acceptance criterion | Verified by steps |
|---|---|
| Submitting a non-empty note stores it via `POST /api/notes` and it appears in the on-page list without a full page reload | 3, 4, 5 |
| Submitting an empty note is rejected with a visible validation message and no API call | 6 |
| Saved notes persist across a page reload (`GET /api/notes` returns them from PostgreSQL) | 8, 10 |
| Edge case: whitespace-only note treated as empty | 9 |
| Edge case: 500-character upper bound on note text | 11 |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
