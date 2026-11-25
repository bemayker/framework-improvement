# UAT Script: BUG-01 Server time is not cached at the edge

No criterion is verifiable through the UI: `GET /api/time` has no frontend, so the observable check is the HTTP response itself, read with `curl`. Criterion 3 can only be verified on the deployed environment, by a human, after the merge.

## Prerequisites

- Repository checked out on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- `uv` installed, and `curl` available in a terminal.
- Criterion 1 only: nothing bound to local port `8000`. No database is needed for this endpoint.
- Criterion 3 only: the fix is merged and deployed, and you know the deployed API host (written `<deployed-host>` below).

## Test Environment Setup

1. From the repository root, start the backend locally (criterion 1):
   ```bash
   uv run --directory backend uvicorn app.main:app --port 8000
   ```

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a second terminal, run `curl -si http://localhost:8000/api/time` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response headers of the same output | A line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 3 | Read the body of the same output | JSON with a `now` value ending in `Z` or `+00:00` and `"timezone":"UTC"` | [ ] Pass [ ] Fail |
| 4 | Run `curl -si -X POST http://localhost:8000/api/time` (edge case) | The status line reads `405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 6 | Open `backend/tests/integration/test_server_time_integration.py` | `test_get_server_time_sets_cache_control_no_store` asserts the `cache-control` response header against `CACHE_CONTROL_NO_STORE` imported from `app.routers.server_time` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (human check on the deployed environment)

This cannot be verified locally: there is no edge cache locally, so both calls already differ before the fix.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -si https://<deployed-host>/api/time` | Status 200 and a `cache-control: no-store` header. The CDN may add its own headers such as `age` or `x-cache`; an `x-cache: HIT` means the CDN still caches and the check fails | [ ] Pass [ ] Fail |
| 8 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ by about one second | [ ] Pass [ ] Fail |
| 9 | Compare the two `now` values | If they differ, the item is verified and the `mayker:to-verify` label can be removed. If they are identical, record the full headers of both responses in the verification note and leave the `mayker:to-verify` label in place | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
