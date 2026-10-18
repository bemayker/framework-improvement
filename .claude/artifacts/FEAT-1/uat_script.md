# UAT Script: FEAT-1 Server time endpoint

Backend-only feature: no screen consumes `/api/time`, so each check is a terminal curl, a browser address bar on the JSON URL, the API docs page, or a file read.

## Prerequisites

- Docker running; repository on branch `feature/FEAT-1-server-time-endpoint` (or main once merged).
- From the repository root run `docker compose up -d --build`, then `docker compose ps` until the backend service shows running.
- The backend answers on `http://localhost:8010` (published by `docker-compose.yml`).
- For Criterion 4: `uv` installed and backend dependencies synced (`uv sync --directory backend`); no database is needed for those test files.

## Criterion 1: GET /api/time returns 200 with `now` (ISO 8601 UTC, explicit offset) and `timezone` equal to UTC

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i http://localhost:8010/api/time` | First response line is `HTTP/1.1 200 OK`; content-type header is `application/json` | [ ] | [ ] |
| 1.2 | Read the body under the headers | Exactly two fields, `now` and `timezone`, nothing else; `timezone` is the string `UTC` | [ ] | [ ] |
| 1.3 | Read the `now` value | Shape like `2026-10-19T09:15:03.123456+00:00`; ends with `+00:00`, never `Z`, never without an offset; matches the current UTC time from `date -u` to within a few seconds | [ ] | [ ] |
| 1.4 | Open `http://localhost:8010/api/time` in a browser address bar | Same two-field JSON; `timezone` is `UTC` and `now` ends with `+00:00` | [ ] | [ ] |

## Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://localhost:8010/api/time` and note `now` | A timestamp ending `+00:00` | [ ] | [ ] |
| 2.2 | Wait at least one second, run the same command again, note `now` | Differs from 2.1 and is about one second or more later; also ends `+00:00` | [ ] | [ ] |
| 2.3 | Refresh `http://localhost:8010/api/time` in the browser three times | `now` changes on each refresh and never loses its `+00:00` suffix | [ ] | [ ] |
| 2.4 | Edge case: run `curl -i -X POST http://localhost:8010/api/time` | Status line is `405 Method Not Allowed` | [ ] | [ ] |

## Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `backend/app/schemas/server_time.py` | `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` and `timezone: Literal["UTC"]`, and a JSON-mode serializer on `now` whose docstring says it emits `+00:00`, not `Z` | [ ] | [ ] |
| 3.2 | Open `backend/app/routers/server_time.py` | Decorator declares `response_model=ServerTimeResponse`, imported from `app.schemas.server_time`; handler returns a `ServerTimeResponse(...)` instance, not a dict; it reads `datetime.now(timezone.utc)` itself; no services module is imported | [ ] | [ ] |
| 3.3 | Open `backend/app/main.py` | The server_time router import sits between the notes and uptime imports, and `app.include_router(server_time_router)` is the last registration, after the uptime one | [ ] | [ ] |
| 3.4 | Open `http://localhost:8010/docs` and expand `GET /api/time` | The 200 response schema is `ServerTimeResponse` with fields `now` (string, date-time) and `timezone` (string, UTC) | [ ] | [ ] |

## Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` | `0 failed` across those three files | [ ] | [ ] |
| 4.2 | Open `backend/tests/unit/test_server_time_unit.py` | A test asserting the exact serialised `now` string for a fixed instant, ending `+00:00`; a test for the two-field shape; a test that a naive `now` is rejected | [ ] | [ ] |
| 4.3 | Open `backend/tests/integration/test_server_time_integration.py` | A test asserting the live `now` ends with `+00:00` and the body has exactly `now` and `timezone`; a test making two calls one second apart asserting the two `now` values differ | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. 200, `now` ISO 8601 UTC with offset, `timezone` UTC | 1.1 to 1.4 | [ ] Pass [ ] Fail |
| 2. `now` per request, UTC offset, never naive | 2.1 to 2.4 | [ ] Pass [ ] Fail |
| 3. Pydantic schema defines the body | 3.1 to 3.4 | [ ] Pass [ ] Fail |
| 4. Unit and integration tests | 4.1 to 4.3 | [ ] Pass [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass [ ] Fail
