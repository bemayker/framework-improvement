# UAT Script, FEAT-1: Server time endpoint

Prerequisites (shared by every block): Docker running; the stack up via `docker compose up -d --build` from the repository root; `docker compose ps` shows the `backend` service running; a terminal with `curl`; the backend is published on the host at `http://localhost:8010`. This feature has no UI, so every check is an HTTP or terminal check.

## Criterion 1: `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}`
1. Run `curl -s -i http://localhost:8010/api/time`. Expected: the first line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body printed after the headers. Expected: one JSON object with exactly two keys, `now` and `timezone`, for example `{"now":"2026-10-24T05:40:28.123456+00:00","timezone":"UTC"}`.
3. Check the `timezone` value. Expected: exactly the string `UTC`.
4. Open `http://localhost:8010/docs` in a browser and expand `GET /api/time`. Expected: the endpoint is listed and its 200 example shows `now` and `timezone`.

## Criterion 2: `now` is computed per request, in UTC with an explicit offset, never naive
1. Run `curl -s http://localhost:8010/api/time`, wait one second, and run the same command again. Expected: the two `now` values differ, and the second is about one second later than the first.
2. Look at the end of each `now` value. Expected: each ends in exactly `+00:00`, never in `Z` and never with no offset at all.
3. Run `date -u +%Y-%m-%dT%H:%M:%S` right after a curl call. Expected: the date, hour and minute match the `now` the API returned (UTC, not the host's local time).

## Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`
1. Open `backend/app/schemas/server_time.py`. Expected: it defines `class ServerTimeResponse(BaseModel)` with the fields `now` and `timezone`, and the constant `UTC_OFFSET_SUFFIX = "+00:00"`.
2. Open `backend/app/routers/server_time.py`. Expected: the route declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse(...)`, with no dict literal built in the handler.
3. Run `curl -s http://localhost:8010/openapi.json` and search the output for `ServerTimeResponse`. Expected: the schema appears under `components.schemas` and the `/api/time` 200 response references it.

## Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness
1. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py`. Expected: the summary line reports `0 failed`.
2. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py`. Expected: the summary line reports `0 failed`, and no test in it is skipped.
3. Open `backend/tests/integration/test_server_time_integration.py`. Expected: one test for the 200 shape, one asserting the `+00:00` suffix, and one for per-request freshness with a substituted clock.
