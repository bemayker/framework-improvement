# UAT Script: FEAT-4 GET /api/ping returns a JSON status

Backend-only feature: no screen consumes `/api/ping`, so each check is a terminal curl or a test run.

## Prerequisites

- Docker running; repository on branch `feature/FEAT-4-ping-returns-json-status` (or main once merged).
- From the repository root run `docker compose up -d --build`, then `docker compose ps` until the backend service shows running.
- The backend answers on `http://localhost:8010` (published by `docker-compose.yml`).
- For Criterion 3: `uv` installed and backend dependencies synced (`uv sync --directory backend`); no database is needed for those test files.

## Criterion 1: GET /api/ping answers 200 with {"status": "ok", "service": "backend"}

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i http://localhost:8010/api/ping` | First response line is `HTTP/1.1 200 OK`; content-type header is `application/json` | [ ] | [ ] |
| 1.2 | Read the body under the headers | Exactly `{"status":"ok","service":"backend"}`, with no other field | [ ] | [ ] |

## Criterion 2: POST /api/ping answers 405 with {"detail": "Method Not Allowed"}

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -i -X POST http://localhost:8010/api/ping` | Status line is `HTTP/1.1 405 Method Not Allowed`; an `allow` header reads `GET` | [ ] | [ ] |
| 2.2 | Read the body under the headers | Exactly `{"detail":"Method Not Allowed"}` | [ ] | [ ] |
| 2.3 | Edge case: run `curl -i -X POST -H "Content-Type: application/json" -d '{"x": 1}' http://localhost:8010/api/ping` | Same 405 status and the same `{"detail":"Method Not Allowed"}` body; a request body changes nothing | [ ] | [ ] |

## Criterion 3: A pytest in backend/tests covers both responses

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `backend/tests/integration/test_ping_integration.py` | One test asserting GET /api/ping returns 200 with the exact status body, and one asserting POST /api/ping returns 405 with the exact detail body | [ ] | [ ] |
| 3.2 | From the repository root run `uv run --directory backend pytest -q tests/integration/test_ping_integration.py tests/unit/test_ping_unit.py tests/unit/test_main_unit.py` | Summary line reports `0 failed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. GET 200 with the status body | 1.1 to 1.2 | [ ] Pass [ ] Fail |
| 2. POST 405 with the detail body | 2.1 to 2.3 | [ ] Pass [ ] Fail |
| 3. Pytest covers both responses | 3.1 to 3.2 | [ ] Pass [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass [ ] Fail
