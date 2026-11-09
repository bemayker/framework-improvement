# UAT Script: FEAT-1 Server time endpoint

No acceptance criterion is verifiable through the UI: no frontend screen consumes `GET /api/time`. Each check reads the HTTP response with `curl` in a terminal against the compose stack (backend published on host port `8010`).

## Prerequisites (all blocks)

- Docker running; repository on branch `feature/FEAT-1-server-time-endpoint`.
- From the repository root, `docker compose up -d --build` has been run; `docker compose ps` shows `backend` running and `db` healthy.
- A terminal with `curl` and `python3`.

## Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i http://localhost:8010/api/time` | First line reads `HTTP/1.1 200 OK`; a `content-type: application/json` header is present | [ ] | [ ] |
| 1.2 | Read the response body | Exactly two keys, e.g. `{"now":"2026-11-09T16:53:24.123456+00:00","timezone":"UTC"}`; `timezone` is exactly `UTC`; `now` is close to the current UTC time (compare with `date -u`) | [ ] | [ ] |
| 1.3 | Run `curl -i -X POST http://localhost:8010/api/time` (edge case: read-only) | `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` | Two JSON bodies are printed | [ ] | [ ] |
| 2.2 | Compare the two `now` values | Both end in `+00:00`; the second is about one second later than the first (e.g. `...16:53:24.12...+00:00` then `...16:53:25.13...+00:00`); they are not identical | [ ] | [ ] |
| 2.3 | Run `curl -s http://localhost:8010/api/time \| python3 -c "import json,sys; from datetime import datetime; print(datetime.fromisoformat(json.load(sys.stdin)['now']).utcoffset())"` | Prints `0:00:00` (the value parses as an aware datetime at UTC) | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `backend/app/schemas/server_time.py` | Defines `class ServerTimeResponse(BaseModel)` with fields `now` and `timezone` | [ ] | [ ] |
| 3.2 | Open `backend/app/routers/server_time.py` | The `GET /time` route declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse(...)` instance; no `{...}` dict literal is returned | [ ] | [ ] |
| 3.3 | Run `curl -s http://localhost:8010/openapi.json \| python3 -c "import json,sys; d=json.load(sys.stdin); print(d['paths']['/api/time']['get']['responses']['200']['content']['application/json']['schema'])"` | Prints a `$ref` ending in `ServerTimeResponse` | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

Prerequisite: `uv` installed on the host. The database is not needed for these files.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_service_unit.py tests/unit/test_server_time_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` | Summary line reports `0 failed` and no errors | [ ] | [ ] |
| 4.2 | Open `backend/tests/integration/test_server_time_integration.py` | Contains `test_get_time_returns_200_with_now_and_timezone` (shape), `test_get_time_now_is_utc_with_explicit_offset` (offset) and `test_get_time_now_is_computed_per_request` (freshness) | [ ] | [ ] |
| 4.3 | Open `backend/tests/unit/test_server_time_service_unit.py` and `backend/tests/unit/test_server_time_schema_unit.py` | `test_get_current_utc_time_reads_the_clock_on_every_call` and `test_server_time_response_serialises_now_with_explicit_utc_offset` are present | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. 200 with `now` and `timezone` | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. Per-request, UTC, explicit offset | 2.1 to 2.3 | [ ] Pass  [ ] Fail |
| 3. Pydantic schema | 3.1 to 3.3 | [ ] Pass  [ ] Fail |
| 4. Tests cover shape, offset, freshness | 4.1 to 4.3 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
