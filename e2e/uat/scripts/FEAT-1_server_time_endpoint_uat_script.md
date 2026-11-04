# UAT Script, FEAT-1: Server time endpoint

Feature: `GET /api/time` reports the server's current time (UTC, `+00:00` offset), so a client can detect clock skew.

`{BACKEND}` below is the backend's published host address: `localhost:8010` with `docker-compose.yml` as committed (check with `docker compose port backend 8010`).

## Prerequisites
- The stack is running: `docker compose up -d` at the repo root, and the backend answers on `{BACKEND}`.
- `curl` and a browser are available.
- For Criterion 4 only: a PostgreSQL instance reachable through `DATABASE_URL` (the integration tier's session fixture needs it; see `CLAUDE.md` Backing Services). The FEAT-1 tests themselves use no database.

This feature has no UI. Every check is an HTTP response, the OpenAPI document, the code, or a test run.

## Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -s -i http://{BACKEND}/api/time` | Status line `HTTP/1.1 200 OK` and `content-type: application/json` | [ ] | [ ] |
| 1.2 | Read the body | JSON object with exactly two keys, `now` and `timezone`, e.g. `{"now":"2026-11-04T12:34:56.789012+00:00","timezone":"UTC"}`; `timezone` is exactly `UTC` | [ ] | [ ] |
| 1.3 | Open `http://{BACKEND}/docs` in a browser and expand `GET /api/time` | The 200 response schema shows `now` (string, date-time) and `timezone` (string, `UTC`) | [ ] | [ ] |

## Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://{BACKEND}/api/time` and note `now` | Ends in exactly `+00:00` (not `Z`, not without an offset); time of day matches `date -u` to within a few seconds | [ ] | [ ] |
| 2.2 | Wait one second, run the same command again | `now` ends in `+00:00` and is at least one second later than the value from 2.1 | [ ] | [ ] |
| 2.3 | Edge case: run `curl -s -X POST -i http://{BACKEND}/api/time` | Status `405 Method Not Allowed` (the endpoint is read-only) | [ ] | [ ] |

## Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `backend/app/schemas/server_time.py` | Defines `ServerTimeResponse` with `now: AwareDatetime`, `timezone: Literal["UTC"]` and a `field_serializer` for `now`; the class docstring names the `+00:00` choice | [ ] | [ ] |
| 3.2 | Open `backend/app/routers/server_time.py` | The handler is declared with `response_model=ServerTimeResponse` and returns a `ServerTimeResponse`, with no dict literal for the body | [ ] | [ ] |
| 3.3 | Run `curl -s http://{BACKEND}/openapi.json` and find the `/api/time` entry | Its 200 response references `#/components/schemas/ServerTimeResponse` | [ ] | [ ] |

## Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` | The summary reports `0 failed` | [ ] | [ ] |
| 4.2 | Open `backend/tests/unit/test_server_time_unit.py` and `backend/tests/integration/test_server_time_integration.py` | At least one test each for the shape, for the exact `+00:00` suffix, and for per-request freshness | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|-----------|-------|--------|--------|
| 1: 200 with `now` and `timezone` | 3 | | |
| 2: per-request, UTC, explicit offset | 3 | | |
| 3: Pydantic schema | 3 | | |
| 4: tests cover shape, offset, freshness | 2 | | |
| **Total** | **11** | | |

Overall result: [ ] PASS (0 failed)   [ ] FAIL

Tester: ____________   Date: ____________
