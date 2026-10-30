# UAT Script: TEST-06 Echo endpoint

None of the acceptance criteria is verifiable through the UI: no frontend consumes `GET /api/echo`, so the observable check is the HTTP response itself, read with `curl`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend), which is the mapping from `docker-compose.yml`.
- A terminal with `curl`, and `python3` (used only to build the long strings in steps 6 and 7).
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
| 1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The first response line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 2 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` | `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`: the encoded space is decoded end to end | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -i "http://localhost:8010/api/echo"` | The first response line reads `HTTP/1.1 422 Unprocessable Entity`. It is not a 500 and not an empty 200 | [ ] Pass [ ] Fail |
| 4 | Read the response body | `detail[0]` has `"type":"missing"` and `"loc":["query","msg"]` | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Open `backend/app/routers/echo.py` and `backend/app/schemas/echo.py` | The handler body contains no length check. The bound appears only as `Query(max_length=ECHO_MESSAGE_MAX_LENGTH)`, and `ECHO_MESSAGE_MAX_LENGTH = 200` is defined in `backend/app/schemas/echo.py` | [ ] Pass [ ] Fail |
| 6 | Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` | `HTTP/1.1 422 Unprocessable Entity`. `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] Pass [ ] Fail |
| 7 | Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"` | `HTTP/1.1 200 OK` and the body echoes the 200 `a` characters: the boundary is accepted | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` | The 200 response shows the `EchoResponse` schema with one string field `echo`, and the `msg` parameter shows a maximum length of 200 | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` | The schema file defines `class EchoResponse(BaseModel)` with `echo: str`, and the router returns `EchoResponse(...)`, not a dict | [ ] Pass [ ] Fail |
| 10 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |

### Edge case (optional): an empty message

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `curl -i "http://localhost:8010/api/echo?msg="` | `HTTP/1.1 200 OK` with body `{"echo":""}`: an empty `msg` is present, so it is echoed rather than rejected | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 (10 required, 1 optional edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
