# UAT Script: BUG-01 Server time is not cached by the edge

No criterion is verifiable through the UI: no frontend consumes `GET /api/time`, so the observable check is the HTTP response itself, read with `curl`. Criterion 3 can only be verified on the deployed environment, because the edge cache that causes the defect does not exist locally.

## Prerequisites

- Repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- `uv` installed, and a terminal with `curl`.
- No database or seed data is needed.
- Criterion 3 only: the merged change is deployed to the environment behind the CDN, and you know its public host (written below as `deployed-host`).

## Test Environment Setup

1. From the repository root, start the backend with either:
   ```bash
   docker compose up -d
   ```
   or
   ```bash
   uv run --directory backend uvicorn app.main:app --port 8000
   ```
2. The backend is published on its configured host port, 8000 by default. The steps below use `http://localhost:8000`.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers printed above the body | A line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 3 | Read the body | It has the shape `{"now":"2026-11-02T21:30:05.123456+00:00","timezone":"UTC"}`, with `now` ending in `+00:00` and `timezone` exactly `UTC` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_time_sets_cache_control_no_store` asserts the `cache-control` response header equals `no-store` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

Deployed-only check, run against the environment behind the CDN. It cannot be reproduced locally.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -s https://deployed-host/api/time; sleep 1; curl -s https://deployed-host/api/time` | Two JSON bodies are printed | [ ] Pass [ ] Fail |
| 7 | Compare the two `now` values | They differ, the second about one second later than the first | [ ] Pass [ ] Fail |
| 8 | Run `curl -sI https://deployed-host/api/time` | A `cache-control: no-store` header is present, and a CDN cache-status header (for example `x-cache` or `cf-cache-status`), if any, does not read `HIT` | [ ] Pass [ ] Fail |
| 9 | If steps 7 and 8 hold, move the tracker item from `to_verify` to Done. If the values are identical, record the full headers of both responses on the item | The item is moved, or the headers are recorded | [ ] Pass [ ] Fail |

### Edge case: a non-GET request is refused

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `curl -si -X POST http://localhost:8000/api/time` | The status line reads `405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 (9 required, 1 edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
