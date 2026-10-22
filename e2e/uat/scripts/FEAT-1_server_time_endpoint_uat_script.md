# UAT Script: FEAT-1 Server time endpoint

`GET /api/time` reports the server's current UTC time. No UI consumes the endpoint, so every step is checked with `curl`, the OpenAPI document and the test suite against the running backend.

## Prerequisites

- Docker is running.
- Repository checked out on `feature/FEAT-1-server-time-endpoint`.
- From the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running, published on `http://localhost:8010` (the `docker-compose.yml` mapping `8010:8010`).
- A terminal with `curl`, `python3` and `uv`.

## Criterion 1: `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/time` | First line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers | [ ] | [ ] |
| 1.2 | Read the body printed by step 1.1 | One JSON object with exactly two keys: `now`, a quoted string such as `"2026-10-22T17:29:35.123456Z"`, and `timezone`, the string `"UTC"`; nothing else | [ ] | [ ] |

## Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` | Two JSON bodies are printed | [ ] | [ ] |
| 2.2 | Compare the two `now` values | They differ, and the second is about one second later than the first (between 1.0 and roughly 1.2 seconds, allowing for curl's own time) | [ ] | [ ] |
| 2.3 | Read either `now` value | It ends in `Z` (the pinned zero-offset designator); it never ends in `+00:00` and never ends with no designator at all | [ ] | [ ] |
| 2.4 | Run `python3 -c "from datetime import datetime; print(datetime.fromisoformat('PASTE_NOW_HERE').utcoffset())"`, replacing `PASTE_NOW_HERE` with a `now` value from step 2.1 | Prints `0:00:00` | [ ] | [ ] |
| 2.5 | Run `date -u +%Y-%m-%dT%H:%M:%SZ` and immediately `curl -s http://localhost:8010/api/time` | `now` matches the printed UTC time to within a couple of seconds (the container and host share the host clock) | [ ] | [ ] |
| 2.6 | Run `curl -i -X POST http://localhost:8010/api/time` | First line reads `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open `backend/app/schemas/server_time.py` | Defines `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (its docstring and field description name the `Z` format) and `timezone: Literal["UTC"]` | [ ] | [ ] |
| 3.2 | Open `backend/app/routers/server_time.py` | The route declares `response_model=ServerTimeResponse` and returns `ServerTimeResponse(...)`, not a dict literal; there is no import from `app.services` | [ ] | [ ] |
| 3.3 | Run `curl -s http://localhost:8010/openapi.json` and find `paths`, `/api/time`, `get`, `responses`, `200` | Its schema is a `$ref` to a `components.schemas` entry named for `ServerTimeResponse`; in it `now` is `"type": "string"` with `"format": "date-time"` and `timezone` is restricted to `"UTC"` | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | The run reports `0 failed` for those three files | [ ] | [ ] |
| 4.2 | Open `backend/tests/unit/test_server_time_unit.py` | Contains a test asserting the exact `Z` suffix (`test_server_time_response_serializes_now_with_z_suffix`) and one rejecting a naive datetime | [ ] | [ ] |
| 4.3 | Open `backend/tests/integration/test_server_time_integration.py` | Contains the shape test (`test_get_time_returns_200_with_now_and_timezone`) and the two freshness tests (`test_get_time_returns_different_now_for_calls_a_second_apart`, `test_get_time_reads_the_clock_at_request_time`) | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. 200 with `now` and `timezone` | 1.1 to 1.2 | | |
| 2. Per request, UTC, explicit offset, never naive | 2.1 to 2.6 | | |
| 3. Response defined by a Pydantic schema | 3.1 to 3.3 | | |
| 4. Tests cover shape, offset and freshness | 4.1 to 4.3 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
