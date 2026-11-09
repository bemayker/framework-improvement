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
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: precondition verified before planning. Current main (49d70f8) holds no echo code: `backend/app/routers/` contains only `health.py`, `notes.py`, `version.py`; `backend/app/schemas/` only `health.py`, `note.py`, `version.py`; `backend/app/main.py` registers only the version, notes and health routers; a grep for `echo` across `backend/app` and `backend/tests` matches no echo endpoint code. The revert has landed, so this plan creates the feature from nothing.
- Comment (tracker, 2026-09-03, newer of the two that day): "Retracting the previous comment. It was a measured-run probe, not a real requirement ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. The code on feature/TEST-06-echo-endpoint already satisfies it ..." → Addressed by: criterion 3 is planned as written (422, bound declared declaratively via `Query(max_length=...)` fed from the schema module's constant). The sentence about existing code on `feature/TEST-06-echo-endpoint` is not acted on: that branch was deleted, and the current branch was cut fresh from today's main with no echo code on it, so all code is planned from scratch.
- Comment (tracker, 2026-09-03, older): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on: the newer comment above explicitly retracts it as a measured-run probe and reinstates criterion 3's 422. No custom 400 handler and no `{"error": ...}` body is planned.

## Plan Overview
One read-only backend endpoint, `GET /api/echo`, following the router-plus-schema shape of `backend/app/routers/version.py` and `backend/app/schemas/version.py`:

- New schema module `backend/app/schemas/echo.py`: the `EchoResponse` Pydantic model (`echo: str`) and the bound constant `ECHO_MSG_MAX_LENGTH = 200`.
- New router `backend/app/routers/echo.py`: `APIRouter(prefix="/api", tags=["echo"])` with one handler taking `msg: str = Query(max_length=ECHO_MSG_MAX_LENGTH)` (required, no default) and returning `EchoResponse(echo=msg)`. FastAPI's own request validation produces both 422s (criteria 2 and 3); the handler contains no `if len(...)` check and no exception handling.
- `backend/app/main.py`: one import and one `app.include_router(echo_router)` line; the module docstring's list of registered routers gains TEST-06.
- Tests: integration tests through the real HTTP cycle for criteria 1 to 3, and unit tests for the schema (criterion 4), the declared bound (criterion 3's "stated in the schema" half) and the route registration.

No frontend, no database, no service layer, no new dependency.

Assumptions (recorded per `user_story_alignment.md`, not blocking):
- **No service module.** The handler has no business logic to put in one (it returns its input unchanged), and the feature text asks for "one router, one schema, its tests". `coding_standards.md`'s layered architecture keeps business logic out of routers; there is none here, so a pass-through service would be an empty layer. The version endpoint has a service only because it reads `pyproject.toml`.
- **"The bound is stated in the schema"** is read as: the 200 limit is a declarative constraint on the parameter's declaration, which FastAPI publishes in the OpenAPI schema as `maxLength: 200` and enforces before the handler runs. The constant lives in `backend/app/schemas/echo.py` so the number is defined in the schemas package, and the router passes it to `Query(max_length=...)`, exactly what the retraction comment names.
- **The value is echoed verbatim**: no trimming, no case change, no normalisation. Whitespace handling is the subject of TEST-11 and BUG-05 (which contradict each other) and is out of this item's scope.
- **An empty `msg` (`?msg=`) is not specified** by any criterion. With no `min_length` declared it returns 200 with `{"echo": ""}`. No test asserts this, so a later item can change it freely.
- **The 422 body is FastAPI's default** `{"detail": [...]}` validation shape, unmodified; criterion 2 calls it "the framework's standard validation response".

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}` returns the given text in `{"echo": "<text>"}`. `msg` is a required query string parameter, max 200 characters; a missing or over-long `msg` is rejected with FastAPI's standard 422 before the handler runs.
- Service layer: none (see Plan Overview assumption: no logic to hold).
- Repository layer: none, no data access.
- Migrations: none.

Implementation detail for the builder:
- `backend/app/schemas/echo.py`: module docstring `"""Response schema and query bound for the echo endpoint (TEST-06)."""`; `ECHO_MSG_MAX_LENGTH = 200`; `class EchoResponse(BaseModel)` with field `echo: str` and a docstring `Response body for GET /api/echo.`
- `backend/app/routers/echo.py`: module docstring `"""Router for GET /api/echo (TEST-06)."""`; `router = APIRouter(prefix="/api", tags=["echo"])`; `@router.get("/echo", response_model=EchoResponse)` on `def get_echo(msg: str = Query(max_length=ECHO_MSG_MAX_LENGTH)) -> EchoResponse`, body `return EchoResponse(echo=msg)`. A `Query(...)` with no default makes the parameter required, which is criterion 2. `Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]` is an equivalent spelling and is acceptable.
- `backend/app/main.py`: add `from app.routers.echo import router as echo_router` beside the other router imports and `app.include_router(echo_router)` after the health router; add "and TEST-06 the echo router" to the module docstring's registration sentence. Nothing else in the factory changes (CORS `allow_methods` already includes GET).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string parameter `msg` (string, required, 1 to 200 characters in practice; at most 200 characters is the only declared constraint). No body, no headers required.
- Response:
  - 200, `EchoResponse`: `{"echo": "hello"}` for `?msg=hello`; `{"echo": "hello world"}` for `?msg=hello%20world`.
  - 422 when `msg` is absent, FastAPI default: `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}`
  - 422 when `msg` exceeds 200 characters, FastAPI default: `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "input": "aaa...a", "ctx": {"max_length": 200}}]}`
  - 405 for any other method (FastAPI default; not a criterion, not tested beyond what already exists for siblings).

## Technology Selection
- Request validation of `msg` (presence and the 200-character bound): chose FastAPI's declarative `Query(max_length=...)` (installed dependency, rung 3) over a hand-rolled length check in the handler, because the framework already validates and returns the standard 422 and criterion 3 forbids a handler check.
- `EchoResponse` schema: chose a Pydantic `BaseModel` (installed via FastAPI, rung 3) over a bare dict or a stdlib dataclass, because criterion 4 requires a Pydantic schema and it is what `response_model` serialises.
- Echo router: no stdlib call, native platform feature or installed dependency provides an echo route, so it is built here as one FastAPI `APIRouter`, the same shape as the existing routers.
- No new dependency is introduced; `backend/pyproject.toml` and `backend/uv.lock` are unchanged.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `EchoResponse` Pydantic model (`echo: str`) and the `ECHO_MSG_MAX_LENGTH = 200` bound (criteria 3 and 4)
- [B] backend/app/routers/echo.py: `GET /api/echo` router; `msg` declared as `Query(max_length=ECHO_MSG_MAX_LENGTH)`, returns `EchoResponse` (criteria 1 to 3)
- [B] backend/tests/unit/test_echo_schema_unit.py: unit tests for `EchoResponse` serialisation, the bound constant, and the bound published on the route's OpenAPI parameter (criteria 3 and 4)
- [B] backend/tests/integration/test_echo_integration.py: router integration tests through the full HTTP cycle (criteria 1 to 3)
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)

### Modified files
- [B] backend/app/main.py: import and register the echo router; docstring names TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the custom route paths

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` changes: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither document enumerates API endpoints.

