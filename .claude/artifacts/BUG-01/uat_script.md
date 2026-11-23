# UAT Script: BUG-01 Server time is not served from the edge cache

None of the acceptance criteria is verifiable through the UI: the fix is a response header on a backend route, so the observable check is the HTTP response itself, read with `curl`. Criterion 3 can only be verified on the deployed environment, because the edge cache exists nowhere else.

## Prerequisites

- Repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- `uv` installed and the backend dependencies synced (`uv sync --directory backend`).
- A terminal with `curl`.
- No database is needed: `GET /api/time` touches none.
- Criterion 3 only: this change merged and deployed, and the deployed API host name known.

## Test Environment Setup

1. From the repository root, start the backend:
   ```bash
   uv run --directory backend uvicorn app.main:app --port 8000
   ```
2. Leave it running in its own terminal and use a second terminal for the steps below.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response headers of the same output | A line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 3 | Read the response body | JSON of the shape `{"now":"2026-...Z","timezone":"UTC"}`, where `now` ends in `Z` or `+00:00` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | `test_get_time_sets_cache_control_no_store` asserts `cache-control` equals `no-store` on the response | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

Cannot be verified locally: the edge cache exists only on the deployed environment. Replace `<deployed-host>` with the real host name.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` and note the `now` value | Status 200 and a `cache-control: no-store` header | [ ] Pass [ ] Fail |
| 7 | Wait one second and run the same command again | The `now` value differs from step 6's | [ ] Pass [ ] Fail |
| 8 | In the second response, check for a CDN cache-hit header (for example `cf-cache-status`, `x-cache` or `age`) | It does not report a cache hit (`HIT`), and `age` is absent or 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
