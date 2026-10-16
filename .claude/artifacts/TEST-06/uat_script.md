# UAT Script: TEST-06 Echo endpoint

No screen of the task-notes app calls this endpoint, so every criterion is verified against the HTTP response itself: in a browser address bar, in FastAPI's interactive docs at http://localhost:8010/docs, or with curl.

## Prerequisites

- On branch `feature/TEST-06-echo-endpoint` (or `main` once merged).
- From the repository root run `docker compose up -d --build`, then `docker compose ps` until `backend` reports running.
- The backend answers on http://localhost:8010.
- A terminal with `curl` and `python3`, and a browser.

## Criterion 1: GET /api/echo?msg=hello returns 200 with the echo body

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | First line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers | [ ] | [ ] |
| 1.2 | Read the response body of step 1.1 | Exactly `{"echo":"hello"}`, one key and nothing else | [ ] | [ ] |
| 1.3 | Open http://localhost:8010/api/echo?msg=hello%20world in a browser | The page shows `{"echo":"hello world"}`, the space decoded from %20 | [ ] | [ ] |

## Criterion 2: GET /api/echo with no msg returns 422

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -i "http://localhost:8010/api/echo"` | First line reads `HTTP/1.1 422 Unprocessable Entity`, not `500 Internal Server Error` and not `200 OK` | [ ] | [ ] |
| 2.2 | Read the body of step 2.1 | A JSON object with one key `detail`, a list of one entry whose `type` is `missing`, whose `loc` is the list `query`, `msg`, and whose `msg` is `Field required` | [ ] | [ ] |
| 2.3 | Open http://localhost:8010/docs, expand `GET /api/echo`, click `Try it out`, leave the `msg` field empty and click `Execute` | The docs page refuses to send and marks `msg` as a required field, which shows the parameter is declared required | [ ] | [ ] |

## Criterion 3: msg longer than 200 characters returns 422

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `python3 -c "print('a' * 201)"` and copy the output | A single line of 201 letters `a` | [ ] | [ ] |
| 3.2 | Run `curl -i "http://localhost:8010/api/echo?msg=<the 201 letters from step 3.1>"` | First line reads `HTTP/1.1 422 Unprocessable Entity` | [ ] | [ ] |
| 3.3 | Read the body of step 3.2 | `detail` holds one entry whose `type` is `string_too_long`, whose `msg` is `String should have at most 200 characters`, and whose `ctx.max_length` is `200` | [ ] | [ ] |
| 3.4 | Run `python3 -c "print('a' * 200)"`, copy the 200 letters, and run `curl -i "http://localhost:8010/api/echo?msg=<the 200 letters>"` | `HTTP/1.1 200 OK`, and the `echo` field holds the same 200 letters (the bound is inclusive) | [ ] | [ ] |
| 3.5 | Open `backend/app/routers/echo.py` and `backend/app/schemas/echo.py` | `msg` is declared as `Query(max_length=MAX_ECHO_MSG_LENGTH)`, the handler body contains no `len(` call, and the schema module defines `MAX_ECHO_MSG_LENGTH = 200` | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in backend/app/schemas/

This is a code-structure property with no UI behaviour; the observable checks are the OpenAPI document and the module.

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Open http://localhost:8010/docs, expand `GET /api/echo`, look under `Responses` for code `200` | The schema is named `EchoResponse` and has one required string property `echo` | [ ] | [ ] |
| 4.2 | Open http://localhost:8010/openapi.json and find `components`, then `schemas`, then `EchoResponse` | It lists `echo` under `properties` with type `string`, and under `required` | [ ] | [ ] |
| 4.3 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` | `class EchoResponse(BaseModel)` with field `echo: str`; the router declares `response_model=EchoResponse` and returns an `EchoResponse`, never a dict literal | [ ] | [ ] |
| 4.4 | Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Passed | Failed |
|-----------|-------|--------|--------|
| 1. Echo returns 200 with the body | 1.1 to 1.3 | | |
| 2. Missing msg returns 422 | 2.1 to 2.3 | | |
| 3. Over-long msg returns 422 | 3.1 to 3.5 | | |
| 4. Pydantic response schema | 4.1 to 4.4 | | |

Overall result: [ ] PASS  [ ] FAIL

Tester: ____________  Date: ____________
