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

## Plan Overview
Backend only. One new schema module `backend/app/schemas/echo.py` holding two Pydantic models: `EchoQuery` (the query string, `msg: str` with `Field(max_length=ECHO_MSG_MAX_LENGTH)`, where `ECHO_MSG_MAX_LENGTH = 200`) and `EchoResponse` (`echo: str`). One new router `backend/app/routers/echo.py` (`APIRouter(prefix="/api", tags=["echo"])`) exposing `GET /echo`, which takes the query as a FastAPI query-parameter model (`query: Annotated[EchoQuery, Query()]`) and returns `EchoResponse(echo=query.msg)`, with `response_model=EchoResponse`. The router is registered in `create_app()` in `backend/app/main.py` after the existing three `include_router` calls. FastAPI's own request validation produces the 422 for a missing `msg` (criterion 2) and for one over 200 characters (criterion 3); the handler contains no check of its own.

Assumptions (recorded per `user_story_alignment.md` Section 4, no blocking question):
- No service layer. The handler holds no business logic (it copies one validated field into the response model), there is no persistence, and the item text names exactly "one router, one schema, its tests". `backend_frontend.md` Section 2.2 scopes Router, Service, Repository to a backend "with data persistence" and lets the plan decide which layers exist. Adding an `echo_service.py` would be a module with no logic in it.
- The bound is applied to `msg` as received, after URL decoding, and counts Python characters (code points): exactly 200 characters is accepted, 201 is rejected. That is Pydantic's `max_length` semantics for `str`.
- No minimum length: `GET /api/echo?msg=` (present but empty) returns 200 with `{"echo": ""}`. The criteria only reject an absent `msg`; adding a `min_length` would be gold plating.
- No whitespace stripping or other transformation of `msg`: the endpoint returns exactly what it received.
- The bound is stated in the schema by declaring the query as a Pydantic model (FastAPI query-parameter models, available in the installed FastAPI 0.139.2), rather than as `Query(max_length=200)` in the router signature, which would put the bound in the router, against criterion 3's wording.
- No CORS change: the existing middleware already allows `GET`, and no frontend consumes this endpoint.
- No E2E spec: no criterion involves navigation or interaction through the UI (see Criterion coverage).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo`, query parameter `msg` (required string, at most 200 characters). Returns the text it was given as `{"echo": msg}`. Purpose: prove the API is reachable and that query-string handling works end to end.
- Schemas: `backend/app/schemas/echo.py` with `ECHO_MSG_MAX_LENGTH = 200`, `class EchoQuery(BaseModel): msg: str = Field(max_length=ECHO_MSG_MAX_LENGTH)` and `class EchoResponse(BaseModel): echo: str`. Module and class docstrings in the shape of `backend/app/schemas/version.py`.
- Router: `backend/app/routers/echo.py`, `router = APIRouter(prefix="/api", tags=["echo"])`, `@router.get("/echo", response_model=EchoResponse)`, `def get_echo(query: Annotated[EchoQuery, Query()]) -> EchoResponse: return EchoResponse(echo=query.msg)`. No hand-rolled length or presence check in the handler.
- Registration: `backend/app/main.py` imports `from app.routers.echo import router as echo_router` and adds `app.include_router(echo_router)` in `create_app()`; the module docstring's list of registering features gains TEST-06.
- Service layer: none (see the first assumption above).
- Repository layer: none, no data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg` (required, string, max length 200). No body.
- Response:
  - 200: `{"echo": "hello"}` for `GET /api/echo?msg=hello` (schema `EchoResponse`, single field `echo: str`).
  - 422 when `msg` is absent: FastAPI's standard validation body, e.g. `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`.
  - 422 when `msg` exceeds 200 characters: FastAPI's standard validation body, e.g. `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "ctx": {"max_length": 200}, ...}]}`.
  - Tests assert the status code, the `type` and the `loc` of the first detail entry, never the full human message text.

