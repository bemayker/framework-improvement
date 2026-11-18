# UAT Script: BUG-01 Server time is not served stale from the edge cache

No criterion is verifiable through the UI: no frontend consumes `GET /api/time`, so the observable check is the HTTP response itself, read with `curl`. Use GET (`curl -si`), never HEAD: a HEAD request gets 405 from this route.

## Prerequisites

- Criteria 1 and 2: Docker and Docker Compose installed, repository checked out on branch `feature/BUG-01-server-time-edge-cache` (or `main` once merged), nothing else bound to host port `8010`, `uv` installed, and a terminal with `curl`.
- Criterion 3: the merged fix is deployed, and you know the deployed API host (written below as `<deployed-host>`). `docs/DEVELOPMENT.md` `## Test environments` names none yet, so you supply it.

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Run `docker compose ps` until the `backend` service reports running.
3. Install backend dependencies once: `uv sync --directory backend`.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers of that response | A line `cache-control: no-store` is present (header names are case-insensitive) | [ ] Pass [ ] Fail |
| 3 | Read the body of that response | JSON with exactly two keys: `now` (ISO 8601, ending in `Z` or `+00:00`) and `timezone` with the value `UTC` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_time_sets_cache_control_no_store` reads the `cache-control` header off the response of `GET /api/time` and compares it to `no-store` | [ ] Pass [ ] Fail |
| 5 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (human, deployed environment)

Prerequisites: the merged fix is deployed and `<deployed-host>` is known. This cannot be checked locally: the edge cache exists only on the deployed environment.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` | Status 200, and the headers include `cache-control: no-store` | [ ] Pass [ ] Fail |
| 7 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies are printed | [ ] Pass [ ] Fail |
| 8 | Compare the `now` values of the two bodies | They differ, the second about one second later than the first. Identical values mean the edge cache still serves a stored copy and the item fails verification | [ ] Pass [ ] Fail |
| 9 | When step 8 passes, remove the `mayker:to-verify` label from the merged PR | The item is marked verified | [ ] Pass [ ] Fail |

### Edge case: a second request is not served from a stored copy

Covers the corresponding Gherkin scenario, locally.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `curl -s http://localhost:8010/api/time; curl -s http://localhost:8010/api/time` | The two `now` values differ, the second later than the first | [ ] Pass [ ] Fail |
| 11 | Run `curl -si -X POST http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
