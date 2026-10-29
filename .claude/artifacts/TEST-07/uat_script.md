# UAT Script: TEST-07 Uptime endpoint

No criterion is verifiable through the UI: no frontend screen shows uptime. Every check below is a terminal command against the running stack, and its output is the observable result.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- Host port `8010` (backend, published by `docker-compose.yml`) and `5442` (database) free.
- A terminal with `curl`.
- Criteria 2 and 4 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

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
| 1 | Run `curl -i http://localhost:8010/api/uptime` | The first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body | Exactly two keys, for example `{"uptime_seconds":42.17,"started_at":"2026-10-29T16:17:45.123456+00:00"}`: `uptime_seconds` is an unquoted number, `started_at` is a quoted string | [ ] Pass [ ] Fail |
| 3 | Edge case: run `curl -i -X POST http://localhost:8010/api/uptime` | The first line reads `HTTP/1.1 405 Method Not Allowed` (the endpoint is read-only) | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

Prerequisites: the stack from the setup is still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/uptime; sleep 1; echo; curl -s http://localhost:8010/api/uptime` | Two JSON bodies are printed | [ ] Pass [ ] Fail |
| 5 | Compare the two `uptime_seconds` values | Both are 0 or greater, and the second is at least 1 greater than the first (for example `42.17` then `43.18`) | [ ] Pass [ ] Fail |
| 6 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at application startup, not recomputed per request, and serialised in UTC with an explicit offset

Prerequisites: the stack from the setup is still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -s http://localhost:8010/api/uptime`, wait 2 seconds, run it again | The `started_at` string is character-for-character identical on both calls while `uptime_seconds` has grown | [ ] Pass [ ] Fail |
| 8 | Read `started_at` | It ends in `+00:00` (not `Z`, not another offset, not missing), and the time is close to when the backend container started (compare with the `backend` row's status age in `docker compose ps`) | [ ] Pass [ ] Fail |
| 9 | Run `docker compose restart backend`, wait until `docker compose ps` shows it running, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is later than the value read in step 7 and `uptime_seconds` is small (a few seconds), so a restart is visible | [ ] Pass [ ] Fail |
| 10 | Optional: open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` | The response schema lists `uptime_seconds` (number) and `started_at` (string). `started_at` is a plain string in the schema, with no `date-time` format; that is expected and not a failure | [ ] Pass [ ] Fail |

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: the repository checked out on the feature branch.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Open `backend/app/schemas/uptime.py` | It defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at` | [ ] Pass [ ] Fail |
| 12 | Open `backend/app/routers/uptime.py` | The route is declared with `response_model=UptimeResponse` and returns an `UptimeResponse` | [ ] Pass [ ] Fail |
| 13 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 (12 required, 1 optional) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
