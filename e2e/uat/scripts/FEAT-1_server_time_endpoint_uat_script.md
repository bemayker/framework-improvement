# UAT Script: FEAT-1 Server time endpoint

None of the four criteria can be verified through the application UI: FEAT-1 is a backend endpoint with no frontend. Each block gives the observable check instead, through a terminal and the backend's own OpenAPI page.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- A terminal with `curl` and `date`, and a browser.
- Criterion 4 only: `uv` installed on the host.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `now` and `timezone`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/time` | The status line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | Exactly two keys: `now` (a timestamp such as `2026-11-24T04:38:10.123456+00:00`) and `timezone` with the value `UTC` | [ ] Pass [ ] Fail |
| 3 | Run `curl -i -X POST http://localhost:8010/api/time` | The status line reads `405 Method Not Allowed` and no `now` value is returned | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, in UTC with an explicit offset

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/time`, wait about one second, and run it again | Two response bodies | [ ] Pass [ ] Fail |
| 5 | Compare the two `now` values | They differ, and the second is later than the first | [ ] Pass [ ] Fail |
| 6 | Read the end of each `now` value | Each ends in `+00:00`, never in `Z` and never with no offset at all | [ ] Pass [ ] Fail |
| 7 | Compare the time in `now` with the output of `date -u` | They agree to within a few seconds | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` in a browser | The Swagger page lists `GET /api/time` under the `time` tag | [ ] Pass [ ] Fail |
| 9 | Expand `GET /api/time` and look at its 200 response | The schema shown is `ServerTimeResponse`, with fields `now` (string, date-time) and `timezone` | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` | The schema file defines `ServerTimeResponse` and its docstring states the `+00:00` choice; the router builds that schema and returns no bare dict | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the shape, the offset and the freshness

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |
| 12 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |
| 13 | Open both test files | There are tests named for the shape (`test_get_server_time_returns_200_with_now_and_timezone`), the offset (`test_get_server_time_now_has_explicit_plus_zero_offset`) and the freshness (`test_get_server_time_now_is_computed_per_request`) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
