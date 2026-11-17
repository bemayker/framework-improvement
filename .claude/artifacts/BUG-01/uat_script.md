# UAT Script: BUG-01 Server time is not served stale from the edge cache

No criterion is verifiable through the UI: the checks are an HTTP response header, a test run, and a deployed-environment `curl` comparison.

## Prerequisites

- A terminal with `curl`.
- Criteria 1 and 2: `uv` installed, backend dependencies synced (`uv sync --directory backend`), repository checked out on branch `feature/BUG-01-server-time-edge-cache`.
- Criterion 3 only: the BUG-01 change is merged and deployed, and you know the deployed host name.

## Test Environment Setup

1. From the repository root, start the backend locally:
   ```bash
   uv run --directory backend uvicorn app.main:app --port 8000
   ```

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | Status line `HTTP/1.1 200 OK`, headers include `cache-control: no-store`, body like `{"now":"2026-11-17T18:52:14.123456Z","timezone":"UTC"}` | [ ] Pass [ ] Fail |
| 2 | Check the `now` value from step 1 | It ends in `Z` (or `+00:00`), never a bare time with no offset; `timezone` is `UTC` | [ ] Pass [ ] Fail |
| 3 | Run `curl -si http://localhost:8000/api/health` | Headers carry no `cache-control: no-store` added by this item (the directive is on `/api/time` only) | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | From the repository root run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` | The run passes: no failed or errored test, exit code 0 | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | `test_get_server_time_returns_no_store_cache_control` asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` (a GET; a HEAD request is not served by this route) | Status 200, a `cache-control: no-store` header is present in the response the CDN returns, and the body carries a `now` value | [ ] Pass [ ] Fail |
| 7 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ, the second about one second later than the first | [ ] Pass [ ] Fail |
| 8 | If the two `now` values are identical, note the CDN cache-status header from step 6 (for example `cf-cache-status` or `x-cache`) on the item | A `HIT` means the CDN still caches despite the directive; the item stays unverified | [ ] Pass [ ] Fail |

### Edge case: a non-GET method

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `curl -si -X POST http://localhost:8000/api/time` | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 (step 8 only when step 7 shows identical values) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
