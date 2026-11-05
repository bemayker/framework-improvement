# UAT Script, TEST-06: Echo endpoint

No criterion is verifiable through the UI: no frontend screen calls `GET /api/echo`. The observable check is the HTTP response, read with `curl` against the compose stack's backend on host port 8010 (`docker-compose.yml`).

## Prerequisites
- On branch `feature/TEST-06-echo-endpoint`.
- Stack started from the repository root with `docker compose up -d --build`, and `docker compose ps` shows the `backend` service running.
- `curl` and `python3` available in the terminal.

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`

- [ ] 1.1 Run `curl -i "http://localhost:8010/api/echo?msg=hello"`. Expected: the first response line reads `HTTP/1.1 200 OK`.
- [ ] 1.2 Read the response body. Expected: exactly `{"echo":"hello"}`.
- [ ] 1.3 Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world%20%26%20more"`. Expected: the body is `{"echo":"hello world & more"}`, the decoded text unchanged.

## Criterion 2: `GET /api/echo` with no `msg` returns 422

- [ ] 2.1 Run `curl -i http://localhost:8010/api/echo`. Expected: the first response line reads `HTTP/1.1 422 Unprocessable Entity` (never 500, never 200).
- [ ] 2.2 Read the response body. Expected: a JSON `detail` array whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

## Criterion 3: `msg` longer than 200 characters returns 422

- [ ] 3.1 Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a" * 201)')"` (a `msg` of exactly 201 letters `a`). Expected: `HTTP/1.1 422 Unprocessable Entity`, and the body's first `detail` entry has `"type":"string_too_long"` and `"loc":["query","msg"]`.
- [ ] 3.2 Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a" * 200)')"` (exactly 200 letters `a`). Expected: `HTTP/1.1 200 OK` and the body is `{"echo":"aaa..."}` holding the same 200 letters.
- [ ] 3.3 Open `backend/app/routers/echo.py`. Expected: the `msg` parameter is declared with `Query(max_length=MAX_ECHO_LENGTH)` and the handler body contains no length check.

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Not a runtime behaviour; the observable check is the source and the tests.

- [ ] 4.1 Open `backend/app/schemas/echo.py`. Expected: it defines `class EchoResponse(BaseModel)` with the single field `echo: str`, and `MAX_ECHO_LENGTH = 200`.
- [ ] 4.2 Open `backend/app/routers/echo.py`. Expected: the route declares `response_model=EchoResponse` and returns `EchoResponse(echo=msg)`, with no dict literal.
- [ ] 4.3 From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py`. Expected: the run ends with `0 failed`.

## Summary

| Criterion | Steps | Result (Pass / Fail) | Notes |
|---|---|---|---|
| 1. Echo returns 200 with `{"echo": "hello"}` | 1.1 to 1.3 | | |
| 2. Missing `msg` returns 422 | 2.1 to 2.2 | | |
| 3. `msg` over 200 characters returns 422 | 3.1 to 3.3 | | |
| 4. Response defined by a Pydantic schema | 4.1 to 4.3 | | |

Tester: ____________  Date: ____________  Overall: [ ] Pass  [ ] Fail
