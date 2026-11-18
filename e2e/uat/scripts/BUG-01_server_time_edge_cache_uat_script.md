# UAT Script: BUG-01 Server time is served stale from the edge cache

This item has no UI. Every check reads an HTTP response or a test run, with `curl` and `uv`. Criterion 3 can only be verified on the deployed environment, by a human, after deploy.

## Prerequisites

- Repository checked out locally on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- `uv` and `curl` installed.
- Port `8000` free on the host. `GET /api/time` needs no database.
- Criterion 3 only: the change is merged and deployed, and you know the deployed API host.

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
| 1 | Run `curl -si http://localhost:8000/api/time` | The first line reads `HTTP/1.1 200 OK` and a header line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 2 | Read the JSON body | Like `{"now":"2026-11-18T02:41:07.123456+00:00","timezone":"UTC"}`: `now` ends in `+00:00` and `timezone` is `UTC` | [ ] Pass [ ] Fail |
| 3 | Run `curl -si -X POST http://localhost:8000/api/time` (edge case) | The first line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: a test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` | The summary reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | `test_get_time_sets_cache_control_no_store` asserts the `cache-control` response header equals `no-store` | [ ] Pass [ ] Fail |

### Criterion 3: after deploy, the reproduction returns two different values (human, deployed environment)

Prerequisites: the change is merged and deployed. Replace `{deployed-host}` with the real host.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://{deployed-host}/api/time` | Header `cache-control: no-store` is present on the response that came through the CDN | [ ] Pass [ ] Fail |
| 7 | Run `curl -s https://{deployed-host}/api/time; sleep 1; curl -s https://{deployed-host}/api/time` | Two JSON bodies whose `now` values differ (the second about one second later) | [ ] Pass [ ] Fail |
| 8 | Repeat step 7 once more | The values still differ, confirming the edge cache is not serving a stored copy | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
