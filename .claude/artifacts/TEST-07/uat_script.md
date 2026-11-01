# UAT Script: TEST-07 Uptime endpoint

None of the four acceptance criteria is verifiable through the application UI: no frontend screen shows uptime. The observable checks are the HTTP response, read with `curl`, and FastAPI's generated `/docs` page.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database); both mappings come from `docker-compose.yml`.
- No root `.env` file is required: `docker-compose.yml` carries usable defaults for every variable it substitutes.
- A terminal with `curl`, and a browser.
- Criterion 4 step 12 only: `uv` installed on the host.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/uptime` | The first response line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly two keys, for example `{"uptime_seconds":12.84,"started_at":"2026-11-01T04:11:13.482915+00:00"}`: `uptime_seconds` is an unquoted number and `started_at` is a quoted string | [ ] Pass [ ] Fail |
| 3 | Edge case: run `curl -i -X POST http://localhost:8010/api/uptime` | `HTTP/1.1 405 Method Not Allowed`: the endpoint is read-only | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

Prerequisites: criterion 1's stack still running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` | Two JSON lines are printed | [ ] Pass [ ] Fail |
| 5 | Compare the two `uptime_seconds` values | Both are 0 or greater, and the second exceeds the first by roughly 1 (between about 0.9 and 1.5, allowing for request latency) | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup, in UTC with an explicit offset

Prerequisites: criterion 1's stack still running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart | The `started_at` string is character-for-character identical in both responses while `uptime_seconds` differs. Note this `started_at` value for step 8 | [ ] Pass [ ] Fail |
| 7 | Read the end of `started_at` | It ends in `+00:00` (not `Z`, and not a local offset such as `+01:00`) | [ ] Pass [ ] Fail |
| 8 | Edge case: run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running (`db` stays healthy, so startup succeeds), then run `curl -s http://localhost:8010/api/uptime` | `started_at` is later than the value noted in step 6, and `uptime_seconds` is small (a few seconds), confirming the value is taken at startup | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: criterion 1's stack still running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` | The 200 response's schema is named `UptimeResponse` and lists `uptime_seconds` (number) and `started_at` (string). Do not expect a `format: date-time` on `started_at`; the generated document shows it as a plain string | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/uptime.py` | It defines `class UptimeResponse(BaseModel)` with those two fields | [ ] Pass [ ] Fail |
| 11 | Open `backend/app/routers/uptime.py` | It uses `UptimeResponse` as the route's `response_model` | [ ] Pass [ ] Fail |
| 12 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
