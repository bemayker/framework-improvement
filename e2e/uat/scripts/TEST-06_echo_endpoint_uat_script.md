# UAT Script: TEST-06 Echo endpoint

None of the four criteria can be verified through the UI: no frontend screen calls `GET /api/echo`. The observable check is the HTTP response, read with `curl` against the backend the compose stack publishes on host port `8010` (`docker-compose.yml`).

## Prerequisites (all criteria)
- Docker running.
- From the repository root on branch `feature/TEST-06-echo-endpoint`, run `docker compose up -d --build`, then wait until `docker compose ps` shows `backend` running and `db` healthy.
- A terminal with `curl` and `python3`.

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
- [ ] 1.1 Run `curl -i "http://localhost:8010/api/echo?msg=hello"`. Expected: first line `HTTP/1.1 200 OK`, `content-type` header `application/json`.
- [ ] 1.2 Read the body under the headers. Expected: exactly `{"echo":"hello"}`.
- [ ] 1.3 Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"`. Expected: body exactly `{"echo":"hello world"}` (the URL-encoded space is decoded and echoed unchanged).

## Criterion 2: `GET /api/echo` with no `msg` returns 422
- [ ] 2.1 Run `curl -i "http://localhost:8010/api/echo"`. Expected: first line `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200).
- [ ] 2.2 Read the body. Expected: a `detail` array with one entry whose `type` is `missing`, `loc` is `["query","msg"]` and `msg` is `Field required`.

## Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema
- [ ] 3.1 Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` (201 letters `a`). Expected: first line `HTTP/1.1 422 Unprocessable Entity`.
- [ ] 3.2 Read the body. Expected: a `detail` entry with `type` `string_too_long`, `loc` `["query","msg"]`, `msg` `String should have at most 200 characters` and `ctx` `{"max_length":200}`.
- [ ] 3.3 Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"` (exactly 200 letters `a`). Expected: `HTTP/1.1 200 OK`, and the body's `echo` value is the same 200 letters.
- [ ] 3.4 Open `backend/app/routers/echo.py` in an editor. Expected: the handler only builds the response, with no `len(` call and no `if` on `msg`; the bound appears as `Query(max_length=ECHO_MSG_MAX_LENGTH)` on the parameter, and `ECHO_MSG_MAX_LENGTH = 200` is defined in `backend/app/schemas/echo.py`.

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
- [ ] 4.1 Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo`. Expected: the 200 response shows the schema `EchoResponse` with one field `echo` of type string, and the `msg` parameter shows as required with `maxLength 200`.
- [ ] 4.2 Open `backend/app/schemas/echo.py` in an editor. Expected: `class EchoResponse(BaseModel)` with a single field `echo: str`; `backend/app/routers/echo.py` declares `response_model=EchoResponse` and returns an `EchoResponse(...)` instance, not a dict literal.
- [ ] 4.3 Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py`. Expected: `0 failed`.

## Summary

| # | Criterion | Steps | Pass | Fail |
|---|---|---|---|---|
| 1 | `?msg=hello` returns 200 `{"echo": "hello"}` | 1.1 to 1.3 | [ ] | [ ] |
| 2 | No `msg` returns 422 | 2.1 to 2.2 | [ ] | [ ] |
| 3 | `msg` over 200 characters returns 422, bound in schema | 3.1 to 3.4 | [ ] | [ ] |
| 4 | Response defined by a Pydantic schema | 4.1 to 4.3 | [ ] | [ ] |

Tester: ______________  Date: ______________
