# UAT Script: BUG-01 Server time is not served stale from the edge cache

No criterion is verifiable through a UI: `GET /api/time` has no frontend consumer, so the observable checks are the HTTP response, the test run, and (criterion 3) two values read on the deployed environment with `curl`.

## Prerequisites

- Criteria 1 and 2: Docker and Docker Compose, `uv`, and the repository checked out on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- Criterion 3: the merged change is deployed behind the CDN and you know the deployed host (replace `<deployed-host>` below). A terminal with `curl`.

## Test Environment Setup

1. From the repository root, run `docker compose up -d` and wait until the `backend` service reports running (backend on `http://localhost:8010`).
2. For criterion 2, run `uv sync --directory backend` once.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8010/api/time` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers of that output | A line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 3 | Read the body of that output | JSON of the form `{"now":"2026-11-18T01:30:00.123456+00:00","timezone":"UTC"}`, with `now` ending in `+00:00` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` | The run passes: no failed or errored test, exit code 0 | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_time_response_carries_cache_control_no_store` asserts the `cache-control` header equals `no-store` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` (a GET; a HEAD request gets 405 from this route) | JSON with a `now` value, for example `"2026-11-18T09:00:00.100000+00:00"`; note it. The headers include `cache-control: no-store` as served through the CDN | [ ] Pass [ ] Fail |
| 7 | Wait one second, then run the same command again | A `now` value roughly one second later than step 6's, not identical to it | [ ] Pass [ ] Fail |
| 8 | Optionally check both responses for an `Age:` header | No `Age:` header greater than 0 on either response | [ ] Pass [ ] Fail |

If step 7's value equals step 6's, the defect persists: record the CDN's own cache headers (for example `age` or `x-cache`) in the verification note. When steps 6 and 7 pass, remove the `mayker:to-verify` label from the tracker item.

### Edge case: POST is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `curl -si -X POST http://localhost:8010/api/time` | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 (8 required, step 8 optional) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
