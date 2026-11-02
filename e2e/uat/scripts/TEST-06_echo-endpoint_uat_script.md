# UAT script: TEST-06 Echo endpoint

This item has no UI. Every step uses the backend's HTTP surface: a browser, the FastAPI docs page, or `curl`. Host port 8010 is the backend port `docker-compose.yml` publishes.

## Prerequisites

- Docker is running and the stack is up: `docker compose up -d --build` from the repository root.
- `http://localhost:8010/api/version` answers in a browser.
- `curl` and `uv` are installed (step 4.3 only needs `uv`).

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | In a browser, open `http://localhost:8010/api/echo?msg=hello` | The page shows exactly `{"echo":"hello"}` | [ ] | [ ] |
| 1.2 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | First line reads `HTTP/1.1 200 OK`, body is `{"echo":"hello"}` | [ ] | [ ] |
| 1.3 | Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"` | Body is `{"echo":"hello world"}`, the URL-encoded space decoded | [ ] | [ ] |

## Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -i "http://localhost:8010/api/echo"` | Status line reads `422 Unprocessable Entity` (not 500, not 200). Body is a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]` | [ ] | [ ] |

## Criterion 3: `msg` longer than 200 characters returns 422

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `http://localhost:8010/docs`, expand `GET /api/echo`, click "Try it out", paste 201 letter `a` characters into `msg`, click "Execute" | Response code 422. First `detail` entry has `"type":"string_too_long"` and `"ctx":{"max_length":200}` | [ ] | [ ] |
| 3.2 | Delete one character so `msg` holds exactly 200 letter `a` characters, click "Execute" | Response code 200. The body's `echo` is the same 200-character string | [ ] | [ ] |
| 3.3 | Open `backend/app/routers/echo.py` | The handler body is a single `return EchoResponse(echo=msg)`, with no `len(` call and no `HTTPException`. The 200 appears only as `ECHO_MSG_MAX_LENGTH` in `backend/app/schemas/echo.py` | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Open `http://localhost:8010/docs`, expand `GET /api/echo` | The 200 response's schema is named `EchoResponse` with one string property `echo` | [ ] | [ ] |
| 4.2 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` | The schema file defines `class EchoResponse(BaseModel)` with `echo: str`. The router declares `response_model=EchoResponse` and returns no dict literal | [ ] | [ ] |
| 4.3 | Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` | The summary reports `0 failed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. 200 with `{"echo": "hello"}` | 1.1 to 1.3 | [ ] Pass [ ] Fail |
| 2. 422 when `msg` is missing | 2.1 | [ ] Pass [ ] Fail |
| 3. 422 over 200 characters | 3.1 to 3.3 | [ ] Pass [ ] Fail |
| 4. Pydantic response schema | 4.1 to 4.3 | [ ] Pass [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass [ ] Fail
