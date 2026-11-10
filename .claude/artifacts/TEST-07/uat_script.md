# UAT Script: TEST-07 Uptime endpoint

`GET /api/uptime` reports how long the backend process has been running. There is no UI for it, so every check goes through the HTTP API with `curl`, plus FastAPI's `/docs` page for the schema.

## Prerequisites

- The stack is running: `docker compose up -d --build` from the repo root.
- The backend answers on `http://localhost:8010` (host port 8010, as set in `docker-compose.yml`).
- `curl` is installed.

## Criterion 1: `GET /api/uptime` returns 200 with `uptime_seconds` and `started_at`

1. Run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8010/api/uptime`.
   - Expected: prints `200`.
   - [ ] Pass  [ ] Fail
2. Run `curl -s http://localhost:8010/api/uptime`.
   - Expected: one JSON object with exactly two keys, for example `{"uptime_seconds":42.517,"started_at":"2026-11-10T10:26:35.123456+00:00"}`. `uptime_seconds` is a bare number (no quotes); `started_at` is a quoted ISO 8601 string.
   - [ ] Pass  [ ] Fail

## Criterion 2: `uptime_seconds` is non-negative and increases between two calls a second apart

1. Run `curl -s http://localhost:8010/api/uptime; sleep 1; curl -s http://localhost:8010/api/uptime`.
   - Expected: two JSON objects are printed.
   - [ ] Pass  [ ] Fail
2. Compare the two `uptime_seconds` values.
   - Expected: both are 0 or greater, and the second is larger than the first by roughly 1 (between 1 and 2).
   - [ ] Pass  [ ] Fail
3. Run `docker compose restart backend`, wait until `curl -s http://localhost:8010/api/uptime` answers, and read `uptime_seconds`.
   - Expected: it is small (a few seconds) and lower than the values from step 2, showing the restart.
   - [ ] Pass  [ ] Fail

## Criterion 3: `started_at` is captured once, not recomputed per request, and serialised in UTC with an explicit offset

1. Run `curl -s http://localhost:8010/api/uptime; sleep 2; curl -s http://localhost:8010/api/uptime`.
   - Expected: two JSON objects are printed.
   - [ ] Pass  [ ] Fail
2. Compare the two `started_at` strings.
   - Expected: character-for-character identical.
   - [ ] Pass  [ ] Fail
3. Read the end of the `started_at` string.
   - Expected: it ends in `+00:00`, and the time shown is UTC (it matches `date -u` minus the reported uptime, to within a few seconds).
   - [ ] Pass  [ ] Fail
4. Run `docker compose restart backend`, then `curl -s http://localhost:8010/api/uptime`.
   - Expected: `started_at` is a later timestamp than in step 2, roughly the moment of the restart.
   - [ ] Pass  [ ] Fail

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

1. Open `http://localhost:8010/docs` in a browser.
   - Expected: Swagger UI lists `GET /api/uptime` under the `uptime` tag.
   - [ ] Pass  [ ] Fail
2. Expand `GET /api/uptime` and open the 200 response's Schema tab.
   - Expected: it shows `UptimeResponse` with `uptime_seconds` (number, minimum 0) and `started_at` (string, date-time).
   - [ ] Pass  [ ] Fail
3. Open `backend/app/schemas/uptime.py` in the repository.
   - Expected: it defines `class UptimeResponse(BaseModel)` with those two fields, and `backend/app/routers/uptime.py` declares `response_model=UptimeResponse`.
   - [ ] Pass  [ ] Fail
4. Run `uv run --directory backend pytest -q tests/unit/test_uptime_schema_unit.py tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py tests/unit/test_main_unit.py`.
   - Expected: the summary reports `0 failed`.
   - [ ] Pass  [ ] Fail

## Edge case: a non-GET method is rejected

1. Run `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8010/api/uptime`.
   - Expected: prints `405`.
   - [ ] Pass  [ ] Fail

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `uptime_seconds` and `started_at` | 2 | [ ] Pass  [ ] Fail |
| 2. Non-negative and increasing `uptime_seconds` | 3 | [ ] Pass  [ ] Fail |
| 3. `started_at` captured once, UTC offset | 4 | [ ] Pass  [ ] Fail |
| 4. Pydantic schema | 4 | [ ] Pass  [ ] Fail |
| Edge: POST returns 405 | 1 | [ ] Pass  [ ] Fail |

Tester: ________________  Date: ____________
