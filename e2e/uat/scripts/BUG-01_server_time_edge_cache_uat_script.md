# UAT Script: BUG-01 Server time is not stored by an edge cache

No acceptance criterion is verifiable through the UI: `GET /api/time` has no frontend consumer, so the observable check is the HTTP response itself, read with `curl`. Criterion 3 can only be checked by a human on the deployed environment, after merge and deploy.

## Prerequisites

- Criteria 1 and 2: repository checked out locally on branch `feature/BUG-01-server-time-edge-cache` (or `main` once merged), backend dependencies synced (`uv sync --directory backend`), a terminal with `curl`, and no other process bound to port `8000`. No database is needed for this endpoint.
- Criterion 3: the merged commit is deployed, and you know the deployed API host (`<deployed-host>` below, the host the defect's reproduction uses).

## Test Environment Setup

1. Start the backend locally (criteria 1 and 2 only):
   ```bash
   uv run --directory backend uvicorn app.main:app --port 8000
   ```

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal run `curl -si http://localhost:8000/api/time` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers of that response | One line reads `cache-control: no-store` | [ ] Pass [ ] Fail |
| 3 | Read the body | JSON like `{"now":"2026-11-27T18:30:00.123456+00:00","timezone":"UTC"}`, with `now` ending in `+00:00` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` | The run passes: its summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (human, deployed environment)

Use a GET (`curl -s`), not a HEAD request.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` | Status 200, a `cache-control: no-store` header line, and a body with a `now` value; note it | [ ] Pass [ ] Fail |
| 7 | Wait one second and run `curl -s https://<deployed-host>/api/time` again (or run the whole reproduction: `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`) | A second `now` value that differs from the first (the later value is about one second after the first) | [ ] Pass [ ] Fail |
| 8 | If the CDN adds an `age:` or a cache-status header (for example `cf-cache-status` or `x-cache`), read it on the second response | It shows no cache hit: `age` absent or `0`; status `MISS`, `BYPASS` or `DYNAMIC`, not `HIT` | [ ] Pass [ ] Fail |

### Edge case: a POST is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `curl -si -X POST http://localhost:8000/api/time` | The status line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
