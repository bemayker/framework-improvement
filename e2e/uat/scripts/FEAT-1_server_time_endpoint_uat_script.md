# UAT Script: FEAT-1 Server time endpoint

This item has no UI, so every criterion is verified against the running API, its OpenAPI document, or the test suite.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database). Both mappings come from `docker-compose.yml`.
- A terminal with `curl` and `date`.
- Criterion 4 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/time` | The status line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly two keys, for example `{"now":"2026-11-02T15:50:05.123456+00:00","timezone":"UTC"}`; `timezone` is the string `UTC` | [ ] Pass [ ] Fail |
| 3 | Run `curl -i -X POST http://localhost:8010/api/time` | Status `405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/time` and note `now` | `now` ends with exactly `+00:00`: not `Z`, and not without an offset | [ ] Pass [ ] Fail |
| 5 | Wait about one second and run the same command again | The new `now` is later than the first by roughly one second and also ends with `+00:00` | [ ] Pass [ ] Fail |
| 6 | Compare the hour in `now` with the output of `date -u` in the same terminal | The hours agree, which shows the value is UTC and not the server's local time | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

Not verifiable through a UI. Observable check:

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/time` | The 200 response schema is named `ServerTimeResponse`, with fields `now` (type `string`) and `timezone` (the constant `UTC`). Note: `now` shows plain `string` without a `date-time` format, because the schema serialises it through a custom serializer that returns `str` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` | The schema file defines `ServerTimeResponse`; the router declares `response_model=ServerTimeResponse` and returns a `ServerTimeResponse`, not a bare dict | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness

Not verifiable through a UI. Observable check:

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | The summary reports `0 failed` | [ ] Pass [ ] Fail |
| 10 | Open `backend/tests/integration/test_server_time_integration.py` | It contains a test asserting the exact `+00:00` suffix, a test asserting the response shape (`now` and `timezone`), and tests asserting `now` is computed per request (an overridden clock returning two instants one second apart, and a real-clock check) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
