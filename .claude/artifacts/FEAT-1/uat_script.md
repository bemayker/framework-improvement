# UAT Script: FEAT-1 Server time endpoint

No acceptance criterion is verifiable through the UI: the feature adds one API endpoint and no frontend consumes it, so the observable check is the HTTP response itself, read with `curl`. Criterion 3 also reads two source files and the generated API docs; criterion 4 runs the tests.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010`, the backend port `docker-compose.yml` publishes.
- No root `.env` file is required: `docker-compose.yml` carries usable defaults for every variable it substitutes.
- A terminal with `curl` and `date`.
- Criterion 4 only: `uv` installed on the host.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC, +00:00>", "timezone": "UTC"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly two keys, for example `{"now":"2026-11-23T10:14:34.123456+00:00","timezone":"UTC"}`. `timezone` is the string `UTC` | [ ] Pass [ ] Fail |
| 3 | Look at the end of the `now` value | It ends in `+00:00`, not `Z` and not a bare time with no offset | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/time`, wait about one second, then run it again | Two response bodies | [ ] Pass [ ] Fail |
| 5 | Compare the two `now` values | They differ, and the second is about one second later than the first | [ ] Pass [ ] Fail |
| 6 | Run `date -u` in the same terminal and compare its hour with the hour in `now` | The hours match: the value is UTC, not the server's local time, and it ends in `+00:00`. If the check straddles an hour boundary, repeat it | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` | The 200 response's schema is named `ServerTimeResponse`, with the fields `now` (string) and `timezone` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/schemas/server_time.py` in the editor | It defines `class ServerTimeResponse(BaseModel)`, and its docstring states the `+00:00` offset choice | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/routers/server_time.py` | The handler returns `ServerTimeResponse(...)` and builds no dict literal | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

Prerequisite: the repository checked out at this branch, with `uv` installed. No database is needed.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` | The run passes: its summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |
| 11 | Open `backend/tests/integration/test_server_time_integration.py` | It contains `test_get_time_returns_200_with_now_and_utc_timezone` (shape), `test_get_time_now_ends_with_plus_00_00_offset` (offset) and `test_get_time_now_is_computed_per_request` (freshness) | [ ] Pass [ ] Fail |

### Edge case: a POST to `/api/time` is rejected

Covers the corresponding Gherkin scenario and the integration test `test_post_time_returns_405`.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `curl -i -X POST http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 405 Method Not Allowed` and the body has no `now` field | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 (11 acceptance steps, 1 edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
