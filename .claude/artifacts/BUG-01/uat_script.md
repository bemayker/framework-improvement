# UAT Script: BUG-01 Server time is served stale from the edge cache

None of the criteria is verifiable through the UI: `GET /api/time` has no frontend surface, so the observable check is the HTTP response (read with `curl -si`) or the test run. Always use GET, not HEAD: the route answers HEAD with 405.

## Prerequisites

- A terminal with `curl` and `uv` installed.
- Repository checked out on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- Backend dependencies synced: `uv sync --directory backend`.
- Criteria 1 and the edge case: the backend running locally on port 8000, no database needed.
- Criterion 3 only: the merged change deployed behind the CDN, and you know the deployed API host (`<deployed-host>`).

## Test Environment Setup

1. Start the backend: `uv run --directory backend uvicorn app.main:app --port 8000`

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers in the same output | A line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 3 | Read the body | JSON of the form `{"now":"2026-11-13T09:12:34.567890+00:00","timezone":"UTC"}`, with `now` ending in `+00:00` | [ ] Pass [ ] Fail |

### Criterion 2: a test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary reports `0 failed` | [ ] Pass [ ] Fail |
| 5 | Run `uv run --directory backend pytest -q -k test_get_time_sets_cache_control_no_store` | That one test is reported as passed and the summary reports `0 failed` | [ ] Pass [ ] Fail |

### Criterion 3: after deploy, the reproduction returns two different values (deployed environment only)

The edge cache exists only on the deployed environment, so a local run cannot reproduce the defect. A human performs this check after deploy.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` and note the `now` value and the `Cache-Control` response header | A JSON body with a `now` value, for example `2026-11-13T09:20:01.104512+00:00` | [ ] Pass [ ] Fail |
| 7 | Wait about one second, then run `curl -si https://<deployed-host>/api/time` again | A `now` value later than the one from step 6 | [ ] Pass [ ] Fail |
| 8 | Compare the two responses | The two `now` values differ, the response carries `Cache-Control: no-store`, and no CDN cache-hit header (for example `X-Cache: HIT` or `CF-Cache-Status: HIT`) appears | [ ] Pass [ ] Fail |

### Edge case: a POST to `/api/time` is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `curl -si -X POST http://localhost:8000/api/time` | Status `405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 (steps 6 to 8 on the deployed environment) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
