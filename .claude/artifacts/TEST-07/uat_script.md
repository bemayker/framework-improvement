# UAT Script: TEST-07 Uptime endpoint

There is no UI for this feature: every check is an HTTP request against the running backend and a read of its JSON.

## Prerequisites

- The stack is up: `docker compose up -d --build` at the repo root, and the backend container is running.
- The backend listens on `http://localhost:8010` (docker-compose.yml `ports: 8010:8010`). If the handover rebuild moved it to another free port, use that port instead of 8010 in every step.
- `curl` is available. No login or seeded data is needed, and the endpoint does not use the database.

Mark each step `[x]` Pass or `[x]` Fail.

## Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -s -i http://localhost:8010/api/uptime` | Status line reads `HTTP/1.1 200 OK` and the header `content-type: application/json` is present | [ ] | [ ] |
| 1.2 | Read the body | A JSON object with exactly two keys: `uptime_seconds` (a bare number such as `42.731`, not a string) and `started_at` (a string such as `"2026-11-17T17:22:22.123456Z"`) | [ ] | [ ] |
| 1.3 | Open `http://localhost:8010/api/uptime` in a browser | The same JSON object is shown | [ ] | [ ] |

## Criterion 2: `uptime_seconds` is non-negative and increases a second apart

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (call it A) | A is 0 or greater | [ ] | [ ] |
| 2.2 | Wait about one second, run the same command again and note `uptime_seconds` (call it B) | B is greater than A by roughly 1 (between about 0.9 and 2, allowing for the time you took) | [ ] | [ ] |
| 2.3 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` from the repo root | The run reports no failed or errored test and the command exits 0 | [ ] | [ ] |

## Criterion 3: `started_at` captured once at startup, UTC with an explicit offset

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart | `started_at` is the identical string both times while `uptime_seconds` grew | [ ] | [ ] |
| 3.2 | Read `started_at` | It ends with `Z` (the explicit UTC zero offset), and the current UTC time minus `uptime_seconds` is approximately that instant | [ ] | [ ] |
| 3.3 | Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again | `started_at` is a later instant than in step 3.1, and `uptime_seconds` is small (a few seconds) | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` | The 200 response shows the schema `UptimeResponse` with fields `uptime_seconds` (number) and `started_at` (string, date-time) | [ ] | [ ] |
| 4.2 | Open `backend/app/schemas/uptime.py` and `backend/app/routers/uptime.py` | The schema file defines `class UptimeResponse(BaseModel)` with those two fields, and the router declares `response_model=UptimeResponse` | [ ] | [ ] |

## Edge case: other methods are rejected

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 5.1 | Run `curl -s -i -X POST http://localhost:8010/api/uptime` | Status line reads `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `uptime_seconds` and `started_at` | 1.1 to 1.3 | [ ] Pass [ ] Fail |
| 2. Non-negative and increasing | 2.1 to 2.3 | [ ] Pass [ ] Fail |
| 3. Captured once, UTC with offset | 3.1 to 3.3 | [ ] Pass [ ] Fail |
| 4. Pydantic schema | 4.1 to 4.2 | [ ] Pass [ ] Fail |
| Edge case: 405 on POST | 5.1 | [ ] Pass [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass [ ] Fail
