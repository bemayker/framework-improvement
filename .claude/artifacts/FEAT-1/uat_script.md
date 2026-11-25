# UAT Script: FEAT-1 Server time endpoint

No criterion has a UI: no frontend consumes `GET /api/time`, so every check below is done against the API with `curl`, against the source, or by running tests.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend), which comes from `docker-compose.yml`.
- A terminal with `curl` and `date`.
- Criterion 4 only: `uv` installed on the host and backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
   `--build` is needed so the backend image contains the new `/api/time` route.
2. Run `curl -i http://localhost:8010/api/version` until it answers `HTTP/1.1 200 OK`.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present | [ ] Pass [ ] Fail |
| 2 | Read the response body | A JSON object with exactly two keys: `now` (a timestamp such as `2026-11-25T03:14:15.926535+00:00`) and `timezone` with the value `UTC` | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, UTC with an explicit offset, never naive

Prerequisites: as Criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/time`, wait about one second, and run it again | The two `now` values differ, and the second is about one second later than the first | [ ] Pass [ ] Fail |
| 4 | Look at the end of each `now` value | Each ends in `+00:00`; neither ends in `Z` and neither lacks an offset | [ ] Pass [ ] Fail |
| 5 | Compare the time part of `now` with `date -u` run in the same terminal | The hour and minute match UTC, not the machine's local time zone | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Not verifiable through a UI; the observable check is the source.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Open `backend/app/schemas/server_time.py` | It defines `ServerTimeResponse` with `now` and `timezone`, and its docstring states the `+00:00` choice | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/server_time.py` | The route declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse`, not a dict | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the shape, the offset and the freshness

Prerequisites: backend dependencies installed (`uv sync --directory backend`).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |
| 9 | Open both test files | One test asserts the body's two keys, one asserts the exact `+00:00` suffix, and one asserts that two calls a second apart differ | [ ] Pass [ ] Fail |

### Edge case: a POST to `/api/time` is refused

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `curl -i -X POST http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
