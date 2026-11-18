# UAT Script: FEAT-1 Server time endpoint

FEAT-1 adds no screen, so no acceptance criterion is verifiable through the UI. Every step below is an HTTP request or a test run against the backend.

## Prerequisites

- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- `uv` installed and backend dependencies synced: `uv sync --directory backend`.
- The backend running locally: `uv run --directory backend uvicorn app.main:app --port 8000`. No database is needed for this endpoint.
- No other process bound to port `8000`.
- A terminal with `curl` and `date`; a browser for criterion 3.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -s -i http://localhost:8000/api/time` | The status line reads `HTTP/1.1 200 OK` and `content-type` is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | It has exactly two keys, `now` and `timezone`, and `timezone` is `"UTC"` | [ ] Pass [ ] Fail |
| 3 | Run `curl -s -i -X POST http://localhost:8000/api/time` | The status line reads `405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8000/api/time`, wait about one second, run it again | The two `now` values differ, and the second is later than the first | [ ] Pass [ ] Fail |
| 5 | Read the end of each `now` value from step 4 | Both end in `+00:00`; neither ends in `Z` and neither lacks an offset | [ ] Pass [ ] Fail |
| 6 | Run `curl -s http://localhost:8000/api/time` and, at the same moment, `date -u +%Y-%m-%dT%H:%M:%S` | The date and time of `now` agree with the `date` output to within a second or two | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8000/docs` in a browser and expand `GET /api/time` | The 200 response shows the schema `ServerTimeResponse` with fields `now` (string, date-time) and `timezone` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/server_time.py` | The handler returns a `ServerTimeResponse`, not a dict literal, and `ServerTimeResponse` is imported from `app.schemas.server_time` | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | The run passes: the summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |
| 10 | Run the same command with `-v` and read the test names | They include `test_get_time_computes_now_per_request`, `test_get_time_now_ends_with_plus_zero_offset` and `test_server_time_response_serializes_now_with_plus_zero_offset_suffix` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
