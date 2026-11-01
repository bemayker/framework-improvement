# UAT Script: BUG-01 Server time is served stale from the edge cache

No criterion is verifiable through the UI: the item is backend only, so the observable check is the HTTP response itself, read with `curl`. Criterion 3 can only be verified on the deployed environment, because locally nothing caches the response.

## Prerequisites

- Criteria 1 and 2: the repository checked out locally on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`), `uv` installed, and a terminal with `curl`. The backend runs locally at `http://localhost:8010` (`docker compose up -d --build` from the repo root, as `docker-compose.yml` publishes the backend on host port `8010`) or via `uv run --directory backend uvicorn app.main:app --port 8000`, in which case use port `8000` below.
- Criterion 3: the change is merged and deployed, and you know the deployed API host (`<deployed-host>`).

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
| 1 | Run `curl -si http://localhost:8010/api/time` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers of that same response | One header reads `cache-control: no-store` (header names are case-insensitive) | [ ] Pass [ ] Fail |
| 3 | Read the body | JSON of the form `{"now":"2026-11-01T06:21:50.123456+00:00","timezone":"UTC"}`: `now` ends in `+00:00` and `timezone` is `UTC` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | From the repo root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_time_response_carries_cache_control_no_store` asserts the `cache-control` header equals `no-store` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

Deployed environment only, behind its edge cache. This step list matches `.claude/artifacts/run/test_steps-BUG-01.md`.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Deploy the merged commit to the deployed environment (behind its edge cache) | The deployment completes and the API answers | [ ] Pass [ ] Fail |
| 7 | Run `curl -si https://<deployed-host>/api/time` | `HTTP` status 200 and a `Cache-Control: no-store` header. If the CDN adds an `age` header or `x-cache: HIT`, the fix is not effective | [ ] Pass [ ] Fail |
| 8 | Wait two seconds, then run the same request again | A second 200 response with `Cache-Control: no-store` | [ ] Pass [ ] Fail |
| 9 | Compare the `now` values of the two responses | The two `now` values differ and the second is later than the first, so the edge cache did not serve a stale copy. Repeat steps 7 and 8 once more for confirmation; on pass, record it and remove the item's `mayker:to-verify` label | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
