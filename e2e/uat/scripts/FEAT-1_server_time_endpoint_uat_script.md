# UAT Script: FEAT-1 Server time endpoint

No criterion has a UI: every step is verified in a browser tab pointed straight at the API, or in a terminal.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The port comes from `docker-compose.yml`; substitute the port your stack publishes if it differs.
- A browser with developer tools, and a terminal with `curl`.
- Criterion 4 only: `uv` installed on the host. The listed test files do not need the Postgres backing service.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Open `http://localhost:8010/api/version` in a browser tab until it answers.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `{"now": ..., "timezone": "UTC"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/time` in a browser tab | A JSON object with exactly two keys, `now` and `timezone` | [ ] Pass [ ] Fail |
| 2 | Read `timezone` | It is the string `UTC` | [ ] Pass [ ] Fail |
| 3 | Open the developer tools, Network tab, and reload the page | The `time` request shows status `200` and content type `application/json` | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, in UTC, with an explicit offset

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `http://localhost:8010/api/time` and note the `now` value, e.g. `2026-10-29T16:53:08.123456+00:00` | A timestamp is shown | [ ] Pass [ ] Fail |
| 5 | Check the ending of `now` | It ends with `+00:00`, not with `Z` and not with no offset at all | [ ] Pass [ ] Fail |
| 6 | Compare its hour and minute with the current UTC time (for example from `https://time.is/UTC`) | They agree to within a few seconds | [ ] Pass [ ] Fail |
| 7 | Wait about two seconds and reload the tab | The new `now` differs from the one noted in step 4 and is later | [ ] Pass [ ] Fail |

### Criterion 3: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` | Swagger UI lists `GET /api/time` under the `time` tag | [ ] Pass [ ] Fail |
| 9 | Expand `GET /api/time` and open the 200 response's Schema tab | The schema is named `ServerTimeResponse` with fields `now` (string) and `timezone` (string, `UTC`). `now` is shown as a plain string rather than a date-time because the schema's serializer pins the `+00:00` format | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` in the editor | The schema file defines `class ServerTimeResponse(BaseModel)` with the `now` serializer; the router names it as `response_model` and returns the schema, not a dict | [ ] Pass [ ] Fail |

### Criterion 4: unit and integration tests cover the shape, the offset and the per-request freshness

Not a UI criterion; the observable check is the test run.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | From the repo root, run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |
| 12 | Open `backend/tests/unit/test_server_time_unit.py` | It has a test asserting the serialised `now` ends with `+00:00` and not with `Z`, a test rejecting a naive datetime, and a test showing two requests with two injected clock values return two different `now` values | [ ] Pass [ ] Fail |
| 13 | Open `backend/tests/integration/test_server_time_integration.py` | It has a test asserting the live body's shape and `+00:00` suffix, and a test making two requests about a second apart and asserting they differ | [ ] Pass [ ] Fail |

### Criterion 5: `GET /api/echo?msg={text}` returns `{"echo": "<msg>"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 14 | Open `http://localhost:8010/api/echo?msg=hello` | The page shows `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 15 | Open `http://localhost:8010/api/echo?msg=hello%20world` | The page shows `{"echo":"hello world"}` | [ ] Pass [ ] Fail |

### Edge cases

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 16 | Open `http://localhost:8010/api/echo` with no `msg` and read the Network tab | Status `422`; the body names the missing `msg` query parameter | [ ] Pass [ ] Fail |
| 17 | Run `curl -i -X POST http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 17 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
