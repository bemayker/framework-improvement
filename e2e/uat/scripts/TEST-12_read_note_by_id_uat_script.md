# UAT Script: TEST-12 Read one note by id

This feature has no screen in the app. Every check runs against the backend over HTTP with `curl`, plus one test-suite run.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-12-read-note-by-id` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`; if a handover rebuild moved the backend to another port, use the backend URL the handover reports instead.
- A terminal with `curl`, and `uv` installed (criterion 4).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.
3. Run `curl -s http://localhost:8010/api/health`; it returns a JSON body with a 200, confirming the backend answers on port 8010.

## Steps

### Criterion 1: for a stored note, `GET /api/notes/{id}` returns 200 with `{"id": ..., "text": ...}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "Buy milk"}'` and note the `id` value | A 201 body such as `{"id": 7, "text": "Buy milk"}` (7 is an example id) | [ ] Pass [ ] Fail |
| 2 | Run `curl -s -i http://localhost:8010/api/notes/7` (use the id from step 1) | Status line `HTTP/1.1 200 OK` and body exactly `{"id": 7, "text": "Buy milk"}` | [ ] Pass [ ] Fail |
| 3 | Run `curl -s -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "  Walk dog  "}'`, note the returned id (say 8), then run `curl -s http://localhost:8010/api/notes/8` | Body `{"id": 8, "text": "Walk dog"}`: the stored (trimmed) text, and not the note from step 1 | [ ] Pass [ ] Fail |

### Criterion 2: for an id that does not exist, it returns 404 with `{"detail": "Note not found"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/notes` | No note in the list has id `999999` (a fresh database never reaches it) | [ ] Pass [ ] Fail |
| 5 | Run `curl -s -i http://localhost:8010/api/notes/999999` | Status line `HTTP/1.1 404 Not Found` and body exactly `{"detail": "Note not found"}` | [ ] Pass [ ] Fail |
| 6 | Run `curl -s -i http://localhost:8010/api/notes/0` (edge case) | `HTTP/1.1 404 Not Found` with body `{"detail": "Note not found"}`; zero is an integer, so it is a miss, not a validation error | [ ] Pass [ ] Fail |
| 7 | Run `curl -s -i http://localhost:8010/api/notes/99999999999999999999` (edge case) | `HTTP/1.1 404 Not Found` with body `{"detail": "Note not found"}`, not a 500 | [ ] Pass [ ] Fail |

### Criterion 3: a non-integer id returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Run `curl -s -i http://localhost:8010/api/notes/abc` | Status line `HTTP/1.1 422 Unprocessable Entity` (some servers print `422 Unprocessable Content`) and a JSON body whose `detail[0].loc` is `["path", "note_id"]` | [ ] Pass [ ] Fail |
| 9 | Run `curl -s -i http://localhost:8010/api/notes/1.5` (edge case) | `422` with the same `loc` `["path", "note_id"]` | [ ] Pass [ ] Fail |

### Criterion 4: the full backend test suite passes with the new tests included

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | With a PostgreSQL reachable through `DATABASE_URL` (the compose `db` service on `postgresql://tasknotes:tasknotes@localhost:5442/tasknotes`, or the CLAUDE.md Backing Services recipe), run `uv run --directory backend pytest -q` | The summary line reports `0 failed` (no failures and no errors) across the whole backend suite, which includes `backend/tests/unit/test_note_service_unit.py` and `backend/tests/integration/test_notes_integration.py` | [ ] Pass [ ] Fail |
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_note_service_unit.py tests/integration/test_notes_integration.py -k get_note` | The new `get_note` tests are collected (the collected count is not zero) and the summary reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 (4 criteria; steps 6, 7 and 9 are edge cases) |
| Steps passed | |
| Steps failed | |
| Tester | |
| Date | |
| Overall | [ ] Pass [ ] Fail |
