# UAT Script: FEAT-1 Server time endpoint

This feature has no UI. Each criterion is verified with an HTTP client against the running backend, by reading the OpenAPI document or the code, or by running the tests.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database). Both mappings come from `docker-compose.yml`. Substitute the port in the commands below if your stack runs elsewhere.
- A terminal with `curl` and `date`.
- Step 11 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`). The tests need no database.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `curl -i http://localhost:8010/api/version` until it answers `200`.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/time` | The status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | One JSON object with exactly two keys, for example `{"now":"2026-11-27T14:13:48.123456+00:00","timezone":"UTC"}`, and no other keys | [ ] Pass [ ] Fail |
| 3 | Check `timezone` | Its value is exactly `UTC` | [ ] Pass [ ] Fail |
| 4 | Check `now` | It is an ISO 8601 date-time (date, `T`, time), within a few seconds of the current UTC time shown by `date -u` in the same terminal | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` | Two JSON bodies print | [ ] Pass [ ] Fail |
| 6 | Compare the two `now` values | They differ, and the second is about one second later than the first | [ ] Pass [ ] Fail |
| 7 | Look at the end of each `now` value | Each ends with exactly `+00:00`. Neither ends with `Z`, and neither has no offset at all | [ ] Pass [ ] Fail |
| 8 | Edge case: run `curl -i -X POST http://localhost:8010/api/time` | The status line reads `HTTP/1.1 405 Method Not Allowed` (the endpoint is read-only) | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router

Not verifiable through a UI. Check it in the API's own schema document and in the code.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` | The 200 response's schema is `ServerTimeResponse`, with the fields `now` (a string) and `timezone` (a string fixed to `UTC`) | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/routers/server_time.py` and `backend/app/schemas/server_time.py` | The route declares `response_model=ServerTimeResponse` and the handler returns a `ServerTimeResponse(...)`, with no dict literal. The schema file defines `ServerTimeResponse` and `UTC_OFFSET_SUFFIX = "+00:00"` | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness

Not a UI behaviour. The observable check is a passing test run.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | From the repo root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | The summary line reports no failed and no errored test, and the command exits 0 | [ ] Pass [ ] Fail |
| 12 | Open `backend/tests/unit/test_server_time_unit.py` and `backend/tests/integration/test_server_time_integration.py` | Each contains a test asserting the response shape, a test asserting the exact `+00:00` suffix, and a test asserting that `now` differs across calls | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
