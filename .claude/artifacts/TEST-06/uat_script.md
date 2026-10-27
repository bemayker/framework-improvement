# UAT Script, TEST-06: Echo endpoint

Manual verification of `GET /api/echo?msg={text}`. Backend-only item: no frontend page is involved, and the interactive docs page at `http://localhost:8010/docs` is the UI.

## Prerequisites

- [ ] The stack is running: `docker compose up -d` from the repository root.
- [ ] The backend answers at `http://localhost:8010` (the host port `docker-compose.yml` publishes).
- [ ] No sign-in and no seed data are needed.
- [ ] `curl` is available in a terminal, and `uv` for the test step in criterion 4.

Every step can be done in a browser address bar or with `curl`.

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Open `http://localhost:8010/api/echo?msg=hello` in a browser. | The page shows exactly `{"echo":"hello"}`. | [ ] | [ ] |
| 1.2 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"`. | First line is `HTTP/1.1 200 OK`, the `content-type` header is `application/json`, and the body is `{"echo":"hello"}`. | [ ] | [ ] |
| 1.3 | Open `http://localhost:8010/api/echo?msg=Hello%20world`. | The page shows `{"echo":"Hello world"}`, with the `%20` decoded to a space. | [ ] | [ ] |

## Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -i "http://localhost:8010/api/echo"`. | First line is `HTTP/1.1 422 Unprocessable Entity` (not 500 and not 200). The body is a JSON object with a `detail` list whose first entry has `"loc":["query","msg"]` and `"type":"missing"`. | [ ] | [ ] |
| 2.2 | Open `http://localhost:8010/docs`, expand `GET /api/echo`, click "Try it out", leave `msg` empty and click "Execute". | The docs page refuses to send and marks `msg` as required. | [ ] | [ ] |

## Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Open `http://localhost:8010/docs` and expand `GET /api/echo`. | The `msg` parameter shows `maxLength: 200` (the bound comes from the declaration, not from handler code). | [ ] | [ ] |
| 3.2 | Click "Try it out", paste into `msg` the text `0123456789` repeated 20 times followed by `X` (201 characters), click "Execute". | The response code is `422` and the body's `detail` entry has `"loc":["query","msg"]` and `"type":"string_too_long"`. | [ ] | [ ] |
| 3.3 | Remove the trailing `X` so `msg` is exactly 200 characters (`0123456789` repeated 20 times), click "Execute". | The response code is `200` and the body is `{"echo": "<the same 200 characters>"}`. | [ ] | [ ] |
| 3.4 | Open `backend/app/routers/echo.py`. | The handler contains no length check of its own; `msg` is declared with `Query(max_length=ECHO_MSG_MAX_LENGTH)`, and the constant is defined in `backend/app/schemas/echo.py` as `200`. | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Open `http://localhost:8010/docs`, expand `GET /api/echo`, look at the 200 response. | Its schema is named `EchoResponse` with one string property, `echo`. | [ ] | [ ] |
| 4.2 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py`. | The schema file defines `class EchoResponse(BaseModel)` with `echo: str`. The router returns `EchoResponse(echo=msg)` and declares `response_model=EchoResponse`, with no dict literal as the response. | [ ] | [ ] |
| 4.3 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py`. | The summary reports `0 failed` across those three test files. | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. `?msg=hello` returns 200 and `{"echo": "hello"}` | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. No `msg` returns 422 | 2.1 to 2.2 | [ ] Pass  [ ] Fail |
| 3. `msg` over 200 characters returns 422, bound in the schema | 3.1 to 3.4 | [ ] Pass  [ ] Fail |
| 4. Response defined by a Pydantic schema | 4.1 to 4.3 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
