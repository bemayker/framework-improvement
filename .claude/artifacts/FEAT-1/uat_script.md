# UAT Script: FEAT-1 Server time endpoint

This item has no UI: every criterion is verified against the running backend's HTTP response, its OpenAPI page or its test suite, which are the observable checks.

## Prerequisites

- Repository checked out locally on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- `uv` installed and the backend dependencies synced.
- A terminal with `curl` and `date`.
- No other process bound to host port `8000`.
- No database is needed by this endpoint, but the app's startup schema initialisation runs when `DATABASE_URL` is set and fails if that database is unreachable. Start the backend with `DATABASE_URL` unset (below), or with a reachable database.

## Test Environment Setup

1. From the repository root, run in one terminal and leave it running:
   ```bash
   env -u DATABASE_URL uv run --directory backend uvicorn app.main:app --port 8000
   ```
2. The server logs a warning that schema initialisation was skipped because `DATABASE_URL` is not set. That is expected.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `now` and `timezone: "UTC"`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a second terminal, run `curl -i http://localhost:8000/api/time` | The first response line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly two keys: `now` (for example `2026-10-30T15:39:23.123456+00:00`) and `timezone` with the value `UTC`, and nothing else | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, UTC with an explicit offset, never naive

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8000/api/time`, wait about one second, run it again | Two bodies whose `now` values differ, the second later than the first by roughly one second | [ ] Pass [ ] Fail |
| 4 | Read the end of each `now` value | Each ends with exactly `+00:00`: not `Z`, not another offset, and never without an offset | [ ] Pass [ ] Fail |
| 5 | Run `date -u` in the same terminal and compare it with the time part of a fresh `now` | They match to within a second or two: the value is UTC, not the machine's local time | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Open `http://localhost:8000/docs` in a browser and expand `GET /api/time` | The 200 response's schema is named `ServerTimeResponse`, with a `now` string property and a `timezone` property whose value is `UTC` | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` | The schema file defines `class ServerTimeResponse(BaseModel)` with a docstring stating the `+00:00` suffix; the router returns `ServerTimeResponse(...)`, not a dict | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover shape, offset and freshness

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | The summary reports `0 failed` | [ ] Pass [ ] Fail |
| 9 | Open `backend/tests/unit/test_server_time_unit.py` and `backend/tests/integration/test_server_time_integration.py` | There is a test asserting the body's keys, one asserting the exact `+00:00` suffix, and one asserting two calls return different `now` values | [ ] Pass [ ] Fail |

### Edge case: a non-GET method is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `curl -i -X POST http://localhost:8000/api/time` | The first response line reads `HTTP/1.1 405 Method Not Allowed` and the body carries no `now` value | [ ] Pass [ ] Fail |

## Cleanup

Stop the backend started in Test Environment Setup with Ctrl-C.

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 (9 criterion steps, 1 edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
