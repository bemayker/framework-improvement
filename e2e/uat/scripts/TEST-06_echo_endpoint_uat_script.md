# UAT script: TEST-06 Echo endpoint

`GET /api/echo?msg={text}` returns the text it was given. No acceptance criterion is verifiable through the application UI, because no frontend screen consumes the endpoint. The observable check is the HTTP response, read with `curl` against the compose stack, plus the backend's interactive docs page for criterion 4.

## Prerequisites

- Docker is running.
- The repository is on branch `feature/TEST-06-echo-endpoint` (or `main` once merged).
- From the repository root, `docker compose up -d --build` has completed and `docker compose ps` shows the `backend` service running.
- The backend is published on host port `8010` (from `docker-compose.yml`).
- A terminal with `curl` and `python3`.
- `curl` prints JSON without spaces, so `{"echo":"hello"}` on screen is the same body as `{"echo": "hello"}` below.

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The first response line reads `HTTP/1.1 200 OK` | [ ] | [ ] |
| 1.2 | Read the last line of the output (the body) | Exactly `{"echo": "hello"}`, with a `content-type: application/json` header above it | [ ] | [ ] |
| 1.3 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` | `HTTP/1.1 200 OK` with body `{"echo": "hello world"}`, showing the URL-encoded space was decoded end to end | [ ] | [ ] |

## Criterion 2: `GET /api/echo` with no `msg` returns 422, the standard validation response

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -i "http://localhost:8010/api/echo"` | The first response line reads `HTTP/1.1 422 Unprocessable Entity` (never `500`, never `200`) | [ ] | [ ] |
| 2.2 | Read the body | A `detail` list whose single entry has `"type": "missing"`, `"loc": ["query", "msg"]` and `"msg": "Field required"` | [ ] | [ ] |

## Criterion 3: `msg` longer than 200 characters returns 422; the bound is stated in the schema

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `python3 -c "print('a' * 201, end='')" \| curl -s -i -G --data-urlencode "msg@-" "http://localhost:8010/api/echo"` (sends `msg` as 201 letters `a`) | `HTTP/1.1 422 Unprocessable Entity` | [ ] | [ ] |
| 3.2 | Read the body | One `detail` entry with `"type": "string_too_long"`, `"loc": ["query", "msg"]` and `"ctx": {"max_length": 200}` | [ ] | [ ] |
| 3.3 | Run the same command with `201` replaced by `200` | `HTTP/1.1 200 OK` and a body whose `echo` value is the 200 letters `a`, confirming the bound is inclusive at 200 | [ ] | [ ] |
| 3.4 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` | The `msg` parameter is marked required and shows `maxLength: 200`, the schema-level declaration the criterion asks for | [ ] | [ ] |
| 3.5 | Open `backend/app/routers/echo.py` in the editor | The length bound appears only as `Query(max_length=ECHO_MSG_MAX_LENGTH)` on the parameter; the handler body contains no `len(` check | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Open `http://localhost:8010/docs`, expand `GET /api/echo` and look at the 200 response | Its schema is named `EchoResponse` with one string property `echo` | [ ] | [ ] |
| 4.2 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` | The schema file defines `class EchoResponse(BaseModel)` with `echo: str`; the router declares `response_model=EchoResponse` and returns an `EchoResponse`, not a dict | [ ] | [ ] |
| 4.3 | Run `uv run --directory backend pytest -q tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. Echo returns 200 with `{"echo": "hello"}` | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. Missing `msg` returns 422 | 2.1 to 2.2 | [ ] Pass  [ ] Fail |
| 3. `msg` over 200 characters returns 422, bound in the schema | 3.1 to 3.5 | [ ] Pass  [ ] Fail |
| 4. Response body is a Pydantic schema | 4.1 to 4.3 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
