# UAT Script, BUG-01: Server time is served stale from the edge cache

Criteria 1 and 2 have no UI; the observable checks are the response header and the test run. Criterion 3 is a human check on the deployed environment after merge.

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the app stack is running locally (`docker compose up -d --build` at the repo root), backend on `http://localhost:8010`.
1. In a terminal, run `curl -si http://localhost:8010/api/time` -> the status line reads `HTTP/1.1 200 OK`.
2. Read the headers of that output -> a `cache-control: no-store` line is present (header names are case-insensitive).
3. Read the body of that output -> JSON with exactly two keys, `now` ending in `+00:00` (for example `2026-10-27T21:40:12.345678+00:00`) and `timezone` equal to `UTC`.

## Criterion 2: A test asserts the header on the response
Prerequisites: a checkout of the branch with `uv` installed.
1. From the repo root run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` -> `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` -> a test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

## Criterion 3: After deploy, the reproduction returns two different values
This cannot be verified locally (there is no edge cache) or through any UI.
Prerequisites: the merged commit is deployed; you know the deployed host (replace `<deployed-host>` below).
1. On the deployed environment, run `curl -si https://<deployed-host>/api/time` -> status 200, and the headers include `cache-control: no-store` (a CDN may add its own headers such as `age` or `x-cache`; an `x-cache: HIT` here is the defect).
2. Wait one second, then run the same request again, or run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` -> both responses carry `Cache-Control: no-store`, and the two `now` values differ (the second is later than the first). A repeated identical `now` means the edge cache still serves a stale copy.
3. If both checks hold, remove the `mayker:to-verify` tag from the ClickUp item to mark it verified; if the two `now` values are identical, leave the tag and reopen the item with the curl output attached.

## Edge case: write method
1. Run `curl -si -X POST http://localhost:8010/api/time` -> status 405.
