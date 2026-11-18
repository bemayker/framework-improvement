# UAT Script: TEST-06 Echo endpoint

None of the four acceptance criteria can be verified through the UI: no frontend screen calls `/api/echo`. The observable check is the HTTP response itself, read with `curl`, plus a read of the two source files for the criteria about where the bound and the schema live.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- A terminal with `curl`, and `python3` on the host to build the long strings (criterion 3).
- `uv` installed on the host with the backend dependencies synced (criterion 4, step 12 only).
- A browser (criterion 4, step 10 only).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service shows running.

## Steps

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 3 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` | `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`, showing the URL-encoded space decoded | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

Prerequisites: the stack from the setup is still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -i http://localhost:8010/api/echo` | The first response line reads `HTTP/1.1 422 Unprocessable Entity`, never a 500 or a 200 | [ ] Pass [ ] Fail |
| 5 | Read the response body | A `detail` list whose entry has `"type":"missing"` and `"loc":["query","msg"]` | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422

Prerequisites: the stack from the setup is still up, and `python3` is available on the host.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -i -G http://localhost:8010/api/echo --data-urlencode "msg=$(python3 -c 'print("a"*201)')"`, which sends a 201-character `msg` of the letter `a` | The first response line reads `HTTP/1.1 422 Unprocessable Entity` | [ ] Pass [ ] Fail |
| 7 | Read the response body | A `detail` entry with `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] Pass [ ] Fail |
| 8 | Run `curl -i -G http://localhost:8010/api/echo --data-urlencode "msg=$(python3 -c 'print("a"*200)')"`, which sends exactly 200 characters | `HTTP/1.1 200 OK`, and the body's `echo` value is the same 200 `a` characters | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/routers/echo.py`, then `backend/app/schemas/echo.py` | The handler contains no length check, no `if` on `msg` and no `HTTPException`. `EchoQuery.msg` is declared with `Field(max_length=ECHO_MSG_MAX_LENGTH)` and `ECHO_MSG_MAX_LENGTH = 200` | [ ] Pass [ ] Fail |

### Criterion 4: the response body is a Pydantic schema in `backend/app/schemas/`

Prerequisites: the stack from the setup is still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` | Under Responses, the 200 response's schema is shown as `EchoResponse` with one string field `echo` | [ ] Pass [ ] Fail |
| 11 | Open `backend/app/schemas/echo.py`, then `backend/app/routers/echo.py` | `class EchoResponse(BaseModel)` with `echo: str`. The route declares `response_model=EchoResponse` and returns an `EchoResponse(...)`, not a dict literal | [ ] Pass [ ] Fail |
| 12 | Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
