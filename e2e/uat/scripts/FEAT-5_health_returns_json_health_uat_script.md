# UAT Script, FEAT-5: GET /api/health returns a JSON health

This item has no UI, so each criterion is verified with an HTTP client against the running backend, and criterion 3 by running the tests.

## Prerequisites (all criteria)
- Run from the repository root.
- The stack is up with `docker compose up -d --build`, the `db` service reports healthy in `docker compose ps`, and the backend listens on http://localhost:8010.

## Criterion 1: GET /api/health answers 200 with {"health": "green"}

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/health` | Status line `HTTP/1.1 200 OK`; `content-type` is `application/json` | [ ] | [ ] |
| 1.2 | Read the body of the same response | Carries `"health":"green"`, alongside `"status":"ok"` and a `"database"` object with a host and a port | [ ] | [ ] |
| 1.3 | Run `docker compose stop db`, then `curl -i http://localhost:8010/api/health` | Status line `HTTP/1.1 503 Service Unavailable`; body carries `"status":"degraded"` and `"health":"red"` | [ ] | [ ] |
| 1.4 | Run `docker compose start db` | The database is running again (restores the environment) | [ ] | [ ] |

## Criterion 2: POST /api/health answers 405 with {"detail": "Method Not Allowed"}

Prerequisite: the backend is running as above (the database is not needed).

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -i -X POST http://localhost:8010/api/health` | Status line `HTTP/1.1 405 Method Not Allowed`; an `allow` header reads `GET` | [ ] | [ ] |
| 2.2 | Read the body of the same response | Exactly `{"detail":"Method Not Allowed"}` | [ ] | [ ] |
| 2.3 | Run `curl -i -X POST -H "Content-Type: application/json" -d '{"x": 1}' http://localhost:8010/api/health` | The same 405 status and the same `{"detail":"Method Not Allowed"}` body; a request body changes nothing | [ ] | [ ] |

## Criterion 3: A pytest in backend/tests covers both responses

Prerequisites: backend dependencies installed (`uv sync --directory backend`), and a PostgreSQL reachable through DATABASE_URL (for example the compose `db` service, with DATABASE_URL taken from .env.example), because the 200 test runs against a real database and skips without one outside CI.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `backend/tests/integration/test_health_integration.py` | Contains a test asserting GET /api/health returns 200 with `"health": "green"`, and tests asserting POST /api/health returns 405 with exactly `{"detail": "Method Not Allowed"}` (with and without a JSON body) | [ ] | [ ] |
| 3.2 | Run `uv run --directory backend pytest -q -rs tests/integration/test_health_integration.py tests/unit/test_health_service_unit.py` | The summary line reports `0 failed` for `test_health_integration.py` and `test_health_service_unit.py`, and the `-rs` report lists no skipped test (a skip means DATABASE_URL was not set and criterion 1's test did not run) | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. GET /api/health answers 200 with `{"health": "green"}` | 1.1 to 1.4 | [ ] Pass [ ] Fail |
| 2. POST /api/health answers 405 with `{"detail": "Method Not Allowed"}` | 2.1 to 2.3 | [ ] Pass [ ] Fail |
| 3. A pytest in backend/tests covers both responses | 3.1 to 3.2 | [ ] Pass [ ] Fail |

Tester: ____________  Date: ____________
