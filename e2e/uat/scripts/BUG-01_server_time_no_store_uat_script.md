# UAT Script: BUG-01 Server time is never cached at the edge

None of the three acceptance criteria is verifiable through the UI: `GET /api/time` has no screen, so the observable checks are the HTTP response (read with `curl`) and the test run. Criterion 3 can only be checked on the deployed environment, where the CDN sits in front of the API; it is a human step and cannot be run in any automated tier.

## Prerequisites

- A terminal with `curl`.
- Criteria 1 and 2: a checkout of the branch `feature/BUG-01-server-time-edge-cache` (or, once merged, `main`), `uv` installed and backend dependencies synced. No database is required.
- Criterion 3: the fix is merged and deployed, and you know the deployed host name (`docs/DEVELOPMENT.md` lists no test environment for this project, so ask the maintainer).

## Test Environment Setup

1. For criterion 1, start the backend locally from the repository root:
   ```bash
   uv run --directory backend uvicorn app.main:create_app --factory --port 8000
   ```
2. Leave it running in its own terminal and run the steps below in another.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers in that output | A line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 3 | Read the body in that output | JSON with `now` ending in `+00:00` and `"timezone":"UTC"` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary reports `0 failed` | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | A test asserts that `response.headers["cache-control"]` equals the router's `NO_STORE` constant | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

Not verifiable locally or through the UI: the edge cache exists only in front of the deployed API. Run the item's reproduction on the deployed host. Before the fix both calls returned the same `now`; after the fix and deploy they must differ.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://{deployed-host}/api/time` and note the `now` value | `200`, header `cache-control: no-store` present | [ ] Pass [ ] Fail |
| 7 | Wait one second, then run the same command again | The `now` value is later than the one noted in step 6 (the two values differ) | [ ] Pass [ ] Fail |
| 8 | If the CDN adds a cache-status header (for example `cf-cache-status` or `x-cache`), read it on the second response | It reports a miss or bypass, never a hit | [ ] Pass [ ] Fail |

### Edge case: the header is present on a second consecutive request

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Against the local backend, run `curl -si http://localhost:8000/api/time` twice in a row | Both responses carry `cache-control: no-store`, and the two `now` values differ | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
