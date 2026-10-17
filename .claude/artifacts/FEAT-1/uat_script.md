# UAT Script: FEAT-1 Server time endpoint

No criterion is verifiable through the application UI: no frontend screen calls `GET /api/time`. Each check is an HTTP request made with `curl` or a browser address bar. The backend answers on `http://localhost:8010`, the host port `docker-compose.yml` publishes for the `backend` service.

## Prerequisites

- Docker running; repository on branch `feature/FEAT-1-server-time-endpoint`.
- From the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running.
- A terminal with `curl`; a browser. `uv` installed for Criterion 4 (no database needed for those test files).

## Criterion 1: GET /api/time returns 200 with now and timezone

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i http://localhost:8010/api/time`, read the first response line | `HTTP/1.1 200 OK` | [ ] | [ ] |
| 1.2 | Read the `content-type` header | `application/json` | [ ] | [ ] |
| 1.3 | Read the response body | JSON object with exactly two keys, `now` and `timezone` | [ ] | [ ] |
| 1.4 | Read `timezone` | the string `UTC` | [ ] | [ ] |
| 1.5 | Read `now` | quoted string like `2026-10-17T09:15:02.123456+00:00`: date, `T`, time, offset `+00:00` | [ ] | [ ] |
| 1.6 | Open `http://localhost:8010/api/time` in a browser address bar | the page shows the same two-key JSON object | [ ] | [ ] |

## Criterion 2: now is computed per request, UTC, explicit offset, never naive

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` | two JSON lines are printed | [ ] | [ ] |
| 2.2 | Compare the two `now` values | they differ; the second is about one second later | [ ] | [ ] |
| 2.3 | Read the end of each `now` string | both end in `+00:00`: not `Z`, not offset-less | [ ] | [ ] |
| 2.4 | Run `curl -s http://localhost:8010/api/time` then immediately `date -u +%Y-%m-%dT%H:%M:%S` | date and time in `now` match the UTC clock within a couple of seconds | [ ] | [ ] |
| 2.5 | Repeat step 2.1 three more times | every call returns a new `now`; never the same across calls a second apart | [ ] | [ ] |

## Criterion 3: response body is a Pydantic schema, not a bare dict

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `http://localhost:8010/docs` and expand `GET /api/time` | 200 response schema is `ServerTimeResponse`, with `now` (string, date-time) and `timezone` (string), both required | [ ] | [ ] |
| 3.2 | Open `backend/app/schemas/server_time.py` | defines `class ServerTimeResponse(BaseModel)` with `now` and `timezone`, and a comment stating the `+00:00` offset choice | [ ] | [ ] |
| 3.3 | Open `backend/app/routers/server_time.py` | route decorator names `response_model=ServerTimeResponse`; handler returns a `ServerTimeResponse`, not a dict literal; no import from `app.services` | [ ] | [ ] |

## Criterion 4: unit and integration tests cover shape, offset and freshness

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_schema_unit.py tests/unit/test_server_time_router_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` | summary line reports `0 failed` | [ ] | [ ] |
| 4.2 | Open `backend/tests/unit/test_server_time_schema_unit.py` | a test asserts the full serialised `now` string ending in `+00:00` | [ ] | [ ] |
| 4.3 | Open `backend/tests/unit/test_server_time_router_unit.py` | a test calls the handler twice with a stubbed clock and asserts the two `now` values differ | [ ] | [ ] |
| 4.4 | Open `backend/tests/integration/test_server_time_integration.py` | tests assert the 200 shape, the `+00:00` suffix (not `Z`), and two calls one second apart returning different values | [ ] | [ ] |

## Edge case: non-GET method is rejected

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| E.1 | Run `curl -i -X POST http://localhost:8010/api/time` | first response line is `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|-----------|-------|--------|--------|
| 1 Shape and 200 | 1.1 to 1.6 | | |
| 2 Fresh, UTC, offset | 2.1 to 2.5 | | |
| 3 Pydantic schema | 3.1 to 3.3 | | |
| 4 Tests | 4.1 to 4.4 | | |
| Edge: 405 on POST | E.1 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
