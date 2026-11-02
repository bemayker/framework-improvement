# UAT Script: TEST-07 Uptime endpoint

No acceptance criterion is verifiable through a screen of the app: the feature has no frontend. The observable check is the HTTP response read with `curl`, and FastAPI's Swagger UI at `/docs` on the backend is used where it helps.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database). Both mappings come from `docker-compose.yml`.
- No root `.env` file is required: `docker-compose.yml` carries defaults for every variable it substitutes.
- A terminal with `curl`, and a browser.
- Criterion 2 step 3 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running. The backend answers on `http://localhost:8010`.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/docs` in a browser | Swagger UI lists `GET /api/uptime` under the `uptime` tag | [ ] Pass [ ] Fail |
| 2 | Expand `GET /api/uptime`, click `Try it out`, then `Execute` | The response panel shows code `200` and a JSON body with exactly two keys: `uptime_seconds` (a number, for example `37.402`) and `started_at` (a string such as `2026-11-02T14:48:28.123456+00:00`) | [ ] Pass [ ] Fail |
| 3 | In a terminal run `curl -i http://localhost:8010/api/uptime` | The first line reads `HTTP/1.1 200 OK`, `content-type` is `application/json`, and the body has the same two keys | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is a non-negative number and increases between two calls a second apart

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (for example `50.120`) | The value is 0 or greater | [ ] Pass [ ] Fail |
| 2 | Wait about one second, then run the same command again | `uptime_seconds` is larger than the first value by roughly one second (for example `51.131`), never smaller and never negative | [ ] Pass [ ] Fail |
| 3 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at application startup, not recomputed per request, and is serialised in UTC with an explicit offset

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart, and compare `started_at` | Both responses carry the identical string, and it ends with `+00:00` | [ ] Pass [ ] Fail |
| 2 | Compare `started_at` with the backend container's start time from `docker compose ps backend` (or the time you ran `docker compose up`) | They agree to within a few seconds, expressed in UTC | [ ] Pass [ ] Fail |
| 3 | Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again | `started_at` is later than the value from step 1, and `uptime_seconds` has dropped to a small number (a few seconds) | [ ] Pass [ ] Fail |

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/docs`, expand `GET /api/uptime`, and select the `Schema` view of the 200 response | It is named `UptimeResponse` and lists `uptime_seconds` (number) and `started_at` (string). Only the schema name and these two properties are checked: the document is not required to show any format keyword for `started_at` | [ ] Pass [ ] Fail |
| 2 | Open `backend/app/schemas/uptime.py` in the repository, then `backend/app/routers/uptime.py` | The first defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`; the second declares `response_model=UptimeResponse` | [ ] Pass [ ] Fail |

### Edge case: a POST to the endpoint is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i -X POST http://localhost:8010/api/uptime` | The first line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 (11 across the four criteria, 1 edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
