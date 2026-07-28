# UAT Script: TEST-03 Simple note form

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-03-simple-note-form` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5173` (frontend), `8000` (backend), or the configured PostgreSQL port.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (the `frontend` log shows the Vite dev server listening on port 5173).
3. Open `http://localhost:5173` in a browser.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Load the landing page | Page loads without errors; the notes section is visible below the title | [ ] Pass [ ] Fail |
| 2 | Observe the notes list before adding anything (fresh database) | An empty-state message ("No notes yet. Add one above to get started.") is shown, identified by `note-list-empty` | [ ] Pass [ ] Fail |
| 3 | Type "Buy milk" into the note input (`note-input`) and click "Add note" (`note-submit`) | "Buy milk" appears immediately in the notes list (`note-list`) with no full-page reload (URL and rest of page stay unchanged) | [ ] Pass [ ] Fail |
| 4 | Leave the note input empty and click "Add note" | A validation message is shown, identified by `note-error` (e.g. "Note text is required."); the notes list is unchanged; no network request is sent | [ ] Pass [ ] Fail |
| 5 | Type only spaces (e.g. "   ") into the note input and click "Add note" | The same validation message (`note-error`) is shown; the notes list is unchanged; no network request is sent | [ ] Pass [ ] Fail |
| 6 | Type "Call the dentist" into the note input and click "Add note" | "Call the dentist" appears in the notes list alongside "Buy milk" | [ ] Pass [ ] Fail |
| 7 | Refresh the browser page (full reload) | Both "Buy milk" and "Call the dentist" are still visible in the notes list after the page finishes loading, confirming they were read back from PostgreSQL via `GET /api/notes` | [ ] Pass [ ] Fail |
| 8 | Open browser dev tools and inspect the form and list elements | The form has `data-testid="note-form"`, the input has `data-testid="note-input"`, the submit button has `data-testid="note-submit"`, and the list has `data-testid="note-list"` | [ ] Pass [ ] Fail |
| 9 | In a separate terminal, run `cd backend && uv run pytest` | Unit and integration tests for the notes feature pass | [ ] Pass [ ] Fail |
| 10 | In a separate terminal, run `cd frontend && npm test` | Vitest suite passes, including `NoteForm`, `NoteList`, and `useNotes` tests | [ ] Pass [ ] Fail |
| 11 | From the repository root, run `npx playwright test e2e/tests/TEST-03_simple_note_form.spec.ts` | The E2E spec passes, confirming note creation, validation, and persistence across reload | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
