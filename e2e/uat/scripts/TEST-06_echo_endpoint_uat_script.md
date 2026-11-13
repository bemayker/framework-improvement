# UAT Script: TEST-06 Echo endpoint

None of the four acceptance criteria can be verified by clicking through the app's UI: the endpoint has no screen. The observable surface is the HTTP response, read with `curl`, and the FastAPI docs page at `/docs`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database). Both mappings come from `docker-compose.yml`. If the PR description names a different handover stack, use its backend port instead of `8010` in every command below.
- A terminal with `curl`, and a browser for the `/docs` page.
- Step 6 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The status line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 2 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` | Status 200 and the body is `{"echo":"hello world"}` (URL-encoded input is decoded and echoed verbatim) | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -i "http://localhost:8010/api/echo"` | The status line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200) and the body is a JSON `detail` list whose entry has `"type":"missing"` and `"loc":["query","msg"]` | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -i "http://localhost:8010/api/echo?msg=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"` (201 letters `a`) | Status 422 and the `detail` entry has `"type":"string_too_long"` with `"ctx":{"max_length":200}` | [ ] Pass [ ] Fail |
| 5 | Run the same request with exactly 200 letters `a` (remove one `a`) | Status 200 and the body echoes all 200 letters | [ ] Pass [ ] Fail |
| 6 | Open `backend/app/routers/echo.py`, then `backend/app/schemas/echo.py` | The handler in `echo.py` contains no length check. `EchoQuery.msg` in `schemas/echo.py` declares a `max_length` of 200 (through the constant `MAX_ECHO_LENGTH = 200`) | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | In a browser, open `http://localhost:8010/docs` | The endpoint list shows `GET /api/echo` under the `echo` tag | [ ] Pass [ ] Fail |
| 8 | Expand `GET /api/echo` | The 200 response shows the `EchoResponse` schema with a single string field `echo`, and the parameters list shows `msg` as required with a maximum length of 200 | [ ] Pass [ ] Fail |
| 9 | Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The run reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
