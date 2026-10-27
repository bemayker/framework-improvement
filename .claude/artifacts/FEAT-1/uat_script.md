# UAT Script: FEAT-1 Server time endpoint

FEAT-1 has no UI, so no criterion is verifiable by navigating a screen. Each step below is the observable check a person runs from a terminal instead, read with `curl`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-1-server-time-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- No root `.env` file is required: `docker-compose.yml` carries usable defaults for every variable it substitutes.
- A terminal with `curl` and `date`.
- Criterion 4 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running. The endpoint needs no database, so `db` health is not a precondition.

## Steps

### Criterion 1: `GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -i http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 200 OK` and a `content-type: application/json` header is present | [ ] Pass [ ] Fail |
| 2 | Read the response body | One JSON object with exactly two keys, `now` and `timezone`, for example `{"now":"2026-10-27T19:44:51.123456+00:00","timezone":"UTC"}` | [ ] Pass [ ] Fail |
| 3 | Check the `timezone` value | It reads exactly `UTC` | [ ] Pass [ ] Fail |

### Criterion 2: `now` is computed per request, serialised in UTC with an explicit offset, never naive

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s http://localhost:8010/api/time` and note the `now` value | It ends in `+00:00`: not `Z`, and not with no offset at all | [ ] Pass [ ] Fail |
| 5 | In the same terminal run `date -u +%Y-%m-%dT%H:%M:%S` | The date, hour and minute match `now` from step 4 (allow a few seconds between the two commands; a mismatch of whole hours means the value is not UTC) | [ ] Pass [ ] Fail |
| 6 | Wait about one second, then run `curl -s http://localhost:8010/api/time` again | The new `now` is later than the one from step 4 and also ends in `+00:00` | [ ] Pass [ ] Fail |

### Criterion 3: The response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -s http://localhost:8010/openapi.json` (or open that URL in a browser) and look under `paths`, `/api/time`, `get`, `responses`, `200` | The schema is a `$ref` to `#/components/schemas/ServerTimeResponse` | [ ] Pass [ ] Fail |
| 8 | Look under `components`, `schemas`, `ServerTimeResponse` | It lists the properties `now` (string, `date-time` format) and `timezone` | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/server_time.py` and `backend/app/routers/server_time.py` | The first defines `ServerTimeResponse`; the second returns that model, not a dict literal | [ ] Pass [ ] Fail |

### Criterion 4: Unit and integration tests cover the shape, the offset and the per-request freshness

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | The summary line reports `0 failed`, and no test in those files is reported skipped (they need no database) | [ ] Pass [ ] Fail |
| 11 | Open `backend/tests/integration/test_server_time_integration.py` | One test asserts the `+00:00` suffix exactly, and tests issue two requests and assert the two `now` values come back in order (`test_get_time_reads_clock_per_request`, `test_get_time_now_is_bracketed_by_real_clock_and_advances`) | [ ] Pass [ ] Fail |

### Edge case: a non-GET method is rejected

Covers the corresponding Gherkin scenario.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `curl -s -i -X POST http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
