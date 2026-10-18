# UAT Script: BUG-01 Server time is served stale from the edge cache on the deployed environment

Backend-only defect fix: the change is a `Cache-Control: no-store` response header on `GET /api/time`, so each check is a terminal command or a file read. Criterion 3 can only be checked on the deployed environment, by a human, after the merge.

## Prerequisites

- Criterion 1: Docker running; from the repository root run `docker compose up -d --build`; the backend answers on `http://localhost:8010`.
- Criterion 2: `uv` installed and backend dependencies synced (`uv sync --directory backend`); no database is needed for those test files.
- Criterion 3: the merge is deployed and you know the deployed host name (written `DEPLOYED-HOST` below).

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -sI http://localhost:8010/api/time` | Status line `HTTP/1.1 200 OK`; headers include `cache-control: no-store` (header names are case-insensitive) | [ ] | [ ] |
| 1.2 | Run `curl -s -D - http://localhost:8010/api/time` | The same `cache-control: no-store` line above a JSON body with exactly `now` (a timestamp ending `+00:00`) and `timezone` equal to `UTC`, unchanged from FEAT-1 | [ ] | [ ] |
| 1.3 | Edge case: run `curl -s -i -X POST http://localhost:8010/api/time` | Status line `HTTP/1.1 405 Method Not Allowed`, so the route was not widened | [ ] | [ ] |

## Criterion 2: A test asserts the header on the response

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | From the repository root run `uv run --directory backend pytest -v tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` | `0 failed`; `test_get_time_sets_cache_control_no_store` and `test_handler_sets_cache_control_no_store_on_response` are listed as PASSED | [ ] | [ ] |
| 2.2 | Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_time_sets_cache_control_no_store` | It asserts that the `cache-control` header of the `GET /api/time` response equals `no-store` | [ ] | [ ] |

## Criterion 3: After deploy, the reproduction returns two different values (human check, deployed environment)

Not verifiable locally: nothing caches locally, so two local calls differ before and after the fix.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | On the deployed environment run `curl -s https://DEPLOYED-HOST/api/time` and note the body | A JSON body with `now` and `timezone` | [ ] | [ ] |
| 3.2 | Wait one second, then run the same command again | The two `now` values differ (the second is about one second later). Identical values mean the defect persists: record both bodies on the item and leave it in to_verify | [ ] | [ ] |
| 3.3 | Run `curl -sI https://DEPLOYED-HOST/api/time` | The headers include `cache-control: no-store`; if the CDN adds an age or cache-status header, it reports a miss or bypass, not a hit | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. `Cache-Control: no-store` on `GET /api/time` | 1.1 to 1.3 | [ ] Pass [ ] Fail |
| 2. A test asserts the header | 2.1 to 2.2 | [ ] Pass [ ] Fail |
| 3. Deployed reproduction returns two different values | 3.1 to 3.3 | [ ] Pass [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass [ ] Fail
