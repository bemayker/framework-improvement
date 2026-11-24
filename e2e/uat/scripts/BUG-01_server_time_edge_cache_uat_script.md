# UAT Script: BUG-01 Server time is served stale from the edge cache

This item has no UI. Every criterion is verified through HTTP requests or a test run, read with `curl` and `pytest`. Criterion 3 can only be verified on the deployed environment, because locally nothing caches the response.

## Prerequisites

- Repository checked out on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- `uv` and `curl` installed; backend dependencies synced (`uv sync --directory backend`).
- Criteria 1 and 2: the backend started locally with `uv run --directory backend uvicorn app.main:app --port 8000`. No database is needed for this endpoint.
- Criterion 3: the fix is merged and deployed, and you know the deployed API host (written `<deployed-host>` below).

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | The first line reads `HTTP/1.1 200 OK`, the headers include `cache-control: no-store`, and the body has the shape `{"now":"2026-11-24T20:31:56.123456Z","timezone":"UTC"}` (current time, ending in `Z`) | [ ] Pass [ ] Fail |
| 2 | Run `curl -si -X POST http://localhost:8000/api/time` | The first line reads `HTTP/1.1 405 Method Not Allowed` (edge case) | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 4 | Open `backend/tests/integration/test_server_time_integration.py` | The test `test_get_time_sets_cache_control_no_store` asserts the `cache-control` header equals `no-store` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, two requests a second apart return different values (human check on the deployed environment)

Use a GET request: a HEAD request gets 405 from this route.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -si https://<deployed-host>/api/time` | Status 200 and a `cache-control: no-store` header. If the CDN adds an `age` or cache-hit header, it must not show a hit | [ ] Pass [ ] Fail |
| 6 | Wait one second, then run the same request again: `sleep 1; curl -si https://<deployed-host>/api/time` | Status 200 and the `cache-control: no-store` header again | [ ] Pass [ ] Fail |
| 7 | Compare the `now` values of steps 5 and 6 | The two `now` values differ (roughly one second apart, for example `2026-11-24T21:00:00.120000Z` then `2026-11-24T21:00:01.135000Z`). Identical values mean the edge cache is still serving a stale response and the item fails verification | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
