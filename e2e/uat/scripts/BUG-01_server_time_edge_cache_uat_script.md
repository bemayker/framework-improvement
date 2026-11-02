# UAT Script: BUG-01 Server time is not served stale from the edge cache

None of the three criteria is verifiable through the UI: the item has no frontend. The observable check is the HTTP response, read with `curl`, and the test run for criterion 2. Criterion 3 is a human check that only runs on the deployed environment.

## Prerequisites

- Repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- `uv` installed and `curl` available.
- Criterion 1 needs no database: the endpoint does not touch it.
- Criterion 2: the run's backing database available per `CLAUDE.md` Backing Services (the shared conftest may require it).
- Criterion 3: the change is merged and deployed, and you know the deployed API host (`<deployed-host>`). Locally there is no edge cache, so this criterion cannot be checked on a developer machine.

## Test Environment Setup

1. From the repository root, start the backend:
   ```bash
   uv run --directory backend uvicorn app.main:app --port 8000
   ```
2. Leave it running in one terminal and use a second terminal for the steps below.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response headers | A line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 3 | Read the response body | JSON with keys `now` (for example `2026-11-02T22:40:01.123456Z`, ending in `Z` or `+00:00`) and `timezone` equal to `"UTC"` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | A test asserts `response.headers["cache-control"] == "no-store"` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies are printed | [ ] Pass [ ] Fail |
| 7 | Compare the two `now` values | They differ (the second is about one second later) | [ ] Pass [ ] Fail |
| 8 | Run `curl -sI https://<deployed-host>/api/time` | The headers include `cache-control: no-store`, and no CDN cache-hit header (for example `x-cache: HIT` or `cf-cache-status: HIT`) is shown | [ ] Pass [ ] Fail |

### Edge case (optional): other methods are rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | With the local backend running, run `curl -si -X POST http://localhost:8000/api/time` | The first response line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 (8 required, 1 optional edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
