# UAT Script: TEST-07 Uptime endpoint

This feature has no UI: every criterion is verified against the live HTTP response, read with `curl` from a terminal on the host.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database); both mappings come from `docker-compose.yml`.
- A terminal with `curl`.
- Step 11 only (optional): `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Run `curl -s http://localhost:8010/api/version` until it answers (the backend is ready).

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -s -i http://localhost:8010/api/uptime` | The status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the body printed below the headers | One JSON object with exactly two keys, `uptime_seconds` (a number such as `42.81733`) and `started_at` (a string such as `2026-11-09T16:15:34.123456Z`), and nothing else | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` as A | A is 0 or greater | [ ] Pass [ ] Fail |
| 4 | Wait about one second, run `curl -s http://localhost:8010/api/uptime` again and note `uptime_seconds` as B | B is greater than A, by roughly 1 (plus however long you took) | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, in UTC with an explicit offset

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart | `started_at` is the same string both times, character for character, while `uptime_seconds` differs | [ ] Pass [ ] Fail |
| 6 | Look at the end of `started_at` | It ends in `Z` (the ISO 8601 zero-offset UTC designator), e.g. `...T16:15:34.123456Z`, and the time is close to when you last started the backend, expressed in UTC (not your local time zone) | [ ] Pass [ ] Fail |
| 7 | Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/version` answers again, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is a later timestamp than in step 5, and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

This is a code property, not a UI behaviour; the observable check is the source file and the generated API document.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `backend/app/schemas/uptime.py` | It defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at` | [ ] Pass [ ] Fail |
| 9 | Run `curl -s http://localhost:8010/openapi.json` and find the `UptimeResponse` entry under `components.schemas` | It lists `uptime_seconds` and `started_at` as properties, and the `/api/uptime` GET operation's 200 response references it. Only the presence of both properties is checked; no particular `format` value is expected on `started_at` | [ ] Pass [ ] Fail |

### Edge case and automated check (optional)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `curl -s -i -X POST http://localhost:8010/api/uptime` | The status line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_unit.py tests/unit/test_main_unit.py tests/integration/test_uptime_integration.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 (9 required, 2 optional) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
