# UAT Script: TEST-07 Uptime endpoint

This feature has no UI and no frontend consumes `GET /api/uptime`, so every criterion is verified through the running backend's HTTP API with `curl`, and through its built-in Swagger page at `http://localhost:8010/docs`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend), which `docker-compose.yml` publishes.
- No database or seed data is needed for the endpoint itself. The compose stack also starts the `db` service, which is harmless here.
- A terminal with `curl`, and a browser for the Swagger page.
- Criterion 4 step 3 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running. Alternatively, run the API directly with `uv run --directory backend uvicorn app.main:app --port 8010`.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/uptime` | The first response line reads `HTTP/1.1 200 OK` and the header `content-type: application/json` is present | [ ] Pass [ ] Fail |
| 2 | Read the body printed below the headers | One JSON object with exactly two keys: `uptime_seconds` (a number such as `42.81`) and `started_at` (a string such as `2026-11-13T05:51:31.123456+00:00`) | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/docs` in a browser, expand `GET /api/uptime`, click "Try it out" then "Execute" | The "Server response" shows code `200` and the same two-key body | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` | The value is 0 or greater, e.g. `42.81` | [ ] Pass [ ] Fail |
| 5 | Wait about one second, then run `curl -s http://localhost:8010/api/uptime` again | `uptime_seconds` is larger than the first value by roughly one second, e.g. `43.83`, and still 0 or greater | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart | `started_at` is the identical string in both responses, while `uptime_seconds` differs | [ ] Pass [ ] Fail |
| 7 | Read the end of the `started_at` string | It ends in `+00:00` (UTC, explicit offset), not in a local offset such as `+01:00` and not with no offset at all | [ ] Pass [ ] Fail |
| 8 | Restart the backend (`docker compose restart backend`, or stop and start uvicorn), wait until it answers, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is a later timestamp than in step 6, and `uptime_seconds` is small (a few seconds) | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/uptime.py` in an editor | It defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at` | [ ] Pass [ ] Fail |
| 10 | Open `http://localhost:8010/docs`, expand `GET /api/uptime`, and look at the 200 response's schema | It is named `UptimeResponse` and lists `uptime_seconds` (number) and `started_at` (string, date-time) | [ ] Pass [ ] Fail |
| 11 | From the repo root, run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py tests/unit/test_main_unit.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |

### Edge case: a POST to the endpoint is rejected

Covers the corresponding Gherkin scenario. This step was added at build time: the plan's manual verification plan has no step for it.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `curl -i -X POST http://localhost:8010/api/uptime` | The first response line reads `HTTP/1.1 405 Method Not Allowed` and the body does not contain `uptime_seconds` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 (11 from the plan, 1 edge case added at build time) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
