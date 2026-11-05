# UAT Script: FEAT-1 Server time endpoint

This endpoint has no UI. Every check is made against the running backend with `curl` from a terminal (the backend publishes on http://localhost:8010 under `docker compose up`).

## Prerequisites
- The stack is running: `docker compose up -d --build` from the repository root.
- `curl -i http://localhost:8010/api/version` answers 200.
- `uv` is installed (Criterion 4 only; no database is needed for those tests).

## Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/time` | First line reads `HTTP/1.1 200 OK`; `content-type` is `application/json` | [ ] | [ ] |
| 1.2 | Read the body under the headers | One JSON object with exactly two keys, e.g. `{"now":"2026-11-05T01:29:16.123456+00:00","timezone":"UTC"}`; `timezone` is exactly `"UTC"` | [ ] | [ ] |

## Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -s http://localhost:8010/api/time` and note `now` | A value such as `2026-11-05T01:29:16.123456+00:00` | [ ] | [ ] |
| 2.2 | Wait about one second, run the same command again | The new `now` differs from the first, roughly one second later | [ ] | [ ] |
| 2.3 | Compare both `now` values with `date -u` | Same hour and minute as `date -u` (a few seconds of skew allowed); both end with exactly `+00:00`, never `Z`, never another offset, never no offset | [ ] | [ ] |

## Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Open http://localhost:8010/docs in a browser and expand `GET /api/time` | The 200 response shows schema `ServerTimeResponse` with `now` (string, date-time) and `timezone` (string, "UTC") | [ ] | [ ] |
| 3.2 | Open `backend/app/routers/server_time.py` | Handler declares `response_model=ServerTimeResponse` and returns `ServerTimeResponse(...)`; no `dict` literal is returned | [ ] | [ ] |
| 3.3 | Open `backend/app/schemas/server_time.py` | Defines `ServerTimeResponse` and states the `+00:00` choice in its docstring | [ ] | [ ] |

## Criterion 4: Unit and integration tests cover shape, offset and per-request freshness

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | Summary line reports `0 failed` | [ ] | [ ] |
| 4.2 | Read the test names in `backend/tests/unit/test_server_time_unit.py` and `backend/tests/integration/test_server_time_integration.py` | Named tests exist for the shape (`test_get_time_returns_200_with_utc_now_and_plus_zero_offset`), the exact `+00:00` suffix (`test_server_time_response_serialises_now_with_plus_zero_offset_suffix`) and per-request freshness (`test_get_server_time_reads_the_clock_on_every_call`, `test_get_time_computes_now_per_request`) | [ ] | [ ] |

## Edge case: other methods are rejected

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 5.1 | Run `curl -i -X POST http://localhost:8010/api/time` | `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `now` and `timezone` | 1.1 to 1.2 | [ ] Pass [ ] Fail |
| 2. Per-request, UTC, explicit offset | 2.1 to 2.3 | [ ] Pass [ ] Fail |
| 3. Pydantic schema | 3.1 to 3.3 | [ ] Pass [ ] Fail |
| 4. Tests cover shape, offset, freshness | 4.1 to 4.2 | [ ] Pass [ ] Fail |
| Edge: POST returns 405 | 5.1 | [ ] Pass [ ] Fail |

Tester: ______________  Date: ______________
