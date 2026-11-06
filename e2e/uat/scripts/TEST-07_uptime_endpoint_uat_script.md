# UAT Script, TEST-07: Uptime endpoint

`GET /api/uptime` reports how long the backend has been running and when it started, so an operator can tell a restart from a long-lived process.

No criterion is verifiable through the UI: no screen renders this endpoint. Every check reads the HTTP response with `curl` against the Docker Compose stack, where the backend is published at `http://localhost:8010` (`docker-compose.yml`), and with the stack's own logs.

## Prerequisites

- Docker is running.
- The repository is on branch `feature/TEST-07-uptime-endpoint`.
- Host ports 8010 (backend), 5442 (database) and 5183 (frontend) are free before start-up.
- From the repository root, `docker compose up -d --build` has completed and `docker compose ps` shows the `backend` service running. The backend waits for the database to be healthy, so allow a short time after the build.
- The endpoint reads no database, but the app's startup creates the notes schema, so the `db` service must be healthy for the backend to start.

## Criterion 1: `GET /api/uptime` returns 200 with `{"uptime_seconds": <number>, "started_at": "<ISO 8601 UTC>"}`

| Done | Step | Expected result |
|---|---|---|
| [ ] pass [ ] fail | 1.1 Run `curl -i http://localhost:8010/api/uptime` | The first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`. |
| [ ] pass [ ] fail | 1.2 Read the body | A single JSON object with exactly two keys, `uptime_seconds` and `started_at`, for example `{"uptime_seconds":7.214533,"started_at":"2026-11-06T10:02:11.482113+00:00"}`. `uptime_seconds` is an unquoted number and `started_at` is a quoted string. |
| [ ] pass [ ] fail | 1.3 Run `curl -i -X POST http://localhost:8010/api/uptime` | `HTTP/1.1 405 Method Not Allowed` (the endpoint is read-only). |

## Criterion 2: `uptime_seconds` is a non-negative number and increases between two calls a second apart

| Done | Step | Expected result |
|---|---|---|
| [ ] pass [ ] fail | 2.1 Run `curl -s http://localhost:8010/api/uptime` and note `uptime_seconds` (call it A) | A is 0 or greater. |
| [ ] pass [ ] fail | 2.2 Wait about one second, then run `curl -s http://localhost:8010/api/uptime` again and note `uptime_seconds` (call it B) | B is greater than A, by roughly one second plus however long you took between the two commands. No negative value ever appears. |

## Criterion 3: `started_at` is captured once at application startup, not recomputed per request, and serialised in UTC with an explicit offset

| Done | Step | Expected result |
|---|---|---|
| [ ] pass [ ] fail | 3.1 Run `curl -s http://localhost:8010/api/uptime` three times, a few seconds apart, and compare the `started_at` values | All three are character-for-character identical, while `uptime_seconds` grows each time. |
| [ ] pass [ ] fail | 3.2 Read the end of the `started_at` value | It ends in `+00:00` (an explicit UTC offset), not `Z` and not a bare time with no offset. |
| [ ] pass [ ] fail | 3.3 Run `docker compose logs backend \| grep -i "application startup complete"` and compare the log timestamp (if the log line carries one) with `started_at` | `started_at` is within a second or two of the startup line (allowing for the log's own timezone), not the time of your curl requests. If the log line carries no timestamp, mark this step as not applicable and rely on step 3.4. |
| [ ] pass [ ] fail | 3.4 Run `docker compose restart backend`, wait until `docker compose ps` shows it running, then run `curl -s http://localhost:8010/api/uptime` | `started_at` is later than the value from step 3.1, and `uptime_seconds` is small (a few seconds). This is how an operator tells a restart from a long-lived process. |
| [ ] pass [ ] fail | 3.5 Optional schema check: run `curl -s http://localhost:8010/openapi.json` and find `UptimeResponse` | `started_at` is documented as a string (`"type": "string"`). Do not expect `format: date-time`: it is deliberately not added. |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Not verifiable through the UI; the observable check is the source file and its tests.

| Done | Step | Expected result |
|---|---|---|
| [ ] pass [ ] fail | 4.1 Open `backend/app/schemas/uptime.py` and `backend/app/routers/uptime.py` | The schema file defines `class UptimeResponse(BaseModel)` with the fields `uptime_seconds` and `started_at`, and the router declares `response_model=UptimeResponse`. |
| [ ] pass [ ] fail | 4.2 From the repository root run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/integration/test_uptime_integration.py` | The summary line reports `0 failed` for those two files. The endpoint reads no database, so these tests run with `DATABASE_URL` unset; if it is set, it must point at a reachable PostgreSQL, because the app's startup creates the notes schema. |

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. 200 with `uptime_seconds` and `started_at` | 1.1 to 1.3 | | |
| 2. Non-negative and increasing | 2.1 to 2.2 | | |
| 3. Captured once, UTC with explicit offset | 3.1 to 3.5 | | |
| 4. Pydantic schema in `backend/app/schemas/` | 4.1 to 4.2 | | |

Overall result: [ ] pass [ ] fail

Tester: ____________  Date: ____________
