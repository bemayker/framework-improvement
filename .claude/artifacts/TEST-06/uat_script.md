# UAT Script: TEST-06 Echo endpoint

None of the four acceptance criteria is verifiable through the UI: no frontend consumes `GET /api/echo`, so the observable check for each is the HTTP response itself, read with `curl` or a browser address bar. Two criteria (3 and 4) are about the endpoint's *declaration* rather than its behaviour, so they are additionally read off the OpenAPI document the backend serves at `/openapi.json`, which is where a hand-rolled check would fail to appear.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`, service `backend`.
- The `db` service state is irrelevant to this endpoint: `GET /api/echo` opens no database connection and answers whether or not PostgreSQL is up. Do not stop or start `db` for this script.
- No root `.env` file is required. `docker-compose.yml` carries usable defaults for every variable it substitutes.
- A terminal with `curl`, and `python3` on the host (used only in steps 6 and 7 to build the long query strings).
- A browser, for the optional steps 3, 12 and 13.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The first response line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 2 | Read the response body | Exactly `{"echo":"hello"}` — the supplied text returned verbatim, with no other fields | [ ] Pass [ ] Fail |
| 3 | (Optional) Open `http://localhost:8010/api/echo?msg=hello` in a browser | The page shows `{"echo":"hello"}` | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422, the standard validation response

Prerequisites: criterion 1 just verified, stack still up.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `curl -i "http://localhost:8010/api/echo"` | The first response line reads `HTTP/1.1 422 Unprocessable Entity`. Starlette may spell the reason phrase `Unprocessable Content`; the status code 422 is what counts | [ ] Pass [ ] Fail |
| 5 | Read the response body | A JSON object with a `detail` array whose single entry has `"loc":["query","msg"]` and `"type":"missing"` — FastAPI's standard validation shape. It is not a 500 and not an empty 200 | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422, with the bound declared in the schema

Prerequisites: stack still up; `python3` available on the host (used only to build the long string).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201, end="")')"` (a `msg` of 201 `a` characters) | The first response line reads `HTTP/1.1 422 ...`, and the body's `detail[0]` has `"type":"string_too_long"` and `"loc":["query","msg"]` | [ ] Pass [ ] Fail |
| 7 | Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200, end="")')"` (exactly 200 characters, the boundary) | `HTTP/1.1 200 OK` with body `{"echo":"aaaa...a"}` containing 200 `a` characters — the boundary value is accepted, not rejected | [ ] Pass [ ] Fail |
| 8 | Run `curl -s http://localhost:8010/openapi.json` (or open the URL in a browser) and locate `paths` → `/api/echo` → `get` → `parameters` → the entry with `"name":"msg"` | The entry has `"in":"query"` and `"required":true`, and its `schema` carries `"maxLength":200`. This is the declared bound; a check hand-rolled in the handler would not appear here | [ ] Pass [ ] Fail |
| 9 | Open `backend/app/routers/echo.py` in the repository | The handler body contains no `len(` comparison and no `HTTPException`; the only length reference is the `Query(max_length=ECHO_MSG_MAX_LENGTH)` declaration on the `msg` parameter, and the body is a single `return` statement | [ ] Pass [ ] Fail |

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict

Prerequisites: stack still up; repository checked out.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Open `backend/app/schemas/echo.py` in the repository | It defines `class EchoResponse(BaseModel)` with a single field `echo: str`, alongside the module constant `ECHO_MSG_MAX_LENGTH = 200` | [ ] Pass [ ] Fail |
| 11 | Open `backend/app/routers/echo.py` | The route decorator reads `@router.get("/echo", response_model=EchoResponse)` and the handler returns `EchoResponse(echo=msg)`, not a dict literal | [ ] Pass [ ] Fail |
| 12 | Read `http://localhost:8010/openapi.json` again | `components` → `schemas` contains `EchoResponse` with property `echo` of type `string`, and `paths` → `/api/echo` → `get` → `responses` → `200` → `content` → `application/json` → `schema` reads `{"$ref":"#/components/schemas/EchoResponse"}` | [ ] Pass [ ] Fail |
| 13 | (Optional) Open `http://localhost:8010/docs` in a browser and, under the `echo` tag, expand `GET /api/echo` | The 200 response's "Example Value \| Schema" toggle names the schema `EchoResponse`, and the `msg` parameter is shown as required with a maximum length of 200 | [ ] Pass [ ] Fail |

## Summary

| Criterion | Steps | Result | Notes |
|-----------|-------|--------|-------|
| 1. `?msg=hello` returns 200 `{"echo": "hello"}` | 1-3 | [ ] Pass [ ] Fail | |
| 2. Missing `msg` returns 422, standard validation body | 4-5 | [ ] Pass [ ] Fail | |
| 3. `msg` over 200 characters returns 422, bound declared in the schema | 6-9 | [ ] Pass [ ] Fail | |
| 4. Response body defined by a Pydantic schema | 10-13 | [ ] Pass [ ] Fail | |
| Edge case: exactly 200 characters returns 200 | 7 | [ ] Pass [ ] Fail | |

| Item | Result |
|------|--------|
| Total steps | 13 (10 required, 3 optional browser checks: 3, 13, and the browser form of 8) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
