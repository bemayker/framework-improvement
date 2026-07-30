# UAT Script: TEST-03 Simple note form

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-03-simple-note-form` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5173` (frontend), `8000` (backend), or `5432` (PostgreSQL). If one of those ports is taken on your machine, remap it in `docker-compose.yml` and substitute your ports everywhere below; the values in this script are the declared defaults.
- A way to produce a text longer than 1000 characters for step 12, for example `python3 -c "print('x' * 1001)"` in a terminal, then copy the output.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (the `frontend` log shows the Vite dev server listening on port 5173, the `backend` log shows Uvicorn listening on port 8000).
3. This feature stores notes in PostgreSQL, so the list is **not** empty if someone added notes to this database before. That is expected; verify the notes *you* add rather than the total count. Optionally start from an empty list with `docker compose down -v && docker compose up --build`, which discards the database volume.

## The three messages this feature can show

The form has three separate messages, and confusing them will produce a false failure. Each is a different outcome, with its own test attribute:

| Test attribute | Message | Means |
|---|---|---|
| `note-validation-error` | "Enter a note before adding it." | The browser refused the note before contacting the backend (empty or spaces only). No request was sent. |
| `note-save-error` | "The note could not be saved. Please try again." | The request was sent and the backend refused it or was unreachable. |
| `notes-load-error` | "Saved notes could not be loaded." | Reading the existing notes when the page opened failed. Nothing you typed is involved. |

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open a browser and navigate to `http://localhost:5173` | The page loads with the title "Task Notes", a note field with an "Add note" button below it, and no red message on screen (in particular no "Saved notes could not be loaded.") | [ ] Pass [ ] Fail |
| 2 | Open the browser's developer tools on the Network tab and leave it open for the rest of the run | Requests are being recorded; a `GET` to `/api/notes` from opening the page is listed with status 200 | [ ] Pass [ ] Fail |
| 3 | Type `Buy milk` into the note field and click "Add note" | "Buy milk" appears in the list under the form within a moment. The Network tab shows one `POST` to `/api/notes` with status 201 | [ ] Pass [ ] Fail |
| 4 | Look at the note field and at the browser tab while step 3 happens | The field is empty again, and the page did not reload: no new document request in the Network tab, no reload spinner in the tab, nothing on the page flickered or was re-drawn from scratch | [ ] Pass [ ] Fail |
| 5 | Type `Walk the dog` and click "Add note" | "Walk the dog" appears **below** "Buy milk" (notes are listed oldest first), and the field clears again | [ ] Pass [ ] Fail |
| 6 | With the field empty, click "Add note" | The message "Enter a note before adding it." appears. The Network tab shows **no** new `POST` to `/api/notes`. The list still shows exactly the notes from steps 3 and 5, with no blank entry | [ ] Pass [ ] Fail |
| 7 | Type three spaces into the field and click "Add note" | The same "Enter a note before adding it." message appears, again with **no** `POST` in the Network tab. The three spaces are still in the field | [ ] Pass [ ] Fail |
| 8 | Clear the field, then reload the page (F5 or the reload button) | Both "Buy milk" and "Walk the dog" are still listed, in the same order. The Network tab shows a `GET` to `/api/notes` with status 200 whose response contains both notes | [ ] Pass [ ] Fail |
| 9 | In a terminal, run `curl http://localhost:8000/api/notes` | The response is a JSON array containing both notes, each with an `id`, the `content` you typed, and a `created_at` timestamp | [ ] Pass [ ] Fail |
| 10 | In a terminal, run `docker compose restart backend`, wait for the `backend` log to show Uvicorn listening again, then reload the browser page | Both notes are still listed. They survived the backend restart, so they are stored in PostgreSQL and not held in the running application or the browser | [ ] Pass [ ] Fail |
| 11 | Inspect the form with the developer tools' accessibility inspector or a screen reader | The text field is labelled "Note", the list is labelled "Saved notes", and each message from the table above is announced as an alert when it appears | [ ] Pass [ ] Fail |
| 12 | Produce a text longer than 1000 characters (see Prerequisites), paste it into the field, and click "Add note" | The message "The note could not be saved. Please try again." appears, and the Network tab shows a `POST` to `/api/notes` with status 422. The pasted text is still in the field, and no over-long note is added to the list | [ ] Pass [ ] Fail |
| 13 | Delete most of the pasted text so well under 1000 characters remain, then click "Add note" | The note saves and appears in the list. This confirms step 12 failed because of the length limit and not because the form stopped working | [ ] Pass [ ] Fail |
| 14 | Reload the page one more time | The notes from steps 3, 5 and 13 are listed; the over-long note from step 12 is still absent | [ ] Pass [ ] Fail |
| 15 | Resize the browser window to a mobile width (e.g. 375px) | The note field, the "Add note" button, and the notes list stay fully visible and readable, with no clipping or overlap, and long note text wraps instead of overflowing | [ ] Pass [ ] Fail |
| 16 | In a separate terminal, run `cd frontend && npm test` | The Vitest suite passes, including the `NoteForm`, `NoteList`, notes API client, and updated `LandingPage` tests | [ ] Pass [ ] Fail |
| 17 | In a separate terminal, run `cd backend && uv run pytest -q` (with the compose `db` service up, so the integration tests reach PostgreSQL on port 5432) | The pytest suite passes, unit and integration tests included | [ ] Pass [ ] Fail |
| 18 | From the repository root, run `npx playwright test e2e/tests/TEST-03_simple_note_form.spec.ts` | The E2E specs pass, covering the three acceptance criteria plus the whitespace-only rejection | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 18 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