## Technology Selection
- Echo query model (`EchoQuery` in `backend/app/schemas/echo.py`): chose a Pydantic model with `Field(max_length=200)` consumed as a FastAPI query-parameter model, over a hand-rolled `len(msg) > 200` check in the handler and over `Query(max_length=200)` in the router signature, because Pydantic (already installed, 2.13.4) states the bound declaratively in the schema as criterion 3 requires and FastAPI (already installed, 0.139.2) turns its violation into the standard 422 response.
- Echo response model (`EchoResponse` in `backend/app/schemas/echo.py`): chose a Pydantic `BaseModel` over a bare dict, because criterion 4 requires it and Pydantic is already installed; no stdlib or native alternative applies.
- Echo router (`backend/app/routers/echo.py`): chose FastAPI's installed `APIRouter`, the shape `backend/app/routers/version.py` already uses; no new dependency.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH`, `EchoQuery` (query model carrying the 200-character bound) and `EchoResponse` (response body)
- [B] backend/app/routers/echo.py: `GET /api/echo` router returning `EchoResponse(echo=query.msg)`
- [B] backend/tests/unit/test_echo_schema_unit.py: unit tests for `EchoQuery` bounds and `EchoResponse` serialization
- [B] backend/tests/integration/test_echo_integration.py: router integration tests for 200, missing `msg` 422 and over-long `msg` 422
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus the 200-character boundary edge case
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/main.py: import `echo_router` and register it with `app.include_router(echo_router)` in `create_app()`; docstring lists TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`, the same shape as the existing version and health route tests

No dependency is added or changed, so no lockfile is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `EchoQuery` accepts a normal `msg`, accepts exactly 200 characters (boundary), rejects 201 characters with a `string_too_long` validation error, rejects a missing `msg`; `EchoResponse(echo="hello").model_dump()` equals `{"echo": "hello"}`; `create_app()` registers `/api/echo`. No service layer exists, so the schema is the unit under test.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (here `test_echo_schema_unit.py`; the existing `test_main_unit.py` gains one test)
- Integration tests: full HTTP request/response cycle through the session-scoped `client` fixture in `backend/tests/conftest.py`: 200 with `{"echo": "hello"}`; 422 with `loc == ["query", "msg"]` and `type == "missing"` when `msg` is absent; 422 with `type == "string_too_long"` for 201 characters; 200 for exactly 200 characters (boundary). No database is needed, so no `db_connection` or `notes_table` fixture is used.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. Toggle is ENABLED, but no acceptance criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question, asked per criterion), and no frontend consumes the endpoint. An E2E spec calling the API directly would be a router integration test (`testing_standards.md` Section 5).
  - Directory: e2e/tests/
  - File: none for this feature
- UAT scenarios: one Gherkin scenario per acceptance criterion plus the 200-character boundary edge case, phrased against the HTTP API since there is no UI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}` | Integration | `test_get_echo_returns_200_with_echoed_msg` | verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | `test_get_echo_without_msg_returns_422` | verifying it needs no navigation or interaction: it is a router validation behaviour with no UI |
| 3 | `msg` longer than 200 characters returns 422, bound stated in the schema | Unit + Integration | `test_echo_query_rejects_msg_longer_than_200_chars`, `test_echo_query_accepts_msg_of_exactly_200_chars`, `test_get_echo_with_msg_longer_than_200_chars_returns_422`, `test_get_echo_with_msg_of_exactly_200_chars_returns_200` | verifying it needs no navigation or interaction: it is a schema validation rule plus its HTTP mapping |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_echo_response_serializes_to_echo_field`, `test_echo_query_rejects_missing_msg` | verifying it needs no navigation or interaction: it is a property of the schema module, reviewed in the diff and exercised directly |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | 422 with no `msg` | covered at Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo` without `msg`, Then the status is 422 and the error names `msg` as missing |
| 3 | 422 for `msg` over 200 characters | covered at Unit + Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo` with a 201-character `msg`, Then the status is 422; and with exactly 200 characters, Then the status is 200 |
| 4 | Response defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the API documentation at `/docs`, When I open `GET /api/echo`, Then its 200 response schema is `EchoResponse` with a single string field `echo` |

## Manual verification plan
None of these criteria can be verified through the application UI: the endpoint has no frontend consumer. Each block below verifies it against the running backend over HTTP and, for criterion 4, in FastAPI's interactive docs page, which is the closest thing to a UI the endpoint has.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
Prerequisites: the stack is running (`docker compose up -d` at the repo root) and the backend answers on http://localhost:8010 (the port `docker-compose.yml` publishes).
1. In a terminal run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the status line reads `HTTP/1.1 200 OK`.
2. Read the response body → it is exactly `{"echo":"hello"}`.
3. Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"` → the body is `{"echo":"hello world"}`, showing the query string was decoded and returned unchanged.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: as for criterion 1.
1. Run `curl -i "http://localhost:8010/api/echo"` → the status line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200).
2. Read the body → it is a JSON object with a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422
Prerequisites: as for criterion 1.
1. Open http://localhost:8010/docs in a browser, expand `GET /api/echo`, click "Try it out", paste a `msg` of exactly 200 `a` characters, click "Execute" → the response code shown is 200 and the body echoes the 200 characters.
2. Add one more `a` (201 characters) to `msg` and click "Execute" again → the response code shown is 422 and the body's first `detail` entry has `"type":"string_too_long"` and `"ctx":{"max_length":200}`.
3. Open `backend/app/routers/echo.py` → the handler contains no length check; open `backend/app/schemas/echo.py` → `msg` is declared with `Field(max_length=ECHO_MSG_MAX_LENGTH)` and `ECHO_MSG_MAX_LENGTH = 200`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for criterion 1.
1. Open http://localhost:8010/docs and expand `GET /api/echo` → under Responses, code 200 shows the schema `EchoResponse` with one string field `echo`.
2. Open `backend/app/routers/echo.py` → the route declares `response_model=EchoResponse` and returns an `EchoResponse(...)`, not a dict literal.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/integration/test_echo_integration.py` → the summary line reports no failed or errored test and the command exits 0.
