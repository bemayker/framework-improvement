# UAT Script: TEST-06 Echo endpoint

None of the four criteria can be verified through the application UI: no frontend consumes `GET /api/echo`. Each criterion is verified over HTTP with `curl` against the running backend and, for criteria 3 and 4, in FastAPI's interactive docs page, the closest thing to a UI the endpoint has.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010`, the backend port `docker-compose.yml` publishes.
- A terminal with `curl`, and a browser for the `/docs` steps.
- `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`), for step 12 only.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The status line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 3 | Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"` | The body is `{"echo":"hello world"}`, showing the query string was decoded and returned unchanged | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -i "http://localhost:8010/api/echo"` | The status code is `422` (not 500, not 200). The reason phrase after it is whatever the server prints for 422, `Unprocessable Entity` or `Unprocessable Content` | [ ] Pass [ ] Fail |
| 5 | Read the response body | A JSON object with a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]` | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Open http://localhost:8010/docs in a browser, expand `GET /api/echo`, click "Try it out", paste a `msg` of exactly 200 `a` characters and click "Execute" | The response code shown is 200 and the body echoes the 200 characters | [ ] Pass [ ] Fail |
| 7 | Add one more `a` (201 characters) to `msg` and click "Execute" again | The response code shown is 422 and the body's first `detail` entry has `"type":"string_too_long"` and `"ctx":{"max_length":200}` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/echo.py` | The handler contains no length check | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/echo.py` | `msg` is declared with `Field(max_length=ECHO_MSG_MAX_LENGTH)` and `ECHO_MSG_MAX_LENGTH = 200` | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Open http://localhost:8010/docs and expand `GET /api/echo` | Under Responses, code 200 shows the schema `EchoResponse` with one string field `echo` | [ ] Pass [ ] Fail |
| 11 | Open `backend/app/routers/echo.py` | The route declares `response_model=EchoResponse` and returns an `EchoResponse(...)`, not a dict literal | [ ] Pass [ ] Fail |
| 12 | Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/integration/test_echo_integration.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
