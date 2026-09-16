# UAT Script: TEST-06 Echo endpoint

None of the four acceptance criteria is verifiable through the UI: nothing in `frontend/` calls `GET /api/echo`, so there is no page to open and no control to click. The observable check for every criterion is the HTTP response itself, read with `curl`. Criterion 4 additionally has a source-level check.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database), per `docker-compose.yml`. The database is not needed by this endpoint, but the stack is what publishes the backend on `http://localhost:8010`.
- A terminal with `curl`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The first response line reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the response body of that same command | Exactly `{"echo":"hello"}`, with no other field and no wrapping object | [ ] Pass [ ] Fail |
| 3 | Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"` | The body is exactly `{"echo":"hello world"}`, proving the value is echoed verbatim after URL-decoding rather than transformed | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -i "http://localhost:8010/api/echo"` | The first response line reads `HTTP/1.1 422 Unprocessable Entity`. It must not be `200`, `500` or a hang | [ ] Pass [ ] Fail |
| 5 | Read the response body of that same command | A JSON object with a `detail` array whose single entry has `"loc":["query","msg"]` and `"type":"missing"` — FastAPI's own validation body, unaltered | [ ] Pass [ ] Fail |
| 6 | Run `curl -s "http://localhost:8010/api/echo?msg="` | The status is `200` and the body is exactly `{"echo":""}`. An empty value is present, not missing, so it is valid; this step distinguishes the two and confirms step 4 fired on absence rather than on emptiness | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422, with the bound stated in the schema

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` | The terminal prints `422`. (The `printf` builds a 201-character string of `a`; any other way of producing 201 characters works the same.) | [ ] Pass [ ] Fail |
| 8 | Run `curl -s "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` | The body's `detail` entry reports `"type":"string_too_long"` with `"ctx":{"max_length":200}`, naming the bound the declaration sets | [ ] Pass [ ] Fail |
| 9 | Run `curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..200})"` | The terminal prints `200`. Exactly 200 characters is inside the bound, so the limit is "longer than 200", not "200 or more" | [ ] Pass [ ] Fail |
| 10 | Open `backend/app/routers/echo.py` | The `msg` parameter is annotated `Annotated[str, Query(max_length=200)]`, and the function body contains no `len(`, no `if` on the length, and no `raise`. A hand-rolled check would appear here; its absence is the criterion | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Open `backend/app/schemas/echo.py` | It defines `class EchoResponse(BaseModel)` with the single field `echo: str`, and `backend/app/routers/echo.py` declares `response_model=EchoResponse` on the route and returns `EchoResponse(echo=msg)` rather than `{"echo": msg}` | [ ] Pass [ ] Fail |
| 12 | Run `curl -s http://localhost:8010/openapi.json \| python3 -m json.tool \| grep -A4 '"EchoResponse"'` | The generated OpenAPI document contains a named `EchoResponse` schema with the one property `echo` of type `string`. A handler returning a bare dict produces no named schema here, so this output is the observable difference | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
