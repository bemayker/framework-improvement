# UAT script, TEST-06: Echo endpoint

No criterion is verifiable through the UI: no frontend consumes `GET /api/echo`. The observable check is the HTTP response itself, read with `curl` against the backend at `http://localhost:8010` (the host port `docker-compose.yml` publishes; use the port your stack reports if a handover rebuild moved it).

## Prerequisites

- [ ] The stack is running (`docker compose up -d`).
- [ ] `curl -i http://localhost:8010/api/version` answers `HTTP/1.1 200 OK`.
- [ ] `curl` is installed.

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | First line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}` | [ ] | [ ] |
| 1.2 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` | `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`, showing the query string is decoded end to end | [ ] | [ ] |

## Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -i "http://localhost:8010/api/echo"` | First line reads `HTTP/1.1 422 Unprocessable Entity` (never 500, never 200), and the body is a `detail` list whose entry has `"type":"missing"` and `"loc":["query","msg"]` | [ ] | [ ] |

## Criterion 3: `msg` longer than 200 characters returns 422

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -i "http://localhost:8010/api/echo?msg=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"` (201 letters `a`) | `HTTP/1.1 422 Unprocessable Entity`, and the `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] | [ ] |
| 3.2 | Remove one `a` from the URL (200 letters) and run it again | `HTTP/1.1 200 OK` with the 200 letters echoed back under `echo` | [ ] | [ ] |
| 3.3 | Open `backend/app/routers/echo.py` | The handler contains no length check; the bound appears only as `max_length` in `backend/app/schemas/echo.py` | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` | The 200 response's schema is named `EchoResponse` with one string field `echo` | [ ] | [ ] |
| 4.2 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` | The schema file defines `class EchoResponse(BaseModel)` with `echo: str`, and the router declares `response_model=EchoResponse` and returns an `EchoResponse`, not a dict | [ ] | [ ] |
| 4.3 | Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The run ends with `0 failed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. 200 with `{"echo": "hello"}` | 1.1, 1.2 | [ ] Pass  [ ] Fail |
| 2. Missing `msg` returns 422 | 2.1 | [ ] Pass  [ ] Fail |
| 3. Over 200 characters returns 422 | 3.1, 3.2, 3.3 | [ ] Pass  [ ] Fail |
| 4. Response defined by a Pydantic schema | 4.1, 4.2, 4.3 | [ ] Pass  [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass  [ ] Fail
