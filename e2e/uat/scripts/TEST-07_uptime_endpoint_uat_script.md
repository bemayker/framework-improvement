# UAT Script: TEST-07 Uptime endpoint

This feature has no UI of its own; every check is made against the running backend in a terminal or through FastAPI's docs page at `http://localhost:8010/docs`.

## Prerequisites (all criteria)
- [ ] The stack is up: `docker compose up -d` at the repo root.
- [ ] The backend answers on `http://localhost:8010`: `curl -s http://localhost:8010/api/version` prints a JSON version.
- [ ] `curl` and `date` are available in the terminal.

## Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`

| Step | Action | Expected | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -s -i http://localhost:8010/api/uptime` | First line reads `HTTP/1.1 200 OK`; `content-type` header is `application/json` | [ ] | [ ] |
| 1.2 | Read the body under the headers | One JSON object with exactly two keys: `uptime_seconds` an unquoted number such as `42.317`, `started_at` a quoted string such as `"2026-11-18T09:15:02.481233+00:00"` | [ ] | [ ] |
| 1.3 | Open `http://localhost:8010/docs`, expand `GET /api/uptime`, click `Try it out` then `Execute` | Server response shows code `200` and the same two-key body | [ ] | [ ] |

## Criterion 2: `uptime_seconds` is a non-negative number and increases between two calls a second apart

| Step | Action | Expected | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (for example `120.004`) | Value is 0 or greater | [ ] | [ ] |
| 2.2 | Wait about one second, run the same command again | New `uptime_seconds` is greater than step 2.1 by roughly one second (for example `121.019`) | [ ] | [ ] |
| 2.3 | Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/version` answers, then run `curl -s http://localhost:8010/api/uptime` | `uptime_seconds` is small (a few seconds) and not negative, showing the restart | [ ] | [ ] |

## Criterion 3: `started_at` is captured once at startup, not recomputed per request, and serialised in UTC with an explicit offset

| Step | Action | Expected | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -s http://localhost:8010/api/uptime` and copy `started_at` | Ends in `+00:00` (not `Z`, not a local offset such as `+01:00`) | [ ] | [ ] |
| 3.2 | Wait about two seconds, run the same command again | `started_at` is character-for-character identical to step 3.1, while `uptime_seconds` has grown | [ ] | [ ] |
| 3.3 | Run `date -u +%Y-%m-%dT%H:%M:%S` | Printed time is within a second or two of `started_at` advanced by `uptime_seconds` | [ ] | [ ] |
| 3.4 | Run `docker compose restart backend`, wait until the backend answers, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is later than the step 3.1 value (the restart time), still ending in `+00:00` | [ ] | [ ] |

## Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`
Additional prerequisite: the repository is checked out on this branch.

| Step | Action | Expected | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Open `backend/app/schemas/uptime.py` | Defines `class UptimeResponse(BaseModel)` with `uptime_seconds: float` and `started_at: datetime` | [ ] | [ ] |
| 4.2 | Open `backend/app/routers/uptime.py` | `@router.get("/uptime", ...)` passes `response_model=UptimeResponse`, imported from `app.schemas.uptime` | [ ] | [ ] |
| 4.3 | Open `http://localhost:8010/docs`, expand `GET /api/uptime` | 200 response schema is named `UptimeResponse`, listing `uptime_seconds` (number) and `started_at` (string, date-time) | [ ] | [ ] |
| 4.4 | Run `uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py tests/unit/test_main_unit.py` | The run passes: its summary reports no failed or errored test and the command exits 0 | [ ] | [ ] |

## Edge case: non-GET method

| Step | Action | Expected | Pass | Fail |
|---|---|---|---|---|
| E.1 | Run `curl -s -i -X POST http://localhost:8010/api/uptime` | First line reads `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `uptime_seconds` and `started_at` | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. Non-negative and increasing | 2.1 to 2.3 | [ ] Pass  [ ] Fail |
| 3. Captured once, UTC, explicit offset | 3.1 to 3.4 | [ ] Pass  [ ] Fail |
| 4. Pydantic schema | 4.1 to 4.4 | [ ] Pass  [ ] Fail |
| Edge case: POST gives 405 | E.1 | [ ] Pass  [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass  [ ] Fail
