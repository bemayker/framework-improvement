# UAT Script: FEAT-1 Server time endpoint

No criterion is verifiable through the UI, because no frontend screen consumes `GET /api/time`. The checks below use `curl` against the compose stack (backend published on host port `8010` by `docker-compose.yml`) and read the files and test output.

## Prerequisites
- Docker running.
- Repository on branch `feature/FEAT-1-server-time-endpoint`.
- `docker compose up -d --build` run from the repo root, and `docker compose ps` showing `backend` running.

## Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`
- [ ] Step 1: run `curl -i http://localhost:8010/api/time`. Expected: first line `HTTP/1.1 200 OK` and `content-type: application/json`. Result: PASS / FAIL
- [ ] Step 2: read the body. Expected: a JSON object with exactly two keys, `now` and `timezone`, for example `{"now":"2026-11-06T10:38:10.123456+00:00","timezone":"UTC"}`; `timezone` is exactly `UTC`. Result: PASS / FAIL

## Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive
- [ ] Step 1: run `curl -s http://localhost:8010/api/time`, wait about one second, run it again. Expected: two bodies are printed. Result: PASS / FAIL
- [ ] Step 2: compare the two `now` values. Expected: they differ, and the second is about one second later. Result: PASS / FAIL
- [ ] Step 3: read the last six characters of each `now`. Expected: both are exactly `+00:00` (not `Z`, not missing). Result: PASS / FAIL
- [ ] Step 4: compare the date and hour of `now` with `date -u` in the same terminal. Expected: they match current UTC time, not local time. Result: PASS / FAIL

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router
- [ ] Step 1: open `backend/app/schemas/server_time.py`. Expected: `class ServerTimeResponse(BaseModel)` with `now: AwareDatetime`, `timezone: Literal["UTC"]`, and a `field_serializer` for `now` whose docstring names the `+00:00` offset. Result: PASS / FAIL
- [ ] Step 2: open `backend/app/routers/server_time.py`. Expected: the route is declared with `response_model=ServerTimeResponse` and the handler returns `ServerTimeResponse(...)`, with no dict literal. Result: PASS / FAIL
- [ ] Step 3: open `http://localhost:8010/docs` in a browser and expand `GET /api/time`. Expected: the response schema is named `ServerTimeResponse`. Result: PASS / FAIL

## Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness
- [ ] Step 1: from the repo root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py`. Expected: output reports `0 failed`, and the tests include `test_server_time_response_serializes_now_with_plus_00_00_suffix` and `test_get_server_time_reads_the_clock_per_call`. Result: PASS / FAIL
- [ ] Step 2: run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py`. Expected: `0 failed` for `test_get_time_returns_200_with_now_and_utc_timezone`, `test_get_time_now_ends_with_plus_00_00_offset`, `test_get_time_now_is_computed_per_request` and `test_post_time_returns_405_method_not_allowed`. Result: PASS / FAIL
- [ ] Step 3 (edge case): run `curl -i -X POST http://localhost:8010/api/time`. Expected: first line `HTTP/1.1 405 Method Not Allowed`. Result: PASS / FAIL

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1: 200 with now and timezone | 2 | | |
| 2: per-request, UTC, explicit offset | 4 | | |
| 3: Pydantic schema | 3 | | |
| 4: tests cover shape, offset, freshness (incl. 405 edge case) | 3 | | |

Overall result: PASS / FAIL

Tester: ____________  Date: ____________
