# UAT Script: TEST-06 Echo endpoint

None of the four criteria is verifiable through the UI: no frontend screen consumes `GET /api/echo`. The observable check is the HTTP response itself, read with `curl` against the compose stack, plus the OpenAPI document for criterion 4.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend, published by `docker-compose.yml`).
- A terminal with `curl` and `python3` (used only to generate the long `msg` in criterion 3).
- Steps 8, 10 and 11 (code reading and test run): a checkout of the repository, and `uv` installed on the host with the backend dependencies synced.

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
| 1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 3 | Run `curl -s "http://localhost:8010/api/echo?msg=a%26b%3Dc%20d"` | The body is `{"echo":"a&b=c d"}`, showing the encoded query string was decoded end to end | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -i "http://localhost:8010/api/echo"` | The first response line reads `HTTP/1.1 422 Unprocessable Entity` (never 500, never 200) | [ ] Pass [ ] Fail |
| 5 | Read the response body | A JSON object with a `detail` array whose first entry has `"type":"missing"` and `"loc":["query","msg"]` | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` (a `msg` of 201 letters `a`) | The first line reads `HTTP/1.1 422 Unprocessable Entity` and the body's `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] Pass [ ] Fail |
| 7 | Run the same command with `"a"*200` instead of `"a"*201` (200 letters) | `HTTP/1.1 200 OK` with the 200 letters echoed back in `echo` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/echo.py` | The `msg` parameter is declared with `Query(max_length=ECHO_MSG_MAX_LENGTH)`, the constant is defined in `backend/app/schemas/echo.py` as `200`, and the handler body contains no length check | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` | The 200 response shows the `EchoResponse` schema with one string field `echo`, and the `msg` parameter is marked required with max length 200 | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/echo.py` | It defines `class EchoResponse(BaseModel)` with `echo: str`; `backend/app/routers/echo.py` declares `response_model=EchoResponse` and returns `EchoResponse(echo=msg)`, not a dict | [ ] Pass [ ] Fail |
| 11 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` | The run ends with `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
