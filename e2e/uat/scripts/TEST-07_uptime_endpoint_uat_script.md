# UAT Script: TEST-07 Uptime endpoint

No acceptance criterion is verifiable through the application UI: no frontend screen consumes `GET /api/uptime`. Criteria 1 to 3 are checked from the HTTP response with `curl`; criterion 4 is checked in the backend's interactive API docs and by running the feature's tests.

## Prerequisites

- Docker running; repository checked out on `feature/TEST-07-uptime-endpoint`.
- Nothing else bound to host port 8010.
- From the repository root, `docker compose up -d --build` has completed and `docker compose ps` shows the `backend` service running.
- `curl` and `uv` installed on the host.

## Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

1. Run `curl -i http://localhost:8010/api/uptime`.
   - Expected: first response line reads `HTTP/1.1 200 OK`; the `content-type` header is `application/json`.
   - [ ] Pass  [ ] Fail
2. Read the response body.
   - Expected: a JSON object with exactly two fields, e.g. `{"uptime_seconds":37.2041,"started_at":"2026-10-30T15:03:13.482911+00:00"}`; `uptime_seconds` is an unquoted number and `started_at` a quoted date-time string.
   - [ ] Pass  [ ] Fail

## Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; echo; curl -s http://localhost:8010/api/uptime`.
   - Expected: two JSON bodies print, one per line.
   - [ ] Pass  [ ] Fail
2. Compare the two `uptime_seconds` values.
   - Expected: both are 0 or greater, and the second is larger than the first by roughly 1 (about 1.0 to 1.5).
   - [ ] Pass  [ ] Fail

## Criterion 3: `started_at` is captured once at startup and serialised in UTC with an explicit offset

1. Run `curl -s http://localhost:8010/api/uptime`, wait about 3 seconds, run it again.
   - Expected: the two `started_at` values are character-for-character identical; `uptime_seconds` has grown by about 3.
   - [ ] Pass  [ ] Fail
2. Read the end of the `started_at` value.
   - Expected: it ends in `+00:00`, not `Z` and not without an offset.
   - [ ] Pass  [ ] Fail
3. Run `date -u` and compare with `started_at`.
   - Expected: `started_at` is earlier than the current UTC time, close to when `docker compose up` brought the backend up.
   - [ ] Pass  [ ] Fail
4. Run `docker compose restart backend`, wait until `docker compose ps` shows `backend` running, then run `curl -s http://localhost:8010/api/uptime`.
   - Expected: `started_at` is later than the value from step 1 (roughly the restart time) and `uptime_seconds` is small again (a few seconds).
   - [ ] Pass  [ ] Fail

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

1. In a browser, open `http://localhost:8010/docs`.
   - Expected: Swagger UI titled "Task Notes API" lists `GET /api/uptime` under the `uptime` tag.
   - [ ] Pass  [ ] Fail
2. Expand `GET /api/uptime`.
   - Expected: under Responses, code 200 shows the schema `UptimeResponse` with fields `uptime_seconds` (number) and `started_at` (string).
   - [ ] Pass  [ ] Fail
3. Click "Try it out", then "Execute".
   - Expected: Server response shows code 200 and a body with the two fields described in criterion 1.
   - [ ] Pass  [ ] Fail
4. Scroll to the Schemas section.
   - Expected: `UptimeResponse` is listed.
   - [ ] Pass  [ ] Fail
5. Open `backend/app/schemas/uptime.py`.
   - Expected: it defines the `UptimeResponse` Pydantic model the docs page named.
   - [ ] Pass  [ ] Fail
6. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/unit/test_main_unit.py tests/integration/test_uptime_integration.py`.
   - Expected: the summary line reports `0 failed` (a run with no failures prints no failed count, which also reads as 0 failed).
   - [ ] Pass  [ ] Fail

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `uptime_seconds` and `started_at` | 2 | [ ] Pass  [ ] Fail |
| 2. Non-negative and increasing | 2 | [ ] Pass  [ ] Fail |
| 3. Captured once, UTC, explicit offset | 4 | [ ] Pass  [ ] Fail |
| 4. Defined by a Pydantic schema | 6 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________
