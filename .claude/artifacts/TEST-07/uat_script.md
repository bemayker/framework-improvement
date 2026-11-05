# UAT Script: TEST-07 Uptime endpoint

None of the four acceptance criteria is verifiable through the UI: no frontend consumes `GET /api/uptime`, so the observable checks are the HTTP responses (read with `curl`), the OpenAPI page, the schema source file and the test run.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database); both mappings come from `docker-compose.yml`.
- A terminal with `curl`, and a browser for criterion 4.
- Step 10 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
   The whole stack is brought up, not only `backend`: the backend's startup initialises its schema and needs `db` healthy.
2. Run `docker compose ps` until `db` reports healthy and `backend` reports running.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/uptime` | The first response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly two keys, for example `{"uptime_seconds":12.84,"started_at":"2026-11-05T09:30:02.118734+00:00"}`: `uptime_seconds` is an unquoted number and `started_at` is a quoted date-time string | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

Prerequisites: criterion 1 verified, backend still running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` | Two JSON bodies print | [ ] Pass [ ] Fail |
| 4 | Compare the two `uptime_seconds` values | Both are 0 or greater, and the second is larger than the first by roughly one second (for example 30.41 then 31.42) | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset

Prerequisites: criterion 2 verified, backend still running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Look at the two bodies from step 3 | `started_at` is the identical string in both, character for character | [ ] Pass [ ] Fail |
| 6 | Read the end of that string | It ends in `+00:00` (not `Z`, and not a local offset such as `+01:00`) | [ ] Pass [ ] Fail |
| 7 | Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running, then run `curl -s http://localhost:8010/api/uptime` | `uptime_seconds` is small (a few seconds) and `started_at` is later than the value read in step 5, which is how an operator tells a restart from a long-lived process | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: backend running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `backend/app/schemas/uptime.py` | It defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at` | [ ] Pass [ ] Fail |
| 9 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` | The 200 response names the `UptimeResponse` schema with `uptime_seconds` (number) and `started_at` (string). `started_at` is documented as a plain string with no `date-time` format: that is the accepted limitation recorded in the plan's API Contract, not a defect | [ ] Pass [ ] Fail |
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/unit/test_main_unit.py tests/integration/test_uptime_integration.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
