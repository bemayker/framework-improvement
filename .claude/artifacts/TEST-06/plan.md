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
<!-- First plan. The item carries 38 tracker comments: 35 are the framework's own "mayker-dev: plan PR opened for TEST-06" link comments for since-closed plan PRs, which ask for nothing and are not acted on. The other three are recorded below, newest first. -->
- Comment (tracker), 2026-09-07: "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: precondition verified, not a change to the plan. On `feature/TEST-06-echo-endpoint` (branched from current `origin/main` at 2ded6408) there is no `backend/app/routers/echo.py`, no `backend/app/schemas/echo.py`, no echo test and no echo registration in `backend/app/main.py` (a grep for `echo` across `backend/app`, `backend/tests` and `e2e` finds only an unrelated docstring in `test_notes_integration.py`). The feature is absent from main, so the plan is written against a main that does not hold it, which is what the comment requires.
- Comment (tracker), 2026-09-03: "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. ... No action needed on this item." → Addressed by: criterion 3 is planned as 422 with a declarative bound, exactly as the description states. The comment's `Query(max_length=...)` phrase describes how the since-reverted PR #23 declared the bound; the same comment says the criterion "stands as written in the description", whose wording is "stated in the schema". Assumption recorded: the plan declares the bound in a Pydantic query-parameter model in `backend/app/schemas/echo.py` (`Field(max_length=200)`), bound to the router with `Annotated[EchoQuery, Query()]`. That satisfies both readings: it is declarative, FastAPI validates it before the handler runs, it returns the standard 422, and the bound literally lives in the schema the criterion names. Fallback, only if the installed FastAPI rejects a query-parameter model: `msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]` with the constant imported from `backend/app/schemas/echo.py`, listed as a deviation in the PR description.
- Comment (tracker), 2026-09-03 (older): "A msg longer than 200 characters should return 400 with a {\"error\": \"...\"} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer comment above explicitly retracts it as a measured-run probe. Criterion 3 keeps 422 and FastAPI's standard validation body; no custom 400 handler is planned.

## Plan Overview
Backend only. One new router `backend/app/routers/echo.py` exposing `GET /api/echo`, one new schema module `backend/app/schemas/echo.py` holding the query model (`EchoQuery`, carrying the 200-character bound) and the response model (`EchoResponse`), registration of the router in `backend/app/main.py`'s `create_app()`, and unit plus integration tests. No database, no service layer, no frontend, no external API, no new dependency.

Decision (scope, recorded): no service module. `coding_standards.md` Section 2.2 puts business logic in the service and query parameter validation via schemas in the router; echoing a validated string back has no business logic, and the item text scopes the work to "one router, one schema, its tests". TEST-05's `version_service.py` exists because it reads `pyproject.toml`; there is no equivalent here, so an `echo_service.py` would be a pass-through layer with nothing in it.

Assumption (recorded, no gold plating): an empty value (`GET /api/echo?msg=`) is a present `msg` of length 0 and returns 200 with `{"echo": ""}`. No criterion asks for a minimum length, so none is added. Characters are counted as Python string length (Pydantic's `max_length` on `str`), so 200 multibyte characters pass and 201 fail.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo` with required query parameter `msg` (string, at most 200 characters). Returns `EchoResponse` with status 200. Router built like `backend/app/routers/version.py`: `router = APIRouter(prefix="/api", tags=["echo"])`, `@router.get("/echo", response_model=EchoResponse)`, handler signature `def get_echo(query: Annotated[EchoQuery, Query()]) -> EchoResponse` returning `EchoResponse(echo=query.msg)`. The handler holds no length check, no `if` and no `HTTPException`: missing and over-long `msg` are rejected by FastAPI's request validation before the handler runs (criteria 2 and 3).
- Schemas (`backend/app/schemas/echo.py`): `ECHO_MSG_MAX_LENGTH = 200`; `class EchoQuery(BaseModel)` with `msg: str = Field(max_length=ECHO_MSG_MAX_LENGTH)` (required, no default); `class EchoResponse(BaseModel)` with `echo: str`. Module and class docstrings in the style of `schemas/version.py`.
- Registration: in `backend/app/main.py`, import `from app.routers.echo import router as echo_router` beside the existing router imports and add `app.include_router(echo_router)` after the existing three `include_router` calls. Extend the module docstring's list of registering features with TEST-06. Nothing else in `create_app()` or `lifespan` changes.
- Service layer: none (see the decision under Plan Overview).
- Repository layer: none; the endpoint touches no database.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg`, required, string, maximum 200 characters. No body, no headers required.
- Response 200: `{"echo": "<msg as received, URL-decoded>"}`, e.g. `GET /api/echo?msg=hello` returns `{"echo": "hello"}`.
- Response 422 (missing `msg`), FastAPI's standard body: `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`.
- Response 422 (`msg` over 200 characters), FastAPI's standard body: `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "ctx": {"max_length": 200}, ...}]}`.
- OpenAPI: the 200 response references the `EchoResponse` component schema.

## Technology Selection
- Query-string validation (presence and 200-character bound): chose Pydantic's `Field(max_length=...)` on a query-parameter model, read through FastAPI's `Query()`, both already installed (fastapi 0.139.2, pydantic 2.13.4 in `backend/uv.lock`), over a hand-written length check in the handler, which criterion 3 rules out and which would not produce the framework's standard 422.
- `EchoQuery` and `EchoResponse` schemas: chose Pydantic `BaseModel`, already installed and the pattern `schemas/version.py` and `schemas/health.py` use, over a bare dict or a dataclass, which criterion 4 rules out.
- Echo router: no stdlib call, native platform feature or installed dependency covers an HTTP route other than FastAPI's `APIRouter`, already installed, so it is built here on that.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH`, the `EchoQuery` query model with the 200-character bound, and the `EchoResponse` response model
- [B] backend/app/routers/echo.py: `GET /api/echo` router returning `EchoResponse`, validation delegated to `EchoQuery`
- [B] backend/tests/unit/test_echo_schema_unit.py: unit tests of `EchoQuery` (bound, missing field) and `EchoResponse` serialization
- [B] backend/tests/integration/test_echo_integration.py: full HTTP request/response tests of `GET /api/echo` through the session `client` fixture
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation is ENABLED)
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-06/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import the echo router, add `app.include_router(echo_router)` in `create_app()`, add TEST-06 to the module docstring
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`, same shape as the version and health route tests
No lockfile changes: the feature adds no dependency, so `backend/uv.lock` and `frontend/package-lock.json` are untouched.
No documentation changes: the feature changes no project structure, run configuration, dependency or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.
No E2E spec: no criterion needs navigation or interaction through the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: `EchoQuery` accepts a 200-character `msg`, rejects a 201-character `msg` with a `string_too_long` error, rejects a missing `msg` with a `missing` error; `EchoResponse(echo="hello").model_dump()` equals `{"echo": "hello"}`; `create_app()` registers `/api/echo`. All in-memory, no database, no HTTP.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_echo_schema_unit.py`; `test_main_unit.py` extended)
- Integration tests: the router through the real HTTP cycle with the session-scoped `client` fixture from `backend/tests/conftest.py` (no database fixture needed): 200 happy path, URL-encoded round trip, 422 on missing `msg`, 422 on 201 characters with FastAPI's standard `detail` shape (`type` `string_too_long`, `loc` `["query", "msg"]`), 200 at exactly 200 characters, and the OpenAPI 200 response referencing `EchoResponse`.
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. The E2E toggle is ENABLED, but no criterion involves navigation or interaction through the UI; the endpoint has no frontend caller (`testing_standards.md` Section 6, fourth question, asked per criterion below).
  - Directory: e2e/tests/
  - File: none (would be `TEST-06_echo_endpoint.spec.ts`; not created)
