# UAT Script: TEST-06 Echo endpoint

None of the four acceptance criteria is verifiable through the application's UI: no frontend consumes `GET /api/echo`. The observable check is the HTTP response itself, read with `curl`, plus FastAPI's generated Swagger UI at `/docs` for criterion 4, which a person can read in a browser. Two steps (3.4 and 4.5) read source files, because the "declared, not hand-checked" half of criteria 3 and 4 is observable only there.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (backend) or `5442` (database); both mappings come from `docker-compose.yml`.
- No root `.env` file is required. `docker-compose.yml` carries usable defaults for every variable it substitutes and sets the backend's `DATABASE_URL` itself.
- A terminal with `curl`, and `python3` on the host to build the 200- and 201-character strings used in criterion 3.
- A browser, for criterion 4 steps 1 to 3.
- **The `db` service is irrelevant to this endpoint but is still needed to start the stack.** `GET /api/echo` opens no database connection and answers whether or not PostgreSQL is reachable, exactly as `GET /api/version` does. The compose `backend` service nevertheless declares `depends_on: db: condition: service_healthy`, so the container will not start until `db` reports healthy. Bring the whole stack up as below and ignore `db` from then on.

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
| 1.1 | In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` | The first response line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json` | [ ] Pass [ ] Fail |
| 1.2 | Read the response body | Exactly `{"echo":"hello"}` — the text sent, returned unchanged, and nothing else in the object | [ ] Pass [ ] Fail |
| 1.3 | Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` | `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`: the percent-encoded space was decoded and the text returned verbatim, with no trimming or escaping. This is the "query-string handling works end to end" half of the criterion | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422, the standard validation response

Prerequisites: the shared prerequisites above.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Run `curl -i "http://localhost:8010/api/echo"` | The first response line reads `HTTP/1.1 422 Unprocessable Entity` (a future FastAPI or Python release may spell the reason phrase `Unprocessable Content`; the code `422` is what matters). It is neither a `500` nor an empty `200` | [ ] Pass [ ] Fail |
| 2.2 | Read the response body | A JSON object whose `detail` list has a single entry with `"type":"missing"` and `"loc":["query","msg"]`, in the shape `{"detail":[{"type":"missing","loc":["query","msg"],"msg":"Field required","input":null}]}`. The `msg` wording is pydantic's and is not part of the contract; `type` and `loc` are | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422, with the bound declared rather than hand-checked

Prerequisites: the shared prerequisites above, including `python3` on the host.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | Build the boundary strings, then send the 200-character one: <br>`MSG200=$(python3 -c "print('a'*200, end='')")` <br>`MSG201=$(python3 -c "print('a'*201, end='')")` <br>`curl -i "http://localhost:8010/api/echo?msg=$MSG200"` | `HTTP/1.1 200 OK` with a body of the form `{"echo":"aaa…a"}` containing exactly 200 `a` characters: 200 is the maximum and is accepted (the boundary edge case) | [ ] Pass [ ] Fail |
| 3.2 | Run `curl -i "http://localhost:8010/api/echo?msg=$MSG201"` | `HTTP/1.1 422 Unprocessable Entity`: 201 characters is the first rejected length | [ ] Pass [ ] Fail |
| 3.3 | Read the response body from step 3.2 | `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}` | [ ] Pass [ ] Fail |
| 3.4 | Open `backend/app/routers/echo.py` in an editor | The handler declares `msg: Annotated[str, Query(max_length=ECHO_MESSAGE_MAX_LENGTH)]` and its body is the single statement `return EchoResponse(echo=msg)`. There is no `len(`, no `if` and no `HTTPException` anywhere in the file: the rejection in steps 3.2 and 3.3 came from the framework, not from a check written here. The constant is imported from `app.schemas.echo`, so the bound has one source | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: the shared prerequisites above, including a browser.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | Open `http://localhost:8010/docs` in the browser | The Swagger UI loads and lists a `GET /api/echo` operation under the `echo` tag | [ ] Pass [ ] Fail |
| 4.2 | Expand `GET /api/echo` and read its `200` response | The example body is `{"echo": "string"}` and the schema link names `EchoResponse`. The `msg` query parameter is listed as required, with a maximum length of 200 | [ ] Pass [ ] Fail |
| 4.3 | Scroll to the `Schemas` section at the bottom of the page and expand `EchoResponse` | It is listed with one required property, `echo`, of type `string`, and no others | [ ] Pass [ ] Fail |
| 4.4 | In a terminal, run `curl -s http://localhost:8010/openapi.json` and read the JSON | At `paths."/api/echo".get.responses."200".content."application/json".schema."$ref"` the value is `#/components/schemas/EchoResponse`, and `components.schemas.EchoResponse.properties` has exactly one key, `echo` | [ ] Pass [ ] Fail |
| 4.5 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` in an editor | The schema module defines `class EchoResponse(BaseModel)` with the single field `echo: str` (alongside `ECHO_MESSAGE_MAX_LENGTH: int = 200`), and the router returns `EchoResponse(echo=msg)` — an instance of that model, not a bare dict | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 (3 + 2 + 4 + 5) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
