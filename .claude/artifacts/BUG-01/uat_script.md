# UAT Script: BUG-01 Server time is served stale from the edge cache

None of the three criteria is verifiable through the UI: `GET /api/time` has no frontend consumer, so the observable check is the HTTP response itself, read with `curl`. Criterion 3 can only be verified on the deployed environment, because locally there is no edge cache.

## Prerequisites

- Criteria 1 and 2: repository checked out locally on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`), with `uv` and `curl` installed. For criterion 1, the backend runs through `docker compose up -d --build` (published on host port `8010`) or `uv run --directory backend uvicorn app.main:app --port 8000`; substitute the port your stack publishes. `8010` is used below.
- Criterion 3: the merged change is deployed to the environment behind the edge cache, and you know its host. `docs/DEVELOPMENT.md` -> `## Test environments` has no row yet, so take the host from whoever operates the deployment.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8010/api/time` | The first line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response headers | A line `cache-control: no-store` is present (header names are case-insensitive) | [ ] Pass [ ] Fail |
| 3 | Read the body | One JSON object with exactly the keys `now` and `timezone`; `timezone` is `"UTC"`; `now` ends in `Z` or `+00:00` | [ ] Pass [ ] Fail |
| 4 | Run `curl -si -X POST http://localhost:8010/api/time` | The status line reads `405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_time_returns_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] Pass [ ] Fail |
| 6 | From the repo root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

Deployed environment only. Replace `<deployed-host>` with the host you were given.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -si https://<deployed-host>/api/time` | Status 200, and the headers include `cache-control: no-store` as served through the CDN (a CDN that strips or overrides it is a deployment finding, not a pass) | [ ] Pass [ ] Fail |
| 8 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON lines are printed | [ ] Pass [ ] Fail |
| 9 | Compare the `now` value of the two lines | They differ by roughly one second; identical values mean the edge still caches the route (the fix has not reached the deployed environment, or the CDN ignores the directive) | [ ] Pass [ ] Fail |
| 10 | When step 9 passes, remove the `mayker:to-verify` label from the item | The item can move to done | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 (6 local, 4 deployed-only) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
