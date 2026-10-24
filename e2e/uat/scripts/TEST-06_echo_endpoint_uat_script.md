# UAT Script, TEST-06: Echo endpoint

Prerequisites (shared by every block): Docker running; repository on branch `feature/TEST-06-echo-endpoint`; nothing else bound to host port 8010; the stack up via `docker compose up -d --build` from the repository root; `docker compose ps` shows the `backend` service running; a terminal with `curl`. This feature has no UI, so every check is an HTTP or terminal check against `http://localhost:8010`.

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
1. Run `curl -i "http://localhost:8010/api/echo?msg=hello"`. Expected: the first line reads `HTTP/1.1 200 OK`.
2. Read the body printed after the headers. Expected: exactly `{"echo":"hello"}`.
3. Open `http://localhost:8010/api/echo?msg=hello` in a browser. Expected: the page shows the JSON `{"echo":"hello"}`.

## Criterion 2: `GET /api/echo` with no `msg` returns 422, the standard validation response
1. Run `curl -i "http://localhost:8010/api/echo"`. Expected: the first line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200).
2. Read the body. Expected: a JSON object with a `detail` list whose first entry has `"type":"missing"`, `"loc":["query","msg"]` and `"msg":"Field required"`.

## Criterion 3: `msg` longer than 200 characters returns 422, bound declared in the schema
Extra prerequisite: `python3` on the host to build the long strings.
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` (201 letters `a`). Expected: `HTTP/1.1 422 Unprocessable Entity`, and `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"` (exactly 200 letters `a`). Expected: `HTTP/1.1 200 OK`, and the body's `echo` value is the same 200-letter string.
3. Open `http://localhost:8010/docs` and expand `GET /api/echo`. Expected: the `msg` parameter is shown as required, with a maximum length of 200.
4. Open `backend/app/routers/echo.py`. Expected: the handler contains no `len(` check and raises no exception of its own; the limit appears only as `Query(max_length=ECHO_MSG_MAX_LENGTH)`.

## Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`
1. Open `http://localhost:8010/docs`, expand `GET /api/echo` and look at the 200 response. Expected: its schema is named `EchoResponse`, with one string field `echo`.
2. Open `backend/app/schemas/echo.py`. Expected: it defines `class EchoResponse(BaseModel)` with `echo: str`, and `backend/app/routers/echo.py` returns an `EchoResponse`, not a dict.

## All criteria: automated tests
Extra prerequisite: `uv` installed on the host.
1. From the repository root run `uv run --directory backend pytest -q tests/integration/test_echo_integration.py tests/unit/test_main_unit.py`. Expected: the summary line reports `0 failed`.
