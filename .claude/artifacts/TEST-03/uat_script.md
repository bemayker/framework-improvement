# UAT Script: TEST-03 Simple note form

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-03-simple-note-form` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5173` (frontend), `8000` (backend), or `5432` (database).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (the `db` service reports healthy, and the `frontend` log shows the Vite dev server listening on port 5173).
3. Open the browser's developer tools (Network tab) if you want to observe the `POST`/`GET /api/notes` requests referenced below.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open a browser and navigate to `http://localhost:5173` | The landing page loads with the "Task Notes" title, and below it a note form (a text input and a "Save" button) and the notes list area | [ ] Pass [ ] Fail |
| 2 | Inspect the form with dev tools | The input has `data-testid="note-form-input"`, the button has `data-testid="note-form-submit"`, and the form itself has `data-testid="note-form"` | [ ] Pass [ ] Fail |
| 3 | Click "Save" without typing anything in the input | A visible validation message appears near the input (element `data-testid="note-form-error"`), and no `POST /api/notes` request appears in the Network tab | [ ] Pass [ ] Fail |
| 4 | Type only spaces (e.g. three spaces) into the input, then click "Save" | The same validation message appears, and no `POST /api/notes` request is made | [ ] Pass [ ] Fail |
| 5 | Type "Buy milk" into the input and click "Save" | A `POST /api/notes` request appears in the Network tab and returns status `201`; "Buy milk" appears in the notes list (element `data-testid="note-list"`) immediately, with no full-page reload | [ ] Pass [ ] Fail |
| 6 | Observe the input field after the note is saved | The input is cleared and ready for a new note | [ ] Pass [ ] Fail |
| 7 | Type "Call the dentist" into the input and click "Save" | "Call the dentist" is added to the list below "Buy milk", both notes remain visible | [ ] Pass [ ] Fail |
| 8 | Reload the browser page (F5 or the reload button) | A `GET /api/notes` request appears in the Network tab; after the page finishes loading, both "Buy milk" and "Call the dentist" are still shown in the list | [ ] Pass [ ] Fail |
| 9 | Resize the browser window to a mobile width (e.g. 375px) | The form and note list remain readable, stacked in a single column, no horizontal scrolling or overlapping text | [ ] Pass [ ] Fail |
| 10 | In a separate terminal, run `docker compose up -d db` (or ensure `db` is already running), then `cd backend && uv run pytest` | All backend unit and integration tests pass (integration tests require the `db` service to be reachable at `localhost:5432`) | [ ] Pass [ ] Fail |
| 11 | In a separate terminal, run `cd frontend && npm test` | The Vitest suite passes, including `NoteForm`, `NoteList`, and `NotesSection` tests | [ ] Pass [ ] Fail |
| 12 | From the repository root, run `npx playwright test e2e/tests/TEST-03_simple_note_form.spec.ts` | The E2E spec passes, covering the same three acceptance criteria plus the whitespace-only edge case exercised above | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
