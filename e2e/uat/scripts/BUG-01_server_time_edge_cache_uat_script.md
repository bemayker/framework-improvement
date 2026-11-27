# UAT Script: BUG-01 Server time is not cached by the edge

No criterion is verifiable through the UI: `GET /api/time` has no frontend consumer, so the observable check is the HTTP response itself, read with `curl`. Always use GET (`curl -si`), never HEAD (`curl -I`): the route declares GET only and a HEAD returns 405.

## Prerequisites

- Repository checked out locally on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- `uv` installed and a terminal with `curl`.
- Criteria 1 and 2: the backend running locally, for example `uv run --directory backend uvicorn app.main:app --port 8000` (no database needed for this route).
- Criterion 3 only: the merged fix deployed, and the deployed API host known to the tester (replace `<deployed-host>`). The host is not recorded in `docs/DEVELOPMENT.md` under `## Test environments`.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | The status line reads `HTTP/1.1 200 OK`, the headers include `cache-control: no-store`, and the body looks like `{"now":"2026-11-27T17:05:12.345678+00:00","timezone":"UTC"}` | [ ] Pass [ ] Fail |
| 2 | Run `curl -si -X POST http://localhost:8000/api/time` (edge case) | The status line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The run passes: its summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 4 | Open `backend/tests/integration/test_server_time_integration.py` | The test `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (human, deployed environment)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -si https://<deployed-host>/api/time` and note the `now` value | Status 200, header `cache-control: no-store`, a body with a `now` value | [ ] Pass [ ] Fail |
| 6 | Wait one second, then run `curl -si https://<deployed-host>/api/time` again | Status 200, header `cache-control: no-store`, and a `now` value later than the one noted in step 5 (the two differ) | [ ] Pass [ ] Fail |
| 7 | If the two values are identical or the header is missing | The item fails verification: record both full responses on the item | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
