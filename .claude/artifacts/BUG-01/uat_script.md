# UAT Script, BUG-01: Server time is served stale from the edge cache

Prerequisites (criteria 1 and 2): Docker running; the stack up via `docker compose up -d --build` from the repository root; `docker compose ps` shows the `backend` service running; a terminal with `curl`; the backend is published on the host at `http://localhost:8010`. This fix has no UI, so every check is an HTTP or terminal check. Criterion 3 is different: it can only be checked on the deployed environment, after deploy.

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
1. Run `curl -sS -D - -o /dev/null http://localhost:8010/api/time`. Expected: the status line reads `200 OK` and the header block contains the line `cache-control: no-store`.
2. Run `curl -sS http://localhost:8010/api/time`. Expected: the body is still `{"now":"<ISO 8601 ending +00:00>","timezone":"UTC"}`, unchanged from FEAT-1.
3. Open `http://localhost:8010/api/time` in a browser with DevTools open, Network tab, click the `time` request, Headers panel. Expected: Response Headers lists `cache-control: no-store`.

## Criterion 2: A test asserts the header on the response
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py`. Expected: `0 failed`, and the run includes `test_get_time_response_carries_cache_control_no_store` and `test_get_time_cache_control_is_set_on_every_request`.
2. Open `backend/tests/integration/test_server_time_integration.py` and read `test_get_time_response_carries_cache_control_no_store`. Expected: it asserts the response header `cache-control` equals exactly `no-store`.

## Criterion 3: After deploy, the reproduction returns two different values (DEPLOYED-ONLY, human check after deploy)
This criterion cannot be verified locally or by any test tier: the stale value comes from the CDN in front of the deployed API, which exists only on the deployed environment. The integration header assertion covers the cause; this block checks the effect. Do not mark it verified until it has been run against the deployed host.

Prerequisites: the BUG-01 change is merged and deployed; you know the deployed host name (`<deployed-host>`).
1. Run `curl -sS -D - -o /dev/null https://<deployed-host>/api/time`. Expected: the header block contains `cache-control: no-store`. If the CDN adds its own cache status header (such as `x-cache` or `cf-cache-status`), it reads a miss, bypass or dynamic value, not a hit.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`. Expected: two JSON bodies are printed and their `now` values differ, the second about one second later than the first.
3. Repeat step 2 once more. Expected: the `now` values differ again. If they are identical, the CDN may still hold an entry cached before the deploy: purge the CDN cache for `/api/time`, repeat step 2, and record the result on the item.
