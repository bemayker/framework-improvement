# UAT Script: BUG-01 Server time is not served stale from the edge cache

No acceptance criterion is verifiable through the UI: the item is a response header on `GET /api/time`, read with `curl`. Criterion 3 can only be verified on the deployed environment, because nothing caches the response locally.

## Prerequisites

- Docker and Docker Compose installed and running (criterion 1).
- Repository checked out locally on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend).
- A terminal with `curl`; `uv` installed for criterion 2.
- Criterion 3 only: the merged fix is deployed behind its edge cache. No row exists in `docs/DEVELOPMENT.md` Test environments, so use the deployed host the item refers to as `<deployed-host>`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running. No database row or seed data is needed.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8010/api/time` | The first line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers in the same output | A line `cache-control: no-store` is present (the name may print lower-case) | [ ] Pass [ ] Fail |
| 3 | Read the body | JSON of the form `{"now":"2026-11-19T01:23:45.678901+00:00","timezone":"UTC"}`: `now` ends with `+00:00`, `timezone` is `UTC` | [ ] Pass [ ] Fail |
| 4 | Run `curl -si -X POST http://localhost:8010/api/time` (edge case) | The first line reads `HTTP/1.1 405 Method Not Allowed` and the body is not a server-time body | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 6 | Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_time_sets_cache_control_no_store` | It sends `GET /api/time` and asserts the response's `cache-control` header equals `no-store` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

Deployed environment only. Use `GET` requests: a HEAD request gets 405 from this route.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -si https://<deployed-host>/api/time` | Status 200 and a `cache-control: no-store` header is present (the edge has not replaced it) | [ ] Pass [ ] Fail |
| 8 | Wait one second and run the same command again | Status 200 and the `cache-control: no-store` header again | [ ] Pass [ ] Fail |
| 9 | Compare the `now` values of the two responses | They differ by about one second. Identical values mean the edge still caches the response and the item is not verified | [ ] Pass [ ] Fail |
| 10 | If the edge exposes a cache status header (for example `cf-cache-status`, `x-cache` or `age`), read it on the response from step 7 | It does not report a cache hit, and `age` is absent or `0` | [ ] Pass [ ] Fail |
| 11 | Only after steps 7 to 10 hold, remove the `mayker:to-verify` label | The item can move from To verify to Done | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
