# UAT Script: FEAT-1 Server time endpoint

This feature has no screen of its own. The UI used to verify it is the browser pointed at the API, plus FastAPI's Swagger UI at `/docs`.

## Prerequisites

- The stack is running: `docker compose up -d --build` from the repository root. The backend answers at `http://localhost:8010` (the `backend` service's published port in `docker-compose.yml`).
- You know the current UTC time (for example from `https://time.is/UTC`).
- No credentials or seeded records are needed.
- Criterion 4 additionally needs a checkout of the feature branch with `uv` installed; no database is needed for its test files.

## Criterion 1: GET /api/time returns 200 with now (ISO 8601 UTC with explicit offset) and timezone UTC

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Open `http://localhost:8010/docs` in a browser | Swagger UI lists a `time` section containing `GET /api/time` | [ ] | [ ] |
| 1.2 | Click `GET /api/time`, then `Try it out`, then `Execute` | The Responses panel shows `Code` 200 | [ ] | [ ] |
| 1.3 | Read the `Response body` | Exactly two keys, `now` and `timezone`; `timezone` is `UTC`; `now` looks like `2026-10-18T20:41:07.512834+00:00` and matches the current UTC time to within a few seconds | [ ] | [ ] |

## Criterion 2: now is computed per request, in UTC with an explicit offset, never naive

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Open `http://localhost:8010/api/time` in a browser tab and note the `now` value | JSON body appears, for example `2026-10-18T20:41:07.512834+00:00` | [ ] | [ ] |
| 2.2 | Check the end of that `now` value | It ends with `+00:00`; it does not end with `Z` and is never without an offset | [ ] | [ ] |
| 2.3 | Wait at least one second, then reload the tab | A new `now` appears, later than the first by about the time waited, still ending in `+00:00` | [ ] | [ ] |
| 2.4 | Reload twice more, quickly | Every reload shows a different, increasing `now`; it never repeats a previous value | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `http://localhost:8010/docs` and scroll to the `Schemas` section at the bottom | A schema named `ServerTimeResponse` is listed | [ ] | [ ] |
| 3.2 | Expand `ServerTimeResponse` | `now` is a required `string($date-time)`; `timezone` is a `string` whose only allowed value is `UTC` | [ ] | [ ] |
| 3.3 | Expand `GET /api/time` and read its 200 response | Its schema is `ServerTimeResponse`, not an untyped object | [ ] | [ ] |
| 3.4 | Open `backend/app/routers/server_time.py` and `backend/app/schemas/server_time.py` | The route is declared with `response_model=ServerTimeResponse` and returns `ServerTimeResponse(...)`; the schema file defines that class; there is no dict literal in the handler | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

This criterion is about the tests, so it is verified in a terminal.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_schema_unit.py tests/unit/test_server_time_router_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` | The summary line reports `0 failed` (no failures, no errors) | [ ] | [ ] |
| 4.2 | Open `backend/tests/integration/test_server_time_integration.py` | A test for the body shape (`test_get_time_returns_200_with_exactly_now_and_timezone`), one asserting the `+00:00` suffix (`test_get_time_now_ends_with_plus_00_00_offset`), and two for per-request freshness (real clock: `test_get_time_second_consecutive_request_is_strictly_later`; override: `test_get_time_with_clock_override_one_second_apart_differs_by_one_second`) | [ ] | [ ] |
| 4.3 | Open `backend/tests/unit/test_server_time_schema_unit.py` | A test asserting the exact `+00:00` suffix (`test_server_time_response_serialises_now_with_plus_00_00_suffix`) and one rejecting a naive datetime (`test_server_time_response_rejects_naive_datetime`) | [ ] | [ ] |

## Edge case: a non-GET method is rejected

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 5.1 | In Swagger UI or a terminal, send `POST http://localhost:8010/api/time` (for example `curl -i -X POST http://localhost:8010/api/time`) | Status 405 Method Not Allowed | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|-----------|-------|--------|--------|
| 1. 200 with now and timezone | 1.1 to 1.3 | | |
| 2. Per-request, UTC offset, never naive | 2.1 to 2.4 | | |
| 3. Pydantic schema | 3.1 to 3.4 | | |
| 4. Tests cover shape, offset, freshness | 4.1 to 4.3 | | |
| Edge case: POST returns 405 | 5.1 | | |

Tester: ______________  Date: ______________  Overall result: [ ] Pass  [ ] Fail
