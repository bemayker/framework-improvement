# UAT Script: FEAT-10 API ping returns ok

None of the three acceptance criteria is verifiable through the UI: the feature adds no frontend. The observable checks are the HTTP response, the code and OpenAPI listing, and the test run.

## Prerequisites

- Repository checked out locally, on branch `feature/FEAT-10-api-ping-returns-ok` (or, once merged, on `main`).
- A terminal with `curl`, and `uv` installed.
- No database is required: the ping route does not touch it.

## Test Environment Setup

Start the backend by either route:

1. With Docker: from the repository root run `docker compose up -d --build`. The backend is published on host port `8010` (from `docker-compose.yml`).
2. Without Docker: run `uv run --directory backend uvicorn app.main:create_app --factory --port 8000`. The backend is on port `8000`.

The steps below use `http://localhost:8010`; substitute `8000` if you used route 2.

## Steps

### Criterion 1: `GET /api/ping` answers HTTP 200 with `{"status": "ok"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/ping` | The first response line reads `HTTP/1.1 200 OK` and the body is exactly `{"status":"ok"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:8010/api/ping` in a browser | The page shows `{"status":"ok"}` | [ ] Pass [ ] Fail |
| 3 | Edge case: run `curl -i -X POST http://localhost:8010/api/ping` | The first response line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: the route lives in `backend/app/ping.py` and is registered in `main.py`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `backend/app/ping.py` | It defines the `/api` router with the `GET /ping` handler | [ ] Pass [ ] Fail |
| 5 | Open `backend/app/main.py` | `create_app()` calls `app.include_router(ping_router)` | [ ] Pass [ ] Fail |
| 6 | Open `http://localhost:8010/docs` | The `ping` section lists `GET /api/ping` | [ ] Pass [ ] Fail |

### Criterion 3: a pytest test asserts criterion 1

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | From the repository root, run `uv run --directory backend pytest -q tests/integration/test_ping_integration.py tests/unit/test_main_unit.py` | The run ends with `0 failed`, and the test asserting status 200 and body `{"status": "ok"}` is among the tests run | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
