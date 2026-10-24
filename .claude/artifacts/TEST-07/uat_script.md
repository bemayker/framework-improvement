# UAT Script: TEST-07 Uptime endpoint

This item has no UI: every criterion is checked against the API from a terminal at the repository root, and criterion 4 also in a browser at the API docs page.

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-07-uptime-endpoint` (or, once merged, on `main`).
- The stack is running from the repository root with `docker compose up -d --build backend`.
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` prints `200` (the backend answers on port 8010).
- Backend dependencies installed for the automated checks: `uv sync --directory backend`.

## Steps

### Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal run `curl -s -i http://localhost:8010/api/uptime` | First line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present | [ ] Pass [ ] Fail |
| 2 | Read the body on the last line | Exactly two keys, for example `{"uptime_seconds":37.912405,"started_at":"2026-10-24T04:24:56.123456+00:00"}`: `uptime_seconds` is an unquoted number, `started_at` is a quoted date-time string | [ ] Pass [ ] Fail |
| 3 | Run `curl -s http://localhost:8010/api/uptime \| python3 -m json.tool` | The output shows the same two keys and no others | [ ] Pass [ ] Fail |

### Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds`, for example `40.10` | The value is 0 or greater | [ ] Pass [ ] Fail |
| 5 | Wait about one second, then run the same command again | `uptime_seconds` is larger than in step 4, by roughly one second (for example `41.13`) | [ ] Pass [ ] Fail |
| 6 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |

### Criterion 3: `started_at` is captured once at startup, not recomputed per request, and is serialised in UTC with an explicit offset

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -s http://localhost:8010/api/uptime` and copy `started_at`, for example `2026-10-24T04:24:56.123456+00:00` | The value ends with `+00:00` | [ ] Pass [ ] Fail |
| 8 | Wait a few seconds and run the same command again | `started_at` is character-for-character identical to step 7, while `uptime_seconds` has grown | [ ] Pass [ ] Fail |
| 9 | Run `docker compose restart backend`, wait until `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/version` prints `200`, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is a later time than in step 7, still ends with `+00:00`, and `uptime_seconds` is small (a few seconds) | [ ] Pass [ ] Fail |
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_main_unit.py tests/unit/test_uptime_schema_unit.py tests/integration/test_uptime_integration.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Open `backend/app/schemas/uptime.py` in an editor | It defines `class UptimeResponse(BaseModel)` with fields `uptime_seconds` and `started_at` | [ ] Pass [ ] Fail |
| 12 | Open `backend/app/routers/uptime.py` | The `GET /uptime` route declares `response_model=UptimeResponse` | [ ] Pass [ ] Fail |
| 13 | In a browser open `http://localhost:8010/docs` and expand `GET /api/uptime` | The 200 response shows the `UptimeResponse` schema with `uptime_seconds` (number) and `started_at` (string). A plain string without a `date-time` format on `started_at` is expected | [ ] Pass [ ] Fail |
| 14 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |

### Edge case: the method stays read-only

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 15 | Run `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8010/api/uptime` | `405` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
