# UAT Script: BUG-01 Server time is served stale from the edge cache

This item has no UI: every check is an HTTP call or a test run. Criterion 3 can only be verified on the deployed environment, behind the CDN, by a human after the merge is deployed.

## Prerequisites

- Docker and Docker Compose installed and running (criterion 1).
- Repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- A terminal with `curl`.
- Criterion 2 only: `uv` installed and the backend dependencies synced (`uv sync --directory backend`). No database is needed for those test files.
- Criterion 3 only: the merge containing BUG-01 is deployed, and `<deployed-host>` is the deployed API's host. No row exists yet in `docs/DEVELOPMENT.md` under `## Test environments`, so take the host from whoever operates the deployment.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8010/api/time` | Status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a JSON body with `now` (ISO 8601 ending in `Z` or `+00:00`) and `"timezone":"UTC"` | [ ] Pass [ ] Fail |
| 2 | Run `curl -si http://localhost:8010/api/version` | Status 200 and no `cache-control: no-store` header line (the directive is scoped to `/api/time` only) | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | Output ends with `0 failed` | [ ] Pass [ ] Fail |
| 4 | Open `backend/tests/integration/test_server_time_integration.py` | A test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

Not verifiable locally: the stale value is produced by the deployed environment's CDN, which a local stack does not have. Locally both calls differ with or without the fix; the header itself is the cause-level check covered by step 3. Run these steps against the deployed environment.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -si https://<deployed-host>/api/time` (a GET; a HEAD request gets 405 from this route) | Status 200 and a `cache-control: no-store` header line on the response the CDN returns | [ ] Pass [ ] Fail |
| 6 | Wait one second and run the same `curl -si https://<deployed-host>/api/time` again | Status 200 and a `cache-control: no-store` header line again | [ ] Pass [ ] Fail |
| 7 | Compare the `now` values of the two responses (record the response headers of both calls in the verification note) | The two `now` values differ, the second about one second later. Identical values mean the defect persists; before the fix, the edge cache served the same stale `now` for both | [ ] Pass [ ] Fail |

### Edge case: the directive is scoped to the time route only

Covered by step 2 above (`/api/version` carries no `no-store`).

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
