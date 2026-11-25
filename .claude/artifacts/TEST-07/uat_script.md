# UAT Script: TEST-07 Uptime endpoint

No acceptance criterion is verifiable through the UI: no frontend consumes `GET /api/uptime`. The observable check is the HTTP response itself, read with `curl` against the Docker Compose stack, whose backend listens on host port `8010` (`docker-compose.yml`). Criterion 4 is a structural property of the code and is checked from the source files and their unit tests.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- A terminal with `curl`.
- Criterion 4 step 3 only: `uv` installed on the host and the backend dependencies available (`uv run --directory backend` syncs them on first use).

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
| 1 | Run `curl -i http://localhost:8010/api/uptime` | The first response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | One JSON object with exactly two keys, for example `{"uptime_seconds":42.318904,"started_at":"2026-11-25T01:45:47.123456+00:00"}`: `uptime_seconds` is an unquoted number and `started_at` is a quoted string | [ ] Pass [ ] Fail |
| 3 | Run `curl -i -X POST http://localhost:8010/api/uptime` | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

Prerequisites: stack up as above.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` | Two JSON bodies print | [ ] Pass [ ] Fail |
| 5 | Compare the two `uptime_seconds` values | Both are 0 or greater, and the second is greater than the first by roughly 1 (for example `42.31` then `43.32`) | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup and serialised in UTC with an explicit offset

Prerequisites: stack up as above.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart, and note the `started_at` value of the first response | The `started_at` string is character-for-character identical in both responses, while `uptime_seconds` differs | [ ] Pass [ ] Fail |
| 7 | Read the end of `started_at` | It ends in `+00:00` (not `Z`, and not a local offset such as `+01:00`) | [ ] Pass [ ] Fail |
| 8 | Run `docker compose restart backend`, wait until `docker compose ps` shows it running, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is later than the value noted in step 6, and `uptime_seconds` is small (a few seconds), showing a restart is distinguishable from a long-lived process | [ ] Pass [ ] Fail |

> Do not check the OpenAPI document for `format: date-time` on `started_at`. The generated schema shows it as a plain string, which is expected and accepted, so this script makes no claim about it.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Not verifiable through the UI; the observable checks are the source files and their unit tests.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/uptime.py` | It defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at` | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/routers/uptime.py` | The `GET /uptime` route declares `response_model=UptimeResponse`, imported from `app.schemas.uptime` | [ ] Pass [ ] Fail |
| 11 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py` | The run passes: its summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
