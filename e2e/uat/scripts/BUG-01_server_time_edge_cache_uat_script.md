# UAT Script: BUG-01 Server time is not served stale from the edge cache

`GET /api/time` now carries `Cache-Control: no-store`, so the CDN in front of the API no longer returns the same `now` for requests a second apart. No UI is involved; criteria 1 and 2 are checked locally with `curl` and the test suite, criterion 3 on the deployed environment after merge.

## Prerequisites

- Docker is running.
- Repository checked out on `feature/BUG-01-server-time-edge-cache`.
- From the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running, published on `http://localhost:8010`.
- A terminal with `curl` and `uv` (`uv sync --directory backend` done).
- For criterion 3 only: the fix is merged and deployed, and you know the deployed host name (below `tasknotes.example.com`; substitute the real one).

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -si http://localhost:8010/api/time` | First line reads `HTTP/1.1 200 OK`; a header line `cache-control: no-store` is present; the body is JSON with `now` ending in `Z` and `timezone` equal to `UTC` | [ ] | [ ] |
| 1.2 | Run the same command a second time | `cache-control: no-store` is present again | [ ] | [ ] |

## Criterion 2: a test asserts the header on the response

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` | The run includes `test_get_time_sets_cache_control_no_store` and `test_get_time_sets_cache_control_on_every_call` and reports `0 failed` | [ ] | [ ] |
| 2.2 | Open `backend/tests/integration/test_server_time_integration.py` | `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` | [ ] | [ ] |

## Criterion 3: after deploy, the reproduction returns two different values

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -si https://tasknotes.example.com/api/time` | `200`, a `cache-control: no-store` header line; note the `now` value (for example `2026-10-22T18:01:12.345678Z`) | [ ] | [ ] |
| 3.2 | Wait one second, then run the same command again | A different `now`, at least one second later than the first; any CDN cache-status header (such as `x-cache`) does not report a hit and no `age:` header shows | [ ] | [ ] |
| 3.3 | Run `curl -s https://tasknotes.example.com/api/time; sleep 1; curl -s https://tasknotes.example.com/api/time` | Two different `now` values (before the fix both were identical) | [ ] | [ ] |
| 3.4 | When verified, remove the `mayker:to-verify` tag from the ClickUp task | Tag removed so the item reads as done | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. Header `Cache-Control: no-store` | 1.1 to 1.2 | | |
| 2. A test asserts the header | 2.1 to 2.2 | | |
| 3. Deployed reproduction returns different values | 3.1 to 3.4 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
