# UAT Script: BUG-01 Server time is not served stale from the edge cache

This feature has no UI. Every criterion is verified against the API with `curl`, the test suite, or the deployed environment. Criterion 3 can only be verified on the deployed environment (locally there is no edge cache).

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- No other process bound to host port `8010`.
- A terminal with `curl`.
- `uv` installed (criterion 2).
- Criterion 3 only: the fix merged and deployed, the item at `to_verify`, and the deployed host name known (written `<deployed-host>` below).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build backend
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8010/api/time` | Status line `HTTP/1.1 200 OK`; headers include `cache-control: no-store`; body looks like `{"now":"2026-11-04T20:42:29.123456+00:00","timezone":"UTC"}` with `now` ending in `+00:00` | [ ] Pass [ ] Fail |
| 2 | Run the same command a second time | `cache-control: no-store` is present again and `now` is later than in step 1 | [ ] Pass [ ] Fail |

### Criterion 2: a test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` | The summary reports `0 failed` | [ ] Pass [ ] Fail |
| 4 | Open `backend/tests/integration/test_server_time_integration.py` | One test asserts the response's `cache-control` header equals `no-store` | [ ] Pass [ ] Fail |

### Criterion 3: after deploy, the reproduction returns two different values (deployed environment, human check)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -s -i https://<deployed-host>/api/time` | Status 200; headers include `cache-control: no-store`; no CDN cache-hit header reports a hit (`x-cache` or `cf-cache-status` is absent, `MISS`, `BYPASS` or `DYNAMIC`, depending on the CDN) | [ ] Pass [ ] Fail |
| 6 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ by about one second | [ ] Pass [ ] Fail |
| 7 | Record the two `now` values on the tracker item | Recorded. If the values are identical, the item fails verification and goes back with the step 5 response headers attached | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
