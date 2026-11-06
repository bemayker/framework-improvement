# UAT Script: TEST-06 Echo endpoint

No acceptance criterion is verifiable through the UI: no screen calls `/api/echo`. Every step below reads the HTTP response with `curl` against the running stack instead, or inspects the code and the published OpenAPI document.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend, per `docker-compose.yml`).
- A terminal with `curl`, and a shell that expands `{1..200}` (bash or zsh) for criterion 3.
- `uv` installed on the host and backend dependencies synced, for criterion 4 step 12.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running. The backend is published at `http://localhost:8010`.

## Steps

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The first line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 2 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world%21"` | `HTTP/1.1 200 OK` with body `{"echo":"hello world!"}`: the decoded message comes back unchanged, space and punctuation included | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Run `curl -i "http://localhost:8010/api/echo"` | The first line reads `HTTP/1.1 422 Unprocessable Entity` (never `500`, never `200`) | [ ] Pass [ ] Fail |
| 4 | Read the response body | A JSON object with a `detail` array whose entry has `"type":"missing"`, `"loc":["query","msg"]` and `"msg":"Field required"` | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422, bound declared rather than hand-checked

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..200})"` (exactly 200 letters `a`) | Prints `200` | [ ] Pass [ ] Fail |
| 6 | Run `curl -i "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` (201 letters `a`) | `HTTP/1.1 422 Unprocessable Entity`, and the body's `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] Pass [ ] Fail |
| 7 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` | The `msg` query parameter is marked required and shows `maxLength: 200`, the declared bound | [ ] Pass [ ] Fail |
| 8 | Open `backend/app/routers/echo.py` | The handler body only builds `EchoResponse(echo=msg)`; there is no `len(` call, no `if` and no `HTTPException` in it | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Not a runtime behaviour a UI shows; the observable checks are the code and the published schema.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Open `backend/app/schemas/echo.py` | It defines `class EchoResponse(BaseModel)` with the single field `echo: str` | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/routers/echo.py` | The route is declared with `response_model=EchoResponse` and returns an `EchoResponse`, never a dict literal | [ ] Pass [ ] Fail |
| 11 | Run `curl -s http://localhost:8010/openapi.json` and find `paths`, `/api/echo`, `get`, `responses`, `200` | Its schema is a `$ref` to `#/components/schemas/EchoResponse`, whose only property is `echo` of type `string` | [ ] Pass [ ] Fail |
| 12 | Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` | The summary line reports `0 failed` (no failures and no errors) for those three files | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
