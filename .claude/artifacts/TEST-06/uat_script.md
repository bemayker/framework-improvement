# UAT Script: TEST-06 Echo endpoint

None of the four acceptance criteria is verifiable through the UI: no frontend screen calls `GET /api/echo`. The observable check is the HTTP response itself, read with `curl` against the backend the compose stack publishes on host port 8010 (`docker-compose.yml`).

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010`.
- No root `.env` file is required; `docker-compose.yml` carries usable defaults.
- A terminal with `curl`.
- `python3` available, to build the long strings in steps 3 and 4.
- `uv` installed on the host and the backend dependencies synced, for step 8 only.
- A browser, for step 7.
- An editor or file viewer, for steps 5 and 6.

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
| 1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The first line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 2 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` | `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`, showing the query string is URL-decoded end to end | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

Prerequisites: the stack from the setup still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -i "http://localhost:8010/api/echo"` | The first line reads `HTTP/1.1 422 Unprocessable Entity` (some versions print `Unprocessable Content`). The body is a JSON object whose `detail` list has one entry with `"type":"missing"` and `"loc":["query","msg"]`. It is not a 500 and not a 200 | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema

Prerequisites: the stack from the setup still up; `python3` available.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -i --get --data-urlencode "msg=$(python3 -c 'print("a"*201)')" "http://localhost:8010/api/echo"` | `HTTP/1.1 422 Unprocessable Entity`; the `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] Pass [ ] Fail |
| 5 | Run `curl -i --get --data-urlencode "msg=$(python3 -c 'print("a"*200)')" "http://localhost:8010/api/echo"` (edge case: the inclusive limit) | `HTTP/1.1 200 OK` with body `{"echo":"aaaa..."}` holding the same 200 `a` characters, confirming 200 is accepted | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` in an editor | The 200 limit appears in the schema (`MAX_ECHO_MESSAGE_LENGTH = 200` used by `Field(max_length=...)`); the router contains no `len(` call and no `if` on the message length | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: the stack from the setup still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` | The 200 response's schema is shown as `EchoResponse` with one string property `echo` | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/echo.py`, then run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The route declares `response_model=EchoResponse` and returns `EchoResponse(...)`, not a dict literal. The test run ends with `0 failed` for those three files | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
