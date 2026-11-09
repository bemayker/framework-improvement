# UAT Script: TEST-06 Echo endpoint

None of the four acceptance criteria is verifiable through the UI: no frontend screen calls `GET /api/echo`. The observable check is the HTTP response itself, read with `curl` against the backend that `docker-compose.yml` publishes on `http://localhost:8010`.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend), which is the mapping `docker-compose.yml` declares.
- No root `.env` file is required: `docker-compose.yml` carries usable defaults.
- A terminal with `curl`, `head` and `tr` (criterion 3 builds a long message with them).
- Step 12 only: `uv` installed on the host and the backend dependencies synced (`uv sync --directory backend`).

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
| 2 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` | `HTTP/1.1 200 OK` and body exactly `{"echo":"hello world"}` (the encoded space is decoded, proving query-string handling end to end) | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422, the standard validation response

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -i "http://localhost:8010/api/echo"` | The first line reads `HTTP/1.1 422 Unprocessable Entity` (never `500`, never `200`) | [ ] Pass [ ] Fail |
| 4 | Read the body | `{"detail":[{"type":"missing","loc":["query","msg"],"msg":"Field required","input":null}]}`: FastAPI's standard validation shape naming the missing `msg` query parameter | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422, the bound stated in the schema

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -i "http://localhost:8010/api/echo?msg=$(head -c 201 < /dev/zero | tr '\0' a)"` (a msg of 201 letters `a`) | `HTTP/1.1 422 Unprocessable Entity`, and the body's `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] Pass [ ] Fail |
| 6 | Run `curl -i "http://localhost:8010/api/echo?msg=$(head -c 200 < /dev/zero | tr '\0' a)"` (exactly 200 letters `a`) | `HTTP/1.1 200 OK` and the body is `{"echo":"` followed by the same 200 letters and `"}` | [ ] Pass [ ] Fail |
| 7 | Run `curl -s http://localhost:8010/openapi.json` and find the `parameters` entry of `paths["/api/echo"].get` (or open `http://localhost:8010/docs` in a browser and expand `GET /api/echo`) | The `msg` parameter is marked required and its schema carries `"maxLength":200`: the bound is declared on the parameter, not checked in the handler | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/echo.py` | The handler body is a single `return EchoResponse(echo=msg)`, with no `len(` check and no `raise` | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/echo.py` | It defines `class EchoResponse(BaseModel)` with one field `echo: str` | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/routers/echo.py` | The route is declared with `response_model=EchoResponse` and returns an `EchoResponse`, not a dict literal | [ ] Pass [ ] Fail |
| 11 | Run `curl -s http://localhost:8010/openapi.json` and look under `components.schemas` | An `EchoResponse` schema exists with a required string property `echo`, and `paths["/api/echo"].get.responses["200"]` references it | [ ] Pass [ ] Fail |
| 12 | Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` | The run reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
