# UAT Script: BUG-01 Server time is not cached at the edge

No acceptance criterion involves the UI: `GET /api/time` is read directly with `curl`. Criterion 3 can only be verified on the deployed environment, because locally nothing caches the response and the two values always differ.

## Prerequisites

- Repository checked out locally, on branch `feature/BUG-01-server-time-edge-cache` (or, once merged, on `main`).
- A terminal with `curl`.
- Criteria 1 and 2: the backend running locally, either `docker compose up` from the repository root or `uv run --directory backend uvicorn app.main:app --port 8000` (the commands below assume port 8000; use the host port your run publishes). No database is needed for this endpoint.
- Criterion 2: `uv` installed.
- Criterion 3: the merged fix is deployed, and you know the deployed host (`docs/DEVELOPMENT.md` has no Test environments row for it yet).

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the headers of that response | A line `cache-control: no-store` is present | [ ] Pass [ ] Fail |
| 3 | Read the body | JSON of the shape `{"now":"2026-11-10T13:14:33.512301+00:00","timezone":"UTC"}`: `now` ends in `+00:00`, `timezone` is `UTC` | [ ] Pass [ ] Fail |
| 4 | Run the same command again | `cache-control: no-store` is present again and `now` is later than in step 3 | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |
| 6 | Open `backend/tests/integration/test_server_time_integration.py` | A test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values

Not verifiable locally. Verify on the deployed environment after the merged change is deployed. Use `GET`: a `HEAD` request gets 405 from this route.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -si https://<deployed-host>/api/time`, wait one second, then run it again | Both responses carry `Cache-Control: no-store`, and the two `now` values differ | [ ] Pass [ ] Fail |
| 8 | If the `now` values match | The edge cache is still serving the response: the defect is not fixed on the deployed environment, and the item stays open | [ ] Pass [ ] Fail |
| 9 | When step 7 passes, remove the `mayker:to-verify` tag from ClickUp task BUG-01 | The item is verified | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 (steps 8 and 9 apply only to the deployed check) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
