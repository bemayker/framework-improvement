# UAT Script: TEST-06 Echo endpoint

None of the four acceptance criteria can be verified through the UI: no frontend screen calls `GET /api/echo`. The observable check is the HTTP response, read with `curl` against the compose stack's backend on host port 8010.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- A terminal with `curl`, in bash or zsh (steps 5 and 6 use `{1..N}` brace expansion).
- Step 10 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

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
| 1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly `{"echo":"hello"}` | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -i "http://localhost:8010/api/echo"` | The first response line starts with `HTTP/1.1 422` (the reason phrase is the server's: `Unprocessable Entity` or `Unprocessable Content`). It is not 500 and not 200 | [ ] Pass [ ] Fail |
| 4 | Read the response body | A JSON object with a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]` | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -i "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` (201 letters `a`) | The first response line starts with `HTTP/1.1 422`, and the body's first `detail` entry has `"type":"string_too_long"` and `"ctx":{"max_length":200}` | [ ] Pass [ ] Fail |
| 6 | Run the same command with `{1..200}` (exactly 200 letters `a`) | `HTTP/1.1 200 OK` and a body whose `echo` value is the 200-letter string | [ ] Pass [ ] Fail |
| 7 | Open `backend/app/routers/echo.py` | The handler body contains no length comparison; the bound appears only as `Query(max_length=MAX_ECHO_MESSAGE_LENGTH)`, and `MAX_ECHO_MESSAGE_LENGTH = 200` is defined in `backend/app/schemas/echo.py` | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` | The 200 response schema is shown as `EchoResponse` with a single string field `echo` | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` | The schema file defines `class EchoResponse(BaseModel)`; the router returns `EchoResponse(echo=msg)` and no bare dict | [ ] Pass [ ] Fail |
| 10 | Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` | The summary line shows `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
