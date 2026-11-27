# UAT Script: BUG-01 Server time is served stale from the edge cache

No acceptance criterion is verifiable through the UI: no frontend consumes `GET /api/time`, so the observable check is the HTTP response itself, read with `curl`. Criterion 3 can only be verified on the deployed environment, because the edge cache does not exist locally.

## Prerequisites

- Repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- `uv` installed and the backend dependencies synced (`uv sync --directory backend`).
- A terminal with `curl`.
- No database is needed for this route.
- Criterion 3 only: the BUG-01 change is merged and deployed, and you know the deployed API host (`docs/DEVELOPMENT.md` Test environments names none: use the environment the item names, "the deployed environment").

## Test Environment Setup

1. From the repository root, start the backend:
   ```bash
   uv run --directory backend uvicorn app.main:app --port 8000
   ```
2. Leave it running in its own terminal; run the steps below in a second one.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response headers | A line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 3 | Read the response body | JSON of the form `{"now":"2026-11-27T16:06:12.345678+00:00","timezone":"UTC"}`, with `now` ending in `+00:00` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

The edge cache exists only on the deployed environment, so this cannot be checked locally. Replace `<deployed-host>` with the deployed API host. Use a GET: HEAD is not served by this route.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` | `HTTP 200` with a `cache-control: no-store` header (if the CDN rewrites headers, an `age:` header must be absent or `0`) | [ ] Pass [ ] Fail |
| 7 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ (the second about one second later) | [ ] Pass [ ] Fail |
| 8 | Repeat step 7 once more | The `now` values differ again, ruling out a cache that expired between runs | [ ] Pass [ ] Fail |

### Edge case: two rapid local requests differ

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `curl -s http://localhost:8000/api/time; curl -s http://localhost:8000/api/time` | Two bodies with differing `now` values, each computed per request | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
