# UAT Script: BUG-01 Server time is not served stale from the edge cache

No criterion is verifiable through the UI: `GET /api/time` has no frontend consumer, so the observable check is the HTTP response, read with `curl`. Criterion 3 can only be checked on the deployed environment, because locally there is no CDN and the defect cannot be seen.

## Prerequisites

- A terminal with `curl`.
- Steps 1 to 3: repository checked out on branch `feature/BUG-01-server-time-edge-cache` (or `main` once merged), `uv` installed, and the backend running locally on port 8000, for example `uv run --directory backend uvicorn app.main:app --port 8000` (or `docker compose up backend`; adjust the port to the one the compose file publishes).
- Steps 4 to 7: the fix merged and deployed, and the deployed host name known (written `<deployed-host>` below).

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -si http://localhost:8000/api/time` | Status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a JSON body with a `now` timestamp and `"timezone":"UTC"` | [ ] Pass [ ] Fail |
| 2 | Run `curl -si -X POST http://localhost:8000/api/time` (edge case) | Status `405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` | The run ends with `0 failed`, and the header test in `test_server_time_integration.py` is among the passed tests | [ ] Pass [ ] Fail |

### Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)

This is a human check on the deployed environment, done once the fix is merged and deployed (the item's `to_verify` route). This repository does not hold the deployed environment, so a local run cannot replace it.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -si https://<deployed-host>/api/time` | `200`, with header `cache-control: no-store` present on the response as delivered through the CDN | [ ] Pass [ ] Fail |
| 5 | Wait one second, then run the same call again | A second `200` response, also carrying `cache-control: no-store` | [ ] Pass [ ] Fail |
| 6 | Compare the `now` values of the two responses (the single-line form is `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`) | The two JSON bodies carry different `now` values, the second about one second later | [ ] Pass [ ] Fail |
| 7 | Only if step 6 shows identical values: inspect the response headers for a CDN cache-hit header (for example `x-cache: HIT` or `cf-cache-status: HIT`) and record it on the work item | A cache-hit header points at a CDN rule overriding the origin header, so the fix is not reaching the edge. This is not a code defect in this change. Mark step 6 Fail | [ ] Pass [ ] Fail [ ] N/A |

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 (steps 4 to 7 deployed only; step 7 conditional) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
