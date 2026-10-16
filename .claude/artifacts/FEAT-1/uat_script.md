# UAT Script: FEAT-1 Server time endpoint

No screen of the task-notes app calls this endpoint, so every criterion is verified against the HTTP response itself: in a browser address bar, in FastAPI interactive docs at http://localhost:8010/docs, or with curl.

## Prerequisites

- On branch `feature/FEAT-1-server-time-endpoint` (or `main` once merged), from the repository root run `docker compose up -d --build`, then `docker compose ps` until `backend` reports running. The backend answers on http://localhost:8010.
- A terminal with `curl`, `date` and `python3`.

## Criterion 1: GET /api/time returns 200 with now and timezone UTC

1. Run `curl -i http://localhost:8010/api/time` -> the first line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers.
2. Read the response body -> a JSON object with exactly two keys: `now`, a timestamp string such as `2026-10-16T03:33:49.123456Z`, and `timezone`, whose value is the string `UTC`. No other key is present.
3. Open http://localhost:8010/api/time in a browser -> the page shows the same two keys, with `now` close to the current UTC time.

## Criterion 2: now is computed per request, UTC with an explicit offset, never naive

1. Run `date -u +%Y-%m-%dT%H:%M:%S` -> note the current UTC time.
2. Run `curl -s http://localhost:8010/api/time` -> `now` matches the time from step 1 to within a few seconds, and its last character is `Z`. It does not end in `+00:00`, and it is never a timestamp without an offset.
3. Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` -> two bodies; the second `now` is one second or more later than the first. Both end in `Z` and both carry `timezone` `UTC`.
4. Copy one `now` value from step 3 and run `python3 -c "import datetime; print(datetime.datetime.fromisoformat('PASTE_NOW_HERE').utcoffset())"` with the value in place of PASTE_NOW_HERE -> it prints `0:00:00`, which shows the value parses as an aware UTC time.

## Criterion 3: the response body is defined by a Pydantic schema in backend/app/schemas/

This is a code-structure property with no UI behaviour; the observable checks are the OpenAPI document and the module.

1. Open http://localhost:8010/docs, expand `GET /api/time`, look under `Responses` for code `200` -> the schema is named `ServerTimeResponse` with two required properties, `now` (string, date-time) and `timezone` (string, the single allowed value `UTC`).
2. Open http://localhost:8010/openapi.json and find `components`, then `schemas`, then `ServerTimeResponse` -> `now` has `type` `string` and `format` `date-time`, `timezone` is restricted to `UTC`, and both appear under `required`.
3. Open `backend/app/schemas/server_time.py` -> `class ServerTimeResponse(BaseModel)` with fields `now` and `timezone`; its docstring and the `now` description state the `Z` suffix. Open `backend/app/routers/server_time.py` -> it declares `response_model=ServerTimeResponse`, returns a `ServerTimeResponse`, never a dict literal, and imports no service module.

## Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

This criterion is about the test suite, so the check is running it.

1. No PostgreSQL is needed for these files; the endpoint touches no database.
2. From the repository root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` -> the summary line reports `0 failed`.
3. Open `backend/tests/unit/test_server_time_unit.py` -> it contains `test_server_time_response_serialises_now_with_z_suffix`, `test_server_time_response_normalises_non_utc_offset_to_z` and `test_get_server_time_reads_the_clock_on_every_request`. Open `backend/tests/integration/test_server_time_integration.py` -> it contains `test_get_server_time_now_ends_with_z_suffix` and `test_get_server_time_now_is_computed_per_request`.
