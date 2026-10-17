# UAT Script, BUG-01: Server time is served stale from the edge cache

None of the criteria can be verified through the UI: the change is a response header on a backend endpoint. Each step reads an observable check instead.

## Prerequisites
- Local: stack running (`docker compose up -d --build` from the repo root), backend at http://localhost:8010.
- Tests: backend dependencies installed (`uv sync --directory backend`), Postgres reachable per CLAUDE.md Backing Services.
- Criterion 3 only: the fix is merged and deployed, and you know the deployed host name (none is configured in this sandbox).

## Criterion 1: GET /api/time responses carry Cache-Control: no-store
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -s -D - -o /dev/null http://localhost:8010/api/time` | Headers start with `HTTP/1.1 200 OK` and include `cache-control: no-store` | [ ] | [ ] |
| 1.2 | Run `curl -s http://localhost:8010/api/time` | JSON body with `now` (UTC timestamp ending `+00:00`) and `timezone` equal to `UTC` | [ ] | [ ] |

## Criterion 2: A test asserts the header on the response
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_router_unit.py` | `0 failed` | [ ] | [ ] |
| 2.2 | Open `backend/tests/integration/test_server_time_integration.py` | A test sends GET /api/time and asserts the `cache-control` header equals `no-store` | [ ] | [ ] |

## Criterion 3: After deploy, the reproduction returns two different values (deployed only)
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -s -D - -o /dev/null https://<deployed-host>/api/time` | Headers include `cache-control: no-store` (the CDN passes it through) | [ ] | [ ] |
| 3.2 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ, the second about one second later | [ ] | [ ] |
| 3.3 | If the two `now` values are identical, record the response headers (including any `age` or `x-cache` header) | Criterion marked failed; the edge cache is still serving a stored copy | [ ] | [ ] |

## Summary
| Criterion | Result | Notes |
|---|---|---|
| 1. Header present on GET /api/time | | |
| 2. Test asserts the header | | |
| 3. Deployed reproduction differs (human, deployed) | | |

Tester: ______  Date: ______
