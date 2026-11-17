# UAT Script, BUG-01: Server time is not stored by the edge cache

Tester: ____________  Date: ____________

Use GET requests only (`curl -si`, `curl -s`). A HEAD request (`curl -I`) gets 405 from this route and is not a valid check.

## Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally on port 8000 (for example `uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this endpoint.

| Step | Action | Expected | Result |
|---|---|---|---|
| 1 | Run `curl -si http://localhost:8000/api/time` | Status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a body like `{"now":"2026-11-17T19:45:12.345678Z","timezone":"UTC"}` | PASS / FAIL |
| 2 | Check the `now` value | It ends in `Z` or `+00:00` (an explicit UTC offset), never a bare timestamp | PASS / FAIL |

## Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out on the BUG-01 branch, uv installed.

| Step | Action | Expected | Result |
|---|---|---|---|
| 1 | Open `backend/tests/integration/test_server_time_integration.py` | It contains `test_get_time_sets_cache_control_no_store`, which asserts the response header `cache-control` equals `no-store` | PASS / FAIL |
| 2 | Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` | The summary line reports no failed or errored test, and the command exits 0 | PASS / FAIL |

## Criterion 3: After deploy, the reproduction returns two different values
This criterion cannot be verified locally (no edge cache exists there). It is a human check on the deployed host, after the merge has deployed.

| Step | Action | Expected | Result |
|---|---|---|---|
| 1 | Run `curl -si https://<deployed-host>/api/time` | Status 200 and a `cache-control: no-store` header as served through the CDN; any `age` or CDN cache-status header does not report a cache hit | PASS / FAIL |
| 2 | Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` | Two JSON bodies whose `now` values differ, by roughly one second | PASS / FAIL |
| 3 | Repeat step 2 once more | The values differ again, confirming the response is not stored at the edge | PASS / FAIL |

## Edge case: POST is rejected
Prerequisites: as Criterion 1.

| Step | Action | Expected | Result |
|---|---|---|---|
| 1 | Run `curl -si -X POST http://localhost:8000/api/time` | Status line `HTTP/1.1 405 Method Not Allowed` | PASS / FAIL |
