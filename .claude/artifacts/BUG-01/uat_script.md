# UAT Script: BUG-01 Server time is not stored by the edge cache

No acceptance criterion has a UI surface: every step reads an HTTP response or a test run, so the checks are `curl` and `pytest`. Criterion 3 runs on the deployed environment only.

## Prerequisites

- Docker and Docker Compose installed and running (criterion 1).
- Repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- A terminal with `curl`.
- Criterion 2: `uv` installed and backend dependencies synced (`uv sync --directory backend`); no database is required.
- Criterion 3: this item's PR is merged and deployed, and you know the deployed API host (substitute it for `<deployed-host>`).

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
| 1 | Run `curl -i http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response headers | A line `cache-control: no-store` is present (header names are case-insensitive) | [ ] Pass [ ] Fail |
| 3 | Read the response body | JSON of the form `{"now":"2026-11-17T02:03:10.123456Z","timezone":"UTC"}`, with `now` ending in `Z` (or `+00:00`) and `timezone` exactly `UTC` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_server_time_sets_cache_control_no_store` asserts the response's `Cache-Control` header equals `no-store` | [ ] Pass [ ] Fail |
| 5 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies are printed | [ ] Pass [ ] Fail |
| 7 | Compare the two `now` values | They differ (the second is about one second later than the first) | [ ] Pass [ ] Fail |
| 8 | Run `curl -si https://<deployed-host>/api/time` (a GET; this route answers a HEAD request with 405) | The headers include `cache-control: no-store`, and any CDN cache-status header (for example `cf-cache-status` or `x-cache`) does not report a HIT | [ ] Pass [ ] Fail |
| 9 | Repeat step 6 twice more | Every pair differs; a single identical pair means the edge cache still stores the response and the item fails verification | [ ] Pass [ ] Fail |

### Edge case: a POST is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `curl -i -X POST http://localhost:8010/api/time` | `HTTP/1.1 405 Method Not Allowed`; the body is not a server-time body | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
