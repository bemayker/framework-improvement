# UAT Script, BUG-01: Server time is served stale from the edge cache

Criteria 1 and 2 are verified locally. Criterion 3 is a human check on the deployed host only; no local edge cache exists to reproduce it.

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

Prerequisites: the backend is running locally (`docker compose up` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8000`), reachable at `http://localhost:8000`. This criterion has no UI; the observable check is the response header.

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -si http://localhost:8000/api/time` | Status line reads `HTTP/1.1 200 OK` | [ ] | [ ] |
| 1.2 | Read the response headers | A line `cache-control: no-store` is present (case-insensitive) | [ ] | [ ] |
| 1.3 | Read the body | JSON with exactly two keys: `now` (ISO 8601, ending in `Z` or `+00:00`) and `timezone` with value `UTC` | [ ] | [ ] |
| 1.4 | Run `curl -si -X POST http://localhost:8000/api/time` | Status `405 Method Not Allowed` | [ ] | [ ] |

## Criterion 2: A test asserts the header on the response

Prerequisites: backend dependencies installed (`uv sync --directory backend`).

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The run ends with `0 failed` | [ ] | [ ] |
| 2.2 | Open `backend/tests/integration/test_server_time_integration.py` | A test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] | [ ] |

## Criterion 3: After deploy, the reproduction returns two different values

Prerequisites: the fix is merged and deployed; you know the deployed API host (replace `<deployed-host>` below). Human verification on the deployed environment only.

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -si https://<deployed-host>/api/time` | Status 200 and a `cache-control: no-store` header. If the CDN adds an `age:` or cache-hit header such as `x-cache: HIT`, note it; it should read as a miss or be absent | [ ] | [ ] |
| 3.2 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | The two printed `now` values differ, by about one second | [ ] | [ ] |
| 3.3 | Record the two values and the date in the item's verification note | When they differ, the `mayker:to-verify` item can be confirmed done. When identical, the CDN is ignoring the header: reopen with the step 3.1 response headers attached | [ ] | [ ] |

## Summary

| Criterion | Where | Result |
|---|---|---|
| 1. Header present on `GET /api/time` | Local | [ ] Pass [ ] Fail |
| 2. Test asserts the header | Local | [ ] Pass [ ] Fail |
| 3. Two different values after deploy | Deployed host (human) | [ ] Pass [ ] Fail |

Tester: ____________  Date: ____________
