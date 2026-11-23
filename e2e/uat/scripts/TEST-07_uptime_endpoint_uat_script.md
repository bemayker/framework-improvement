# UAT Script: TEST-07 Uptime endpoint

No UI exists for this endpoint, so every step is an HTTP call, a read of the API docs page, or a test run.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database), both from `docker-compose.yml`.
- A terminal with `curl`, and a browser for criterion 4.
- Step 5 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running. The backend answers on http://localhost:8010.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -i http://localhost:8010/api/uptime` | The status line reads `HTTP/1.1 200 OK` and the header `content-type: application/json` is present | [ ] Pass [ ] Fail |
| 2 | Read the body of the same response | One JSON object with exactly two keys: `uptime_seconds` (a number, e.g. `12.40371`) and `started_at` (a string such as `2026-11-22T17:27:30.123456+00:00`) | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` | A value of 0 or more | [ ] Pass [ ] Fail |
| 4 | Wait about one second, then run the same command again | `uptime_seconds` is larger than the value from step 3 by roughly one second | [ ] Pass [ ] Fail |
| 5 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup and serialised in UTC with an explicit offset

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart | `started_at` is the same string both times, and it ends in `+00:00` | [ ] Pass [ ] Fail |
| 7 | Run `docker compose restart backend`, then wait until `curl -s http://localhost:8010/api/uptime` answers again | `started_at` is a later instant than in step 6 and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open http://localhost:8010/docs in a browser and expand `GET /api/uptime` | The 200 response shows the schema `UptimeResponse` with fields `uptime_seconds` (number) and `started_at` (string) | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/uptime.py` and `backend/app/routers/uptime.py` | `uptime.py` in `schemas/` defines `class UptimeResponse(BaseModel)`, and the router uses it as the route's `response_model` and return type | [ ] Pass [ ] Fail |

### Edge case: other methods are rejected

Covers the corresponding Gherkin scenario. The plan's Manual verification plan had no step for it.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `curl -s -i -X POST http://localhost:8010/api/uptime` | The status line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
