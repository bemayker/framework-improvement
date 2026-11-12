# UAT Script: TEST-07 Uptime endpoint

No frontend renders `GET /api/uptime`, so no criterion is verifiable by clicking through the UI. Every check reads the HTTP response with `curl` in a terminal.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database); both mappings come from `docker-compose.yml`.
- No root `.env` file is required: `docker-compose.yml` carries usable defaults and sets the backend's `DATABASE_URL` itself.
- A terminal with `curl`.
- Criterion 4, step 12 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

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
| 1 | Run `curl -i http://localhost:8010/api/uptime` | The first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body of the same response | One JSON object with exactly two keys: `uptime_seconds` (a number such as `37.214`, no quotes) and `started_at` (a quoted string such as `"2026-11-12T21:36:19.123456+00:00"`) | [ ] Pass [ ] Fail |
| 3 | Run `curl -i -X POST http://localhost:8010/api/uptime` (edge case, covers the 405 scenario) | The first line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

Prerequisites: as for Criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` | Two JSON bodies print | [ ] Pass [ ] Fail |
| 5 | Compare the two `uptime_seconds` values | Both are 0 or greater, and the second exceeds the first by roughly 1 (about 0.9 to 1.5, depending on request latency) | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup, not per request, and is UTC with an explicit offset

Prerequisites: as for Criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -s http://localhost:8010/api/uptime` three times, a few seconds apart, and note the first `started_at` | The `started_at` string is byte-identical in all three responses while `uptime_seconds` grows | [ ] Pass [ ] Fail |
| 7 | Read the end of that `started_at` string | It ends in `+00:00` (not `Z`, and never without an offset) | [ ] Pass [ ] Fail |
| 8 | Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers, then run it once | `started_at` is later than the value from step 6, and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process | [ ] Pass [ ] Fail |

> The `db` service stays up during step 8, so the restarted backend boots normally.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: repository checked out, stack up as for Criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/uptime.py` in an editor | It defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at` | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/routers/uptime.py` | The `GET /uptime` route (prefix `/api`) declares `response_model=UptimeResponse` | [ ] Pass [ ] Fail |
| 11 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` | The 200 response lists an `UptimeResponse` schema with `uptime_seconds` (number) and `started_at` (string). A `date-time` format is not expected on `started_at`: the field's serializer returns a plain string, so do not fail this step for its absence | [ ] Pass [ ] Fail |
| 12 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/unit/test_main_unit.py tests/integration/test_uptime_integration.py` | The summary line shows `0 failed` for those four files | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
