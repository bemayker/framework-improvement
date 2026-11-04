# UAT Script: BUG-01 Server time is never stored by an edge cache

No frontend consumes `GET /api/time`, so every check reads the HTTP response (or the test run) directly. Criterion 3 can only be verified on the deployed environment, behind its edge cache.

## Prerequisites

- Criteria 1 and 2: Docker and Docker Compose, a terminal with `curl`, and `uv` installed. Repository checked out on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, `main`). Host port `8010` free (backend mapping from `docker-compose.yml`).
- Criterion 3: this change is merged and deployed, and you know the deployed host name (shown as `{deployed base URL}`).

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
| 1 | Run `curl -i http://localhost:8010/api/time` | Status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a JSON body such as `{"now":"2026-11-04T01:47:48.123456+00:00","timezone":"UTC"}` whose `now` ends in `+00:00` | [ ] Pass [ ] Fail |
| 2 | Run the same command a second time | Again `200 OK` with `cache-control: no-store` on this response too | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | From the repository root run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |
| 4 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_time_returns_cache_control_no_store` asserts the response's `Cache-Control` header equals the router's `NO_STORE` constant | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Deploy the merged fix to the deployed environment (behind its edge cache) | The deployment completes | [ ] Pass [ ] Fail |
| 6 | Run `curl -si {deployed base URL}/api/time` | `200` with `cache-control: no-store` among the headers (if the CDN adds an `age:` or cache-status header, it must not report a cache hit). Note the `now` value | [ ] Pass [ ] Fail |
| 7 | Wait one second and run the same command again | `200` with `cache-control: no-store` again | [ ] Pass [ ] Fail |
| 8 | Compare the two `now` values | They differ (the edge cache did not serve the first response again); the second is about one second later. Record both in the item's verification note. Identical values mean the defect persists and the item stays in `to_verify` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 (steps 5 to 8 require the deployed environment) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
