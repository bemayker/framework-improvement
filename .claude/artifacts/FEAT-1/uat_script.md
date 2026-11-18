# UAT Script: FEAT-1 Server time endpoint

This item has no UI. Criteria 1 to 3 are verified against the running API with a browser address bar or a terminal; criterion 4 by running the tests.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (the backend's host port, from `docker-compose.yml`).
- A terminal with `curl` and `date`, and a browser.
- Criterion 4 only: `uv` installed on the host; no database is needed for those test files.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a browser, open `http://localhost:8010/api/time` | The page shows a JSON object with exactly two keys, `now` and `timezone` | [ ] Pass [ ] Fail |
| 2 | Read `timezone` | Its value is the string `UTC` | [ ] Pass [ ] Fail |
| 3 | In a terminal, run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/time` | It prints `200` | [ ] Pass [ ] Fail |
| 4 | Edge case: run `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8010/api/time` | It prints `405` | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive

Prerequisites: as for criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Open `http://localhost:8010/api/time` and note the `now` value | It looks like `2026-11-18T00:48:50.123456+00:00` and ends in exactly `+00:00` (not `Z`, and never without an offset) | [ ] Pass [ ] Fail |
| 6 | Wait about one second and reload the page | `now` has a later value than in step 5, still ending in `+00:00` | [ ] Pass [ ] Fail |
| 7 | Compare the date and time in `now` with the current UTC time (run `date -u` in a terminal) | They agree to within a few seconds, which shows the value is UTC and not the machine's local time | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: as for criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` and expand `GET /api/time` | The 200 response's schema is named `ServerTimeResponse`, with fields `now` (shown as a plain `string`, with the description "Server time, ISO 8601 in UTC, always ending +00:00 (never Z).") and `timezone` (`UTC`). `now` is not labelled `date-time`: its serializer returns a string, so the OpenAPI schema has no `date-time` format | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/server_time.py` in the repository | It defines `class ServerTimeResponse(BaseModel)` with the `+00:00` choice stated in the module | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/routers/server_time.py` | The handler declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse`, not a dict literal | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

Prerequisites: a checkout of this branch with `uv` installed; no database is needed for these files.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | From the repo root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | The run passes: its summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 12 | Read the test names in those files | They include the shape test (`test_server_time_response_dumps_now_and_timezone_only`), the offset test (`test_server_time_response_serialises_now_with_plus_zero_offset`) and the freshness test (`test_get_time_computes_now_per_request`) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
