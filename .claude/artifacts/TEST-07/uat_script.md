# UAT Script: TEST-07 Uptime endpoint

The feature has no UI. Every check is an HTTP request from a terminal against the running backend, published by the root `docker-compose.yml` on `http://localhost:8010`.

## Prerequisites

- The stack is up: `docker compose up -d --build` at the repo root, and `docker compose ps` shows the backend container running.
- `curl` and `uv` are installed (needed for Criterion 2 step 3).
- No seeded data or credentials are needed.

## Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -s -i http://localhost:8010/api/uptime` | Status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json` | [ ] | [ ] |
| 1.2 | Read the body | One JSON object with exactly two keys: `uptime_seconds` (a number such as `42.137`) and `started_at` (a string such as `2026-11-17T22:49:37.120394+00:00`) | [ ] | [ ] |

## Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (A) | A is 0 or greater | [ ] | [ ] |
| 2.2 | Wait about one second, run the same command again and note `uptime_seconds` (B) | B is greater than A, by roughly one second plus the time you took | [ ] | [ ] |
| 2.3 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/unit/test_uptime_schema_unit.py tests/integration/test_uptime_integration.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] | [ ] |

## Criterion 3: `started_at` captured once at startup, UTC with explicit offset

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `curl -s http://localhost:8010/api/uptime` twice, a few seconds apart | `started_at` is character-for-character identical in both responses, while `uptime_seconds` grew | [ ] | [ ] |
| 3.2 | Read the end of `started_at` | It ends in `+00:00` (not `Z`, not a local offset such as `+01:00`) | [ ] | [ ] |
| 3.3 | Run `docker compose restart backend`, wait until `docker compose ps` shows it running, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is a later instant than in step 3.1, and `uptime_seconds` is small (a few seconds): a restart is distinguishable from a long-lived process | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

This is a code-structure criterion; the observable check is the OpenAPI document and the file.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` | The 200 response schema is named `UptimeResponse` with `uptime_seconds` (number, minimum 0) and `started_at` (string, date-time) | [ ] | [ ] |
| 4.2 | Open `backend/app/schemas/uptime.py` and `backend/app/routers/uptime.py` | The schema file defines `class UptimeResponse(BaseModel)` with those two fields, and the router declares `response_model=UptimeResponse` | [ ] | [ ] |

## Edge case: non-GET method

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| E.1 | Run `curl -s -i -X POST http://localhost:8010/api/uptime` | Status line reads `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. 200 with both fields | 1.1, 1.2 | [ ] Pass  [ ] Fail |
| 2. Non-negative and increasing | 2.1 to 2.3 | [ ] Pass  [ ] Fail |
| 3. Captured once, UTC offset | 3.1 to 3.3 | [ ] Pass  [ ] Fail |
| 4. Pydantic schema | 4.1, 4.2 | [ ] Pass  [ ] Fail |
| Edge: POST returns 405 | E.1 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