- UAT scenarios: one scenario per criterion plus one edge case (exactly 200 characters returns 200), API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | `test_get_echo_returns_200_with_msg_echoed`, `test_get_echo_round_trips_url_encoded_msg`, `test_create_app_registers_echo_route` | verifying it needs no navigation or interaction: it is a router request/response cycle with no UI caller |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | `test_get_echo_without_msg_returns_422`, `test_echo_query_rejects_missing_msg` | verifying it needs no navigation or interaction: it is request validation at the router |
| 3 | `msg` over 200 characters returns 422, bound stated in the schema | Integration | `test_get_echo_with_msg_over_200_chars_returns_422`, `test_get_echo_with_msg_of_exactly_200_chars_returns_200`, `test_echo_query_rejects_msg_over_max_length`, `test_echo_query_accepts_msg_at_max_length` | verifying it needs no navigation or interaction: it is a schema validation rule, proven at the router and on the model |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_get_echo_openapi_response_schema_is_echo_response`, `test_echo_response_serializes_to_echo_field` | verifying it needs no navigation or interaction: it is a structural property of the API contract, visible in the OpenAPI document |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo?msg=hello, Then the status is 200 and the body is {"echo": "hello"} |
| 2 | No `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo with no query string, Then the status is 422 and the body's detail names the missing query field msg |
| 3 | `msg` over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo with a msg of 201 characters, Then the status is 422 and the detail type is string_too_long; edge: a msg of exactly 200 characters returns 200 |
| 4 | Response defined by a Pydantic schema | covered at Integration, see Criterion coverage | Given the backend is running, When a client reads /openapi.json, Then the 200 response of GET /api/echo references the EchoResponse schema |

## Manual verification plan
No criterion can be verified through the UI: the endpoint has no frontend caller. Each block below uses a terminal against the running backend instead. Prerequisites for every block: the stack is up (`docker compose up -d --build` from the repository root) and the backend answers on `http://localhost:8010` (`curl -s http://localhost:8010/api/version` returns a JSON body with a `version` field).

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
1. In a terminal, run `curl -s -i "http://localhost:8010/api/echo?msg=hello"` → the status line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.
2. Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"` → the body is `{"echo":"hello world"}` (the encoded space comes back decoded).
3. Open `http://localhost:8010/api/echo?msg=hello` in a browser tab → the page shows `{"echo":"hello"}`.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
1. Run `curl -s -i "http://localhost:8010/api/echo"` → the status line reads `HTTP/1.1 422 Unprocessable Entity` (never 500 or 200).
2. Read the body of the same response → it is a JSON object with a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema
1. Run `curl -s -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` → the status line reads `HTTP/1.1 422 Unprocessable Entity` and the body's first `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
2. Run `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"` → it prints `200`.
3. Open `backend/app/routers/echo.py` → the handler contains no length comparison, `if` or `HTTPException`; open `backend/app/schemas/echo.py` → `EchoQuery.msg` carries `Field(max_length=ECHO_MSG_MAX_LENGTH)` with `ECHO_MSG_MAX_LENGTH = 200`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
1. Open `http://localhost:8010/docs` in a browser → the `GET /api/echo` operation is listed; expand it and its 200 response shows the `EchoResponse` schema with a single string field `echo`.
2. Open `backend/app/routers/echo.py` → the route declares `response_model=EchoResponse` and returns `EchoResponse(...)`, never a dict literal.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the summary line reports no failed or errored test and the command exits 0.
