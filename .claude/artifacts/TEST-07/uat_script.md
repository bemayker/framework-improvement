# UAT Script, TEST-07: Uptime endpoint

`GET /api/uptime` reports how long the backend process has been running. No UI consumes it, so every check reads the HTTP response with `curl` against the compose stack (backend published on host port 8010).

## Prerequisites
- Docker is running.
- From the repository root, `docker compose up -d --build` has completed; `docker compose ps` shows `backend` running and `db` healthy.
- A terminal with `curl` and `uv` installed.

## Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/uptime` | First line reads `HTTP/1.1 200 OK`; the `content-type` header is `application/json` | [ ] | [ ] |
| 1.2 | Read the body | One JSON object with exactly two keys, e.g. `{"uptime_seconds":37.204,"started_at":"2026-11-07T16:30:00.123456+00:00"}`; `uptime_seconds` is an unquoted number, `started_at` is a quoted ISO 8601 date-time | [ ] | [ ] |

## Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -s http://localhost:8010/api/uptime; sleep 1; echo; curl -s http://localhost:8010/api/uptime` | Two JSON bodies print, one per line | [ ] | [ ] |
| 2.2 | Compare the two `uptime_seconds` values | Both are 0 or greater; the second is greater than the first by roughly 1 (at least 1.0, typically under 1.5) | [ ] | [ ] |
| 2.3 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py` | The run ends with `0 failed` | [ ] | [ ] |

## Criterion 3: `started_at` is captured once at startup and serialised in UTC with an explicit offset

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -s http://localhost:8010/api/uptime`, wait about 3 seconds, run it again | `started_at` is character-for-character identical in both bodies while `uptime_seconds` has grown | [ ] | [ ] |
| 3.2 | Read `started_at` | It ends in `+00:00` (not `Z`, not a local offset such as `+01:00`), and its date and time are the backend container's start time in UTC; compare with `docker compose ps backend`, whose status shows how long ago it started | [ ] | [ ] |
| 3.3 | Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers again | `started_at` is later than the value from step 3.1 and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Not a UI behaviour; the observable check is the code and its tests.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Open `backend/app/schemas/uptime.py` | It defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at` | [ ] | [ ] |
| 4.2 | Open `backend/app/routers/uptime.py` | The route decorator declares `response_model=UptimeResponse` | [ ] | [ ] |
| 4.3 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py` | The run ends with `0 failed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `uptime_seconds` and `started_at` | 1.1, 1.2 | [ ] Pass  [ ] Fail |
| 2. Non-negative and increasing | 2.1, 2.2, 2.3 | [ ] Pass  [ ] Fail |
| 3. Captured once, UTC with explicit offset | 3.1, 3.2, 3.3 | [ ] Pass  [ ] Fail |
| 4. Pydantic schema in `backend/app/schemas/` | 4.1, 4.2, 4.3 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
