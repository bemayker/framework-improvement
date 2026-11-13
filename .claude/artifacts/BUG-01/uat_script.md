# UAT Script: BUG-01 Server time is served stale from the edge cache

No criterion is verifiable through the UI: no page renders `GET /api/time`, so the observable checks are the HTTP response (read with `curl`) and the test run. Criterion 3 can only be verified on the deployed environment, because locally nothing caches the response, so a local run shows neither the defect nor its fix. The item stays `to_verify` until criterion 3 is done.

## Prerequisites

- Criterion 1: the app stack is running locally (`docker compose up`), backend reachable at `http://localhost:8000`; a terminal with `curl`.
- Criterion 2: repository checked out on the merged branch, `uv` installed.
- Criterion 3: the merge is deployed and you know the deployed API host (`<deployed-host>`).

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | Status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store` (header names are case-insensitive), and a body like `{"now":"2026-11-13T16:40:12.345678Z","timezone":"UTC"}` | [ ] Pass [ ] Fail |
| 2 | Check the body's `now` and `timezone` | `now` ends in `Z` or `+00:00` (an explicit UTC offset, never a bare time) and `timezone` is `UTC` | [ ] Pass [ ] Fail |
| 3 | Run `curl -si -X POST http://localhost:8000/api/time` | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_server_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` (a GET; a HEAD gets 405) | 200, a `cache-control: no-store` header, and no CDN cache-hit indicator: no `age:` header above 0, and any `x-cache` or `cf-cache-status` header reads a miss or bypass, not a hit | [ ] Pass [ ] Fail |
| 7 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ (the second about one second later) | [ ] Pass [ ] Fail |
| 8 | Repeat step 7 once more | The `now` values differ again. When both repetitions differ, remove the `mayker:to-verify` label from the tracker item | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
