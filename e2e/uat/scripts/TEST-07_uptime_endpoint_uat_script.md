# UAT Script: TEST-07 Uptime endpoint

Backend-only feature: no screen consumes `/api/uptime`, so every check is a terminal `curl`, a browser address bar, or a file read.

## Prerequisites

- Docker running.
- Repository on branch `feature/TEST-07-uptime-endpoint` (or `main` once merged).
- From the repository root run `docker compose up -d --build`, then `docker compose ps` until the `backend` service shows running.
- The backend answers on `http://localhost:8010` (published by `docker-compose.yml`).
- Criterion 4 step 4.3 only: `uv` installed and backend dependencies synced (`uv sync --directory backend`).

## Criterion 1: GET /api/uptime returns 200 with uptime_seconds (a number) and started_at (ISO 8601 UTC)

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i http://localhost:8010/api/uptime` | First response line is `HTTP/1.1 200 OK`; `content-type` header is `application/json` | [ ] | [ ] |
| 1.2 | Read the body under the headers | A JSON object with exactly two fields: `uptime_seconds` holding an unquoted number such as `12.84`, and `started_at` holding a quoted timestamp such as `2026-10-19T09:15:03.123456+00:00`; no other field | [ ] | [ ] |
| 1.3 | Open `http://localhost:8010/api/uptime` in a browser address bar | Page shows the same two-field JSON object | [ ] | [ ] |

## Criterion 2: uptime_seconds is non-negative and increases between two calls a second apart

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (for example `30.11`) | The value is 0 or greater, never negative | [ ] | [ ] |
| 2.2 | Wait about one second, then run the same command again | The new `uptime_seconds` is greater than the one noted in 2.1, by roughly one second plus the time you took (for example `31.37`) | [ ] | [ ] |
| 2.3 | Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` | The second printed `uptime_seconds` is greater than the first | [ ] | [ ] |

## Criterion 3: started_at is captured once at application startup, not recomputed per request, and serialised in UTC with an explicit offset

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `curl -s http://localhost:8010/api/uptime` and note `started_at` | It ends in `+00:00` (an explicit offset: not `Z`, not a local offset such as `+02:00`) | [ ] | [ ] |
| 3.2 | Run the same command twice more, a few seconds apart | `started_at` is character-for-character identical on every call while `uptime_seconds` keeps growing, so the start time is not recomputed per request | [ ] | [ ] |
| 3.3 | Run `date -u` right after a call and subtract `started_at` from it | The difference is approximately the `uptime_seconds` value from the same moment, within a second or two | [ ] | [ ] |
| 3.4 | Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is later than the value noted in 3.1 and `uptime_seconds` is small (a few seconds), which is how an operator tells a restart from a long-lived process | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in backend/app/schemas/

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Open `backend/app/schemas/uptime.py` | `class UptimeResponse(BaseModel)` declares `uptime_seconds` as a float with `ge=0` and `started_at` as `AwareDatetime`, with a json-mode serializer that converts `started_at` to UTC | [ ] | [ ] |
| 4.2 | Open `backend/app/routers/uptime.py` | The route decorator declares `response_model=UptimeResponse`, `UptimeResponse` is imported from `app.schemas.uptime`, and the handler returns an `UptimeResponse` instance, not a dict literal, and calls no clock itself | [ ] | [ ] |
| 4.3 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_uptime_unit.py tests/unit/test_uptime_service_unit.py tests/unit/test_main_unit.py tests/integration/test_uptime_integration.py` | `0 failed` across those four files (no database needed for them) | [ ] | [ ] |
| 4.4 | Open `http://localhost:8010/docs` and expand `GET /api/uptime` | The 200 response schema is `UptimeResponse` with fields `uptime_seconds` (number) and `started_at` (string). The docs do not show a `date-time` format for `started_at`; that is expected, not a defect | [ ] | [ ] |

## Additional checks (edge cases)

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| E.1 | Run `curl -i -X POST http://localhost:8010/api/uptime` | `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. 200 with uptime_seconds and started_at | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. Non-negative, grows a second apart | 2.1 to 2.3 | [ ] Pass  [ ] Fail |
| 3. started_at captured once, UTC offset | 3.1 to 3.4 | [ ] Pass  [ ] Fail |
| 4. Pydantic response schema | 4.1 to 4.4 | [ ] Pass  [ ] Fail |
| Edge cases | E.1 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
