# UAT Script, BUG-01: Server time is served stale from the edge cache

No criterion is verifiable through the application UI (no frontend page calls `/api/time`). Every check reads the HTTP response with `curl`. Local backend host port is 8010 (`docker-compose.yml`).

## Prerequisites
- Docker running; branch `feature/BUG-01-server-time-edge-cache` checked out.
- From the repository root: `docker compose up -d --build`, then wait until `docker compose ps` shows `backend` running.
- A terminal with `curl` and `uv`.
- Criterion 3 only: the fix is deployed, and you know the public host (`<deployed-host>`; no row yet in `docs/DEVELOPMENT.md` -> `## Test environments`).

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -si http://localhost:8010/api/time` | First line reads `HTTP/1.1 200 OK` | [ ] | [ ] |
| 1.2 | Read the headers of the same response | A line `cache-control: no-store` (name case may differ), value exactly `no-store` | [ ] | [ ] |
| 1.3 | Read the body of the same response | Two-key JSON, e.g. `{"now": "2026-10-02T13:22:08.123456+00:00", "timezone": "UTC"}` | [ ] | [ ] |
| 1.4 | Run the curl command a second time | The second response also carries `cache-control: no-store` | [ ] | [ ] |

## Criterion 2: a test asserts the header on the response
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` | All tests pass, none skipped | [ ] | [ ] |
| 2.2 | Open `backend/tests/integration/test_server_time_integration.py` | `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` | [ ] | [ ] |
| 2.3 | Optional: run `git show main:backend/app/routers/server_time.py` | The handler on `main` sets no header, so the same test fails on `main` | [ ] | [ ] |

## Criterion 3: after deploy, the reproduction returns two different values
Run by a human after the merge is deployed. Not runnable locally (the CDN exists only on the deployed environment).

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -si https://<deployed-host>/api/time` | Status 200; headers include `cache-control: no-store`; any CDN cache-status header (`x-cache`, `cf-cache-status`) reads miss or bypass, not hit | [ ] | [ ] |
| 3.2 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies print | [ ] | [ ] |
| 3.3 | Compare the two `now` values | They differ, the second about one second later. Identical values mean the defect persists: record the step 3.1 headers on the item | [ ] | [ ] |
| 3.4 | Repeat step 3.2 two more times | Every pair differs | [ ] | [ ] |
| 3.5 | Move the item from `to_verify` to done only when 3.1 to 3.4 pass | Item status updated | [ ] | [ ] |

## Summary
| Criterion | Steps | Result |
|---|---|---|
| 1. Cache-Control no-store on responses | 1.1 to 1.4 | [ ] Pass [ ] Fail |
| 2. A test asserts the header | 2.1 to 2.3 | [ ] Pass [ ] Fail |
| 3. Deployed: two different `now` values | 3.1 to 3.5 | [ ] Pass [ ] Fail |

Tester: ____________  Date: ____________  Environment: ____________
