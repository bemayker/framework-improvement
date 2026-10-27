# UAT script: BUG-01 Server time is not stored by edge caches

No criterion is verifiable through the UI: the observable check is the HTTP response, read with `curl`. Criterion 3 can only be verified by a human on the deployed environment, after the fix is deployed.

## Prerequisites

- Repository checked out on branch `feature/BUG-01-server-time-edge-cache`, `uv` installed, a terminal with `curl`.
- Criteria 1 and 2: backend running locally at `http://localhost:8000`, for example `uv run --directory backend uvicorn app.main:app --port 8000` (no database needed for this endpoint), or the compose stack.
- Criterion 3: the BUG-01 change is merged and deployed, and you know the deployed host name (`<deployed-host>`).

## Steps

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -sS -D - -o /dev/null http://localhost:8000/api/time` | Status line reads `200 OK` and the header block contains `cache-control: no-store` | [ ] Pass [ ] Fail |
| 2 | Run `curl -sS http://localhost:8000/api/time` | Body is `{"now":"<ISO 8601 timestamp ending +00:00>","timezone":"UTC"}`, exactly those two keys | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8000/api/time` in a browser with DevTools, Network tab, click the `time` request, Headers panel | Response Headers lists `cache-control: no-store` | [ ] Pass [ ] Fail |

### Criterion 2: A test asserts the header on the response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | From the repository root run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py` | `0 failed`; the run includes `test_get_time_response_carries_cache_control_no_store` and `test_get_time_cache_control_is_set_on_every_request` | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_server_time_integration.py` and read `test_get_time_response_carries_cache_control_no_store` | It asserts the response header `cache-control` equals exactly `no-store` | [ ] Pass [ ] Fail |

### Edge case: the header is present on every request

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -sS -D - -o /dev/null http://localhost:8000/api/time` twice in a row | Both responses contain `cache-control: no-store` | [ ] Pass [ ] Fail |

### Criterion 3 (post-deploy, human): the reproduction returns two different values

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -sS -D - -o /dev/null https://<deployed-host>/api/time` | Header block contains `cache-control: no-store`; a CDN cache status header such as `x-cache` or `cf-cache-status` reads a miss, bypass or dynamic value, not a hit | [ ] Pass [ ] Fail |
| 8 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies are printed and their `now` values differ, the second about one second later | [ ] Pass [ ] Fail |
| 9 | Repeat step 8 once more | The `now` values differ again. If identical, the CDN may still hold an entry cached before the deploy: purge the CDN cache for `/api/time`, repeat step 8 and record the result on the item | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 (5 local required, 1 local edge case, 3 post-deploy) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
