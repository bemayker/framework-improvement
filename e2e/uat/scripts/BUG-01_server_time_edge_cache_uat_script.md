# UAT Script: BUG-01 Server time is served stale from the edge cache

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: stack running from the repository root with `docker compose up -d --build backend`; backend on `http://localhost:8010`. No UI; the check is the response header.
1. Run `curl -si http://localhost:8010/api/time` (a GET). Expected: status line `HTTP/1.1 200 OK` and a `cache-control: no-store` header.
2. Read the body. Expected: JSON with `now` ending in `+00:00` and `timezone` equal to `"UTC"`.
3. Run `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8010/api/time`. Expected: `405`.

## Criterion 2: a test asserts the header on the response
Prerequisites: `uv` installed; run from the repository root.
1. Open `backend/tests/integration/test_server_time_integration.py`. Expected: `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`.
2. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py`. Expected: `0 failed`, including that test.

## Criterion 3: after deploy, the reproduction returns two different values
Prerequisites: the fix is merged and deployed; the deployed host name is known (replace `<deployed-host>`). Not verifiable locally: the edge cache exists only on the deployed environment.
1. On the deployed environment, send `curl -si https://<deployed-host>/api/time` (a GET; HEAD is not routed). Expected: the response carries `Cache-Control: no-store` and no CDN cache-hit header (for example `x-cache: HIT` or `cf-cache-status: HIT`).
2. Wait one second and send the same request again.
3. Confirm the two responses carry different `now` values (the second later than the first).
4. Remove the `mayker:to-verify` label from the item once both checks hold.