## Testing Strategy
- Unit tests: the schema module and the app factory wiring, no HTTP.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_echo_schema_unit.py`, plus one new case in the existing `test_main_unit.py`
  - `test_echo_response_serialises_to_echo_field`: `EchoResponse(echo="hello").model_dump() == {"echo": "hello"}` (happy path, criterion 4).
  - `test_echo_response_rejects_missing_echo_field`: `EchoResponse()` raises `pydantic.ValidationError` (error case).
  - `test_echo_msg_max_length_is_200`: `ECHO_MSG_MAX_LENGTH == 200` (edge: the bound's value).
  - `test_echo_route_publishes_msg_max_length_in_openapi`: from `create_app().openapi()`, the `get` operation on `/api/echo` has a `msg` query parameter with `required: true` and `schema.maxLength == ECHO_MSG_MAX_LENGTH`. This proves the bound is declared on the parameter (criterion 3's "stated in the schema") rather than inside the handler.
  - `test_create_app_registers_echo_route` in `test_main_unit.py`, same shape as the existing version and health cases.
- Integration tests: the router through the real HTTP request/response cycle, using the session-scoped `client` fixture from `backend/tests/conftest.py` (the endpoint needs no database; with `DATABASE_URL` unset the app lifespan only warns, as for the version endpoint).
  - Directory: backend/tests/integration/
  - File: `test_echo_integration.py`
  - `test_get_echo_returns_200_with_the_message`: `GET /api/echo?msg=hello` gives 200 and exactly `{"echo": "hello"}` (criterion 1).
  - `test_get_echo_decodes_an_encoded_query_string`: `client.get("/api/echo", params={"msg": "hello world"})` gives 200 and `{"echo": "hello world"}` (query-string handling end to end, an edge of criterion 1).
  - `test_get_echo_without_msg_returns_422`: `GET /api/echo` gives 422, and `response.json()["detail"][0]` has `type == "missing"` and `loc == ["query", "msg"]` (criterion 2, proves it is the standard validation response, not a 500 or an empty 200).
  - `test_get_echo_accepts_a_msg_of_exactly_200_characters`: `msg = "a" * 200` gives 200 and `{"echo": msg}` (boundary, criterion 3).
  - `test_get_echo_with_msg_over_200_characters_returns_422`: `msg = "a" * 201` gives 422, and `detail[0]` has `type == "string_too_long"` and `loc == ["query", "msg"]` (criterion 3).
  - Lengths are built from `ECHO_MSG_MAX_LENGTH` (`"a" * ECHO_MSG_MAX_LENGTH` and `+ 1`) imported from the schema, so the tests assert the resolution, not a duplicated literal.
- E2E tests: not warranted. E2E Tests is ENABLED, but no criterion involves navigation or interaction through the UI: there is no frontend consumer of `/api/echo` and none is in scope. Testing the endpoint directly from Playwright would be an E2E test bypassing the UI, which `testing_standards.md` lists as an anti-pattern. No spec file is created.
  - Directory: e2e/tests/ (unused by this feature)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus one edge-case scenario (exactly 200 characters accepted), verifying the HTTP response with a client against the running backend, as `e2e/uat/scenarios/TEST-02_health_endpoint.feature` does.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | Verifying it needs no navigation or interaction: no UI consumes the endpoint, it is a router request/response behaviour |
| 2 | `GET /api/echo` without `msg` returns 422, the standard validation response | Integration | Verifying it needs no navigation or interaction: it is a request-validation behaviour of the router |
| 3 | `msg` over 200 characters returns 422; bound stated in the schema, not the handler | Integration (the 422 and the 200-character boundary) and Unit (the bound published as `maxLength` on the parameter) | Verifying it needs no navigation or interaction: it is a validation rule plus a declaration check |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a schema definition, checked on the model and through criterion 1's exact body |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET "/api/echo?msg=hello", Then the status is 200 and the body is {"echo": "hello"} |
| 2 | `GET /api/echo` without `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET "/api/echo" with no query string, Then the status is 422 and the body's detail names the missing query parameter "msg" |
| 3 | `msg` over 200 characters returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client sends GET "/api/echo" with a msg of 201 characters, Then the status is 422 with detail type "string_too_long"; edge: a msg of exactly 200 characters returns 200 |
| 4 | Response defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When a client reads the OpenAPI document at "/openapi.json", Then the 200 response of GET /api/echo references the "EchoResponse" schema with a string property "echo" |

