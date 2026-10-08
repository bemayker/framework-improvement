# UAT Script: TEST-15 Count notes

This feature has no screen in the app. Every check runs against the backend over HTTP with `curl`, plus one test-suite run.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-15-count-notes` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`; if a handover rebuild moved the backend to another port, use the backend URL the handover reports instead.
- An empty `notes` table at the start (a fresh database), so criterion 1 can be checked. If notes already exist, delete them first with `DELETE /api/notes/{id}` for each id listed by `GET /api/notes`.
- A terminal with `curl`, and `uv` installed (criterion 3).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.
3. Run `curl -s http://localhost:8010/api/health`; it returns a JSON body with a 200, confirming the backend answers on port 8010.

## Steps

### Criterion 1: with no notes stored, `GET /api/notes/count` returns 200 with `{"count": 0}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/notes` | The body is `[]` (no notes stored) | [ ] Pass [ ] Fail |
| 2 | Run `curl -s -i http://localhost:8010/api/notes/count` | Status line `HTTP/1.1 200 OK` and body exactly `{"count":0}` | [ ] Pass [ ] Fail |

### Criterion 2: after creating two notes the count is 2, and after deleting one it is 1

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "Buy milk"}'` and note the `id` value | A 201 body such as `{"id": 7, "text": "Buy milk"}` (7 is an example id) | [ ] Pass [ ] Fail |
| 4 | Run `curl -s -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "Walk dog"}'` | A 201 body such as `{"id": 8, "text": "Walk dog"}` | [ ] Pass [ ] Fail |
| 5 | Run `curl -s -i http://localhost:8010/api/notes/count` | `HTTP/1.1 200 OK` with body `{"count":2}` | [ ] Pass [ ] Fail |
| 6 | Run `curl -s -i -X DELETE http://localhost:8010/api/notes/7` (use the id from step 3) | `HTTP/1.1 204 No Content` and no body | [ ] Pass [ ] Fail |
| 7 | Run `curl -s -i http://localhost:8010/api/notes/count` | `HTTP/1.1 200 OK` with body `{"count":1}` | [ ] Pass [ ] Fail |
| 8 | Run `curl -s -i -X DELETE http://localhost:8010/api/notes/999999` (edge case: a delete that misses) | `HTTP/1.1 404 Not Found` with body `{"detail":"Note not found"}` | [ ] Pass [ ] Fail |
| 9 | Run `curl -s http://localhost:8010/api/notes/count` (edge case) | The body is still `{"count":1}` (a failed delete changes nothing) | [ ] Pass [ ] Fail |

### Criterion 3: the route does not shadow `GET /api/notes/{id}`, and the full backend suite passes

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `curl -s -i http://localhost:8010/api/notes/count` | `HTTP/1.1 200 OK` with a `count` field, not a 422 (the `{note_id}` route did not capture `count`) | [ ] Pass [ ] Fail |
| 11 | Run `curl -s -i http://localhost:8010/api/notes/8` (the id from step 4) | `HTTP/1.1 200 OK` with body `{"id":8,"text":"Walk dog"}` | [ ] Pass [ ] Fail |
| 12 | Run `curl -s -i http://localhost:8010/api/notes/999999` | `HTTP/1.1 404 Not Found` with body `{"detail":"Note not found"}` (the id route still answers a miss) | [ ] Pass [ ] Fail |
| 13 | Run `curl -s -i http://localhost:8010/api/notes/abc` | `HTTP/1.1 422 Unprocessable Entity` (the id route still validates a non-integer segment) | [ ] Pass [ ] Fail |
| 14 | With a PostgreSQL reachable through `DATABASE_URL` (the compose `db` service on `postgresql://tasknotes:tasknotes@localhost:5442/tasknotes`, or the CLAUDE.md Backing Services recipe), run `uv run --directory backend pytest -q` | The summary line reports `0 failed` (no failures and no errors) across the whole backend suite, which includes `backend/tests/unit/test_note_service_unit.py` and `backend/tests/integration/test_notes_integration.py` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 (3 criteria; steps 8 and 9 are edge cases) |
| Steps passed | |
| Steps failed | |
| Tester | |
| Date | |
| Overall | [ ] Pass [ ] Fail |
