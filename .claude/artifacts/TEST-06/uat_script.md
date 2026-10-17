# UAT Script: TEST-06 Echo endpoint

No acceptance criterion is verifiable through the UI: no frontend screen calls `GET /api/echo`. The observable check is therefore the HTTP response itself, read with `curl` in a terminal (or the same URL pasted into a browser address bar).

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-06-echo-endpoint` (or, once merged, on `main`).
- No other process bound to host port `8010` (the backend port `docker-compose.yml` publishes).
- No root `.env` file is required; `docker-compose.yml` carries defaults for everything it substitutes.
- A terminal with `curl`, and `python3` to generate the long input for criterion 3.
- Step 16 only: `uv` installed on the host and the backend dependencies synced.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `backend` service reports running. The backend answers on `http://localhost:8010`.

## Steps

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -i "http://localhost:8010/api/echo?msg=hello"` and read the first response line | It reads `HTTP/1.1 200 OK` | [ ] Pass [ ] Fail |
| 2 | Read the `content-type` header of the same response | It is `application/json` | [ ] Pass [ ] Fail |
| 3 | Read the response body | A JSON object with exactly one key, `echo`, whose value is the string `hello`, and nothing else (`{"echo":"hello"}`) | [ ] Pass [ ] Fail |
| 4 | Paste `http://localhost:8010/api/echo?msg=hello` into a browser address bar | The page shows the same one-key JSON object | [ ] Pass [ ] Fail |

### Criterion 2: `GET /api/echo` with no `msg` returns 422, the standard validation response

Prerequisites: stack up as above.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `curl -i "http://localhost:8010/api/echo"` and read the first response line | The status code is `422` (the reason text after it, such as `Unprocessable Entity`, may vary with the server version). It is not 500 and not 200 | [ ] Pass [ ] Fail |
| 6 | Read the body | A JSON object with one key, `detail`, holding a list with one entry whose `type` is `missing`, whose `loc` is the list `query`, `msg`, and whose `msg` reads `Field required` | [ ] Pass [ ] Fail |
| 7 | Run `curl -i "http://localhost:8010/api/echo?msg="` (parameter present but empty) | `HTTP/1.1 200 OK` with the key `echo` holding an empty string. This is expected, not a defect: the criteria require `msg` to be present and set no minimum length | [ ] Pass [ ] Fail |

### Criterion 3: `msg` longer than 200 characters returns 422, with the bound stated in the schema

Prerequisites: stack up as above.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Run `python3 -c "print('a' * 201)"` and copy the printed line of 201 letters `a` | One line of 201 letters `a` is printed | [ ] Pass [ ] Fail |
| 9 | Run `curl -i "http://localhost:8010/api/echo?msg=PASTE"` with the copied 201 letters in place of `PASTE` | The status code is `422` | [ ] Pass [ ] Fail |
| 10 | Read the body | One `detail` entry whose `type` is `string_too_long`, whose `loc` is the list `query`, `msg`, and whose `ctx` holds `max_length` 200 | [ ] Pass [ ] Fail |
| 11 | Run `python3 -c "print('a' * 200)"` and repeat step 9 with those 200 letters | `HTTP/1.1 200 OK` and the `echo` value is the same 200 letters, so the bound is exactly 200 | [ ] Pass [ ] Fail |
| 12 | Open `http://localhost:8010/docs` in a browser, expand `GET /api/echo`, and read the `msg` parameter | It is marked required, of type string, with `maxLength` 200: the bound is stated in the published schema | [ ] Pass [ ] Fail |
| 13 | Open `backend/app/routers/echo.py` and read `get_echo` | The only statement in its body returns `EchoResponse(echo=msg)`; there is no `len(` call and no manual error response | [ ] Pass [ ] Fail |

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`

Prerequisites: stack up as above.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 14 | Open `http://localhost:8010/docs` in a browser, expand `GET /api/echo`, and read the 200 response | Its schema is named `EchoResponse` and has one required string property, `echo` | [ ] Pass [ ] Fail |
| 15 | Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` | The schema file defines `class EchoResponse(BaseModel)` with the single field `echo: str`; the route decorator names `response_model=EchoResponse` and the handler returns an `EchoResponse`, not a dict literal | [ ] Pass [ ] Fail |
| 16 | From the repository root, run `uv run --directory backend pytest -q tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` | The summary line reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 16 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
