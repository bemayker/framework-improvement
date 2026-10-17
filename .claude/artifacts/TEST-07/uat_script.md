# UAT Script: TEST-07 Uptime endpoint

No acceptance criterion is verifiable through the UI: no frontend screen calls `GET /api/uptime`. Each block gives an observable HTTP check instead, made with `curl` in a terminal (or the same URL in a browser address bar).

## Prerequisites

- Docker and Docker Compose running.
- Repository on branch `feature/TEST-07-uptime-endpoint`.
- From the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running.
- The backend answers on `http://localhost:8010` (the host port `docker-compose.yml` publishes).
- A terminal with `curl`; a browser for steps that name one.

## Criterion 1: GET /api/uptime returns 200 with uptime_seconds (number) and started_at (ISO 8601 UTC string)

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/uptime` and read the first response line | It reads `HTTP/1.1 200 OK` | [ ] | [ ] |
| 1.2 | Read the `content-type` header of the same response | It is `application/json` | [ ] | [ ] |
| 1.3 | Read the response body | A JSON object with exactly two keys, `uptime_seconds` and `started_at`, and nothing else | [ ] | [ ] |
| 1.4 | Read `uptime_seconds` | A plain number without quotes, for example `12.84` (fractional digits expected) | [ ] | [ ] |
| 1.5 | Read `started_at` | A quoted string shaped like `2026-10-17T09:15:02.123456+00:00`: a date, the letter `T`, a time, and an offset | [ ] | [ ] |
| 1.6 | Paste `http://localhost:8010/api/uptime` into a browser address bar | The page shows the same two-key JSON object | [ ] | [ ] |

## Criterion 2: uptime_seconds is non-negative and increases between two calls a second apart

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (for example `30.2`) | It is 0 or greater, never negative | [ ] | [ ] |
| 2.2 | Wait about one second, run the same command again and note the new `uptime_seconds` | It is at least 1 greater than the value from step 2.1 (for example `31.3` or more) | [ ] | [ ] |
| 2.3 | Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime` | The second line shows an `uptime_seconds` at least 1 greater than the first line | [ ] | [ ] |

## Criterion 3: started_at is captured once at application startup, not per request, and serialised in UTC with an explicit offset

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -s http://localhost:8010/api/uptime` and copy the full `started_at` string | A `started_at` string is copied | [ ] | [ ] |
| 3.2 | Wait a few seconds and run the same command again | `started_at` is character-for-character identical to step 3.1, while `uptime_seconds` has grown (not recomputed per request) | [ ] | [ ] |
| 3.3 | Read the end of the `started_at` string | It ends in `+00:00`, the explicit UTC offset (not `Z`, and not a missing offset) | [ ] | [ ] |
| 3.4 | Compare `started_at` with the current UTC time from `date -u +%Y-%m-%dT%H:%M:%S` | `started_at` is earlier, by roughly `uptime_seconds` seconds | [ ] | [ ] |
| 3.5 | Run `docker compose restart backend`, wait until `docker compose ps` shows it running again, and repeat step 3.1 | `started_at` is a new, later value and `uptime_seconds` has started again near 0 (set when the application starts) | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in backend/app/schemas/

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/uptime` | The 200 response schema is named `UptimeResponse`, with `uptime_seconds` (number, minimum 0) and `started_at` (string, format date-time), both required | [ ] | [ ] |
| 4.2 | Open `backend/app/schemas/uptime.py` | It defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at` | [ ] | [ ] |
| 4.3 | Open `backend/app/routers/uptime.py` | The route decorator names `response_model=UptimeResponse` and the handler returns an `UptimeResponse`, not a dict literal | [ ] | [ ] |
| 4.4 | From the repository root, run `uv run --directory backend pytest -q tests/integration/test_uptime_integration.py tests/unit/test_uptime_service_unit.py tests/unit/test_uptime_schema_unit.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `uptime_seconds` and `started_at` | 1.1 to 1.6 | [ ] Pass  [ ] Fail |
| 2. Non-negative and increasing | 2.1 to 2.3 | [ ] Pass  [ ] Fail |
| 3. `started_at` captured once, UTC with `+00:00` | 3.1 to 3.5 | [ ] Pass  [ ] Fail |
| 4. Pydantic schema in `backend/app/schemas/` | 4.1 to 4.4 | [ ] Pass  [ ] Fail |

Overall: [ ] Pass  [ ] Fail

Tester: ______________  Date: ______________