## Manual verification plan
None of the four criteria is verifiable through the UI: no frontend screen calls `GET /api/echo`. The observable check is the HTTP response itself, read with `curl` against the backend that `docker-compose.yml` publishes on `http://localhost:8010`.

Common prerequisites for every block: Docker running; repository on branch `feature/TEST-06-echo-endpoint` (or `main` once merged); from the repository root run `docker compose up -d --build` and wait until `docker compose ps` shows the `backend` service running; a terminal with `curl`.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
Prerequisites: the common prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → `HTTP/1.1 200 OK` and body exactly `{"echo":"hello world"}` (the encoded space is decoded, proving query-string handling end to end).

### Criterion 2: `GET /api/echo` with no `msg` returns 422, the standard validation response
Prerequisites: the common prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first line reads `HTTP/1.1 422 Unprocessable Entity` (never `500`, never `200`).
2. Read the body → `{"detail":[{"type":"missing","loc":["query","msg"],"msg":"Field required","input":null}]}`: FastAPI's standard validation shape naming the missing `msg` query parameter.

### Criterion 3: `msg` longer than 200 characters returns 422, the bound stated in the schema
Prerequisites: the common prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(head -c 201 < /dev/zero | tr '\0' a)"` (a msg of 201 letters `a`) → `HTTP/1.1 422 Unprocessable Entity`, and the body's `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=$(head -c 200 < /dev/zero | tr '\0' a)"` (exactly 200 letters `a`) → `HTTP/1.1 200 OK` and the body is `{"echo":"` followed by the same 200 letters and `"}`.
3. Run `curl -s http://localhost:8010/openapi.json` and find the `parameters` entry of `paths["/api/echo"].get` (or open `http://localhost:8010/docs` in a browser and expand `GET /api/echo`) → the `msg` parameter is marked required and its schema carries `"maxLength":200`, showing the bound is declared on the parameter, not checked in the handler.
4. Open `backend/app/routers/echo.py` → the handler body is a single `return EchoResponse(echo=msg)`, with no `len(` check and no `raise`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the common prerequisites above.
1. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with one field `echo: str`.
2. Open `backend/app/routers/echo.py` → the route is declared with `response_model=EchoResponse` and returns an `EchoResponse`, not a dict literal.
3. Run `curl -s http://localhost:8010/openapi.json` and look under `components.schemas` → an `EchoResponse` schema exists with a required string property `echo`, and `paths["/api/echo"].get.responses["200"]` references it.
4. Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` → the run reports `0 failed`.
