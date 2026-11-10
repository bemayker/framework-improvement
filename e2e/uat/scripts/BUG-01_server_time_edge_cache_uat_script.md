# UAT Script: BUG-01 Server time is not served stale from the edge cache

No acceptance criterion is verifiable through a UI: `GET /api/time` has no frontend consumer, so the observable check is the HTTP response, read with `curl`. Criterion 3 can only be verified on the deployed environment, because locally there is no edge cache.

## Prerequisites

- Criteria 1 and 2: repository checked out on branch `feature/BUG-01-server-time-edge-cache`, `uv` installed, and a terminal with `curl`. No database is needed for this endpoint.
- Criterion 3: the merged fix is deployed to the environment the item names (`<deployed-host>`; `docs/DEVELOPMENT.md` has no Test environments row yet, so the verifier supplies the host).

## Test Environment Setup

1. Start the backend locally on port 8000 (criterion 1 only):
   ```bash
   uv run --directory backend uvicorn app.main:app --port 8000
   ```

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response headers in the same output | A `cache-control: no-store` header is present | [ ] Pass [ ] Fail |
| 3 | Read the body in the same output | JSON with exactly two keys: `now` (ISO 8601 timestamp ending in `+00:00`) and `timezone` with value `UTC` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_server_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` (a GET; a HEAD request gets 405 from this route) | Status 200 and a `Cache-Control: no-store` header, as served through the CDN | [ ] Pass [ ] Fail |
| 7 | Wait one second and run the same command again | The response again carries `Cache-Control: no-store` | [ ] Pass [ ] Fail |
| 8 | Compare the `now` values of the two responses (or run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`) | The two `now` values differ, the second about one second later. Identical values mean the edge cache is still serving a stale response (the defect): leave the `mayker:to-verify` label and reopen the item | [ ] Pass [ ] Fail |
| 9 | If steps 6 to 8 hold, remove the `mayker:to-verify` label from the item | The item may be marked verified | [ ] Pass [ ] Fail |

### Edge case (optional): other methods are rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `curl -si -X POST http://localhost:8000/api/time` against the local backend | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 (9 required, 1 optional edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
