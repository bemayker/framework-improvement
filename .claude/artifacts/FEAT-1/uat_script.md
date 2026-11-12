# UAT Script: FEAT-1 Server time endpoint

This feature has no UI. Every criterion is verified against the running API from a browser address bar or a terminal.

## Prerequisites

- A terminal at the repository root.
- The backend running locally on port 8000: `uv run --directory backend uvicorn app.main:app --port 8000`. No database is needed for this endpoint (without `DATABASE_URL` the app logs a warning at startup and still serves `/api/time`).

## Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Open `http://localhost:8000/api/time` in a browser | The page shows a JSON object with exactly two keys, `now` and `timezone` | [ ] | [ ] |
| 1.2 | Read the `timezone` value | It is exactly `UTC` | [ ] | [ ] |
| 1.3 | Run `curl -i http://localhost:8000/api/time` | First line is `HTTP/1.1 200 OK`; the `content-type` header is `application/json` | [ ] | [ ] |
| 1.4 | Run `curl -i -X POST http://localhost:8000/api/time` | The status line reads `405 Method Not Allowed` | [ ] | [ ] |

## Criterion 2: `now` is computed per request (two calls a second apart differ), serialised in UTC with an explicit offset, never naive

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Open `http://localhost:8000/api/time` and note the `now` value, for example `2026-11-12T22:28:59+00:00` | A date, `T`, a time in whole seconds, ending with `+00:00` (not `Z`, never without an offset) | [ ] | [ ] |
| 2.2 | Compare the time part with `date -u` in a terminal | They agree to within a few seconds | [ ] | [ ] |
| 2.3 | Wait at least two seconds, then reload the page | The new `now` is later than the one noted in 2.1 and still ends with `+00:00` | [ ] | [ ] |

## Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `http://localhost:8000/docs` | The Swagger page lists `GET /api/time` under the `time` tag | [ ] | [ ] |
| 3.2 | Expand `GET /api/time` and open its 200 response schema | It is named `ServerTimeResponse` with fields `now` (string) and `timezone` (`UTC`) | [ ] | [ ] |
| 3.3 | Open `backend/app/schemas/server_time.py` | It defines `class ServerTimeResponse(BaseModel)`, and its docstring states the `+00:00` offset choice | [ ] | [ ] |
| 3.4 | Open `backend/app/routers/server_time.py` | The handler returns `ServerTimeResponse(now=now)`, with no dict literal as the response | [ ] | [ ] |

## Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` | The summary line reports `0 failed` | [ ] | [ ] |
| 4.2 | Read the test names in `backend/tests/integration/test_server_time_integration.py` | `test_get_time_computes_now_per_request` and `test_get_time_now_ends_with_plus_zero_offset` are present | [ ] | [ ] |
| 4.3 | Read the test names in `backend/tests/unit/test_server_time_unit.py` | `test_server_time_response_serializes_now_with_plus_zero_offset_suffix` is present | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. 200 with `now` and `timezone` | 1.1 to 1.4 | | |
| 2. Per-request, UTC, explicit offset | 2.1 to 2.3 | | |
| 3. Pydantic schema | 3.1 to 3.4 | | |
| 4. Tests cover shape, offset, freshness | 4.1 to 4.3 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
