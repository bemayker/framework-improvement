# UAT Script: BUG-01 Server time is served stale from the edge cache

No criterion is verifiable through the application UI: no frontend screen calls `GET /api/time`. Criteria 1 and 2 are checked locally with `curl` and `uv`. Criterion 3 can only be checked on the deployed environment, because the local stack has no edge cache. The backend answers locally on `http://localhost:8010`, the host port `docker-compose.yml` publishes for the `backend` service (a handover rebuild on free ports prints its own port, use that one).

## Prerequisites

- Docker running; repository on branch `feature/BUG-01-server-time-edge-cache`.
- From the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running.
- A terminal with `curl`; `uv` installed for Criterion 2. The backing database is up per `CLAUDE.md` Backing Services (the integration test uses it).
- Criterion 3 only: the fix is merged and deployed behind the CDN. The deployed host is the one the item names, written here as `https://<deployed-host>`, because `docs/DEVELOPMENT.md` Test environments has no row for it. Replace the placeholder with the real host before running.

## Criterion 1: GET /api/time responses carry Cache-Control: no-store

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -si http://localhost:8010/api/time`, read the first response line | `HTTP/1.1 200 OK` | [ ] | [ ] |
| 1.2 | Read the response headers in the same output | a line `cache-control: no-store` is present (header names may print in lower case) | [ ] | [ ] |
| 1.3 | Read the body below the headers | JSON object with `now` ending in `+00:00` and `timezone` equal to `UTC`, as before the fix | [ ] | [ ] |

## Criterion 2: a test asserts the header on the response

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | From the repository root run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_router_unit.py` | the run ends with `0 failed` | [ ] | [ ] |
| 2.2 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py -k cache_control` | exactly the test `test_get_time_response_carries_cache_control_no_store` is selected and the run ends with `0 failed` | [ ] | [ ] |
| 2.3 | Run `uv run --directory backend pytest -q tests/unit/test_server_time_router_unit.py -k cache_control` | the test `test_get_server_time_sets_cache_control_no_store` is selected and the run ends with `0 failed` | [ ] | [ ] |

## Criterion 3: after deploy, the reproduction returns two different values (deployed environment, human check)

Not runnable locally: the local stack has no edge cache. Run these steps against the deployed host after the fix is merged and deployed.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `curl -si https://<deployed-host>/api/time` | `200`, and the headers include `cache-control: no-store`; a CDN cache-status header, if the CDN sends one, reads a miss or bypass, never a hit | [ ] | [ ] |
| 3.2 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | two JSON bodies whose `now` values differ, the second at least one second later | [ ] | [ ] |
| 3.3 | If the two values are identical, the fix did not hold: leave the `mayker:to-verify` label in place and run `/fix BUG-01`. If they differ, remove the label and move the item to Done | the outcome matches the two values observed in 3.2 | [ ] | [ ] |

## Edge case: non-GET method is still rejected

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| E.1 | Run `curl -i -X POST http://localhost:8010/api/time` | first response line is `HTTP/1.1 405 Method Not Allowed`; the header is not part of this check | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|-----------|-------|--------|--------|
| 1 Cache-Control header | 1.1 to 1.3 | | |
| 2 Tests assert the header | 2.1 to 2.3 | | |
| 3 Deployed, fresh values | 3.1 to 3.3 | | |
| Edge: 405 on POST | E.1 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
