# UAT Script: TEST-06 Echo endpoint

`GET /api/echo?msg={text}` returns the text it was given. No acceptance criterion is verifiable through the application UI (no frontend page calls `/api/echo`), so every check reads the HTTP response with `curl`, plus the API docs page for criterion 4.

## Prerequisites

- Docker running.
- Repository on branch `feature/TEST-06-echo-endpoint` (or `main` once merged).
- From the repository root run `docker compose up -d --build`, then wait until `docker compose ps` shows `backend` running.
- Host port 8010 free (the backend mapping in `docker-compose.yml`).
- A terminal with `curl` and `python3`.

## Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | First line reads `HTTP/1.1 200 OK`; header `content-type: application/json` is present | [ ] | [ ] |
| 1.2 | Read the body of the same response | Body is exactly `{"echo":"hello"}` (FastAPI omits the space; same JSON as `{"echo": "hello"}`) | [ ] | [ ] |
| 1.3 | Run `curl -i -G http://localhost:8010/api/echo --data-urlencode "msg=hello world & more"` | Status 200 and body `{"echo":"hello world & more"}`, proving query-string decoding works end to end | [ ] | [ ] |

## Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -i http://localhost:8010/api/echo` | First line reads `HTTP/1.1 422 Unprocessable Entity` (never `500`, never `200`) | [ ] | [ ] |
| 2.2 | Read the body | JSON object with a `detail` array whose first entry has `"type":"missing"` and `"loc":["query","msg"]` | [ ] | [ ] |

## Criterion 3: `msg` longer than 200 characters returns 422

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `python3 -c "print('a'*201, end='')" > /tmp/echo_msg_201.txt`, then `wc -c /tmp/echo_msg_201.txt` | `wc` prints `201` | [ ] | [ ] |
| 3.2 | Run `curl -i -G http://localhost:8010/api/echo --data-urlencode msg@/tmp/echo_msg_201.txt` | `HTTP/1.1 422 Unprocessable Entity`; first `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] | [ ] |
| 3.3 | Run `python3 -c "print('a'*200, end='')" > /tmp/echo_msg_200.txt`, then `curl -i -G http://localhost:8010/api/echo --data-urlencode msg@/tmp/echo_msg_200.txt` | `HTTP/1.1 200 OK`; the body's `echo` value is the 200 letters `a` (boundary accepted) | [ ] | [ ] |
| 3.4 | Open `backend/app/routers/echo.py` in an editor | The handler contains no `len(` call and no length comparison; the bound appears only as `ECHO_MSG_MAX_LENGTH = 200` and `Query(max_length=ECHO_MSG_MAX_LENGTH)` in `backend/app/schemas/echo.py` | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | In a browser open `http://localhost:8010/docs` | Swagger UI lists `GET /api/echo` under the `echo` tag | [ ] | [ ] |
| 4.2 | Expand `GET /api/echo` and open its `200` response's Schema tab | Schema is named `EchoResponse` with one required string property `echo` | [ ] | [ ] |
| 4.3 | Scroll to the Schemas section at the bottom of the page | `EchoResponse` is listed | [ ] | [ ] |
| 4.4 | Open `backend/app/routers/echo.py` in an editor | The route declares `response_model=EchoResponse` and returns `EchoResponse(echo=msg)`, not a dict literal; `EchoResponse` is imported from `app.schemas.echo` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. Echo returns 200 `{"echo": "hello"}` | 1.1 - 1.3 | [ ] Pass  [ ] Fail |
| 2. Missing `msg` returns 422 | 2.1 - 2.2 | [ ] Pass  [ ] Fail |
| 3. `msg` over 200 characters returns 422 | 3.1 - 3.4 | [ ] Pass  [ ] Fail |
| 4. Response defined by a Pydantic schema | 4.1 - 4.4 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
