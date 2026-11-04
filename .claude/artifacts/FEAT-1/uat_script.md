# UAT Script: FEAT-1 Server time endpoint

None of the acceptance criteria is verifiable through the UI: the feature has no frontend change, so the observable check is the HTTP response, read with `curl` against the running backend.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`; a handover rebuild on free ports may publish another port, read it with `docker compose port backend 8010` and use it in place of `8010` below.
- A terminal with `curl` and `date`.
- Criterion 4 only: `uv` installed on the host. No database is needed for those tests.

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
| 1 | In a terminal, run `curl -i http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | A JSON object with exactly two keys: `now` (for example `"2026-11-04T19:05:12.345678+00:00"`) and `timezone` with the value `"UTC"` | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive

Prerequisites: as Criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/time`, wait about one second, then run the same command again | Two response bodies | [ ] Pass [ ] Fail |
| 4 | Compare the two `now` values | They differ, and the second is about one second later than the first | [ ] Pass [ ] Fail |
| 5 | Read the end of each `now` value | Each ends with exactly `+00:00`: not `Z`, and never without an offset | [ ] Pass [ ] Fail |
| 6 | Run `date -u` and compare it with `now` | They match to within a few seconds, whatever the machine's local time zone | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: as Criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -s http://localhost:8010/openapi.json` and find the `/api/time` path | Its `get` 200 response references `#/components/schemas/ServerTimeResponse` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` | The schema file defines `ServerTimeResponse` with `now` and `timezone`, and its docstring states the `+00:00` choice. The router returns that model, not a dict | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness

Prerequisites: `uv` installed; no database needed.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | The run ends with `0 failed` (no failures reported) | [ ] Pass [ ] Fail |
| 10 | Open `backend/tests/integration/test_server_time_integration.py` | It contains tests asserting the body shape, the exact `+00:00` suffix, and two requests returning different `now` values | [ ] Pass [ ] Fail |

### Edge case: a POST request to `/api/time` is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `curl -i -X POST http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 (10 criterion steps, 1 edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
