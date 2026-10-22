# UAT Script, BUG-01: Server time is not served stale from the edge cache

No criterion is verifiable through a UI; each check is a response header, a body value or a test run.

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the backend is running locally (`docker compose up` from the repo root, API on the published backend port, 8010 unless the handover reports another).
1. Run `curl -sS -D - -o /dev/null http://localhost:8010/api/time` -> headers include `HTTP/1.1 200 OK` and `cache-control: no-store`.
2. Run `curl -sS http://localhost:8010/api/time` -> JSON with exactly `now` (ending `+00:00`) and `timezone` equal to `UTC`.

## Criterion 2: A test asserts the header on the response
Prerequisites: a checkout of the branch, uv installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_unit.py` -> ends with `0 failed`, and the new header test is in the integration file.
2. Open `backend/tests/integration/test_server_time_integration.py` -> a test sends `GET /api/time` and asserts `Cache-Control` equals `no-store`.

## Criterion 3: After deploy, the reproduction returns two different values (human, deployed only)
Prerequisites: the merge is deployed; the deployed host name is known (`<deployed-host>`).
1. Run `curl -sS -D - -o /dev/null https://<deployed-host>/api/time` -> headers include `cache-control: no-store` (a missing header means the deploy has not landed or the CDN strips it).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` -> two bodies whose `now` values differ, the second about one second later.
3. Repeat step 2 once more -> the `now` values differ again (rules out a single lucky cache miss).
