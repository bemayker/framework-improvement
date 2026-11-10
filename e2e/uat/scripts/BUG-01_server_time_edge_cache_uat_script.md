# UAT Script: BUG-01 Server time is served stale from the edge cache

No criterion is verifiable through a UI: the feature is a response header on `GET /api/time`, read with `curl`. Criterion 3 is a human check that can only run on the deployed environment (the item's `to_verify` route), after the fix is merged and deployed.

## Prerequisites

- A terminal with `curl`.
- Criteria 1 and 2: Docker and Docker Compose, the repository checked out locally, and nothing bound to host port `8010`; `uv` for criterion 2.
- Criterion 3: the merged change is deployed, and you know the deployed API host (written `<deployed-host>` below).

## Test Environment Setup

1. For criteria 1 and 2, from the repository root run `docker compose up -d --build`.
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8010/api/time` | The first line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers in that output | A line `cache-control: no-store` is present (header names are case-insensitive) | [ ] Pass [ ] Fail |
| 3 | Read the body on the last line | JSON of the shape `{"now":"2026-11-10T01:47:19.123456+00:00","timezone":"UTC"}`; `now` ends in `+00:00`, `timezone` is `UTC` | [ ] Pass [ ] Fail |
| 4 | Edge case: run `curl -si -X POST http://localhost:8010/api/time` | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `uv sync --directory backend`, then `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |
| 6 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_server_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only, human check)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -si https://<deployed-host>/api/time`; note the `now` value | Status 200 and a `cache-control: no-store` header | [ ] Pass [ ] Fail |
| 8 | Wait about one second, then run `curl -si https://<deployed-host>/api/time` again | Status 200, `cache-control: no-store` again, and a `now` value that differs from step 7's | [ ] Pass [ ] Fail |
| 9 | Optional: read the CDN's cache-status header in the step 7 and 8 output (for example `cf-cache-status` or `x-cache`, depending on the CDN) | It reports a miss or bypass, never a hit | [ ] Pass [ ] Fail |
| 10 | Record the two `now` values and the date on the tracker item, then move it out of to-verify | The item records the evidence | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 (9 required, 1 optional) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
