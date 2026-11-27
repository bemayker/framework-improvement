# UAT Script: BUG-01 Server time is not cached by the edge

No criterion is verifiable through the UI: `GET /api/time` has no frontend consumer, so the observable check is the HTTP response itself, read with `curl`. Criterion 3 can only be checked on the deployed environment, because locally nothing caches the response.

## Prerequisites

- A terminal with `curl`.
- Criteria 1 and 2: the backend running locally on port 8000 (`docker compose up -d backend`, or `uv run --directory backend uvicorn app.main:app --port 8000`). No database is needed for this endpoint. Backend dependencies installed (`uv sync --directory backend`).
- Criterion 3: the merge of this fix is deployed, and you know the deployed API host (written `<deployed-host>` below; the item names none and `docs/DEVELOPMENT.md` Test environments is empty).

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers in the same output | A line `cache-control: no-store` is present (header names are case-insensitive) | [ ] Pass [ ] Fail |
| 3 | Read the body | JSON shaped like `{"now":"2026-11-27T17:45:12.345678Z","timezone":"UTC"}`: `now` ends in `Z` or `+00:00`, never a bare time with no offset, and `timezone` is `UTC` | [ ] Pass [ ] Fail |
| 4 | Edge case: run `curl -si -X POST http://localhost:8000/api/time` | The status line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | A test named `test_get_time_sets_cache_control_no_store` asserts that the `Cache-Control` response header equals `no-store` | [ ] Pass [ ] Fail |
| 6 | From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment, human check)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | On the deployed environment, run `curl -si https://<deployed-host>/api/time` (a GET); note the `now` value | Status 200, a `Cache-Control: no-store` header, and a JSON body with a `now` value | [ ] Pass [ ] Fail |
| 8 | Wait one second and run the same command again | Both responses carry `Cache-Control: no-store`, and the two `now` values differ | [ ] Pass [ ] Fail |
| 9 | Optional, if the CDN exposes its cache status (an `age`, `x-cache` or `cf-cache-status` header): read it on step 7's response | No cache hit: `age` absent or 0, or a MISS, BYPASS or DYNAMIC status | [ ] Pass [ ] Fail |

If both `now` values are identical, the fix is not effective on the deployed environment: record the full response headers of both calls on the item rather than marking it verified.

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 (8 required, 1 optional) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
