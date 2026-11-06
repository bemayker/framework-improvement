# UAT Script: BUG-01 Server time is served stale from the edge cache

None of the acceptance criteria is verifiable through the UI: the app has no screen for server time, so the observable checks are the HTTP response (read with `curl`) and the backend test run. Criterion 3 can only be checked on the deployed environment, because locally there is no edge cache.

## Prerequisites

- A terminal with `curl`.
- Criteria 1 and the edge case: backend running locally (`docker compose up` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8000`). The steps below use port 8000; adjust to the port your run publishes.
- Criterion 2: repository checked out at the merged commit, `uv` installed.
- Criterion 3: the fix merged and deployed, and the deployed host name known (the item's `mayker:to-verify` tag marks it as awaiting this check). Replace `<deployed-host>` below with it.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | Status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a body shaped like `{"now":"2026-11-06T11:20:31.482913Z","timezone":"UTC"}` | [ ] Pass [ ] Fail |
| 2 | Check the `now` value from step 1 | It ends in `Z` or `+00:00` (an explicit offset), and `timezone` is `UTC` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary line shows `0 failed` | [ ] Pass [ ] Fail |
| 4 | Open `backend/tests/integration/test_server_time_integration.py` | One test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -si https://<deployed-host>/api/time` and note its `now` value | `200`, and the header `cache-control: no-store` is present (a CDN may add its own headers; `no-store` must still be there) | [ ] Pass [ ] Fail |
| 6 | Wait one second, then run `curl -si https://<deployed-host>/api/time` again | Header `cache-control: no-store` is present again, and its `now` value differs from step 5's | [ ] Pass [ ] Fail |
| 7 | Repeat steps 5 and 6 once more | The values differ again (a CDN hit would return the identical body) | [ ] Pass [ ] Fail |

### Edge case: a POST is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Run `curl -si -X POST http://localhost:8000/api/time` | Status `405 Method Not Allowed`; the route is GET only and carries no body to cache | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
