# UAT Script: FEAT-1 Server time endpoint

The endpoint has no UI; every check is an HTTP call or a file read.

## Prerequisites

- [ ] Docker is running.
- [ ] The stack is up: `docker compose up -d --build` from the repository root.
- [ ] `docker compose ps` shows the `backend` service running (the endpoint needs no database, but compose starts `db` anyway).
- [ ] A terminal with `curl` is available.
- [ ] The backend is published on the host at `http://localhost:8010` (`docker-compose.yml`, backend `8010:8010`).

## Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -s -i http://localhost:8010/api/time` | Status line reads `HTTP/1.1 200 OK` and `content-type: application/json` | [ ] | [ ] |
| 1.2 | Read the body printed under the headers | One JSON object with exactly two keys: `now` (a string such as `2026-11-10T11:19:09.123456+00:00`) and `timezone` with the value `"UTC"`; nothing else | [ ] | [ ] |
| 1.3 | Run `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8010/api/time` | Prints `405` | [ ] | [ ] |

## Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://localhost:8010/api/time`, wait about one second, then run the same command again | Two JSON bodies are printed | [ ] | [ ] |
| 2.2 | Compare the two `now` values | They differ; the second is about one second later than the first | [ ] | [ ] |
| 2.3 | Look at the end of each `now` value | Each ends with exactly `+00:00` (not `Z`, never without an offset) | [ ] | [ ] |
| 2.4 | Compare the hour and minute in `now` with `date -u +%H:%M` run in the same terminal | They match (UTC, not the machine's local time) | [ ] | [ ] |

## Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` | The 200 response schema is named `ServerTimeResponse`, with `now` (string) and `timezone` (the constant `UTC`) | [ ] | [ ] |
| 3.2 | Open `backend/app/schemas/server_time.py` | It defines `class ServerTimeResponse(BaseModel)` with `now`, `timezone`, the `UTC_OFFSET_SUFFIX = "+00:00"` constant and the `now` serializer | [ ] | [ ] |
| 3.3 | Open `backend/app/routers/server_time.py` | The handler declares `response_model=ServerTimeResponse` and returns `ServerTimeResponse(...)`; no `return {...}` dict literal appears | [ ] | [ ] |

## Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` (no failures, no errors) | [ ] | [ ] |
| 4.2 | Open `backend/tests/unit/test_server_time_unit.py` and `backend/tests/integration/test_server_time_integration.py` | Each file has a test for the shape (keys and `timezone`), one asserting the exact `+00:00` suffix, and one for per-request freshness (the clock-seam test; the integration file also has the before-and-after bracket test) | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. 200 with `now` and `timezone` | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. Per request, UTC, explicit offset | 2.1 to 2.4 | [ ] Pass  [ ] Fail |
| 3. Pydantic schema | 3.1 to 3.3 | [ ] Pass  [ ] Fail |
| 4. Tests cover shape, offset, freshness | 4.1 to 4.2 | [ ] Pass  [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass  [ ] Fail
