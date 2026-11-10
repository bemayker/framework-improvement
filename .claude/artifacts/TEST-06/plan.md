# Implementation Plan, TEST-06: Echo endpoint

## Feature
> A small backend feature for the assisted lifecycle (Arm C of measured run 2). Deliberately narrow: one router, one schema, its tests.
>
> ## What
>
> `GET /api/echo?msg={text}` returns the text it was given, so a caller can prove the API is reachable and that query-string handling works end to end.
>
> ## Acceptance criteria
>
> 1. `GET /api/echo?msg=hello` returns **200** with body `{"echo": "hello"}`.
> 2. `GET /api/echo` with no `msg` returns **422**, the framework's standard validation response, rather than a 500 or an empty 200.
> 3. `msg` longer than 200 characters returns **422**. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
>
> ## Notes
>
> Follows the shape TEST-02 established: a router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. It touches `main.py`'s router registration, so it must not run concurrently with another item that does the same.

## Acceptance Criteria
- [ ] 1. `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`.
- [ ] 2. `GET /api/echo` with no `msg` returns 422, the framework's standard validation response, rather than a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns 422. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker), 2026-09-07: "Reset to to do on 2026-09-07 for measured run 3 ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: precondition checked on this branch (cut from origin/main at 76cf593) before planning. No echo code exists: `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`; `backend/app/schemas/` holds no `echo.py`; `backend/app/main.py` registers only the version, notes and health routers; `git grep -i echo origin/main -- backend frontend e2e` matches only an unrelated docstring in `backend/tests/integration/test_notes_integration.py`. Main does not hold the feature (the later echo commits, the last being ea5f29a, were removed by subsequent sandbox resets), so planning proceeds and this plan builds the endpoint from nothing.
- Comment (tracker), 2026-09-03: "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. ..." → Addressed by: criterion 3 is planned as 422, and the bound is declared declaratively through FastAPI's `Query(max_length=...)`, reading its value from a constant that lives in the schema module (see Backend Plan). Its remark that "the code on feature/TEST-06-echo-endpoint already satisfies it" is not acted on because it described the measured-run-2 branch; this branch holds no echo code (see the 2026-09-07 line).
- Comment (tracker), 2026-09-03: "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → not acted on because the newer comment of the same day explicitly withdraws it as a measured-run probe, and comments are read newest first. No custom 400 handler and no `{"error": ...}` body are planned.
- Comment (tracker), 24 framework link comments "mayker-dev: plan PR opened for TEST-06 ..." (PRs #23 to #667, all closed) → not acted on because they record earlier plan PRs and ask for nothing.

## Plan Overview
A backend-only addition, in the shape TEST-02 and TEST-05 established: one new router `backend/app/routers/echo.py` exposing `GET /api/echo`, one new Pydantic response schema `EchoResponse` in `backend/app/schemas/echo.py`, registration of the router in `create_app()` in `backend/app/main.py`, and unit and integration tests. No service layer, repository, model or migration: the endpoint carries no business logic and no persistence, and `coding_standards/backend_frontend.md` Section 2.2 puts query-parameter validation in the router via schemas. No frontend change, no external API, no new dependency.

Assumptions recorded (no blocking question, per `user_story_alignment.md` Section 2 step 3):
1. "The bound is stated in the schema" (criterion 3) is read as: the 200-character limit is declared, not checked imperatively. It is declared on the query parameter with `Query(max_length=ECHO_MSG_MAX_LENGTH)`, the form the 2026-09-03 retraction names, and the value `ECHO_MSG_MAX_LENGTH = 200` is defined once in `backend/app/schemas/echo.py` next to `EchoResponse`, so the endpoint's schema module is the single place the number lives and the generated OpenAPI schema shows `maxLength: 200` on `msg`. The handler contains no `len()` check and no `HTTPException`.
2. Exactly 200 characters is within the bound and returns 200; 201 is the first rejected length.
3. An empty `msg` (`/api/echo?msg=`) is present, so it returns 200 with `{"echo": ""}`. No `min_length` is added: no criterion asks for one (`user_story_alignment.md` Section 3).
4. Leading and trailing whitespace is returned unchanged by default, and no test pins it either way: TEST-11 (trim) and BUG-05 (keep) both depend on this item and specify opposite whitespace behaviour, so this plan neither trims nor asserts on whitespace, leaving that decision to them.
5. The 422 body is FastAPI's default validation response (`{"detail": [...]}`), unchanged; no custom exception handler is added.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo`, query parameter `msg` (required string, max 200 characters), returns the text it was given as `EchoResponse`.
- Schema: `backend/app/schemas/echo.py` defines `ECHO_MSG_MAX_LENGTH = 200` and `class EchoResponse(BaseModel): echo: str`, matching `backend/app/schemas/version.py`'s shape (module docstring naming the item, class docstring naming the endpoint).
- Router: `backend/app/routers/echo.py` defines `router = APIRouter(prefix="/api", tags=["echo"])` and `@router.get("/echo", response_model=EchoResponse)` on `def get_echo(msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]) -> EchoResponse`, returning `EchoResponse(echo=msg)`. No default value on `msg`, so FastAPI itself answers 422 when it is absent (criterion 2). No validation logic in the body.
- Registration: `backend/app/main.py` imports `from app.routers.echo import router as echo_router` and adds `app.include_router(echo_router)` after the existing three; the module docstring's list of registering features gains one clause for TEST-06. The factory is otherwise unchanged. CORS stays as is: `allow_methods` already includes GET.
- Service layer: none (no business logic to hold).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg` (string, required, 0 to 200 characters). No body.
- Response 200: `EchoResponse`, e.g. for `?msg=hello`:

```json
{"echo": "hello"}
```

- Response 422 (missing `msg`), FastAPI's default shape:

```json
{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}
```

- Response 422 (`msg` of 201 characters), FastAPI's default shape, with `detail[0].type` equal to `string_too_long`, `detail[0].loc` equal to `["query", "msg"]` and `detail[0].ctx.max_length` equal to 200.

## Technology Selection
- Length bound on `msg`: chose FastAPI's built-in `Query(max_length=...)` (installed dependency, rung 3) over a hand-rolled `len()` check in the handler, because the criterion forbids the hand-rolled check and the declarative bound also produces the standard 422 and the OpenAPI `maxLength` for free.
- Response schema `EchoResponse`: chose a Pydantic `BaseModel` (pydantic, installed with FastAPI, rung 3) over a bare dict, because criterion 4 requires it; no stdlib type gives FastAPI's response validation and OpenAPI schema.
- Router `backend/app/routers/echo.py`: chose FastAPI's `APIRouter` (installed, rung 3); no stdlib or platform feature serves HTTP routes in this stack.
- Missing-parameter handling: chose FastAPI's required-parameter validation (installed, rung 3) over a custom check, because it already returns the standard 422 criterion 2 asks for.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH` constant and `EchoResponse` Pydantic response schema (criteria 3 and 4)
- [B] backend/app/routers/echo.py: `GET /api/echo` router with the declared `msg` bound (criteria 1 to 3)
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoResponse` and the router function in isolation
- [B] backend/tests/integration/test_echo_integration.py: HTTP request/response tests for all four criteria
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script build-feature writes

### Modified files
- [B] backend/app/main.py: import and register the echo router in `create_app()`; docstring names TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`, matching the existing version and health registration tests

No lockfile changes: no dependency is added or changed. No README.md or docs/DEVELOPMENT.md changes: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints.

## Testing Strategy
- Unit tests (`backend/tests/unit/test_echo_unit.py`): `EchoResponse(echo="hello").model_dump() == {"echo": "hello"}` (happy path); `EchoResponse(echo="")` serialises the empty string (edge); `EchoResponse()` with no `echo` raises `pydantic.ValidationError` (error); `get_echo("hello")` called directly returns an `EchoResponse` instance whose `echo` is `"hello"` (router function returns the schema, not a dict, criterion 4). In `backend/tests/unit/test_main_unit.py`, `test_create_app_registers_echo_route` asserts `/api/echo` is among the custom route paths, reusing `_collect_route_paths` and `BUILT_IN_ROUTE_PATHS`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (test_echo_unit.py)
- Integration tests (`backend/tests/integration/test_echo_integration.py`, using the session-scoped `client` fixture from `backend/tests/conftest.py`; no database is touched):
  - `test_get_echo_returns_200_with_the_message` : `?msg=hello` gives 200 and exactly `{"echo": "hello"}` (criterion 1).
  - `test_get_echo_decodes_the_query_string` : `params={"msg": "hello world & more"}` gives 200 with the decoded text back, proving query-string handling end to end (criterion 1 edge case).
  - `test_get_echo_without_msg_returns_422` : no query string gives 422 with `detail[0].type == "missing"` and `detail[0].loc == ["query", "msg"]` (criterion 2).
  - `test_get_echo_accepts_msg_of_exactly_200_characters` : `"a" * 200` gives 200 and echoes it (criterion 3 boundary).
  - `test_get_echo_with_msg_over_200_characters_returns_422` : `"a" * 201` gives 422 with `detail[0].type == "string_too_long"` and `detail[0].ctx["max_length"] == 200` (criterion 3).
  - `test_openapi_declares_msg_max_length_and_echo_response_schema` : `client.get("/openapi.json")` shows the `msg` parameter of `GET /api/echo` as required with `schema.maxLength == ECHO_MSG_MAX_LENGTH`, and the 200 response referencing `#/components/schemas/EchoResponse`; asserts against the imported constant rather than a second literal (criteria 3 and 4: the bound and the body are declared, not hand-rolled).
  - `test_post_echo_returns_405_method_not_allowed` : the endpoint is GET only (error case).
  - Directory: backend/tests/integration/
- E2E tests: none written. E2E is ENABLED, but no criterion involves navigation or interaction through the UI (no frontend consumes `/api/echo`), so per `testing_standards.md` Section 6 every criterion is covered at integration and unit level and no spec file is created.
  - Directory: e2e/tests/
  - File: none (would be TEST-06_echo_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case, phrased as HTTP requests and responses since there is no UI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI consumer |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | verifying it needs no navigation or interaction: it is router query-parameter validation |
| 3 | `msg` over 200 characters returns 422, bound stated in the schema | Integration | verifying it needs no navigation or interaction: it is a declared validation rule, checked through HTTP and the OpenAPI schema |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is the router function's return type and the schema's serialisation, backed by the OpenAPI integration test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/echo?msg=hello, Then the status is 200 and the body is {"echo": "hello"} |
| 2 | `GET /api/echo` with no `msg` returns 422 | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/echo with no query string, Then the status is 422 and the error names the missing msg parameter |
| 3 | `msg` over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/echo with a msg of 201 characters, Then the status is 422; and with exactly 200 characters, Then the status is 200 |
| 4 | Response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the API is running, When a client reads /openapi.json, Then GET /api/echo's 200 response references the EchoResponse schema |

## Manual verification plan
None of the four criteria is verifiable through the UI: no frontend consumes `GET /api/echo`. The observable check is the HTTP response itself, read with `curl` against the compose stack, as TEST-02's script does.

Prerequisites (all criteria): Docker running; repository on branch `feature/TEST-06-echo-endpoint`; from the repository root run `docker compose up -d --build`, then `docker compose ps` until `db` is healthy and `backend` is running; the backend answers on `http://localhost:8010` (the `8010:8010` mapping in `docker-compose.yml`); `curl` and `python3` available in the terminal.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
1. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first response line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`: the encoded space comes back decoded.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
1. Run `curl -i "http://localhost:8010/api/echo"` → the first response line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200), and the body is a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` → `HTTP/1.1 422 Unprocessable Entity`, with the first `detail` entry showing `"type":"string_too_long"` and `"ctx":{"max_length":200}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"` → `HTTP/1.1 200 OK`, and the body's `echo` value is the 200 letters `a` sent.
3. Open `backend/app/routers/echo.py` → the handler body only builds and returns `EchoResponse`; it has no `len(` call and no `HTTPException`, and the bound appears only as `Query(max_length=ECHO_MSG_MAX_LENGTH)`, with `ECHO_MSG_MAX_LENGTH = 200` defined in `backend/app/schemas/echo.py`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` → the 200 response's schema is named `EchoResponse` with one string property `echo`, and the `msg` query parameter is marked required.
2. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with the field `echo: str`, and `backend/app/routers/echo.py` returns `EchoResponse(echo=msg)` rather than a dict literal.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` from the repository root → the summary line reports `0 failed` for those three files.
