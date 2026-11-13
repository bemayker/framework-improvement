# UAT Script: BUG-01 Server time is served stale from the edge cache

No criterion is verifiable through the UI: `GET /api/time` has no screen, so the observable check is the HTTP response (read with `curl`) or the test run. Criterion 3 can only be verified on the deployed environment, where the CDN exists.

## Prerequisites

- A terminal with `curl`.
- Criterion 1: the backend running locally (the handover stack, or `uv run --directory backend uvicorn app.main:app --port 8000`).
- Criterion 2: a checkout of the merged branch with backend dependencies installed (`uv sync --directory backend`).
- Criterion 3: the merged change deployed, and the deployed host name known (the `<deployed-host>` from the ticket).

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` (substitute the handover's backend URL) | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers in the same output | A line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 3 | Read the body in the same output | JSON of the shape `{"now":"2026-11-13T08:03:14.512345+00:00","timezone":"UTC"}`, with `now` ending in `+00:00` | [ ] Pass [ ] Fail |
| 4 | Edge case: run `curl -si -X POST http://localhost:8000/api/time` | The status line reads `405 Method Not Allowed`. The route is GET only, and a HEAD request also gets 405, so always verify with a GET | [ ] Pass [ ] Fail |

### Criterion 2: a test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `uv run --directory backend pytest -q -v tests/integration/test_server_time_integration.py` | The run ends with `0 failed`, and `test_get_time_sets_cache_control_no_store` is listed as `PASSED` | [ ] Pass [ ] Fail |
| 6 | Open `backend/tests/integration/test_server_time_integration.py` | `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` | [ ] Pass [ ] Fail |

### Criterion 3: after deploy, the reproduction returns two different values

Run by a human on the deployed environment once the merge reaches it (the item sits at `to_verify` until then). Use GET, not HEAD: HEAD returns 405 on this route.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | On the deployed environment, send two GET requests a second apart: run `curl -si https://<deployed-host>/api/time`, wait one second, then run the same call again | Both responses are 200 | [ ] Pass [ ] Fail |
| 8 | Read both responses | Each carries `Cache-Control: no-store`, and the two `now` values differ, the second later than the first | [ ] Pass [ ] Fail |
| 9 | Check the CDN's cache-status header in both outputs if the CDN emits one (for example `cf-cache-status` or `x-cache`) | It reads a miss, bypass or dynamic value, never a hit | [ ] Pass [ ] Fail |

Failure: identical `now` values, or no `Cache-Control: no-store` header, means the edge cache still serves the response. Record the two outputs on the ticket rather than moving the item to Done.

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
