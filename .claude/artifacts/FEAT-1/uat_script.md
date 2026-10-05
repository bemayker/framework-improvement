# UAT Script: FEAT-1 Server time endpoint

This endpoint has no screen, so every check runs against the backend directly (browser address bar, `curl`, FastAPI docs).

## Prerequisites
- [ ] The stack is up: `docker compose up -d --build` at the repository root.
- [ ] `http://localhost:8010/api/version` answers with a `version` value.

## Criterion 1: `GET /api/time` returns 200 with `now` and `timezone: "UTC"`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | In a browser, open `http://localhost:8010/api/time` | JSON object with exactly two keys, e.g. `{"now": "2026-10-05T14:36:55.123456+00:00", "timezone": "UTC"}` | [ ] | [ ] |
| 1.2 | Run `curl -i http://localhost:8010/api/time` | First line `HTTP/1.1 200 OK`; `content-type` is `application/json` | [ ] | [ ] |
| 1.3 | Read the `timezone` value in that body | Exactly `UTC` | [ ] | [ ] |

## Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` | Two lines, each a JSON object | [ ] | [ ] |
| 2.2 | Compare the two `now` values | They differ; the second is about one second later | [ ] | [ ] |
| 2.3 | Read the end of each `now` value | Each ends with exactly `+00:00`; none ends with `Z` or has no offset | [ ] | [ ] |
| 2.4 | Compare `now` with `date -u` in the same terminal | Match within a few seconds (UTC, not local time) | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `http://localhost:8010/docs` and expand `GET /api/time` | The 200 response shows schema `ServerTimeResponse` with `now` (string, date-time) and `timezone` | [ ] | [ ] |
| 3.2 | Click "Try it out", then "Execute" | Code `200` and a body with the same two keys | [ ] | [ ] |
| 3.3 | Open `backend/app/routers/server_time.py` | Handler returns `ServerTimeResponse(...)`, builds no dict literal; the class is imported from `app.schemas.server_time` | [ ] | [ ] |

## Criterion 4: unit and integration tests cover shape, offset and per-request freshness

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | At the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py` | Every test passes, none skipped; at least one test per file | [ ] | [ ] |
| 4.2 | Open the two test files | Each has a test for the key set, one for the `+00:00` suffix, and one for two calls returning different `now` values | [ ] | [ ] |

## Edge case: a non-GET method is rejected

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| E.1 | Run `curl -i -X POST http://localhost:8010/api/time` | First line `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|-----------|-------|--------|--------|
| 1 | 3 | | |
| 2 | 4 | | |
| 3 | 3 | | |
| 4 | 2 | | |
| Edge | 1 | | |

Tester: ______________  Date: ______________  Overall result: [ ] Pass  [ ] Fail
