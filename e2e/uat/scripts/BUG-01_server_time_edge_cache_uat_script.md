# UAT Script, BUG-01: Server time is served stale from the edge cache

Manual acceptance script. Criterion 3 can only be verified by a human on the deployed environment.

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the local stack is running (`docker compose up -d` from the repository root), backend reachable on http://localhost:8010.

| Step | Action | Expected result | Pass/Fail |
|---|---|---|---|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/time` | The status line reads `HTTP/1.1 200 OK` | |
| 2 | Read the response headers of the same output | A line `cache-control: no-store` is present (header names may be lowercase) | |
| 3 | Read the body of the same output | JSON shaped like `{"now":"2026-10-29T19:36:02.123456+00:00","timezone":"UTC"}`, with `now` ending in `+00:00` | |
| 4 | Run `curl -i http://localhost:8010/api/time` again | The header `cache-control: no-store` is present again and `now` is later than in step 3 | |

## Criterion 2: A test asserts the header on the response
Not a UI behaviour; the observable check is the test run.

| Step | Action | Expected result | Pass/Fail |
|---|---|---|---|
| 1 | From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | |
| 2 | Open `backend/tests/integration/test_server_time_integration.py` | A test asserts `response.headers["Cache-Control"] == "no-store"` on a `GET /api/time` response | |

## Criterion 3: After deploy, the reproduction returns two different values
Not verifiable locally: there is no edge cache in the local stack, so both calls already differ there. Verify on the deployed environment after the fix is merged and deployed.
Prerequisites: the merged fix is deployed; you know the deployed API host (`<deployed-host>`).

| Step | Action | Expected result | Pass/Fail |
|---|---|---|---|
| 1 | Run `curl -si https://<deployed-host>/api/time` | Status 200 and header `cache-control: no-store` in the output | |
| 2 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ (the second about one second later) | |
| 3 | If the CDN adds an age or cache-status header (for example `age` or `cf-cache-status`), read it on the step 1 output | It does not report a cache hit | |
| 4 | Record the result on the work item | On success it leaves `to_verify` | |
