# UAT Script: BUG-01 Server time is not cached at the edge

No criterion is verifiable through the UI: `GET /api/time` has no frontend consumer, so the observable check is the HTTP response, read with `curl`, and the test run. Criterion 3 can only be verified by a human on the deployed environment, after the merge has deployed: locally there is no edge cache.

## Prerequisites

- A terminal with `curl`.
- Criteria 1 and 2: repository checked out on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`), `uv` installed, and the backend running locally (`docker compose up -d backend`, or `uv run --directory backend uvicorn app.main:app --port 8000`). The steps below assume port 8000; use the published port if you used compose.
- Criterion 3: the merge commit of this fix is live on the deployed environment and you know its host (`<deployed-host>`).

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | Status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a body like `{"now":"2026-11-04T00:40:12.345678Z","timezone":"UTC"}` | [ ] Pass [ ] Fail |
| 2 | Read the `now` value | It ends in `Z` or `+00:00` (explicit UTC offset), never a bare time with no offset | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | `0 failed` | [ ] Pass [ ] Fail |
| 4 | Open `backend/tests/integration/test_server_time_integration.py` | A test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment, human)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -si https://<deployed-host>/api/time` | The header `cache-control: no-store` is present on the response that passed through the CDN | [ ] Pass [ ] Fail |
| 6 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ (by about one second) | [ ] Pass [ ] Fail |
| 7 | Repeat step 6 once more | The values again differ, confirming the first pair was not a cache miss by chance | [ ] Pass [ ] Fail |

### Edge case (optional): the endpoint is read-only

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Run `curl -si -X POST http://localhost:8000/api/time` | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 (7 required, 1 optional edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
