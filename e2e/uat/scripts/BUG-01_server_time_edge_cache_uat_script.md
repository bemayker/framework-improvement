# UAT Script: BUG-01 Server time is not stored by the edge cache

None of the acceptance criteria is verifiable through the UI: the item has no screen. The observable checks are the HTTP response, the test run, and, for criterion 3, two requests against the deployed host.

## Prerequisites

- A terminal with `curl`.
- Criteria 1 and 2: `uv` installed and the backend dependencies synced (`uv sync --directory backend`). No database is needed for this endpoint.
- Criterion 3: this fix is merged and deployed, you know the deployed host name (`<deployed-host>` below), and the CDN in front of the API is active.

## Test Environment Setup

1. For criterion 1, start the backend locally: `uv run --directory backend uvicorn app.main:app --port 8000`.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -si http://localhost:8000/api/time` | The status line reads `HTTP/1.1 200 OK` and the headers include `cache-control: no-store` | [ ] Pass [ ] Fail |
| 2 | Read the body printed after the headers | JSON shaped `{"now":"2026-...Z","timezone":"UTC"}`, with `now` ending in `Z` or `+00:00` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |
| 4 | Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_time_sets_cache_control_no_store` | It asserts `response.headers["cache-control"] == "no-store"` on the `GET /api/time` response | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

Not verifiable locally: there is no edge cache locally. Run by a human on the deployed environment (the item's `to_verify` step). Use GET; HEAD is not served by this route.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -si https://<deployed-host>/api/time` | Status 200 and a `cache-control: no-store` header. If a CDN status header such as `x-cache` or `cf-cache-status` is present, it does not read `HIT` | [ ] Pass [ ] Fail |
| 6 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies are printed and their `now` values differ (the second is about one second later) | [ ] Pass [ ] Fail |
| 7 | Repeat step 6 once more, waiting a few seconds between the two calls | The `now` values again differ, so the first result was not a cache miss by chance | [ ] Pass [ ] Fail |

### Edge case: a non-GET method is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | With the local backend running, run `curl -si -X POST http://localhost:8000/api/time` | The status line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
