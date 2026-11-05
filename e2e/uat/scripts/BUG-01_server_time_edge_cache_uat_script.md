# UAT Script: BUG-01, Server time is served stale from the edge cache

Criteria 1 and 2 are verified locally. Criterion 3 is deployed-only: it runs after merge on the deployed environment, while the item carries `mayker:to-verify`.

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally (`uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this route.
1. Run `curl -si http://localhost:8000/api/time` -> the status line reads `HTTP/1.1 200 OK`.
2. Read the response headers of that output -> a line `cache-control: no-store` is present (header names are case-insensitive).
3. Read the body -> JSON of the form `{"now":"2026-11-05T13:20:24.123456Z","timezone":"UTC"}`, where `now` ends in `Z` or `+00:00` and `timezone` is `UTC`.
4. Run `curl -si -X POST http://localhost:8000/api/time` -> status `405 Method Not Allowed`.

## Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out on the BUG-01 branch, `uv` installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` -> the run ends with `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` -> a test asserts the `cache-control` header equals `no-store` on the `GET /api/time` response.

## Criterion 3: After deploy, the reproduction returns two different values (deployed environment only)
Not reproducible locally (there is no edge cache locally); these steps pass before and after the fix when run locally, so run them against the deployed environment, performed by a human after merge.
Prerequisites: the merge is deployed; you know the deployed API host (`docs/DEVELOPMENT.md` -> Test environments has no row yet, so take the host from whoever operates the deployment).
1. Run `curl -si https://<deployed-host>/api/time` -> the response carries `Cache-Control: no-store`, with no `age:` header greater than 0 and no CDN cache-hit marker (such as `x-cache: HIT` or `cf-cache-status: HIT`).
2. Run `curl -s https://<deployed-host>/api/time`, wait one second, and run it again.
3. Expected: the two `now` values differ (the edge cache no longer serves a stale response). Before the fix they were identical.
4. Pass: remove the `mayker:to-verify` tag from BUG-01. Fail: run `/fix BUG-01` with the observed responses.
