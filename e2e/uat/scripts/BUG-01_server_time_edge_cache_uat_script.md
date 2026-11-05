# UAT Script: BUG-01 Server time is not cached at the edge

None of the three acceptance criteria has a UI: `GET /api/time` has no frontend consumer, so each check reads an HTTP response or a test run. Criterion 3 can only be verified by a human on the deployed environment; CI and local runs have no edge cache.

## Prerequisites

- Docker and Docker Compose installed and running (criterion 1).
- Repository checked out locally on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- No other process bound to host port `8010`.
- A terminal with `curl`.
- Criterion 2: `uv` installed and backend dependencies synced (`uv sync --directory backend`).
- Criterion 3: the merged fix is deployed to the environment behind the CDN, and the verifier knows the deployed host name (it is not recorded in this repository).

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
| 1 | Run `curl -si http://localhost:8010/api/time` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers in the same output | A line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 3 | Read the body | Exactly two keys: `now` (for example `2026-11-05T08:40:22.123456+00:00`, ending in `+00:00`) and `timezone` with the value `UTC` | [ ] Pass [ ] Fail |
| 4 | Run `curl -si http://localhost:8010/api/version` | No `cache-control` header is added (the fix is scoped to `/api/time`) | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |
| 6 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies print, and their `now` values differ (the second is about one second later). Identical values mean the CDN still caches and the item fails verification | [ ] Pass [ ] Fail |
| 8 | Run `curl -sI https://<deployed-host>/api/time` | The response carries `cache-control: no-store`, and any CDN cache-status header (for example `cf-cache-status` or `x-cache`) does not report a HIT | [ ] Pass [ ] Fail |

### Edge case: other methods are rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `curl -si -X POST http://localhost:8010/api/time` | The status line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 (steps 7 and 8 need the deployed environment) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
