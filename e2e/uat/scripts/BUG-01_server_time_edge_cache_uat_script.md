# UAT Script: BUG-01 Server time is not served stale from the edge cache

Criteria 1 and 2 are checked locally. Criterion 3 cannot be reproduced locally (nothing caches locally) and is checked by a human on the deployed environment after merge (the item lands at `to_verify`).

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

Prerequisites: backend running locally on port 8000 (`uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -s -i http://localhost:8000/api/time` | Status line reads `HTTP/1.1 200 OK` | [ ] | [ ] |
| 1.2 | Read the response headers in the same output | A `cache-control: no-store` header is present (name may be lower-case) | [ ] | [ ] |
| 1.3 | Read the body in the same output | JSON with exactly the keys `now` and `timezone`; `timezone` is `"UTC"`; `now` ends in `+00:00` | [ ] | [ ] |
| 1.4 | Run `curl -s -i -X POST http://localhost:8000/api/time` (edge case) | Status line reads `405 Method Not Allowed` | [ ] | [ ] |

## Criterion 2: A test asserts the header on the response

Prerequisites: repository checked out at the merged commit; uv installed.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` | The run ends with `0 failed` | [ ] | [ ] |
| 2.2 | Open `backend/tests/integration/test_server_time_integration.py` | A test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] | [ ] |

## Criterion 3: After deploy, the reproduction returns two different values

Prerequisites: the merged commit is deployed; you know the deployed host name (`{deployed-host}` below).

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `curl -s -i https://{deployed-host}/api/time` | Status 200 and a `cache-control: no-store` header (if the CDN rewrites or strips it, the fix is not effective at the edge: record a failure) | [ ] | [ ] |
| 3.2 | Run `curl -s https://{deployed-host}/api/time; sleep 1; curl -s https://{deployed-host}/api/time` | Two JSON bodies whose `now` values differ (the second about one second later) | [ ] | [ ] |
| 3.3 | Repeat step 3.2 once more | Again two different `now` values, confirming no cached copy is replayed | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. `Cache-Control: no-store` on responses | 1.1 to 1.4 | [ ] Pass [ ] Fail |
| 2. A test asserts the header | 2.1 to 2.2 | [ ] Pass [ ] Fail |
| 3. Deployed reproduction returns distinct values | 3.1 to 3.3 | [ ] Pass [ ] Fail |

Tester: ______________  Date: ______________
