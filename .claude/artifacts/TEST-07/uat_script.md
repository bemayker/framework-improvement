# UAT script: TEST-07 Uptime endpoint

`GET /api/uptime` reports how long the backend process has been running. No acceptance criterion is verifiable through the application UI, because no frontend screen consumes the endpoint. The observable check is the HTTP response, read with `curl` against the compose stack, plus the backend's interactive docs page for criterion 4.

## Prerequisites

- Docker is running.
- The repository is on branch `feature/TEST-07-uptime-endpoint` (or `main` once merged).
- From the repository root, `docker compose up -d --build` has completed and `docker compose ps` shows the `backend` service running.
- The backend is published on host port `8010` (from `docker-compose.yml`).
- A terminal with `curl`, and a browser.
- `curl` prints JSON without spaces, so `{"uptime_seconds":12.5,...}` on screen is the same body as `{"uptime_seconds": 12.5, ...}` below. The exact numbers and timestamps differ from the examples; the steps say what must hold.

## Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i http://localhost:8010/api/uptime` | The first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present | [ ] | [ ] |
| 1.2 | Read the body on the last line | A JSON object with exactly two keys, e.g. `{"uptime_seconds": 37.204, "started_at": "2026-10-13T08:00:00.123456Z"}`: `uptime_seconds` is an unquoted number and `started_at` is a quoted timestamp | [ ] | [ ] |

## Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://localhost:8010/api/uptime; echo; sleep 1; curl -s http://localhost:8010/api/uptime; echo` | Two bodies print, one per line | [ ] | [ ] |
| 2.2 | Compare the two `uptime_seconds` values | Both are 0 or greater, and the second is larger than the first by roughly one second (for example `41.02` then `42.04`), never smaller or equal | [ ] | [ ] |

## Criterion 3: `started_at` is captured once at startup and serialised in UTC with an explicit offset

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run the two-call command from step 2.1 again | The `started_at` value is character-for-character identical in both bodies | [ ] | [ ] |
| 3.2 | Read that `started_at` value | It is ISO 8601 and ends in `Z` (the UTC offset designator), e.g. `2026-10-13T08:00:00.123456Z`; it is not a timestamp without an offset such as `2026-10-13T08:00:00.123456` | [ ] | [ ] |
| 3.3 | Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running again, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is later than the value from step 3.1, and `uptime_seconds` is small (a few seconds), showing the value belongs to the new process start rather than being recomputed per request | [ ] | [ ] |
| 3.4 | Open `backend/app/main.py` and `backend/app/routers/uptime.py` in the editor | The start is captured in `lifespan` via `capture_process_start()` and stored on `app.state`; the router only reads it and contains no `datetime.now` call | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Open `http://localhost:8010/docs`, expand `GET /api/uptime` and look at the 200 response | Its schema is named `UptimeResponse`, with `uptime_seconds` a number (minimum 0) and `started_at` a string of format `date-time` | [ ] | [ ] |
| 4.2 | Open `backend/app/schemas/uptime.py` and `backend/app/routers/uptime.py` | The schema file defines `class UptimeResponse(BaseModel)`; the router declares `response_model=UptimeResponse` and returns an `UptimeResponse`, not a dict | [ ] | [ ] |
| 4.3 | Run `uv run --directory backend pytest -q tests/integration/test_uptime_integration.py tests/unit/test_uptime_service_unit.py tests/unit/test_uptime_schema_unit.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. Uptime returns 200 with `uptime_seconds` and `started_at` | 1.1 to 1.2 | [ ] Pass  [ ] Fail |
| 2. `uptime_seconds` is non-negative and increases | 2.1 to 2.2 | [ ] Pass  [ ] Fail |
| 3. `started_at` captured once, UTC with explicit offset | 3.1 to 3.4 | [ ] Pass  [ ] Fail |
| 4. Response body is a Pydantic schema | 4.1 to 4.3 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
