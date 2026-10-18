# UAT Script: TEST-06 Echo endpoint

Backend-only feature: no screen consumes `/api/echo`, so every check is a terminal `curl`, a browser address bar, or a file read.

## Prerequisites

- Docker running.
- Repository on branch `feature/TEST-06-echo-endpoint` (or `main` once merged).
- From the repository root run `docker compose up -d --build`, then `docker compose ps` until the `backend` service shows running.
- The backend answers on `http://localhost:8010` (published by `docker-compose.yml`).
- Criterion 4 step 3 only: `uv` installed and backend dependencies synced (`uv sync --directory backend`).

The two long values used in Criterion 3 are the digits `0123456789` repeated. The 200-character value is that block 20 times; the 201-character value is the same plus a trailing `X`.

## Criterion 1: GET /api/echo?msg=hello returns 200 with a body whose only field echo holds hello

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 1.1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` | First response line is `HTTP/1.1 200 OK`; `content-type` header is `application/json` | [ ] | [ ] |
| 1.2 | Read the body under the headers | Exactly one JSON field, `echo`, with value `hello`, and nothing else | [ ] | [ ] |
| 1.3 | Open `http://localhost:8010/api/echo?msg=hello%20world` in a browser | Page shows JSON with `echo` holding `hello world` (the `%20` is decoded) | [ ] | [ ] |

## Criterion 2: GET /api/echo with no msg returns 422, the standard validation response

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 2.1 | Run `curl -i "http://localhost:8010/api/echo"` | First response line is `HTTP/1.1 422 Unprocessable Entity` (never 500, never 200) | [ ] | [ ] |
| 2.2 | Read the body | A `detail` list with one entry whose `type` is `missing` and whose `loc` is `query`, `msg` | [ ] | [ ] |

## Criterion 3: msg longer than 200 characters returns 422, the bound stated in the schema

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 3.1 | Run `curl -i "http://localhost:8010/api/echo?msg=01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789"` (200 characters) | `HTTP/1.1 200 OK`; `echo` holds the same 200-character string (boundary accepted) | [ ] | [ ] |
| 3.2 | Run the same command with a trailing `X` on the value (201 characters) | `HTTP/1.1 422 Unprocessable Entity`; `detail` entry has `type` `string_too_long`, `loc` `query`, `msg`, and `ctx.max_length` 200 | [ ] | [ ] |
| 3.3 | Open `backend/app/schemas/echo.py` | `EchoQuery.msg` is declared with `Field(max_length=ECHO_MSG_MAX_LENGTH)` and `ECHO_MSG_MAX_LENGTH = 200` | [ ] | [ ] |
| 3.4 | Open `backend/app/routers/echo.py` | The handler has no `len(` call, no length comparison and no `HTTPException`; it only returns `EchoResponse(echo=query.msg)` | [ ] | [ ] |

## Criterion 4: the response body is defined by a Pydantic schema in backend/app/schemas/

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| 4.1 | Open `backend/app/schemas/echo.py` | `class EchoResponse(BaseModel)` with the single field `echo: str` | [ ] | [ ] |
| 4.2 | Open `backend/app/routers/echo.py` | Decorator declares `response_model=EchoResponse`, `EchoResponse` is imported from `app.schemas.echo`, and the handler returns an `EchoResponse` instance, not a dict literal | [ ] | [ ] |
| 4.3 | From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` | `0 failed` across those three files | [ ] | [ ] |
| 4.4 | Open `http://localhost:8010/docs` and expand `GET /api/echo` | The 200 response schema is `EchoResponse` with field `echo` (string); `msg` is a required query parameter with maximum length 200 | [ ] | [ ] |

## Additional checks (edge cases)

| # | Step | Expected result | Pass | Fail |
|---|------|-----------------|------|------|
| E.1 | Run `curl -i "http://localhost:8010/api/echo?msg="` | `HTTP/1.1 200 OK`; `echo` is the empty string | [ ] | [ ] |
| E.2 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world%26more"` | `HTTP/1.1 200 OK`; `echo` is `hello world&more` | [ ] | [ ] |
| E.3 | Run `curl -i -X POST "http://localhost:8010/api/echo?msg=hello"` | `HTTP/1.1 405 Method Not Allowed` | [ ] | [ ] |

## Summary

| Criterion | Steps | Result |
|-----------|-------|--------|
| 1. 200 with echo body | 1.1 to 1.3 | [ ] Pass  [ ] Fail |
| 2. Missing msg returns 422 | 2.1 to 2.2 | [ ] Pass  [ ] Fail |
| 3. Over 200 characters returns 422 | 3.1 to 3.4 | [ ] Pass  [ ] Fail |
| 4. Pydantic response schema | 4.1 to 4.4 | [ ] Pass  [ ] Fail |
| Edge cases | E.1 to E.3 | [ ] Pass  [ ] Fail |

Tester: ______________  Date: ______________  Overall: [ ] Pass  [ ] Fail
