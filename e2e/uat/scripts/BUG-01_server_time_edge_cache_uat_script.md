# UAT Script: BUG-01 Server time is not served stale from the edge cache

None of the three criteria has a UI: no frontend consumes `GET /api/time`, so the observable check is the HTTP response itself, read with `curl`, and the test run. Criterion 3 can only be verified by a human on the deployed environment, after the merge (the item's `to_verify` route).

## Prerequisites

- Criteria 1 and 2: repository checked out locally on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`), a terminal with `curl`, and `uv` installed.
- Criterion 1: the backend running locally and reachable. Either `docker compose up -d --build` from the repository root (the backend is published on `http://localhost:8010`), or `uv run --directory backend uvicorn app.main:create_app --factory --port 8010`. The time endpoint needs no database.
- Criterion 2: backend dependencies installed (`uv sync --directory backend`).
- Criterion 3: this item is merged and deployed, and you know the deployed host name (`<deployed-host>` below).

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -si http://localhost:8010/api/time` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers in the same output | A line `cache-control: no-store` is present (header names are case-insensitive) | [ ] Pass [ ] Fail |
| 3 | Read the body in the same output | A JSON object with `now` set to the current UTC time ending in `Z` and `timezone` set to `UTC` | [ ] Pass [ ] Fail |
| 4 | Run `curl -si http://localhost:8010/api/version` | No `cache-control: no-store` line, confirming the header is scoped to the time route only | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 6 | Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_time_returns_no_store_cache_control` | It asserts that the `cache-control` header of a `GET /api/time` response equals `no-store` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, two requests a second apart return different values

Verified by a human on the deployed environment, after the merge has deployed. These steps match the verification steps staged for this item.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -si https://<deployed-host>/api/time` (a GET; a HEAD request is not the route) | A `200` response with a JSON body holding `now` and `timezone` | [ ] Pass [ ] Fail |
| 8 | Confirm the response carries the header `Cache-Control: no-store` | The header is present | [ ] Pass [ ] Fail |
| 9 | Wait one second and run the same `curl -si https://<deployed-host>/api/time` again | A second `200` response with a JSON body | [ ] Pass [ ] Fail |
| 10 | Compare the `now` values of the two responses | They differ (before the fix the edge cache served the same value twice) | [ ] Pass [ ] Fail |
| 11 | When steps 7 to 10 all pass, remove the `mayker:to-verify` label from the item | The label is removed | [ ] Pass [ ] Fail |

### Edge case: a POST to the time endpoint is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `curl -si -X POST http://localhost:8010/api/time` | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
