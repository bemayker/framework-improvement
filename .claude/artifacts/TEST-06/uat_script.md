# UAT Script: TEST-06 Echo endpoint

This feature has no UI. Every check is made against the backend directly, in a browser address bar (shows the JSON body) or with `curl -i` (also shows the status line). The backend from `docker compose up` listens on `http://localhost:8010`.

## Prerequisites
- The stack is running: `docker compose up -d` at the repo root.
- `http://localhost:8010/api/version` answers in a browser.

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| Step | Action | Expected result | Pass |
|---|---|---|---|
| 1.1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | Status line `HTTP/1.1 200 OK`; body exactly `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 1.2 | In a browser open `http://localhost:8010/api/echo?msg=hello%20world` | Page shows `{"echo":"hello world"}` (encoded space decoded) | [ ] Pass [ ] Fail |

## Criterion 2: `GET /api/echo` with no `msg` returns 422

| Step | Action | Expected result | Pass |
|---|---|---|---|
| 2.1 | Run `curl -i "http://localhost:8010/api/echo"` | Status line `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200); body is JSON with a `detail` list whose entry has `"type":"missing"` and `"loc":["query","msg"]` | [ ] Pass [ ] Fail |

## Criterion 3: `msg` longer than 200 characters returns 422

| Step | Action | Expected result | Pass |
|---|---|---|---|
| 3.1 | In bash or zsh run `curl -i "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` (201 `a` characters) | Status line `HTTP/1.1 422 Unprocessable Entity`; `detail` entry has `"type":"string_too_long"` and `"loc":["query","msg"]` | [ ] Pass [ ] Fail |
| 3.2 | Run the same command with `{1..200}` (exactly 200 characters) | Status `HTTP/1.1 200 OK`; body echoes the 200 `a` characters under `echo` | [ ] Pass [ ] Fail |
| 3.3 | Open `backend/app/routers/echo.py`, then `backend/app/schemas/echo.py` | Handler body only builds `EchoResponse(echo=msg)`, with no `len(...)` check or length `if`; the schema defines `ECHO_MSG_MAX_LENGTH = 200`, which the router's `Query(max_length=...)` references | [ ] Pass [ ] Fail |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| Step | Action | Expected result | Pass |
|---|---|---|---|
| 4.1 | In a browser open `http://localhost:8010/docs` and expand `GET /api/echo` | The 200 response schema is shown as `EchoResponse` with one string property `echo` | [ ] Pass [ ] Fail |
| 4.2 | Open `backend/app/routers/echo.py` | The route declares `response_model=EchoResponse` and returns an `EchoResponse` instance, not a dict literal | [ ] Pass [ ] Fail |
| 4.3 | From the repo root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The run passes: no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. Echo returns 200 with body | 1.1, 1.2 | [ ] Pass [ ] Fail |
| 2. Missing msg returns 422 | 2.1 | [ ] Pass [ ] Fail |
| 3. Over-length msg returns 422 | 3.1, 3.2, 3.3 | [ ] Pass [ ] Fail |
| 4. Pydantic response schema | 4.1, 4.2, 4.3 | [ ] Pass [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass [ ] Fail
