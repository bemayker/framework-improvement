# UAT Script: TEST-06 Echo endpoint

`GET /api/echo?msg={text}` returns the text it was given. None of the four criteria is verifiable through the application UI: no frontend screen calls the endpoint. The observable check is the HTTP response, read with `curl` in a terminal (or through FastAPI's Swagger page at `http://localhost:8010/docs` → `GET /api/echo` → "Try it out").

## Prerequisites

- Docker running.
- From the repository root, `docker compose up -d --build`, then `docker compose ps` shows the `backend` service running and published on host port `8010`.
- A terminal with `curl` and `python3`.

Mark each step `[x]` in the Pass column when the expected result is observed, or `[ ]` Fail with a note.

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | First line reads `HTTP/1.1 200 OK`; `content-type: application/json` is among the headers | [ ] | [ ] |
| 1.2 | Read the body from 1.1 | Exactly `{"echo":"hello"}` | [ ] | [ ] |
| 1.3 | Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"` | Body is exactly `{"echo":"hello world"}` (the URL-encoded space is decoded end to end) | [ ] | [ ] |

## Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -i "http://localhost:8010/api/echo"` | First line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200) | [ ] | [ ] |
| 2.2 | Read the body from 2.1 | A JSON object with a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]` | [ ] | [ ] |

## Criterion 3: `msg` longer than 200 characters returns 422, bound declared in the schema

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` (201 letters `a`) | First line reads `HTTP/1.1 422 Unprocessable Entity`; `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] | [ ] |
| 3.2 | Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"` (exactly 200 letters `a`) | `HTTP/1.1 200 OK`; the body's `echo` value is the same 200 letters | [ ] | [ ] |
| 3.3 | Run `curl -s http://localhost:8010/openapi.json \| python3 -m json.tool \| grep -n maxLength` | A line reading `"maxLength": 200` appears (the bound is declared in the published schema) | [ ] | [ ] |
| 3.4 | Open `backend/app/routers/echo.py` | The handler contains no `len(` check and no manual `HTTPException`; the bound appears only as `Query(max_length=ECHO_MSG_MAX_LENGTH)` | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

This is a code-structure property; the observable checks are the source files and the OpenAPI document.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Open `backend/app/schemas/echo.py` | It defines `class EchoResponse(BaseModel)` with a single field `echo: str` | [ ] | [ ] |
| 4.2 | Open `backend/app/routers/echo.py` | The route is declared with `response_model=EchoResponse` and returns `EchoResponse(echo=msg)`, never a `{...}` dict literal | [ ] | [ ] |
| 4.3 | Run `curl -s http://localhost:8010/openapi.json \| python3 -m json.tool \| grep -n EchoResponse` | `EchoResponse` appears both under `components.schemas` and as the `$ref` of the `/api/echo` 200 response | [ ] | [ ] |
| 4.4 | Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` | The summary line shows `0 failed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. Echo returns 200 with the msg | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. Missing msg returns 422 | 2.1 to 2.2 | [ ] Pass  [ ] Fail |
| 3. msg over 200 characters returns 422 | 3.1 to 3.4 | [ ] Pass  [ ] Fail |
| 4. Response defined by a Pydantic schema | 4.1 to 4.4 | [ ] Pass  [ ] Fail |

Overall: [ ] Accepted  [ ] Rejected

Tester: ______________  Date: ______________  Notes: ______________________________
