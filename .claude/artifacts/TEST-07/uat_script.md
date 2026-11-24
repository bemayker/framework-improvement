# UAT Script: TEST-07 Uptime endpoint

This feature has no UI. Every check below is an HTTP request against the running backend, from a terminal or a browser address bar.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend); the mapping comes from `docker-compose.yml`.
- No root `.env` file is required; `docker-compose.yml` carries defaults for every variable it substitutes.
- A terminal with `curl`, and a browser for the address-bar and Swagger steps.
- Step 6 only: `uv` installed on the host and backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/uptime` | The status line reads `HTTP/1.1 200 OK` and `content-type` is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | One JSON object with exactly two keys: `uptime_seconds` (a number such as `37.214`) and `started_at` (a string such as `2026-11-24T03:44:56.123456+00:00`), and nothing else | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/api/uptime` in a browser address bar | The same two-key JSON object is shown | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (for example `40.102`) | The value is 0 or greater | [ ] Pass [ ] Fail |
| 5 | Wait about one second, then run the same command again | `uptime_seconds` is larger than the first value by roughly 1 (for example `41.118`) | [ ] Pass [ ] Fail |
| 6 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` | The run passes: no failed or errored test in the summary line, and the command exits 0 | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup, not per request, and is UTC with an explicit offset

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart, and note `started_at` each time | Both responses carry the identical `started_at` string | [ ] Pass [ ] Fail |
| 8 | Read that string and compare it with `docker compose ps backend` (its status column shows how long ago the container started) | The string ends in `+00:00`, and its date and time match the moment the backend container started, in UTC | [ ] Pass [ ] Fail |
| 9 | Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again, and read the body | `started_at` is a later time than in step 7, and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process | [ ] Pass [ ] Fail |

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Open `http://localhost:8010/docs` in a browser | The Swagger page lists `GET /api/uptime` under the `uptime` tag | [ ] Pass [ ] Fail |
| 11 | Expand `GET /api/uptime` and look at the 200 response | Its schema is named `UptimeResponse`, with `uptime_seconds` (number) and `started_at` (string, date-time) | [ ] Pass [ ] Fail |
| 12 | Open `backend/app/schemas/uptime.py` in the repository | It defines `class UptimeResponse(BaseModel)` with those two fields | [ ] Pass [ ] Fail |

### Edge case: a non-GET method is rejected

Covers the corresponding Gherkin scenario. The plan's Manual verification plan does not list it, so it is written here.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Run `curl -i -X POST http://localhost:8010/api/uptime` | The status line reads `HTTP/1.1 405 Method Not Allowed`, with FastAPI's `{"detail":"Method Not Allowed"}` body | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
