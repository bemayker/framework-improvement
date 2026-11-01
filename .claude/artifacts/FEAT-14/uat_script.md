# UAT Script: FEAT-14 Verify510 endpoint

Neither acceptance criterion is verifiable through the UI: no frontend consumes `GET /api/verify510`, so the observable checks are the HTTP response (read with `curl`) and the test run's own output.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/FEAT-14-verify-mdf-510-backend-get-api-verify510` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- A terminal with `curl`.
- Criterion 2 only: `uv` installed on the host and the backend dependencies synced. No database is needed for that test.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
   The build makes the backend image carry this branch's `main.py`.
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/verify510` returns HTTP 200 with the JSON body `{"status": "ok"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/verify510` | The first response line reads `HTTP/1.1 200 OK` and the `content-type` header reads `application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly `{"status":"ok"}`, with no other field | [ ] Pass [ ] Fail |
| 3 | Edge case: run `curl -i -X POST http://localhost:8010/api/verify510` | The first response line reads `HTTP/1.1 405 Method Not Allowed` (the route is GET only) | [ ] Pass [ ] Fail |

### Criterion 2: the endpoint is covered by one pytest test, which passes

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | From the repo root, run `uv run --directory backend pytest -q -v tests/integration/test_verify510_integration.py` | The run lists `test_get_verify510_returns_200_with_status_ok` as its only test and the summary reports `0 failed` | [ ] Pass [ ] Fail |
| 5 | Open `backend/tests/integration/test_verify510_integration.py` | It holds that one test function, which requests `/api/verify510` and asserts both the 200 status and the exact `{"status": "ok"}` body | [ ] Pass [ ] Fail |
| 6 | Run the project's test gate, `uv run --directory backend pytest -q && npm --prefix frontend test` | Both the backend suite and the frontend Vitest suite report `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 6 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
