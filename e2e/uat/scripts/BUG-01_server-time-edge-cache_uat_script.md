# UAT Script: BUG-01 Server time is served stale from the edge cache

None of these criteria has a UI surface; each is an observable check from a terminal.

## Prerequisites
- Criteria 1 and 2: the backend runs locally (`docker compose up` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8000`).
- Criterion 3: the fix is merged and deployed behind its CDN, and you know the deployed host (`<deployed-host>`; no row exists in `docs/DEVELOPMENT.md` -> `## Test environments`, so take it from whoever deploys).

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -si http://localhost:8000/api/time` | Status line `HTTP/1.1 200 OK`; headers include `cache-control: no-store` | [ ] | [ ] |
| 1.2 | Read the body in the same output | `{"now": "...+00:00", "timezone": "UTC"}`, unchanged from FEAT-1 | [ ] | [ ] |

## Criterion 2: A test asserts the header on the response
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | From the repo root run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` | All tests pass, including the new header tests | [ ] | [ ] |
| 2.2 | Open `backend/tests/integration/test_server_time_integration.py` | One test asserts the `cache-control` header of the `GET /api/time` response equals `no-store` | [ ] | [ ] |

## Criterion 3: After deploy, the reproduction returns two different values (human, deployed environment)
| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -si https://<deployed-host>/api/time` | HTTP 200; headers include `cache-control: no-store` (the deployed build carries the fix) | [ ] | [ ] |
| 3.2 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ, the second later by about one second (before the fix they were identical) | [ ] | [ ] |
| 3.3 | Repeat step 3.2 once more | The `now` values differ again. If identical, record the CDN's cache header from 3.1 (for example `age:` or `x-cache: HIT`) in the report: the CDN is overriding origin directives, and the remedy is CDN configuration, outside this item | [ ] | [ ] |

## Summary
| Criterion | Steps | Result |
|---|---|---|
| 1. Header on responses | 1.1, 1.2 | [ ] Pass [ ] Fail |
| 2. Test asserts the header | 2.1, 2.2 | [ ] Pass [ ] Fail |
| 3. Deployed repro differs | 3.1 - 3.3 | [ ] Pass [ ] Fail |

Tester: ______  Date: ______  Deployed host: ______
