# UAT Script: BUG-01 Server time is not served stale from the edge cache

This item has no UI. Every check is an HTTP call or a test run. Criterion 3 is verifiable only on the deployed environment, because the stale value comes from the CDN in front of the deployed API, which a local stack does not have.

## Prerequisites

- Docker and Docker Compose installed and running; repository checked out on branch `feature/BUG-01-server-time-edge-cache` (or `main` once merged).
- Local backend base URL `http://localhost:8010` (published by the `docker-compose.yml` backend service). If a handover rebuild printed its own URL in the PR description, use that one.
- A terminal with `curl`.
- Criterion 2 only: `uv` installed and backend dependencies synced (`uv sync --directory backend`). No database is needed.
- Criterion 3 only: the merge containing BUG-01 is deployed, and `<deployed-host>` is the deployed API's host. No row exists in `docs/DEVELOPMENT.md` under `## Test environments`, so take the host from whoever operates the deployment.

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
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
| 3 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The run reports `0 failed` | [ ] Pass [ ] Fail |
| 4 | Open `backend/tests/integration/test_server_time_integration.py` | A test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

Not verifiable locally. Run by a human after the merge is deployed.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -si https://<deployed-host>/api/time` | Status 200 and a `cache-control: no-store` header line on the response the CDN returns | [ ] Pass [ ] Fail |
| 6 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ (the second about one second later). Identical values mean the defect persists; record the response headers of both calls in the verification note | [ ] Pass [ ] Fail |

### Edge case: POST is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -si -X POST http://localhost:8010/api/time` | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 (steps 5 and 6 on the deployed environment) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
