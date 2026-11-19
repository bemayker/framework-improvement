# UAT Script: BUG-01 Server time is served stale from the edge cache

No criterion is visible in the UI: `GET /api/time` has no frontend consumer, so the observable checks are the HTTP response, a test run, and (criterion 3) the deployed environment.

## Prerequisites

- Docker and Docker Compose installed and running; backend published on `http://localhost:8010` (from `docker-compose.yml`).
- Repository checked out locally on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- A terminal with `curl`, and `uv` installed (criterion 2).
- Criterion 3 only: the item is merged and deployed, and the deployed API host is known (substitute it for `<deployed-host>`).

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8010/api/time` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers of that same output | A line `cache-control: no-store` is present (header names are case-insensitive) | [ ] Pass [ ] Fail |
| 3 | Read the body | JSON with exactly two keys: `now` (for example `2026-11-19T00:30:12.345678Z`, ending in `Z` or `+00:00`) and `timezone` with value `UTC` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | From the repo root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The run passes: the summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | `test_get_server_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

Verified only on the deployed environment, by a human: no edge cache exists locally.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` and note the `now` value | Status 200 and a `cache-control: no-store` header | [ ] Pass [ ] Fail |
| 7 | Wait one second, then run `curl -s https://<deployed-host>/api/time` again | The `now` value is later than the one noted in step 6, not identical | [ ] Pass [ ] Fail |
| 8 | Repeat steps 6 and 7 once more | The values differ again, confirming the CDN did not serve a stored copy (an `age` header, if the CDN sends one, is absent or `0`) | [ ] Pass [ ] Fail |

### Edge case: a non-GET method is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `curl -si -X POST http://localhost:8010/api/time` | The status line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
