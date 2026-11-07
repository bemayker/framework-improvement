# UAT Script: FEAT-1 Server time endpoint

None of the criteria is verifiable through the UI: no frontend screen consumes `GET /api/time`. Each check reads the HTTP response with `curl` or a browser against the running stack (backend on host port 8010, confirmed in `docker-compose.yml`).

## Prerequisites
- The stack is running: `docker compose up -d`, and `docker compose ps` shows the backend container up.
- `curl` and `uv` are installed (`uv` only for Criterion 4).

## Criterion 1: GET /api/time returns 200 with now and timezone "UTC"
1. Run `curl -i http://localhost:8010/api/time`.
   - Expected: the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
   - [ ] Pass  [ ] Fail
2. Read the body.
   - Expected: one JSON object with exactly two keys, `now` (such as `2026-11-07T17:00:48.123456+00:00`) and `timezone` with the value `"UTC"`.
   - [ ] Pass  [ ] Fail

## Criterion 2: now is computed per request, UTC with an explicit offset, never naive
1. Run `curl -s http://localhost:8010/api/time`, wait about one second, run it again.
   - Expected: two bodies are printed.
   - [ ] Pass  [ ] Fail
2. Compare the two `now` values.
   - Expected: the second is about one second later; they are not identical.
   - [ ] Pass  [ ] Fail
3. Look at the end of each `now` value.
   - Expected: each ends in exactly `+00:00`, never `Z`, never without an offset.
   - [ ] Pass  [ ] Fail
4. Run `date -u +%H:%M:%S` and compare with the time in a fresh `now`.
   - Expected: they agree within a second or two (UTC, not local time).
   - [ ] Pass  [ ] Fail

## Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/
1. Open `http://localhost:8010/docs` in a browser.
   - Expected: Swagger UI lists `GET /api/time` under the `time` tag.
   - [ ] Pass  [ ] Fail
2. Expand `GET /api/time` and read its 200 response schema.
   - Expected: it is named `ServerTimeResponse` with fields `now` (string, date-time) and `timezone` (string, `UTC`).
   - [ ] Pass  [ ] Fail
3. Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py`.
   - Expected: `ServerTimeResponse` lives in the schemas file; the router declares `response_model=ServerTimeResponse` and returns an instance, not a dict.
   - [ ] Pass  [ ] Fail

## Criterion 4: unit and integration tests cover shape, offset and freshness
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py`.
   - Expected: the run ends with `0 failed`.
   - [ ] Pass  [ ] Fail
2. Open the two new test files (`backend/tests/unit/test_server_time_unit.py`, `backend/tests/integration/test_server_time_integration.py`).
   - Expected: at least one test asserts the response shape, one the `+00:00` suffix, and one that two calls return different `now` values.
   - [ ] Pass  [ ] Fail

## Edge case: POST is not allowed
1. Run `curl -i -X POST http://localhost:8010/api/time`.
   - Expected: `HTTP/1.1 405 Method Not Allowed`.
   - [ ] Pass  [ ] Fail

## Summary

| # | Criterion | Steps | Result |
|---|---|---|---|
| 1 | 200 with now and timezone "UTC" | 2 | [ ] Pass  [ ] Fail |
| 2 | Per request, UTC, explicit offset | 4 | [ ] Pass  [ ] Fail |
| 3 | Pydantic schema | 3 | [ ] Pass  [ ] Fail |
| 4 | Tests cover shape, offset, freshness | 2 | [ ] Pass  [ ] Fail |
| Edge | POST returns 405 | 1 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________
