# UAT Script: TEST-06 Echo endpoint

This feature has no screen in the app. Every check runs against the backend directly, in the browser's address bar, in `curl`, and in FastAPI's interactive docs (Swagger UI), which is the closest thing to a UI the endpoint has.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- A browser and a terminal with `curl` and `python3`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running.
3. Open `http://localhost:8010/api/version`; it shows a `version` value, confirming the backend answers on port 8010.

## Steps

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a browser, open `http://localhost:8010/api/echo?msg=hello` | The page shows exactly `{"echo":"hello"}` (the browser may pretty-print it as `echo: "hello"`) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:8010/docs`, expand `GET /api/echo`, click "Try it out", type `hello` in `msg` and click "Execute" | "Server response" shows Code `200` and Response body `{"echo": "hello"}` | [ ] Pass [ ] Fail |
| 3 | In the same panel replace `msg` with `hello world` and click "Execute" | The Request URL shows `msg=hello%20world`, the Code is `200` and the body is `{"echo": "hello world"}` (the text comes back exactly as sent) | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | In a browser, open `http://localhost:8010/api/echo` (no query string) | A JSON body whose `detail` list has one entry with `"type": "missing"`, `"loc": ["query", "msg"]` and `"msg": "Field required"`; not an "Internal Server Error" page and not an `echo` body | [ ] Pass [ ] Fail |
| 5 | In a terminal run `curl -i http://localhost:8010/api/echo` | The first line reads `HTTP/1.1 422 Unprocessable Entity` (or `422 Unprocessable Content`, depending on the server version), never `500` or `200` | [ ] Pass [ ] Fail |
| 6 | In Swagger UI (`http://localhost:8010/docs`), on `GET /api/echo` click "Try it out", leave `msg` empty and click "Execute" | Swagger refuses to send and marks `msg` as required, confirming the parameter is declared required in the OpenAPI schema | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422, bound declared in the schema

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | In a terminal run `python3 -c "print('a' * 201)"` and copy the 201-character line of `a`s it prints | A line of 201 `a` characters is printed | [ ] Pass [ ] Fail |
| 8 | In Swagger UI, on `GET /api/echo` click "Try it out", paste that 201-character value into `msg` and click "Execute" | Code `422`; the Response body's `detail` entry shows `"type": "string_too_long"`, `"loc": ["query", "msg"]` and `"ctx": {"max_length": 200}` | [ ] Pass [ ] Fail |
| 9 | Run `python3 -c "print('a' * 200)"`, paste that 200-character value into `msg` instead and click "Execute" (edge case) | Code `200`; the body is `{"echo": "aaa…a"}` carrying the same 200 characters (the boundary is inclusive) | [ ] Pass [ ] Fail |
| 10 | In Swagger UI expand the `msg` parameter's schema on `GET /api/echo` | It shows `string`, `maxLength: 200`, proving the bound is declared on the parameter rather than checked inside the handler | [ ] Pass [ ] Fail |

### Criterion 4: the response body is a Pydantic schema in `backend/app/schemas/`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Open `http://localhost:8010/docs` and expand `GET /api/echo` | Under Responses, `200` shows the example value `{"echo": "string"}` and its Schema tab names `EchoResponse` | [ ] Pass [ ] Fail |
| 12 | Scroll to the "Schemas" section at the bottom of the page and expand `EchoResponse` | It lists exactly one required property, `echo`, of type `string` | [ ] Pass [ ] Fail |
| 13 | Not verifiable further through a UI: open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` | `echo.py` in schemas defines `class EchoResponse(BaseModel)` and the router returns `EchoResponse(echo=msg)` with no dict literal | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 (4 criteria; step 9 is the 200-character edge case) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
