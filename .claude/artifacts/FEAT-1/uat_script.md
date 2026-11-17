# UAT Script: FEAT-1 Server time endpoint

This feature has no UI, so no criterion can be verified by clicking through the app. Each block below uses the API directly from a terminal with `curl`, which is the observable check.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- No root `.env` file is required: `docker-compose.yml` carries usable defaults and sets the backend's `DATABASE_URL` itself.
- A terminal with `curl` and `date`.
- Criterion 4 only: `uv` installed on the host. No database is needed for the test files named there.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `now` and `timezone: UTC`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -i http://localhost:8010/api/time` | The status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | It has exactly two keys, `now` and `timezone`, and `timezone` is the string `UTC`, for example `{"now":"2026-11-17T00:30:43.123456+00:00","timezone":"UTC"}` | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/time`, wait one second, run it again | The two `now` values differ, the second later than the first by about one second | [ ] Pass [ ] Fail |
| 4 | Look at the end of each `now` value | Both end in exactly `+00:00`, never `Z`, and have six digits after the decimal point | [ ] Pass [ ] Fail |
| 5 | In the same terminal, run `date -u +%Y-%m-%dT%H:%M` straight after a request | Its output equals the first 16 characters (date, hour and minute) of the latest `now`; the server reports UTC, not local time. If the minute rolled over between the two commands, repeat both | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` | Its 200 response shows the schema `ServerTimeResponse` with field `now` (string, date-time) and field `timezone` (string, only value `UTC`) | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` | The schema file defines `class ServerTimeResponse(BaseModel)` and its docstring names the `+00:00` format; the router returns a `ServerTimeResponse`, not a dict | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 9 | Open `backend/tests/integration/test_server_time_integration.py` and `backend/tests/unit/test_server_time_schema_unit.py` | The integration file contains `test_get_time_now_ends_with_plus_00_00_offset` and `test_get_time_computes_now_per_request`; the unit file contains `test_server_time_response_serialises_now_with_plus_00_00_suffix` | [ ] Pass [ ] Fail |

### Edge case: a wrong method

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8010/api/time` | It prints `405` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 (9 from the plan, 1 edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
