# UAT Script: TEST-06 Echo endpoint

This feature has no UI. Every criterion is verified against the HTTP response of `http://localhost:8010/api/echo`, read either in the browser (which renders a JSON response body directly) or with `curl`, which is how the status code is read exactly. Both routes are given per criterion; either one is sufficient.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- The stack is up (`docker compose up -d --build` from the repository root) and the backend answers on `http://localhost:8010`; confirm with `http://localhost:8010/api/version`, which must render a JSON body containing a `version` key.
- No other process bound to host port `8010` (backend). The mapping comes from `docker-compose.yml`.
- A terminal with `curl`.
- Step 8 only (criterion 3's length bound): a way to produce a long string. `python3` on the host is sufficient (see step 8).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` service reports running.

## Steps

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/echo?msg=hello` in the browser | The page renders exactly `{"echo":"hello"}` and nothing else | [ ] Pass [ ] Fail |
| 2 | In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The first response line reads `HTTP/1.1 200 OK` and the body is `{"echo":"hello"}` | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/api/echo?msg=task%20notes` in the browser | The page renders `{"echo":"task notes"}`, confirming the value is echoed verbatim rather than a fixed string | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422

Prerequisites: same as criterion 1.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `http://localhost:8010/api/echo` in the browser, with no query string at all | The page renders a JSON body whose top-level key is `detail`, containing one entry with `"loc": ["query","msg"]` and `"type": "missing"` | [ ] Pass [ ] Fail |
| 5 | In a terminal, run `curl -i "http://localhost:8010/api/echo"` | The first response line reads `HTTP/1.1 422 Unprocessable Entity`. It must not read 200, and must not read 500 | [ ] Pass [ ] Fail |
| 6 | In a terminal, run `curl -i "http://localhost:8010/api/echo?msg="` | The first response line reads `HTTP/1.1 200 OK` and the body is `{"echo":""}`: an empty `msg` is present and therefore valid, which is what distinguishes "missing" from "empty" | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422, with the bound declared rather than hand-rolled

Prerequisites: same as criterion 1, plus a way to produce a long string. Run `python3 -c "print('a'*201)"` and copy its output; that is the 201-character value used below. Run `python3 -c "print('a'*200)"` for the 200-character value.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=<the 201-character value>"`, pasting the copied string in place of the placeholder | The first response line reads `HTTP/1.1 422 Unprocessable Entity`, and the body's `detail` entry names `"loc": ["query","msg"]` with a `string_too_long` type mentioning a maximum of 200 | [ ] Pass [ ] Fail |
| 8 | In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=<the 200-character value>"` | The first response line reads `HTTP/1.1 200 OK` and the body echoes all 200 characters, confirming the boundary is inclusive and the rejection starts at 201 | [ ] Pass [ ] Fail |
| 9 | Open `http://localhost:8010/docs` in the browser and expand `GET /api/echo` | The `msg` parameter is shown as required with a maximum length of 200. This is the observable check for the "stated in the schema, not enforced by a hand-rolled check" half of the criterion: a hand-rolled `if` in the handler would produce the same 422 in step 7 but would leave no bound in this generated documentation | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict

This criterion is structural and cannot be fully verified through a running UI; two observable checks stand in for it.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Open `http://localhost:8010/openapi.json` in the browser and search for `EchoResponse` | The schema is present under `components.schemas` with a single property `echo` of type `string`, and the 200 response of `/api/echo` references it. A bare dict return would produce no named schema here | [ ] Pass [ ] Fail |
| 11 | Open `backend/app/schemas/echo.py` in the repository | The file exists and defines `class EchoResponse(BaseModel)` with the field `echo: str`, and `backend/app/routers/echo.py` names it as `response_model=EchoResponse` on the route decorator | [ ] Pass [ ] Fail |

### Edge case: the 200-character boundary is inclusive

Covered by step 8 above (the 200-character request), which belongs to criterion 3's boundary and is not repeated here as a separate step.

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
