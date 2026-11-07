# UAT Script, TEST-06: Echo endpoint

No frontend screen consumes `GET /api/echo`, so every check reads the HTTP response itself with `curl` against the compose stack (backend published on host port `8010`), plus the OpenAPI document and the code for criterion 4.

## Prerequisites
- [ ] Docker is running
- [ ] Repository is on branch `feature/TEST-06-echo-endpoint`
- [ ] From the repository root: `docker compose up -d --build`, then `docker compose ps` until `backend` reports running
- [ ] A terminal with `curl` and `python3`

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
- [ ] 1.1 Run `curl -i "http://localhost:8010/api/echo?msg=hello"`. Expected: first line `HTTP/1.1 200 OK`.
- [ ] 1.2 Read the body. Expected: exactly `{"echo":"hello"}`.
- [ ] 1.3 Run `curl -s "http://localhost:8010/api/echo?msg=a%26b%3Dc%20d"`. Expected: body `{"echo":"a&b=c d"}`, showing the encoded query string was decoded end to end.

## Criterion 2: `GET /api/echo` with no `msg` returns 422
- [ ] 2.1 Run `curl -i "http://localhost:8010/api/echo"`. Expected: first line `HTTP/1.1 422 Unprocessable Entity` (never 500, never 200).
- [ ] 2.2 Read the body. Expected: a JSON object with a `detail` array whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

## Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema
- [ ] 3.1 Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` (201 letters `a`). Expected: `HTTP/1.1 422 Unprocessable Entity`; `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
- [ ] 3.2 Run the same command with `"a"*200` (200 letters). Expected: `HTTP/1.1 200 OK` with the 200 letters echoed back in `echo`.
- [ ] 3.3 Run `curl -i "http://localhost:8010/api/echo?msg="` (empty msg). Expected: `HTTP/1.1 200 OK` with body `{"echo":""}`.
- [ ] 3.4 Open `backend/app/routers/echo.py`. Expected: `msg` is declared with `Query(max_length=ECHO_MSG_MAX_LENGTH)`, the constant is `200` in `backend/app/schemas/echo.py`, and the handler body contains no length check.

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
- [ ] 4.1 Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo`. Expected: the 200 response shows the `EchoResponse` schema with one string field `echo`, and `msg` is marked required with max length 200.
- [ ] 4.2 Open `backend/app/schemas/echo.py`. Expected: `class EchoResponse(BaseModel)` with `echo: str`; `backend/app/routers/echo.py` declares `response_model=EchoResponse` and returns `EchoResponse(echo=msg)`, not a dict.
- [ ] 4.3 From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py`. Expected: the run ends with `0 failed`.

## Summary

| Criterion | Steps | Pass | Fail | Notes |
|---|---|---|---|---|
| 1. msg echoed with 200 | 1.1 to 1.3 | | | |
| 2. missing msg gives 422 | 2.1 to 2.2 | | | |
| 3. over 200 characters gives 422 | 3.1 to 3.4 | | | |
| 4. Pydantic response schema | 4.1 to 4.3 | | | |
