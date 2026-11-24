# UAT Script: TEST-06 Echo endpoint

This item has no UI: no frontend consumes `GET /api/echo`, so every step runs against the backend's HTTP API from a browser address bar or a terminal.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- Backend reachable at `http://localhost:8010`, the host port `docker-compose.yml` publishes (and `VITE_API_BASE_URL` in `.env.example` names). If the stack was rebuilt on other ports, use the port it reports instead.
- No root `.env` file is required; `docker-compose.yml` carries defaults for every variable it substitutes.
- A browser and a terminal with `curl`. The commands of steps 6 and 7 use brace expansion, so run them in bash or zsh.
- Step 11 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/echo?msg=hello` in a browser | The page shows exactly `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 2 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The status line carries code `200` (`HTTP/1.1 200 OK`) and the body is `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 3 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` | Status 200 and body `{"echo":"hello world"}`: the query string is decoded end to end | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -i "http://localhost:8010/api/echo"` | The status line carries code `422`. The body has a `detail` list whose entry has `"type":"missing"` and `"loc":["query","msg"]` | [ ] Pass [ ] Fail |
| 5 | Check the status and body of step 4 | The status is neither 500 nor 200, and no `echo` key appears in the body | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -i "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` (a `msg` of 201 letters `a`) | The status line carries code `422`. The body's `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] Pass [ ] Fail |
| 7 | Run the same command with `{1..200}` (exactly 200 letters `a`, the edge case) | Status 200 and body `{"echo":"aaa..."}` holding all 200 letters | [ ] Pass [ ] Fail |
| 8 | Open `http://localhost:8010/docs` and expand `GET /api/echo` | The `msg` parameter is marked required and shows a maximum length of 200: the bound is declared in the schema, not in handler code | [ ] Pass [ ] Fail |

### Criterion 4: the response body is a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | On `http://localhost:8010/docs`, expand `GET /api/echo` and look at the 200 response | Its schema is named `EchoResponse` with one required string field `echo` | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` | The schema file defines `class EchoResponse(BaseModel)` with `echo: str`. The router declares `response_model=EchoResponse` and returns an `EchoResponse`, not a dict | [ ] Pass [ ] Fail |
| 11 | Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The run passes: no test failed or errored, and the command exits 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
