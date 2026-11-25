# UAT Script: TEST-06 Echo endpoint

This feature has no UI: no frontend consumes `GET /api/echo`, so every criterion is verified with HTTP requests against the running backend and by reading the code.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend), which comes from `docker-compose.yml`.
- A terminal with `curl` and a bash-compatible shell (step 5 uses `{1..201}` brace expansion).
- A browser (step 3).
- `uv` installed on the host with backend dependencies synced (step 10 only).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Confirm the backend answers: `curl -s http://localhost:8010/api/version` returns a JSON version.

## Steps

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s -w '\nHTTP %{http_code}\n' 'http://localhost:8010/api/echo?msg=hello'` | The output is `{"echo":"hello"}` followed by `HTTP 200` | [ ] Pass [ ] Fail |
| 2 | Run `curl -s 'http://localhost:8010/api/echo?msg=hello%20world'` | The output is `{"echo":"hello world"}` (the space arrives decoded) | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/docs` in a browser, expand `GET /api/echo`, click Try it out, enter `hello` in the `msg` field and click Execute | The response panel shows code 200 and body `{"echo": "hello"}` | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -s -w '\nHTTP %{http_code}\n' 'http://localhost:8010/api/echo'` | A JSON body whose `detail` list has one entry with `"type":"missing"` and `"loc":["query","msg"]`, followed by `HTTP 422` (not 500, not 200) | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -s -w '\nHTTP %{http_code}\n' "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` | The body's `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`, followed by `HTTP 422` | [ ] Pass [ ] Fail |
| 6 | Run the same command with `{1..200}` instead of `{1..201}` (edge case: the boundary) | The output is `{"echo":"aaaa..."}` holding exactly 200 `a` characters, followed by `HTTP 200` | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/echo.py` | The `msg` parameter is declared with `Query(max_length=ECHO_MSG_MAX_LENGTH)`, and the handler body contains no length check and no `HTTPException` | [ ] Pass [ ] Fail |
| 8 | Open `http://localhost:8010/openapi.json` and find `paths`, then `/api/echo`, then `get`, then `parameters` | The `msg` parameter shows `required: true` and a schema with `maxLength: 200` | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/echo.py`, then `backend/app/routers/echo.py` | The schema file defines `class EchoResponse(BaseModel)` with one field `echo: str`. The route is declared with `response_model=EchoResponse` and the handler returns `EchoResponse(echo=msg)`, not a dict literal | [ ] Pass [ ] Fail |
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
