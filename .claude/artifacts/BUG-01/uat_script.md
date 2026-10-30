# UAT Script: BUG-01 Server time is served stale from the edge cache

This item has no UI: no frontend consumes `GET /api/time`, so every step is a terminal command whose output is read by the person verifying. Criterion 3 can only be verified on the deployed environment, because a developer machine has no edge cache.

## Prerequisites

- Docker and Docker Compose installed and running (criterion 1 and the edge case).
- Repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- A terminal with `curl`.
- Criterion 2 only: `uv` installed and the backend dependencies synced (`uv sync --directory backend`).
- Criterion 3 only: the fix is merged and deployed, and you know the deployed host name.

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
| 1 | Run `curl -s -D - -o /dev/null http://localhost:8010/api/time` | The status line is `HTTP/1.1 200 OK` and the printed headers include `cache-control: no-store` | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/api/time` | The body is JSON of the form `{"now":"2026-10-30T17:24:13.123456Z","timezone":"UTC"}`, with `now` ending in `Z` or `+00:00` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `uv run --directory backend pytest -v tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py` | The run reports `0 failed`, and `test_get_time_sets_cache_control_no_store` is listed as PASSED | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

Not verifiable locally: there is no edge cache on a developer machine. Run these steps against the deployed host.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s -D - https://<deployed-host>/api/time` | The response headers include `cache-control: no-store` (the CDN forwards the origin's directive) | [ ] Pass [ ] Fail |
| 5 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ by about one second | [ ] Pass [ ] Fail |
| 6 | Compare the two `now` values from step 5 | If both values are identical, the CDN is still caching: the item stays in To verify and is reopened. If they differ, remove the `mayker:to-verify` label from the item | [ ] Pass [ ] Fail |

### Edge case: two requests return different values locally

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -s http://localhost:8010/api/time; sleep 1; curl -s http://localhost:8010/api/time` | Two JSON bodies whose `now` values differ by about one second (no edge cache locally, so this holds before and after the fix) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 (6 required, 1 edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
