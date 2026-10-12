# UAT Script: FEAT-2 Notes total length endpoint

This feature has no screen in the app. Every check runs against the backend over HTTP with `curl`, plus one test-suite run. JSON bodies are written with spaces for readability; `curl` prints them without spaces, which is the same JSON.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-2-notes-total-length-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`; if a handover rebuild moved the backend to another port, use the backend URL the handover reports instead.
- A terminal with `curl`, and `uv` installed (criterion 3).
- A PostgreSQL reachable through `DATABASE_URL` for the test-suite step (the compose `db` service, or the CLAUDE.md Backing Services recipe).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.
3. Run `curl -s http://localhost:8010/api/health`; it returns a JSON body with a 200, confirming the backend answers on port 8010.

## Steps

### Criterion 1: with no notes stored, `GET /api/notes/total-length` returns 200 with `{"total_length": 0}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/notes` and note every `id` in the array | A JSON array (possibly empty) | [ ] Pass [ ] Fail |
| 2 | For each id, run `curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:8010/api/notes/ID` (ID replaced by the id); skip if the array was empty | `204` each time | [ ] Pass [ ] Fail |
| 3 | Run `curl -s http://localhost:8010/api/notes` | The body is `[]` | [ ] Pass [ ] Fail |
| 4 | Run `curl -s -w "\n%{http_code}\n" http://localhost:8010/api/notes/total-length` | Body `{"total_length": 0}` and status `200` (never `null`) | [ ] Pass [ ] Fail |

### Criterion 2: after creating notes with bodies "ab" and "cde", it returns `{"total_length": 5}`

Prerequisite: the store is empty (Criterion 1 done).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -s -w "\n%{http_code}\n" -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "ab"}'` and note the `id` | Status `201`, body carries `"text": "ab"` and an integer `id` | [ ] Pass [ ] Fail |
| 6 | Run `curl -s -w "\n%{http_code}\n" -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "cde"}'` and note this `id` | Status `201`, body carries `"text": "cde"` and an integer `id` | [ ] Pass [ ] Fail |
| 7 | Run `curl -s http://localhost:8010/api/notes/total-length` | Body `{"total_length": 5}` | [ ] Pass [ ] Fail |
| 8 | Run `curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:8010/api/notes/ID` (the "cde" id from step 6) | `204` | [ ] Pass [ ] Fail |
| 9 | Run `curl -s http://localhost:8010/api/notes/total-length` | Body `{"total_length": 2}` (the total follows the data) | [ ] Pass [ ] Fail |

### Criterion 3: the route does not shadow `GET /api/notes/{id}`, and the full backend suite passes

Prerequisite: the "ab" note from step 5 is stored; use its id as ID below.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `curl -s -w "\n%{http_code}\n" http://localhost:8010/api/notes/total-length` | Status `200` with a `total_length` body, never `422` (a 422 would mean `{note_id}` captured the path) | [ ] Pass [ ] Fail |
| 11 | Run `curl -s -w "\n%{http_code}\n" http://localhost:8010/api/notes/ID` (the "ab" note's id) | Status `200`, body `{"id": ID, "text": "ab"}` | [ ] Pass [ ] Fail |
| 12 | Run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/notes/abc` | `422` (unchanged) | [ ] Pass [ ] Fail |
| 13 | Run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/notes/999999` | `404` (unchanged) | [ ] Pass [ ] Fail |
| 14 | From the repo root, with the PostgreSQL from the prerequisites reachable, run `uv run --directory backend pytest -q` | The summary line reports `0 failed` (no failures and no errors); the run includes `backend/tests/unit/test_note_service_unit.py` and `backend/tests/integration/test_notes_integration.py` | [ ] Pass [ ] Fail |

### Edge case: characters are counted, not bytes

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 15 | Delete every stored note as in Criterion 1 steps 1 to 3, so the store is empty | `GET /api/notes` returns `[]` | [ ] Pass [ ] Fail |
| 16 | Run `curl -s -w "\n%{http_code}\n" -X POST http://localhost:8010/api/notes -H "Content-Type: application/json" -d '{"text": "café"}'` | Status `201`, body carries the text "café" | [ ] Pass [ ] Fail |
| 17 | Run `curl -s http://localhost:8010/api/notes/total-length` | Body `{"total_length": 4}` (4 characters; a byte count would give 5) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 17 (3 criteria; steps 15 to 17 are the edge case) |
| Steps passed | |
| Steps failed | |
| Tester | |
| Date | |
| Overall | [ ] Pass [ ] Fail |
