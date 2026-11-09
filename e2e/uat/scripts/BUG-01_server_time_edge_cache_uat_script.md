# UAT Script: BUG-01 Server time is never served stale from the edge cache

None of the criteria is verifiable through a UI: the item has no frontend, so the observable check is the HTTP response itself, read with `curl`. Criterion 3 can only be verified on the deployed environment, where the CDN sits in front of the API.

## Prerequisites

- Repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).
- A terminal with `curl`.
- Criterion 3 only: the fix is merged and deployed, and you know the deployed API host (`<deployed-host>`).

## Test Environment Setup

1. From the repository root, start the backend (this endpoint needs no database, so `DATABASE_URL` may be unset):
   ```bash
   uv run --directory backend uvicorn app.main:app --port 8000
   ```
2. Leave it running in its own terminal and use a second terminal for the steps below.

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i http://localhost:8000/api/time` | The first response line reads `HTTP/1.1 200 OK`, and a header line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 2 | Read the body of the same response | JSON of the form `{"now":"2026-11-09T20:48:23.512345+00:00","timezone":"UTC"}`: `now` ends in `+00:00` and `timezone` is `UTC` | [ ] Pass [ ] Fail |
| 3 | Edge case: run `curl -i -X POST http://localhost:8000/api/time` | `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` | One test asserts the response's `cache-control` header equals `no-store` | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

Not verifiable locally: the edge cache exists only on the deployed environment, and locally both calls differ even without the fix. Verify by hand after deploy. Both requests are GETs.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time` | `cache-control: no-store` is present in the headers that reach you through the CDN (an `age:` header, if the CDN sends one, is absent or `0`) | [ ] Pass [ ] Fail |
| 7 | Wait one second, then run `curl -si https://<deployed-host>/api/time` again | The response again carries `cache-control: no-store`, and its `now` value differs from step 6's by about one second (e.g. `...T20:48:23.51...+00:00` then `...T20:48:24.53...+00:00`). Identical `now` values mean the edge cache is still serving the response and the fix is not verified | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
