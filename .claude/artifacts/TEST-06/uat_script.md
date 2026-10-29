# UAT Script: TEST-06 Echo endpoint

No criterion is verifiable through the UI: no frontend screen calls `GET /api/echo`. The observable check for every criterion is the HTTP response, read with `curl` in a terminal, or the OpenAPI document in a browser.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend; the mapping comes from `docker-compose.yml`).
- A terminal with `curl` and `python3` (used to build the long strings in criterion 3).
- A browser, for the `/docs` checks.
- `uv` installed on the host, for the test run in criterion 4.

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
| 1 | In a terminal run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 3 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` | `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`, showing the query string is decoded and echoed unchanged | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

Prerequisites: the stack from the setup is still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -i "http://localhost:8010/api/echo"` | The first response line carries status `422` (the reason phrase after it depends on the server library version), not 500 and not 200 | [ ] Pass [ ] Fail |
| 5 | Read the response body | A JSON object with a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]` | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422, bound declared in the schema

Prerequisites: the stack from the setup is still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` | Status `422`, and the body's first `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] Pass [ ] Fail |
| 7 | Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"` | `HTTP/1.1 200 OK` with `{"echo":"aaaa...a"}` holding exactly 200 `a` characters (the boundary is inclusive) | [ ] Pass [ ] Fail |
| 8 | In a browser open `http://localhost:8010/docs` and expand `GET /api/echo` | The `msg` parameter is shown as required, in `query`, with `maxLength 200` | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/routers/echo.py` | The handler body is a single `return EchoResponse(echo=msg)` with no length check; the bound appears only as `Query(max_length=MAX_ECHO_MESSAGE_LENGTH)` in the signature | [ ] Pass [ ] Fail |

### Criterion 4: the response body is a Pydantic schema in `backend/app/schemas/`

Prerequisites: the stack from the setup is still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | In a browser open `http://localhost:8010/docs`, expand `GET /api/echo` and look at the 200 response | Its schema is `EchoResponse` with one string property `echo` | [ ] Pass [ ] Fail |
| 11 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` | The schema file defines `class EchoResponse(BaseModel)` with `echo: str`; the router declares `response_model=EchoResponse` and returns an `EchoResponse`, not a dict | [ ] Pass [ ] Fail |
| 12 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
