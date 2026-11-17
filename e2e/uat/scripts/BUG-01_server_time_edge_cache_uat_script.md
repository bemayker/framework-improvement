# UAT Script: BUG-01 Server time is not served stale from the edge cache

None of the acceptance criteria is verifiable through the UI: the item has no frontend, so the observable checks are the HTTP response headers read with `curl`, the test run, and, for criterion 3, the deployed reproduction. Criterion 3 can only be verified by a human on the deployed environment, because no local environment has an edge cache.

## Prerequisites

- Criteria 1 and 2: repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`), `uv` installed, and a terminal with `curl`.
- Criterion 1: the backend running locally, either with `docker compose up` from the repository root or with `uv run --directory backend uvicorn app.main:app --port 8000`. The steps below use `http://localhost:8000`; substitute the host port your run publishes.
- Criterion 3: the merge is deployed, and you know the deployed API host (`<deployed-host>`).

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -si http://localhost:8000/api/time` | Status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a body like `{"now":"2026-11-17T01:23:45.678901Z","timezone":"UTC"}` | [ ] Pass [ ] Fail |
| 2 | Check the `now` value in the body | It ends in `Z` or `+00:00` (explicit offset, never a bare time) | [ ] Pass [ ] Fail |
| 3 | Run `curl -si -X POST http://localhost:8000/api/time` (edge case) | Status `405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | `test_get_time_returns_cache_control_no_store` asserts the response's `Cache-Control` header equals `no-store` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

Deployed environment only, run by a human after the merge reaches it. Use `GET` requests: a `HEAD` request gets `405` from this route, so never use `curl -I`.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | On the deployed environment, run `curl -si https://<deployed-host>/api/time` | `200`, and the response carries the header `Cache-Control: no-store`. A CDN may add its own headers such as `age` or `x-cache`: `age` should be absent or 0, and `x-cache` should not read HIT | [ ] Pass [ ] Fail |
| 7 | Wait one second and run the same `curl -si https://<deployed-host>/api/time` request again | The two responses carry two different `now` values, about one second apart (no stale value served from the edge cache) | [ ] Pass [ ] Fail |
| 8 | Repeat steps 6 and 7 twice more | Every pair differs. An identical pair means the edge still caches the response: the item fails verification | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 (5 local, 3 on the deployed environment) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
