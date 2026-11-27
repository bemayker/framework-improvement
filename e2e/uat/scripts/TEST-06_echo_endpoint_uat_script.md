# UAT script, TEST-06: Echo endpoint

No criterion can be verified through the UI: the endpoint has no frontend caller. Each block uses a terminal against the running backend.

## Prerequisites
- The stack is up: `docker compose up -d --build` from the repository root.
- The backend answers on `http://localhost:8010`: `curl -s http://localhost:8010/api/version` returns a JSON body with a `version` field.
- `curl` and `python3` are available in the terminal.
- A checkout of branch `feature/TEST-06-echo-endpoint` for the steps that open source files and run tests.

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
- [ ] 1. In a terminal, run `curl -s -i "http://localhost:8010/api/echo?msg=hello"`. Expected: the status line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.
- [ ] 2. Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"`. Expected: the body is `{"echo":"hello world"}` (the encoded space comes back decoded).
- [ ] 3. Open `http://localhost:8010/api/echo?msg=hello` in a browser tab. Expected: the page shows `{"echo":"hello"}`.

## Criterion 2: `GET /api/echo` with no `msg` returns 422
- [ ] 1. Run `curl -s -i "http://localhost:8010/api/echo"`. Expected: the status line reads `HTTP/1.1 422 Unprocessable Entity` (never 500 or 200).
- [ ] 2. Read the body of the same response. Expected: a JSON object with a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

## Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema
- [ ] 1. Run `curl -s -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"`. Expected: the status line reads `HTTP/1.1 422 Unprocessable Entity` and the body's first `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
- [ ] 2. Run `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"`. Expected: it prints `200`.
- [ ] 3. Open `backend/app/routers/echo.py`. Expected: the handler contains no length comparison, `if` or `HTTPException`. Open `backend/app/schemas/echo.py`. Expected: `EchoQuery.msg` carries `Field(max_length=ECHO_MSG_MAX_LENGTH)` with `ECHO_MSG_MAX_LENGTH = 200`.

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
- [ ] 1. Open `http://localhost:8010/docs` in a browser. Expected: the `GET /api/echo` operation is listed; expand it and its 200 response shows the `EchoResponse` schema with a single string field `echo`.
- [ ] 2. Open `backend/app/routers/echo.py`. Expected: the route declares `response_model=EchoResponse` and returns `EchoResponse(...)`, never a dict literal.
- [ ] 3. Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py`. Expected: the summary line reports no failed or errored test and the command exits 0.

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. 200 with `{"echo": "hello"}` | 3 | | |
| 2. Missing `msg` returns 422 | 2 | | |
| 3. Over 200 characters returns 422 | 3 | | |
| 4. Response defined by a Pydantic schema | 3 | | |

Tester: ____________  Date: ____________  Overall result: [ ] Pass  [ ] Fail
