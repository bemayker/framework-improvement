# UAT Script: TEST-06 Echo endpoint

No criterion is verified through the app's UI: no frontend screen calls `GET /api/echo`. Every check reads the HTTP response directly, with `curl` in a terminal or the browser's address bar.

## Prerequisites

- [ ] The stack is running: `docker compose up -d --build` from the repo root, and `docker compose ps` shows the backend service up.
- [ ] The backend answers on `http://localhost:8010` (the port `docker-compose.yml` publishes).
- [ ] `curl` is installed, and `python3` is on the PATH (Criterion 3 only).
- [ ] `uv` is installed (Criterion 4, step 3 only).

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 1.1 | In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` | First line reads `HTTP/1.1 200 OK` and the body is `{"echo":"hello"}` | [ ] | [ ] |
| 1.2 | In a browser, open `http://localhost:8010/api/echo?msg=hello` | The page shows `{"echo":"hello"}` | [ ] | [ ] |

## Criterion 2: `GET /api/echo` with no `msg` returns 422

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 2.1 | Run `curl -i "http://localhost:8010/api/echo"` | First line reads `HTTP/1.1 422 Unprocessable Entity` (or `Unprocessable Content`); the body is a JSON object whose `detail` list has one entry with `"type":"missing"` and `"loc":["query","msg"]`. It is not a 500 and not a 200. | [ ] | [ ] |

## Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 3.1 | Run `curl -i --get --data-urlencode "msg=$(python3 -c 'print("a" * 201)')" http://localhost:8010/api/echo` (a `msg` of 201 letters `a`) | `HTTP/1.1 422`; the `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] | [ ] |
| 3.2 | Run the same command with `201` changed to `200` (a `msg` of exactly 200 letters) | `HTTP/1.1 200 OK` with `{"echo":"aaaa..."}` holding all 200 letters | [ ] | [ ] |
| 3.3 | Open `backend/app/schemas/echo.py`, then `backend/app/routers/echo.py` | `EchoQuery.msg` carries `max_length` set to `MAX_ECHO_MESSAGE_LENGTH` (200); the handler contains no `len(` call and no `if` on `msg` | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| Step | Action | Expected result | Pass | Fail |
|---|---|---|---|---|
| 4.1 | In a browser, open `http://localhost:8010/docs` and expand `GET /api/echo` | Under Responses, the 200 response shows the `EchoResponse` schema with one string field `echo` | [ ] | [ ] |
| 4.2 | Open `backend/app/routers/echo.py` | The route declares `response_model=EchoResponse` and returns `EchoResponse(...)`, not a dict literal | [ ] | [ ] |
| 4.3 | Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The summary line reports no failed or errored test and the command exits 0 | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|---|---|---|
| 1. Echo returns 200 with `{"echo": "hello"}` | 1.1 to 1.2 | [ ] Pass  [ ] Fail |
| 2. Missing `msg` returns 422 | 2.1 | [ ] Pass  [ ] Fail |
| 3. `msg` over 200 characters returns 422 | 3.1 to 3.3 | [ ] Pass  [ ] Fail |
| 4. Response defined by a Pydantic schema | 4.1 to 4.3 | [ ] Pass  [ ] Fail |

Tester: ____________  Date: ____________  Overall: [ ] Pass  [ ] Fail
