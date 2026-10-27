# UAT Script: TEST-07 Uptime endpoint

No acceptance criterion is verifiable through the app's UI: the feature has no frontend, so every check is made against the backend API on the host at `http://localhost:8010`, from a terminal or the FastAPI docs page.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- A terminal with `curl`.
- A browser, for criterion 4.
- `uv` installed on the host with the backend dependencies synced (`uv sync --directory backend`), for step 10.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build backend
   ```
2. Run `docker compose ps backend` until it shows the `backend` service running.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/uptime` | The status line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body of the same response | It has exactly two keys: `uptime_seconds` with an unquoted number such as `12.84`, and `started_at` with a quoted string such as `"2026-10-27T16:33:15.482913+00:00"` | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is a non-negative number and increases between two calls a second apart

Prerequisites: stack still up from the setup above.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (for example `20.11`) | The value is 0 or greater | [ ] Pass [ ] Fail |
| 4 | Wait one second, then run the same command again | `uptime_seconds` is larger than the first value by roughly one second (for example `21.13`), and never smaller | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset

Prerequisites: stack still up from the setup above.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart | `started_at` is the identical string both times, while `uptime_seconds` grows | [ ] Pass [ ] Fail |
| 6 | Read the end of `started_at` | It ends in `+00:00`, not `Z` and not any other offset | [ ] Pass [ ] Fail |
| 7 | Run `docker compose restart backend`, then wait until `curl -s http://localhost:8010/api/uptime` answers again | `started_at` is now a later time than in step 5 and `uptime_seconds` is small (a few seconds), showing the restart | [ ] Pass [ ] Fail |

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: stack still up from the setup above.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` in a browser | The Swagger UI lists `GET /api/uptime` under the `uptime` tag | [ ] Pass [ ] Fail |
| 9 | Expand `GET /api/uptime` and read its 200 response | It names the `UptimeResponse` schema with `uptime_seconds` (number, minimum 0) and `started_at` (string). The page shows `started_at` as a plain string without a `date-time` format; that is expected and not a defect | [ ] Pass [ ] Fail |
| 10 | In a terminal at the repo root, run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` | The summary reports `0 failed` | [ ] Pass [ ] Fail |

### Edge case: a POST request to the endpoint is rejected

Covers the corresponding Gherkin scenario.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `curl -i -X POST http://localhost:8010/api/uptime` | The status line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
