# UAT Script: FEAT-1 Server time endpoint

No acceptance criterion is verifiable through the UI: no frontend screen consumes `GET /api/time`, so the observable check is the HTTP response itself, read with `curl`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend), the port `docker-compose.yml` publishes.
- A terminal with `curl` and `date`.
- Criterion 4 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`). No database is needed for those test files.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running. The backend answers on `http://localhost:8010`.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal run `curl -i http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present | [ ] Pass [ ] Fail |
| 2 | Read the response body | One JSON object with exactly two keys, for example `{"now":"2026-11-01T04:50:22.123456+00:00","timezone":"UTC"}`. `timezone` is exactly `UTC`; `now` is today's date and the current UTC time (compare with `date -u` in the same terminal; within a few seconds) | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` | Two JSON bodies print | [ ] Pass [ ] Fail |
| 4 | Compare the two `now` values | The second is about one second later than the first; they are not identical | [ ] Pass [ ] Fail |
| 5 | Look at the end of each `now` value | Each ends in exactly `+00:00`; neither ends in `Z`, and neither lacks an offset (a value such as `2026-11-01T04:50:22.123456` with nothing after the digits would be naive and is a fail) | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -s http://localhost:8010/openapi.json` and find the `/api/time` entry under `paths`, its `get`, `responses`, `200` | The content schema is a `$ref` to `#/components/schemas/TimeResponse` | [ ] Pass [ ] Fail |
| 7 | Find `TimeResponse` under `components`, `schemas` | It lists the properties `now` (type `string`; the schema carries no `date-time` format because the serializer emits a pinned string) and `timezone` (const `UTC`) | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` | The schema file defines `class TimeResponse(BaseModel)`; the handler is declared with `response_model=TimeResponse` and returns a `TimeResponse(...)`, with no dict literal as the response | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` (no failures and no errors) | [ ] Pass [ ] Fail |
| 10 | Open `backend/tests/unit/test_server_time_unit.py` and `backend/tests/integration/test_server_time_integration.py` | At least one test asserts the exact key set and `timezone == "UTC"` (shape), at least one asserts `now` ends in `+00:00` (offset), and at least one asserts two calls return different, increasing `now` values (freshness) | [ ] Pass [ ] Fail |

### Edge case: a non-GET method is rejected

Covers the corresponding Gherkin scenario.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `curl -i -X POST http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 (10 required, 1 edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
