# UAT Script, BUG-01: Server time is served stale from the edge cache

This item has no UI: every check below reads an HTTP response or a test run.

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the stack is running locally (`docker compose up -d --build` from the repository root), backend on `http://localhost:8010`.
1. In a terminal, run `curl -si http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK`, the headers include `cache-control: no-store`, and the body looks like `{"now":"2026-11-05T18:04:08.123456Z","timezone":"UTC"}`.
2. Check the `now` value from step 1 → it ends in `Z` (an explicit UTC offset), and `timezone` is `UTC`.
3. Run `curl -si -X POST http://localhost:8010/api/time` → `HTTP/1.1 405 Method Not Allowed`.

## Criterion 2: A test asserts the header on the response
Prerequisites: a checkout of the feature branch with `uv` installed.
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the run ends with `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named for the header (for example `test_get_time_sets_cache_control_no_store`) asserts `response.headers["cache-control"] == "no-store"`.

## Criterion 3: After deploy, the reproduction returns two different values
Prerequisites: this item is merged and deployed; you know the deployed host (replace `deployed-host` below). This is the item's to-verify step, done by a human on the deployed environment only.
1. Run `curl -si https://deployed-host/api/time` → 200, headers include `cache-control: no-store`; note the `now` value (for example `2026-11-05T18:10:00.100000Z`).
2. Wait one second, then run `curl -s https://deployed-host/api/time` again → a `now` value one second or more later than step 1's (for example `2026-11-05T18:10:01.250000Z`), not identical to it.
3. Check the second response's headers for any CDN cache-hit marker (for example `x-cache: HIT` or a non-zero `age:`) → none is present; a `HIT` means the CDN still caches and the item is not verified.
