# UAT script: TEST-06 Echo endpoint

`GET /api/echo?msg={text}` returns the text it was given. No frontend consumes it, so every check is an HTTP request read with `curl` or a source/docs inspection.

## Prerequisites

- [ ] Docker is running.
- [ ] Repository is on branch `feature/TEST-06-echo-endpoint`.
- [ ] From the repository root, run `docker compose up -d --build`, then `docker compose ps` until `db` is healthy and `backend` is running.
- [ ] The backend answers on `http://localhost:8010` (the `8010:8010` mapping in `docker-compose.yml`).
- [ ] `curl` and `python3` are available in the terminal.

Note on status lines: the reason phrase after `422` depends on the server's HTTP library (`Unprocessable Entity` or `Unprocessable Content`). The status code `422` is what counts.

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`

### Step 1.1
Run `curl -i "http://localhost:8010/api/echo?msg=hello"`.

**Expected:** the first response line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.

- [ ] Pass
- [ ] Fail

### Step 1.2
Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"`.

**Expected:** `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`: the encoded space comes back decoded.

- [ ] Pass
- [ ] Fail

## Criterion 2: `GET /api/echo` with no `msg` returns 422

### Step 2.1
Run `curl -i "http://localhost:8010/api/echo"`.

**Expected:** the first response line shows status `422` (not 500, not 200), and the body is a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

- [ ] Pass
- [ ] Fail

## Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema

### Step 3.1
Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"`.

**Expected:** status `422`, with the first `detail` entry showing `"type":"string_too_long"` and `"ctx":{"max_length":200}`.

- [ ] Pass
- [ ] Fail

### Step 3.2
Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"`.

**Expected:** `HTTP/1.1 200 OK`, and the body's `echo` value is the 200 letters `a` sent.

- [ ] Pass
- [ ] Fail

### Step 3.3
Open `backend/app/routers/echo.py`.

**Expected:** the handler body only builds and returns `EchoResponse`; it has no `len(` call and no `HTTPException`, and the bound appears only as `Query(max_length=ECHO_MSG_MAX_LENGTH)`, with `ECHO_MSG_MAX_LENGTH = 200` defined in `backend/app/schemas/echo.py`.

- [ ] Pass
- [ ] Fail

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

### Step 4.1
Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo`.

**Expected:** the 200 response's schema is named `EchoResponse` with one string property `echo`, and the `msg` query parameter is marked required.

- [ ] Pass
- [ ] Fail

### Step 4.2
Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py`.

**Expected:** the schema file defines `class EchoResponse(BaseModel)` with the field `echo: str`, and the router returns `EchoResponse(echo=msg)` rather than a dict literal.

- [ ] Pass
- [ ] Fail

### Step 4.3
From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py`.

**Expected:** the summary line reports `0 failed` for those three files.

- [ ] Pass
- [ ] Fail

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. `?msg=hello` returns 200 with `{"echo": "hello"}` | 1.1, 1.2 | [ ] Pass / [ ] Fail |
| 2. No `msg` returns 422 | 2.1 | [ ] Pass / [ ] Fail |
| 3. `msg` over 200 characters returns 422, declared bound | 3.1, 3.2, 3.3 | [ ] Pass / [ ] Fail |
| 4. Body defined by a Pydantic schema | 4.1, 4.2, 4.3 | [ ] Pass / [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass / [ ] Fail
