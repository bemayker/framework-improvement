# UAT Script: BUG-01, Server time is served stale from the edge cache

No screen of the task-notes app calls `/api/time`, so every step is verified against the HTTP response with `curl`.

## Prerequisites (criteria 1 and 2)
- On branch `feature/BUG-01-server-time-edge-cache` (or `main` once merged).
- From the repository root run `docker compose up -d --build`, then `docker compose ps` until `backend` reports running. The backend answers on http://localhost:8010.
- A terminal with `curl` and `uv`.

## Criterion 1: GET /api/time responses carry Cache-Control: no-store

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i http://localhost:8010/api/time` | First line `HTTP/1.1 200 OK`; a header line `cache-control: no-store` (name case-insensitive, value exactly `no-store`, no other directive) | [ ] | [ ] |
| 1.2 | Read the body from step 1.1 | Exactly the keys `now` (timestamp ending in `Z`, such as `2026-10-16T04:40:12.345678Z`) and `timezone` with value `UTC` | [ ] | [ ] |
| 1.3 | Run `curl -s -D - -o /dev/null http://localhost:8010/api/health` | Headers carry no `cache-control: no-store` line, showing the header is scoped to `/api/time` | [ ] | [ ] |

## Criterion 2: a test asserts the header on the response

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Open `backend/tests/integration/test_server_time_integration.py` | It contains `test_get_server_time_sets_cache_control_no_store`, which requests `/api/time` and asserts the `cache-control` header equals `no-store` | [ ] | [ ] |
| 2.2 | From the repository root run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` | Summary reports `0 failed`; `test_get_server_time_sets_cache_control_no_store` is among the tests run (add `-v` to see it listed as PASSED) | [ ] | [ ] |
| 2.3 | Optional negative check: temporarily delete the line that sets the header in `backend/app/routers/server_time.py`, re-run the command from 2.2, then restore the line and re-run | With the line removed `test_get_server_time_sets_cache_control_no_store` fails; after restoring, `0 failed` | [ ] | [ ] |

## Criterion 3: after deploy, the reproduction returns two different values

This criterion exists only behind the CDN of the deployed environment, so a human checks it there after the fix is deployed. No local step can reproduce it.

Prerequisites: the merged fix is deployed. The deployed API base URL is the one the defect reproduction used (not recorded in `CLAUDE.md`); below it is written DEPLOYED_BASE, for example `https://api.example.com`.

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -s -D - DEPLOYED_BASE/api/time`; note the `now` value | Headers include `cache-control: no-store`; a `now` value is noted, for example `2026-10-16T09:00:00.123456Z` | [ ] | [ ] |
| 3.2 | Wait one second, run the same command again | The new `now` is one second or more later than the value from 3.1, so the two values differ (before the fix both were identical) | [ ] | [ ] |
| 3.3 | If the CDN exposes a cache status header (such as `cf-cache-status`, `x-cache` or `age`), read it on the 3.2 response | It reports miss, bypass or dynamic, never a hit; `age` is absent or `0` | [ ] | [ ] |

Summary of the deployed check: on the deployed environment, request GET /api/time, wait one second, request it again. The two responses carry different `now` values, and each carries the header `cache-control: no-store`.

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. Header present on GET /api/time | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. A test asserts the header | 2.1 to 2.3 | [ ] Pass  [ ] Fail |
| 3. Deployed reproduction returns different values (human, deployed only) | 3.1 to 3.3 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________
