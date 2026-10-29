# UAT Script: FEAT-11 API ping count

None of the four acceptance criteria is verifiable through the UI: the feature adds no frontend. The observable checks are the HTTP responses, the code and OpenAPI listing, and the test run.

## Prerequisites

- Repository checked out locally, on branch `feature/FEAT-11-api-ping-count` (or, once merged, on `main`).
- A terminal with `curl`, `docker` and `uv` installed.
- No database is required: neither ping route touches it.

## Test Environment Setup

From the repository root run `docker compose up -d --build`. The backend is published on host port `8010` (from `docker-compose.yml`).

The count is held in memory and starts at 0 each time the backend starts. Before each criterion that expects a count from zero, run `docker compose restart backend` and wait until `curl http://localhost:8010/api/ping/count` answers.

## Steps

### Criterion 1: `GET /api/ping/count` answers HTTP 200 with `{"count": N}`

Prerequisite: no ping sent since the backend started (run `docker compose restart backend`).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i http://localhost:8010/api/ping/count` | The first response line reads `HTTP/1.1 200 OK` and the body is exactly `{"count":0}` | [ ] Pass [ ] Fail |
| 2 | Run `curl http://localhost:8010/api/ping/count` again | The body is still `{"count":0}` (a count request is not a ping) | [ ] Pass [ ] Fail |
| 3 | Run `curl http://localhost:8010/api/ping`, then `curl http://localhost:8010/api/ping/count` | The body of the count request is `{"count":1}` | [ ] Pass [ ] Fail |
| 4 | Edge case: run `curl -i -X POST http://localhost:8010/api/ping/count` | The first response line reads `HTTP/1.1 405 Method Not Allowed` | [ ] Pass [ ] Fail |

### Criterion 2: the route is added in `backend/app/ping.py`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Open `backend/app/ping.py` | It defines `GET /ping/count` on the `/api` router, returning `PingCountResponse` | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/services/ping_service.py` | It defines `PingCounter`; `ping.py` holds no counter variable of its own | [ ] Pass [ ] Fail |
| 7 | Open `http://localhost:8010/docs` | The `ping` section lists both `GET /api/ping` and `GET /api/ping/count` | [ ] Pass [ ] Fail |

### Criterion 3: two pings then count gives 2

Prerequisite: run `docker compose restart backend` and wait until the backend answers.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Run `curl http://localhost:8010/api/ping` | The body is `{"status":"ok"}` | [ ] Pass [ ] Fail |
| 9 | Run `curl http://localhost:8010/api/ping` again | The body is `{"status":"ok"}` | [ ] Pass [ ] Fail |
| 10 | Run `curl http://localhost:8010/api/ping/count` | The body is exactly `{"count":2}` | [ ] Pass [ ] Fail |
| 11 | Run `docker compose restart backend`, wait until `curl http://localhost:8010/api/ping/count` answers | The body is `{"count":0}` (the count is since start) | [ ] Pass [ ] Fail |

### Criterion 4: a pytest test asserts criterion 3

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | From the repository root, run `uv run --directory backend pytest -q tests/integration/test_ping_integration.py tests/unit/test_ping_service_unit.py tests/unit/test_main_unit.py` | The run ends with `0 failed`, and the test that sends two pings and asserts `{"count": 2}` is among the tests run | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
