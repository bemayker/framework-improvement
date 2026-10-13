# UAT script, BUG-01: Server time is served stale from the edge cache

Tester: ______________  Date: ______________  Environment: ______________

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`

Prerequisites: backend running locally (`docker compose up -d` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8010`).

- [ ] 1. Run `curl -si http://localhost:8010/api/time`. Expected: status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a JSON body with `now` ending in `Z` and `timezone` equal to `UTC`.
- [ ] 2. Run the same command a second time. Expected: the `cache-control: no-store` line is present again and `now` is later than in step 1.

## Criterion 2: A test asserts the header on the response

Prerequisites: repo checked out on the BUG-01 branch, uv installed.

- [ ] 1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py -v`. Expected: output ends with `0 failed` and lists `test_get_time_sets_cache_control_no_store` among the run tests.
- [ ] 2. Open `backend/tests/integration/test_server_time_integration.py`. Expected: a test asserts `response.headers["cache-control"] == "no-store"` on `GET /api/time`.

## Criterion 3: After deploy, the reproduction returns two different values

Not verifiable locally: requires the deployed host behind its CDN. Human check on the deployed environment, after merge.

Prerequisites: the fix merged and deployed; the deployed host name known (replace `<deployed-host>`).

- [ ] 1. Run `curl -si https://<deployed-host>/api/time`. Expected: `cache-control: no-store` among the headers; note the `now` value.
- [ ] 2. Wait one second, run `curl -s https://<deployed-host>/api/time` again. Expected: `now` differs from step 1 (later by about one second).
- [ ] 3. Optional: repeat steps 1 and 2 three times. Expected: every pair of `now` values differs. Any identical pair means the CDN still caches and the item fails verification.

## Summary

| # | Criterion | Result (Pass/Fail) | Notes |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | | |
| 2 | A test asserts the header on the response | | |
| 3 | Deployed reproduction returns two different values | | |
