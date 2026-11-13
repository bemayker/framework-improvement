# UAT Script: TEST-07 Uptime endpoint

This feature has no UI: no frontend consumes `GET /api/uptime`, so every criterion is verified against the running backend with `curl`, plus one code and OpenAPI check for criterion 4.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend, published by `docker-compose.yml`).
- A terminal with `curl`.
- Step 11 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/uptime` | The status line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | One JSON object with exactly two keys: `uptime_seconds`, an unquoted number such as `12.84`, and `started_at`, a quoted string such as `"2026-11-13T14:01:50.123456+00:00"` | [ ] Pass [ ] Fail |
| 3 | Run `curl -i -X POST http://localhost:8010/api/uptime` (edge case) | The status line reads `405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is a non-negative number and increases between two calls a second apart

Prerequisites: as Criterion 1. This is the only check of this criterion against a real clock, the automated tests use a patched clock.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (for example `30.12`) | The value is 0 or greater | [ ] Pass [ ] Fail |
| 5 | Wait about one second, then run the same command again | `uptime_seconds` is larger than the first value by roughly 1 (for example `31.15`) | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset

Prerequisites: as Criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart | `started_at` is character-for-character identical in both responses while `uptime_seconds` grew | [ ] Pass [ ] Fail |
| 7 | Read `started_at` | It ends in `+00:00` (not `Z`, not another offset), and its time is roughly the current UTC time minus `uptime_seconds` | [ ] Pass [ ] Fail |
| 8 | Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again | `started_at` is a later timestamp than in step 6 and `uptime_seconds` is small (a few seconds) | [ ] Pass [ ] Fail |

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: a checkout of the feature branch; the stack running as Criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/uptime.py` | It defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at` | [ ] Pass [ ] Fail |
| 10 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` | The 200 response schema is `UptimeResponse` with the two fields. `started_at` shows as a plain string; that is expected and not a defect | [ ] Pass [ ] Fail |
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` | The summary line shows `0 failed` for the three named files | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
