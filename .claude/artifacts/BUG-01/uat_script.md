# UAT Script: BUG-01 Server time is served stale from the edge cache

None of the three criteria can be verified through the UI: `GET /api/time` has no screen, so every step is an HTTP or test-run check executed from a terminal at the repository root. Criterion 3 is deployed-only: the edge cache exists only on the deployed environment.

## Prerequisites

- Repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- `uv` installed and backend dependencies synced (`uv sync --directory backend`).
- Nothing listening on port 8000.
- No database is needed: the app starts without `DATABASE_URL` and only logs a warning.
- A terminal with `curl`.
- Criterion 3 only: the PR has merged, the deployed environment has picked up the new build, and you know the deployed API host (no row exists yet in `docs/DEVELOPMENT.md` under `## Test environments`, so take it from whoever operates the deployment).

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Start the API: `uv run --directory backend uvicorn app.main:app --port 8000` | The log shows `Uvicorn running on http://127.0.0.1:8000` | [ ] Pass [ ] Fail |
| 2 | In a second terminal run `curl -si http://localhost:8000/api/time` | The status line is `HTTP/1.1 200 OK` and a header line reads `cache-control: no-store` | [ ] Pass [ ] Fail |
| 3 | Read the body printed by the same call | `{"now":"<date>T<time>+00:00","timezone":"UTC"}`, with `now` ending in `+00:00` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` (no failures and no errors) | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_server_time_sets_cache_control_no_store` | It asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` (use GET; the route answers HEAD with 405) | Status 200 and a `cache-control: no-store` header line. If the CDN rewrites headers the edge may add its own; the value from the origin must still be `no-store` | [ ] Pass [ ] Fail |
| 7 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ, by about one second | [ ] Pass [ ] Fail |

If both values in step 7 are identical, the edge still caches the route: do not remove the `mayker:to-verify` label; run `/fix BUG-01`. If they differ, remove the `mayker:to-verify` label from the item, which marks it verified.

### Edge case: a non-GET method is rejected

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | With the API from step 1 still running, run `curl -si -X POST http://localhost:8000/api/time` | The status line is `HTTP/1.1 405 Method Not Allowed`. Stop the server with Ctrl-C afterwards | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 (steps 6 and 7 on the deployed environment only) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
