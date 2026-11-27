# UAT Script: BUG-01 Server time is not served stale from the edge cache

None of the three criteria is verifiable through a UI: the item has no frontend, so the observable check is the HTTP response itself, read with `curl`. Criterion 3 can only be verified on the deployed environment, because no edge cache exists locally.

## Prerequisites

- Repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- `uv` installed and the backend dependencies synced (`uv sync --directory backend`).
- Port `8000` free on the host. No database is needed for `/api/time`.
- A terminal with `curl`.
- Criterion 3 only: the BUG-01 merge is deployed behind the CDN, and you know the deployed host name. `docs/DEVELOPMENT.md` Test environments names no host, so use the host the team deploys to.

## Test Environment Setup

1. From the repository root, start the backend (leave it running in its own terminal, stop it with Ctrl-C when done):
   ```bash
   uv run --directory backend uvicorn app.main:app --port 8000
   ```

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | The first response line reads `HTTP/1.1 200 OK` and the headers include `cache-control: no-store` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Looks like `{"now":"2026-11-27T15:30:01.123456+00:00","timezone":"UTC"}`: `now` ends in `+00:00` and `timezone` is `UTC` | [ ] Pass [ ] Fail |
| 3 | Run `curl -si http://localhost:8000/api/version` | The response carries no `cache-control` header: the directive is scoped to `/api/time` only | [ ] Pass [ ] Fail |

### Criterion 2: a test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_time_sets_cache_control_no_store` | It asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] Pass [ ] Fail |

### Criterion 3: after deploy, the reproduction returns two different values (deployed environment, human step)

Use `GET` (`curl -si`), never `HEAD` (`curl -sI`): a CDN may answer a HEAD request from a different cache entry than a GET, so a HEAD check proves nothing about the GET responses the defect is about.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -si https://<deployed-host>/api/time ; sleep 1 ; curl -si https://<deployed-host>/api/time` | Two responses print, both with `cache-control: no-store`, and their `now` values differ (the second is about one second later). Any CDN cache-status header (for example `cf-cache-status` or `x-cache`) does not read `HIT` | [ ] Pass [ ] Fail |
| 7 | If step 6 holds, remove the `mayker:to-verify` label from the item | The label is gone. If the two `now` values were identical, the item stays in verification and the CDN's own cache rules are the next thing to inspect | [ ] Pass [ ] Fail |

### Edge case: a POST to the time endpoint

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Against the local backend, run `curl -si -X POST http://localhost:8000/api/time` | The first response line reads `HTTP/1.1 405 Method Not Allowed` and the body carries no `now` field | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 (steps 6 and 7 on the deployed environment) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
