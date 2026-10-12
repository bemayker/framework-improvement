# UAT script: FEAT-1 Server time endpoint

`GET /api/time` reports the server's current time. No acceptance criterion is verifiable through the application UI, because no frontend screen consumes the endpoint. The observable check is the HTTP response, read with `curl` against the compose stack, plus the backend's interactive docs page for criterion 3.

## Prerequisites

- Docker is running.
- The repository is on branch `feature/FEAT-1-server-time-endpoint` (or `main` once merged).
- From the repository root, `docker compose up -d --build` has completed and `docker compose ps` shows the `backend` service running.
- The backend is published on host port `8010` (from `docker-compose.yml`).
- A terminal with `curl` and `uv`, and a browser.
- `curl` prints JSON without spaces, so `{"now":"...","timezone":"UTC"}` on screen is the same body as the spaced examples below. The timestamps differ from the examples; the steps say what must hold.

## Criterion 1: `GET /api/time` returns 200 with `now` and `timezone`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present | [ ] | [ ] |
| 1.2 | Read the body on the last line | A JSON object with exactly two keys, e.g. `{"now": "2026-10-13T08:00:00.123456Z", "timezone": "UTC"}`: `now` is a quoted timestamp and `timezone` is exactly `UTC` | [ ] | [ ] |
| 1.3 | Edge case: run `curl -i -X POST http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://localhost:8010/api/time; echo; sleep 1; curl -s http://localhost:8010/api/time; echo` | Two bodies print, one per line | [ ] | [ ] |
| 2.2 | Compare the two `now` values | They differ, and the second is about one second later than the first (for example `...08:00:00.10Z` then `...08:00:01.12Z`) | [ ] | [ ] |
| 2.3 | Read either `now` value | It ends in `Z`, not `+00:00` and not without any offset (a value like `2026-10-13T08:00:00.123456` with no suffix is a failure) | [ ] | [ ] |
| 2.4 | Run `date -u +%Y-%m-%dT%H:%M:%SZ` right after a `curl` | The printed UTC time matches `now` to within a second or two, confirming the value is UTC rather than local time | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `http://localhost:8010/docs`, expand `GET /api/time` and look at the 200 response | Its schema is named `ServerTimeResponse`, with `now` a string of format `date-time` and `timezone` a string whose only allowed value is `UTC` | [ ] | [ ] |
| 3.2 | Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` | The schema file defines `class ServerTimeResponse(BaseModel)` whose docstring states the `Z` choice; the router declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse`, not a dict; there is no `backend/app/services/server_time_service.py` | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` (no database needed) | The summary line reports `0 failed` | [ ] | [ ] |
| 4.2 | Open `backend/tests/unit/test_server_time_unit.py` | There is a test asserting the serialised `now` ends with `Z` and not `+00:00`, a test rejecting a naive `now`, and a test showing two calls of `get_server_time()` read the clock twice | [ ] | [ ] |
| 4.3 | Open `backend/tests/integration/test_server_time_integration.py` | There is a test asserting the exact two keys, one asserting the `Z` suffix, and one making two calls one second apart and asserting the `now` values differ | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. Time returns 200 with `now` and `timezone` | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. `now` per request, UTC with explicit offset | 2.1 to 2.4 | [ ] Pass  [ ] Fail |
| 3. Response body is a Pydantic schema | 3.1 to 3.2 | [ ] Pass  [ ] Fail |
| 4. Tests cover shape, offset and freshness | 4.1 to 4.3 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
