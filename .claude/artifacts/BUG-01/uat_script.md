# UAT Script: BUG-01 Server time is not served stale from the edge cache

`GET /api/time` now carries `Cache-Control: no-store`, so the CDN in front of the deployed API no longer caches the time reading. No UI is involved: criteria 1 and 2 are checked with `curl` and the test runner against the local backend, criterion 3 with `curl` on the deployed environment.

## Prerequisites

- Repository checked out on `feature/BUG-01-server-time-edge-cache`, dependencies installed (`uv sync --directory backend`).
- For criterion 1: the backend runs locally, either `docker compose up -d --build` from the repository root (published on `http://localhost:8010`) or `uv run --directory backend uvicorn app.main:app --port 8010`.
- For criterion 3: the fix is merged and deployed, and you know the deployed host name (the one the CDN fronts). It cannot be verified locally, because nothing caches the response there.
- A terminal with `curl` and `uv`.

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -si http://localhost:8010/api/time` | The status line reads `HTTP/1.1 200 OK` | [ ] | [ ] |
| 1.2 | Read the headers printed above the body | One line reads `cache-control: no-store` (header names are case-insensitive), with no other cache directive beside it | [ ] | [ ] |
| 1.3 | Read the body | `{"now":"<an ISO 8601 instant ending in Z>","timezone":"UTC"}`, the same shape as before the fix | [ ] | [ ] |

## Criterion 2: A test asserts the header on the response

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] | [ ] |
| 2.2 | Run `uv run --directory backend pytest -v tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` | The run ends with `0 failed`, and `test_get_time_sets_cache_control_no_store` and `test_get_time_sets_cache_control_no_store_on_every_call` are among the tests run | [ ] | [ ] |

## Criterion 3: After deploy, the reproduction returns two different values (human, deployed environment)

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -si https://<deployed-host>/api/time` | Status `200`, and the headers include `cache-control: no-store` | [ ] | [ ] |
| 3.2 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies are printed | [ ] | [ ] |
| 3.3 | Compare the two `now` values | They differ (the second is about one second later). Identical values mean the CDN still caches the response: record it as a failure, with both bodies and the headers from step 3.1 | [ ] | [ ] |
| 3.4 | Edge case, locally: run `curl -si http://localhost:8010/api/time; sleep 1; curl -si http://localhost:8010/api/time` | Both responses carry `cache-control: no-store` and the two `now` values differ | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. `Cache-Control: no-store` on the response | 1.1 to 1.3 | | |
| 2. A test asserts the header | 2.1 to 2.2 | | |
| 3. Deployed reproduction returns two different values | 3.1 to 3.4 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
