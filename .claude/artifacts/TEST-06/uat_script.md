# UAT Script: TEST-06 Echo endpoint

`GET /api/echo?msg={text}` returns the text it was given. No UI consumes the endpoint, so every step is checked with `curl` (and the OpenAPI document) against the running backend.

## Prerequisites

- Docker is running.
- Repository checked out on `feature/TEST-06-echo-endpoint`.
- From the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running, published on `http://localhost:8010` (the `docker-compose.yml` mapping `8010:8010`).
- A terminal with `curl` and `python3`.

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | First line reads `HTTP/1.1 200 OK`; body is exactly `{"echo":"hello"}` | [ ] | [ ] |
| 1.2 | Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"` | Body is `{"echo":"hello world"}` (the encoded space is decoded, proving query-string handling end to end) | [ ] | [ ] |

## Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -i "http://localhost:8010/api/echo"` | Status is 422 (first line reads `HTTP/1.1 422 Unprocessable Entity` or `Unprocessable Content`, depending on the server version); never 500, never 200 | [ ] | [ ] |
| 2.2 | Read the body | FastAPI's validation shape: `{"detail":[{"type":"missing","loc":["query","msg"],"msg":"Field required","input":null}]}` | [ ] | [ ] |

## Criterion 3: `msg` longer than 200 characters returns 422, bound declared in the schema

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8010/api/echo?msg=$(python3 -c "print('a'*201)")"` | Prints `422` | [ ] | [ ] |
| 3.2 | Run `curl -s "http://localhost:8010/api/echo?msg=$(python3 -c "print('a'*201)")"` | `detail[0].type` is `string_too_long`, `detail[0].loc` is `["query","msg"]`, `detail[0].ctx` is `{"max_length":200}` | [ ] | [ ] |
| 3.3 | Run `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8010/api/echo?msg=$(python3 -c "print('a'*200)")"` | Prints `200` (exactly 200 characters is accepted) | [ ] | [ ] |
| 3.4 | Run `curl -s http://localhost:8010/openapi.json` (or open it in a browser) and find `paths`, `/api/echo`, `get`, `parameters` | The `msg` entry has `"in": "query"`, `"required": true` and a schema with `"maxLength": 200` | [ ] | [ ] |
| 3.5 | Open `backend/app/routers/echo.py` | The handler body contains no length comparison; the bound appears only as `Query(max_length=ECHO_MSG_MAX_LENGTH)` | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Open `backend/app/schemas/echo.py` | Defines `class EchoResponse(BaseModel)` with a single field `echo: str` | [ ] | [ ] |
| 4.2 | Open `backend/app/routers/echo.py` | The route declares `response_model=EchoResponse` and returns `EchoResponse(echo=msg)`, not a dict literal | [ ] | [ ] |
| 4.3 | In `http://localhost:8010/openapi.json`, find `paths`, `/api/echo`, `get`, `responses`, `200` | Its schema is `{"$ref": "#/components/schemas/EchoResponse"}`, and `components.schemas.EchoResponse` lists `echo` as a required string | [ ] | [ ] |
| 4.4 | Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` | The run reports `0 failed` for those three files | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|---|---|---|---|
| 1. 200 with `{"echo": "hello"}` | 1.1 to 1.2 | | |
| 2. Missing `msg` returns 422 | 2.1 to 2.2 | | |
| 3. Over 200 characters returns 422, bound declared | 3.1 to 3.5 | | |
| 4. Response defined by a Pydantic schema | 4.1 to 4.4 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
