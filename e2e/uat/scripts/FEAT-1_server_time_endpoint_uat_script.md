# UAT Script: FEAT-1 Server time endpoint

No criterion is verifiable through the application UI: no frontend page calls `/api/time`. Every check reads the HTTP response in a terminal with `curl` or in a browser on the API URL. Backend host port is 8010 (`docker-compose.yml`).

## Prerequisites

- Docker running.
- Repository on branch `feature/FEAT-1-server-time-endpoint`.
- From the repository root run `docker compose up -d --build`, and wait until `docker compose ps` shows `backend` running.
- A terminal with `curl`, and a browser.

## Criterion 1: `GET /api/time` returns 200 with `now` and `timezone`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i http://localhost:8010/api/time` | First line reads `HTTP/1.1 200 OK`; headers include `content-type: application/json` | [ ] | [ ] |
| 1.2 | Read the body of the same response | A JSON object with exactly two keys, for example `{"now":"2026-10-02T10:42:41.123456+00:00","timezone":"UTC"}` (whitespace may differ); `timezone` is exactly `"UTC"` | [ ] | [ ] |
| 1.3 | Open `http://localhost:8010/api/time` in a browser address bar | The browser shows the same two-key JSON object | [ ] | [ ] |

## Criterion 2: `now` is computed per request, UTC with an explicit offset, never naive

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` | Two JSON bodies print one after the other | [ ] | [ ] |
| 2.2 | Compare the two `now` values | They differ, and the second is about one second later than the first | [ ] | [ ] |
| 2.3 | Read the end of each `now` value | Each ends with exactly `+00:00`: not `Z`, not a local offset such as `+02:00`, and never a bare time with no offset | [ ] | [ ] |
| 2.4 | Run `date -u` immediately after a call and compare | `now` matches the current UTC time to within a second or two | [ ] | [ ] |

## Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `http://localhost:8010/docs` in a browser | Swagger UI lists `GET /api/time` under the `time` tag | [ ] | [ ] |
| 3.2 | Expand `GET /api/time` and read the 200 response | The response schema is named `ServerTimeResponse`. In its Schemas entry, `now` is shown as `string` (no `date-time` format, because the field serializer returns a string; the description reads "Server time, ISO 8601 in UTC with the explicit +00:00 offset.") and `timezone` as `string` constant `"UTC"` (default `UTC`) | [ ] | [ ] |
| 3.3 | Open `backend/app/schemas/server_time.py` in the editor | It defines `class ServerTimeResponse(BaseModel)`, and `backend/app/routers/server_time.py` returns that class rather than a dict | [ ] | [ ] |

## Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

Not a UI behaviour; the observable check is the test run.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py` | All tests pass, none skipped | [ ] | [ ] |
| 4.2 | Open the two files | There is a test asserting the exact `+00:00` suffix, one asserting the two-key shape, and one asserting two calls return different, increasing `now` values | [ ] | [ ] |

## Edge case: non-GET method

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| E.1 | Run `curl -i -X POST http://localhost:8010/api/time` | `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|-----------|-------|--------|--------|
| 1. 200 with `now` and `timezone` | 1.1 - 1.3 | | |
| 2. Per request, UTC, explicit offset | 2.1 - 2.4 | | |
| 3. Pydantic schema | 3.1 - 3.3 | | |
| 4. Tests cover shape, offset, freshness | 4.1 - 4.2 | | |
| Edge: POST returns 405 | E.1 | | |

Tester: ______________ Date: ______________ Overall result: [ ] Pass [ ] Fail
