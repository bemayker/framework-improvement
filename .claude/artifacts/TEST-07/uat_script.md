# UAT Script: TEST-07 Uptime endpoint

This feature has no UI: no frontend screen consumes `GET /api/uptime`, so every check reads the HTTP response directly with `curl` (or a browser address bar) against the running backend at `http://localhost:8010`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend, from `docker-compose.yml` and `backend/Dockerfile`) or `5442` (database).
- A terminal with `curl` and `date`. A browser for the `/docs` check.
- Step 10 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Run `docker compose ps` until `db` is healthy and `backend` is running on port 8010.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/uptime` | The first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body printed by step 1 | A JSON object with exactly two keys: `uptime_seconds` (a number such as `37.512904`, no quotes) and `started_at` (a quoted string such as `"2026-11-03T22:56:29.104512+00:00"`) | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (A) | A is 0 or greater | [ ] Pass [ ] Fail |
| 4 | Wait about one second, run `curl -s http://localhost:8010/api/uptime` again and note `uptime_seconds` (B) | B is 0 or greater and larger than A by roughly one second (about 0.9 up to a few seconds, depending on how long you waited) | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and is UTC with an explicit offset

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart, and compare the two `started_at` values | Character-for-character identical, even though `uptime_seconds` differs | [ ] Pass [ ] Fail |
| 6 | Look at the end of the `started_at` value | It ends in `+00:00` (UTC with an explicit offset), not in `Z` and not without an offset | [ ] Pass [ ] Fail |
| 7 | Run `date -u` and compare with `started_at` | `started_at` is earlier than the current UTC time by about `uptime_seconds` | [ ] Pass [ ] Fail |
| 8 | Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again, and read the body | `started_at` is a new, later timestamp and `uptime_seconds` is small (a few seconds), showing the restart | [ ] Pass [ ] Fail |

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` | Swagger UI lists `GET /api/uptime` under the `uptime` tag. Its 200 response schema is named `UptimeResponse` with fields `uptime_seconds` (number) and `started_at` (string). `started_at` shows as a plain string with no `date-time` format; that is expected (the schema's serializer returns a string) and is not a failure | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/uptime.py` in the repository, then run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` | The file defines `class UptimeResponse(BaseModel)` with those two fields, and the test run ends with `0 failed` | [ ] Pass [ ] Fail |

### Edge cases

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `curl -i -X POST http://localhost:8010/api/uptime` | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |
| 12 | Run `docker compose stop db` (do not restart the backend), then `curl -i http://localhost:8010/api/uptime`, then `docker compose start db` | `HTTP/1.1 200 OK` with both keys: the endpoint needs no database | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
