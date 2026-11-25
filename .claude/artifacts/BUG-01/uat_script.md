# UAT Script: BUG-01 Server time is not served stale from the edge cache

None of the three acceptance criteria has a UI: the endpoint has no frontend consumer, so every step reads the HTTP response with `curl` or runs the tests.

## Prerequisites

- Docker and Docker Compose installed and running (steps 1 to 3).
- Repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- No other process bound to host port `8010` (the backend port `docker-compose.yml` publishes).
- A terminal with `curl`.
- Steps 4 and 5 only: `uv` installed and backend dependencies synced (`uv sync --directory backend`).
- Steps 6 to 9 only: this fix is merged and deployed, and you know the deployed host name. **The deployed host is not named anywhere in the repository** (`docs/DEVELOPMENT.md` Test environments is empty), so this script writes `<deployed-host>` and you must substitute the real host. Do not guess one.

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
| 1 | Run `curl -si http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers of that same output | A line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 3 | Read the body of that same output | JSON shaped like `{"now":"2026-11-25T13:34:31.123456+00:00","timezone":"UTC"}`, with `now` ending in `+00:00` | [ ] Pass [ ] Fail |

### Criterion 2: a test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_time_sets_cache_control_no_store` | It asserts the response's `Cache-Control` header equals `no-store` | [ ] Pass [ ] Fail |

### Criterion 3: after deploy, the reproduction returns two different values

Prerequisites: the fix is merged and deployed, and `<deployed-host>` is known. This cannot be verified locally, because no edge cache exists there. This is the step the item's `mayker:to-verify` label waits on.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` and note the `now` value | Status 200, a `Cache-Control: no-store` header, and a `now` value | [ ] Pass [ ] Fail |
| 7 | Wait one second, then run `curl -si https://<deployed-host>/api/time` again | Status 200, a `Cache-Control: no-store` header, and a `now` value | [ ] Pass [ ] Fail |
| 8 | Compare the two `now` values | They differ | [ ] Pass [ ] Fail |
| 9 | If they are identical, read the response headers for a CDN cache marker (for example `x-cache: HIT` or an `age` header) | A marker means the CDN still caches the route and the item fails verification. With both values different, no marker should be present | [ ] Pass [ ] Fail |

If steps 6 to 8 pass, remove the `mayker:to-verify` label from the item.

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
