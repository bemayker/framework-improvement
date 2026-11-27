# UAT Script: TEST-07 Uptime endpoint

This endpoint has no UI, so every check is made from a terminal (or a browser address bar) against the running backend at `http://localhost:8010`, the host port `docker-compose.yml` publishes.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010`.
- A terminal with `curl`, and a browser.
- Step 11 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/uptime` | The first line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers | [ ] Pass [ ] Fail |
| 2 | Read the body on the last line | A JSON object with exactly two keys: `uptime_seconds` (a number such as `37.84`) and `started_at` (a string such as `2026-11-27T12:58:10.123456+00:00`) | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/api/uptime` in a browser | The same two-key JSON is shown | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` | Two JSON lines are printed | [ ] Pass [ ] Fail |
| 5 | Compare the two `uptime_seconds` values | Both are zero or greater, and the second is larger than the first by roughly 1 (for example `52.10` then `53.12`) | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup, not per request, in UTC with an explicit offset

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart, and note the first `started_at` | `started_at` is character-for-character identical in both responses while `uptime_seconds` differs | [ ] Pass [ ] Fail |
| 7 | Look at the end of `started_at` | It ends in `+00:00` (not `Z`, not a local offset such as `+01:00`), and its date and time equal the current UTC time minus `uptime_seconds`, to within a second | [ ] Pass [ ] Fail |
| 8 | Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again | `started_at` is later than the value noted in step 6, and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` under the `uptime` tag | The 200 response's schema is named `UptimeResponse`, with `uptime_seconds` (number, minimum 0) and `started_at` (string), both required | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/uptime.py` in the editor | It defines `class UptimeResponse(BaseModel)` with those two fields | [ ] Pass [ ] Fail |
| 11 | From the repo root run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` | The run passes: its summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |

### Edge case: a non-GET method is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `curl -i -X POST http://localhost:8010/api/uptime` | The first line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
