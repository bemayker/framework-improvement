# UAT Script: BUG-01 Server time is not served stale from the edge cache

No UI consumes `GET /api/time`, so the observable check is the HTTP response, read with `curl`. Criterion 3 can only be verified on the deployed environment, behind its CDN: locally nothing caches, so two calls differ with or without the fix.

## Prerequisites

- Repository checked out on branch `feature/BUG-01-server-time-edge-cache`, with `uv` installed.
- A terminal with `curl`.
- Criteria 1 and the edge case: the backend running locally, via `uv run --directory backend uvicorn app.main:app --port 8000` (no database needed).
- Criterion 3: this PR merged and deployed; you know the deployed host (`{deployed-host}`).

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | Status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response headers | A line `cache-control: no-store` is present (case-insensitive) | [ ] Pass [ ] Fail |
| 3 | Read the body | JSON with exactly two keys: `now`, ISO 8601 ending in `Z` or `+00:00`, and `timezone` equal to `"UTC"` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | `test_get_time_response_carries_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://{deployed-host}/api/time` (a GET; HEAD is not routed) | 200, and the headers include `Cache-Control: no-store` | [ ] Pass [ ] Fail |
| 7 | Wait two seconds and run the same request again | A second 200 response | [ ] Pass [ ] Fail |
| 8 | Compare the `now` values of the two responses | The second `now` differs from the first (not served stale from the edge cache) | [ ] Pass [ ] Fail |

If the two `now` values are identical, the fix did not hold: leave the `mayker:to-verify` label on and run `/fix BUG-01`. If they differ, remove the `mayker:to-verify` label from the item.

### Edge case: the header is scoped to the time route

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | With the local backend running, run `curl -si http://localhost:8000/api/version` | 200, and no `cache-control: no-store` line | [ ] Pass [ ] Fail |
| 10 | Run `curl -si -X POST http://localhost:8000/api/time` | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
