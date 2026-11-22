# UAT Script: TEST-06 Echo endpoint

No acceptance criterion is verifiable through a UI: the endpoint has no frontend, so the observable check is the HTTP response itself, read with `curl` (or a browser address bar for the GET requests).

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`. If the handover rebuilt the stack on other ports, use the backend port the handover report names in place of `8010` throughout.
- A terminal with `curl` and a POSIX-style shell (bash or zsh) for step 5's `printf` and brace expansion.
- Step 11 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `curl -i http://localhost:8010/api/version` until it answers `HTTP/1.1 200 OK`.

## Steps

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The status line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 2 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` | Status 200 and body `{"echo":"hello world"}` (the encoded space comes back decoded) | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/api/echo?msg=hello` in a browser | The page shows `{"echo":"hello"}` | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

Prerequisites: stack still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -i "http://localhost:8010/api/echo"` | Status code 422 (the reason phrase after it may read `Unprocessable Entity` or `Unprocessable Content`, depending on the Python version in the image). The body is a JSON object with a `detail` list whose entry has `"type":"missing"` and `"loc":["query","msg"]`. It is not a 500 and not an empty 200 | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422

Prerequisites: stack still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | In your own terminal run `curl -i "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` (201 letters `a`) | Status 422; the `detail` entry has `"type":"string_too_long"` and `"loc":["query","msg"]` | [ ] Pass [ ] Fail |
| 6 | Run the same command with `{1..200}` (exactly 200 letters `a`) | Status 200 and the body echoes all 200 letters | [ ] Pass [ ] Fail |
| 7 | Open `http://localhost:8010/docs` and expand `GET /api/echo` | The `msg` parameter is shown as required with a maximum length of 200 | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/echo.py` | The handler body contains no length check; the bound appears only as `Query(max_length=ECHO_MSG_MAX_LENGTH)` | [ ] Pass [ ] Fail |

### Criterion 4: the response body is a Pydantic schema in `backend/app/schemas/`

Prerequisites: stack still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `http://localhost:8010/docs`, expand `GET /api/echo` and look at the 200 response | Its schema is named `EchoResponse` with one string field `echo` | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` | The schema file defines `class EchoResponse(BaseModel)`; the router returns `EchoResponse(...)` and contains no bare dict literal as the response | [ ] Pass [ ] Fail |
| 11 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
