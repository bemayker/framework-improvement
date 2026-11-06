# UAT Script: BUG-01 Server time is not served stale from the edge cache

This item has no UI: every check is an HTTP call or a test run. Criterion 3 can only be performed on the deployed environment, because the stale value comes from the CDN in front of the deployed API.

## Prerequisites

- Docker and Docker Compose installed and running (criteria 1 and 2 locally).
- Repository checked out on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- No other process bound to host port `8010`.
- A terminal with `curl` and `uv`.
- Criterion 3 only: the merge containing BUG-01 is deployed, and `<deployed-host>` is the deployed API's host. `docs/DEVELOPMENT.md` has no `## Test environments` row, so take it from whoever operates the deployment.

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8010/api/time` | Status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a JSON body with `now` (ISO 8601 ending in `Z` or `+00:00`) and `"timezone":"UTC"` | [ ] Pass [ ] Fail |
| 2 | Run `curl -si http://localhost:8010/api/version` | Status 200 and no `cache-control: no-store` header line (the directive is scoped to `/api/time`) | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The run ends with `0 failed` (no database is needed for these files) | [ ] Pass [ ] Fail |
| 4 | Open `backend/tests/integration/test_server_time_integration.py` | A test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

Not verifiable locally. Run by a human after the merge is deployed.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -si https://<deployed-host>/api/time` | Status 200 and a `cache-control: no-store` header line on the response the CDN returns | [ ] Pass [ ] Fail |
| 6 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ, the second about one second later | [ ] Pass [ ] Fail |
| 7 | If the values are identical, record the response headers of both calls in the verification note and keep the `mayker:to-verify` label on the item. If they differ, remove the `mayker:to-verify` label | Differing values: the item is verified. Identical values: the defect persists | [ ] Pass [ ] Fail |

### Edge case: POST to the time route is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Run `curl -si -X POST http://localhost:8010/api/time` | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 (steps 5 to 7 on the deployed environment only) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
