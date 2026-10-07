# UAT Script: TEST-14 Delete a note by id

This feature has no screen in the app. Every check runs against the backend over HTTP with `curl`, plus one test-suite run.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-14-delete-note-by-id` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`; if a handover rebuild moved the backend to another port, use the backend URL the handover reports instead.
- A terminal with `curl`, and `uv` installed (criterion 3).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.
3. Run `curl -s http://localhost:8010/api/health`; it returns a JSON body with a 200, confirming the backend answers on port 8010.

## Steps

### Criterion 1: deleting a stored note returns 204, and `GET /api/notes` no longer lists it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "Buy milk"}'` and note the `id` value | A 201 body such as `{"id": 7, "text": "Buy milk"}` (7 is an example id) | [ ] Pass [ ] Fail |
| 2 | Run `curl -s -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "Walk dog"}'` | A 201 body such as `{"id": 8, "text": "Walk dog"}` | [ ] Pass [ ] Fail |
| 3 | Run `curl -s http://localhost:8010/api/notes` | The list contains both `{"id": 7, "text": "Buy milk"}` and `{"id": 8, "text": "Walk dog"}` | [ ] Pass [ ] Fail |
| 4 | Run `curl -s -i -X DELETE http://localhost:8010/api/notes/7` (use the id from step 1) | Status line `HTTP/1.1 204 No Content` and no body after the headers | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/notes` | `{"id": 8, "text": "Walk dog"}` is still listed and no entry has id 7 | [ ] Pass [ ] Fail |
| 6 | Run `curl -s -i http://localhost:8010/api/notes/7` | `HTTP/1.1 404 Not Found` with body `{"detail": "Note not found"}` | [ ] Pass [ ] Fail |

### Criterion 2: deleting an id that does not exist returns 404 with `{"detail": "Note not found"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -s http://localhost:8010/api/notes` | No note in the list has id `999999` (a fresh database never reaches it) | [ ] Pass [ ] Fail |
| 8 | Run `curl -s -i -X DELETE http://localhost:8010/api/notes/999999` | Status line `HTTP/1.1 404 Not Found` and body exactly `{"detail": "Note not found"}` | [ ] Pass [ ] Fail |
| 9 | Run `curl -s -i -X DELETE http://localhost:8010/api/notes/7` again (the id deleted under criterion 1, edge case) | `HTTP/1.1 404 Not Found` with body `{"detail": "Note not found"}` | [ ] Pass [ ] Fail |
| 10 | Run `curl -s -i -X DELETE http://localhost:8010/api/notes/99999999999999999999` (edge case) | `HTTP/1.1 404 Not Found` with body `{"detail": "Note not found"}`, not a 500 | [ ] Pass [ ] Fail |
| 11 | Run `curl -s http://localhost:8010/api/notes` | The list is unchanged from step 7 (a miss deletes nothing) | [ ] Pass [ ] Fail |

### Criterion 3: the full backend test suite passes with the new tests included

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | With a PostgreSQL reachable through `DATABASE_URL` (the compose `db` service on `postgresql://tasknotes:tasknotes@localhost:5442/tasknotes`, or the CLAUDE.md Backing Services recipe), run `uv run --directory backend pytest -q` | The summary line reports `0 failed` (no failures and no errors) across the whole backend suite, which includes `backend/tests/unit/test_note_service_unit.py` and `backend/tests/integration/test_notes_integration.py` | [ ] Pass [ ] Fail |
| 13 | Run `uv run --directory backend pytest -q tests/unit/test_note_service_unit.py tests/integration/test_notes_integration.py -k delete` | The new delete tests are collected (the collected count is not zero) and the summary reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 (3 criteria; steps 9 and 10 are edge cases) |
| Steps passed | |
| Steps failed | |
| Tester | |
| Date | |
| Overall | [ ] Pass [ ] Fail |
