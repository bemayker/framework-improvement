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
- Comment (tracker, newest): "Reset to to do on 2026-09-07 for measured run 3 ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: checked the precondition from the checkout before planning. On `feature/TEST-06-echo-endpoint` at 6c3179ea (equal to `origin/main`), `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`; there is no `backend/app/routers/echo.py`, no `backend/app/schemas/echo.py`, no `/api/echo` registration in `backend/app/main.py`, and no echo test file (a `git grep -i echo` over `backend`, `frontend/src` and `e2e` hits only a docstring word in `backend/tests/integration/test_notes_integration.py`). Git history shows the earlier echo code (`ea5f29a5 feat(TEST-06): Echo endpoint (#316)`) was removed by the sandbox reset `9dcba19b` (#326), so main does not hold the feature and the plan builds it from nothing. The specific SHAs the comment names (8794a99, ffbfc12, a9695cc) were not traced individually; what matters, an absent feature on main, was verified directly.
- Comment (tracker): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. ..." → Addressed by: criterion 3 is planned as 422, and the bound is declared declaratively as `Query(max_length=ECHO_MSG_MAX_LENGTH)` on the `msg` parameter, with the constant `ECHO_MSG_MAX_LENGTH = 200` defined in `backend/app/schemas/echo.py` so the bound lives in the schema module and appears in the generated OpenAPI schema as `maxLength: 200`. Its remark that "the code on feature/TEST-06-echo-endpoint already satisfies it" is stale: that branch was recreated from current main and holds no echo code (see the line above), so nothing is reused.
- Comment (tracker, oldest): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer retraction comment above withdraws it explicitly as a measured-run probe and restores criterion 3 as written (422). No custom exception handler and no `{"error": ...}` body are planned.
- Assumption (scope): an empty `msg` (`GET /api/echo?msg=`) is present and therefore valid, returning 200 with `{"echo": ""}`. The criteria set only an upper bound and require the parameter to be present; adding a minimum length would be gold plating (`user_story_alignment.md`, no gold plating). Recorded here rather than blocking.
- Assumption (layering): no service module is added. The endpoint has no business logic (it returns its input unchanged), and the item text scopes it to "one router, one schema, its tests"; a pass-through service would be an abstraction with nothing in it (`coding_standards.md`, KISS).

## Plan Overview
One read-only backend endpoint, `GET /api/echo`, in a new router `backend/app/routers/echo.py` registered in `backend/app/main.py`, with its response body defined by a new Pydantic schema `EchoResponse` in `backend/app/schemas/echo.py`. The required query parameter `msg` carries its 200-character bound declaratively through `Query(max_length=...)`, so FastAPI's own request validation produces the standard 422 for both a missing and an over-long `msg`; the handler contains no validation code. Tests: unit tests for the schema, the handler and the route registration, and integration tests for the full HTTP cycle. No frontend, no database, no external API.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}`, returns the given text as `{"echo": "<text>"}`.
  - Router `backend/app/routers/echo.py`: `router = APIRouter(prefix="/api", tags=["echo"])`, matching `version.py` and `health.py`.
  - Handler `get_echo(msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]) -> EchoResponse`, decorated `@router.get("/echo", response_model=EchoResponse)`, body `return EchoResponse(echo=msg)`. `msg` has no default, so it is required: a missing `msg` is FastAPI's standard 422 (criterion 2). The `max_length` is enforced by FastAPI's validation before the handler runs (criterion 3); the handler contains no `len()` check and no `HTTPException`.
  - Schema `backend/app/schemas/echo.py`: `ECHO_MSG_MAX_LENGTH = 200` and `class EchoResponse(BaseModel): echo: str` (criterion 4).
  - Registration in `backend/app/main.py`: import `router as echo_router` from `app.routers.echo` and `app.include_router(echo_router)` after the existing three; update the module docstring's list of registered routers with TEST-06. No other change to the factory, lifespan or CORS (GET is already an allowed method).
- Service layer: none. The endpoint holds no business logic; see the layering assumption in Re-Plan Feedback.
- Repository layer: none. No data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg`, string, required, maximum 200 characters (OpenAPI: `required: true`, `maxLength: 200`). No body.
- Response:
  - 200, `application/json`: `{"echo": "hello"}` for `?msg=hello`; the value is the `msg` string unchanged (URL-decoded by the framework).
  - 422, FastAPI's standard validation body. Missing `msg`: `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`. Over-long `msg`: `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "ctx": {"max_length": 200}, ...}]}`.

## Technology Selection
- Length bound on `msg`: chose FastAPI's own `Query(max_length=...)` (installed dependency, rung 3) over a hand-written length check in the handler, because declarative validation is what criterion 3 asks for and yields the framework's standard 422 with no code of ours.
- Response schema `EchoResponse`: chose Pydantic `BaseModel` (installed dependency, rung 3) over a stdlib `TypedDict` or a bare dict, because criterion 4 names a Pydantic schema and it matches `schemas/version.py`.
- Router `echo.py`: chose FastAPI `APIRouter` (installed dependency, rung 3); no stdlib or platform feature serves HTTP routes in this stack. No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and the `EchoResponse` Pydantic model (`echo: str`).
- [B] backend/app/routers/echo.py: `GET /api/echo` router; required `msg` query parameter bounded by `Query(max_length=ECHO_MSG_MAX_LENGTH)`; returns `EchoResponse`.
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoResponse` and the `get_echo` handler called directly.
- [B] backend/tests/integration/test_echo_integration.py: HTTP-cycle tests for 200, missing-`msg` 422, over-long 422, the 200-character boundary, and the OpenAPI-declared bound.
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus the boundary edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/TEST-06/uat_script.md: the copy of the manual UAT script build-feature writes.

### Modified files
- [B] backend/app/main.py: import and `include_router` the echo router; add TEST-06 to the module docstring's router list.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the app's custom routes.

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints. No E2E spec is planned: no criterion involves UI navigation or interaction (see Criterion coverage).

## Testing Strategy
- Unit tests: `EchoResponse` serializes to exactly `{"echo": ...}`; the `get_echo` handler, called directly with a string, returns an `EchoResponse` instance (not a dict) carrying that string; the app factory registers `/api/echo`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (here `test_echo_unit.py`, plus one added test in the existing `test_main_unit.py`)
- Integration tests: full HTTP request/response cycle through the session `client` fixture in `backend/tests/conftest.py` (no database needed; the lifespan skips schema setup when `DATABASE_URL` is unset, and the endpoint never touches it). Happy path 200, missing `msg` 422, over-long `msg` 422 with `loc == ["query", "msg"]`, exactly-200-character boundary 200, and the OpenAPI schema declaring `maxLength: 200` on `msg`, which is what proves the bound is declared rather than hand-rolled.
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. The E2E toggle is ENABLED, but no acceptance criterion involves navigation or interaction through the UI (the feature has no frontend), so every criterion is covered at integration or unit level per `testing_standards.md` Section 6, asked per criterion. A browser spec calling the API directly would be a router integration test (`testing_standards.md` Section 5).
  - Directory: e2e/tests/
  - File: none planned (would be `TEST-06_echo_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a `msg` of exactly 200 characters returns 200), phrased as API requests and responses.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | `test_get_echo_with_msg_returns_200_with_echoed_text` | Verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI. |
| 2 | `GET /api/echo` with no `msg` returns 422, not 500 or empty 200 | Integration | `test_get_echo_without_msg_returns_422_validation_error` | Verifying it needs no navigation or interaction: it is the router's request validation. |
| 3 | `msg` over 200 characters returns 422; bound stated in the schema | Integration | `test_get_echo_with_msg_over_200_chars_returns_422`, `test_get_echo_with_msg_of_exactly_200_chars_returns_200`, `test_openapi_declares_echo_msg_max_length_200` | Verifying it needs no navigation or interaction: it is a declared validation rule, checked at the HTTP layer and in the OpenAPI schema. |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_echo_response_serializes_to_echo_field`, `test_get_echo_returns_echo_response_instance` | Verifying it needs no navigation or interaction: it is a structural property of the schema and the handler's return type. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo?msg=hello, Then the status is 200 and the body is {"echo": "hello"} |
| 2 | `GET /api/echo` with no `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo with no msg, Then the status is 422 and the detail names the query field msg |
| 3 | `msg` over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo with a 201-character msg, Then the status is 422; and with a 200-character msg the status is 200 |
| 4 | Response defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the API schema at /openapi.json, When a reviewer reads the 200 response of GET /api/echo, Then it references the EchoResponse schema with one string property echo |

## Manual verification plan
This feature has no UI; every criterion is verified with HTTP requests against the running backend and by reading the code. The steps use `curl` and the backend's Swagger page.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: the stack is running (`docker compose up -d` at the repo root) and the backend answers on `http://localhost:8010` (`curl -s http://localhost:8010/api/version` returns a JSON version).
1. In a terminal, run `curl -s -w '\nHTTP %{http_code}\n' 'http://localhost:8010/api/echo?msg=hello'` → the output is `{"echo":"hello"}` followed by `HTTP 200`.
2. Run `curl -s 'http://localhost:8010/api/echo?msg=hello%20world'` → the output is `{"echo":"hello world"}` (the space arrives decoded).
3. Open `http://localhost:8010/docs` in a browser, expand `GET /api/echo`, click Try it out, enter `hello` in the `msg` field and click Execute → the response panel shows code 200 and body `{"echo": "hello"}`.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: as for criterion 1.
1. Run `curl -s -w '\nHTTP %{http_code}\n' 'http://localhost:8010/api/echo'` → the output is a JSON body whose `detail` list has one entry with `"type":"missing"` and `"loc":["query","msg"]`, followed by `HTTP 422` (not 500, not 200).

### Criterion 3: `msg` longer than 200 characters returns 422
Prerequisites: as for criterion 1.
1. Run `curl -s -w '\nHTTP %{http_code}\n' "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` → the body's `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`, followed by `HTTP 422`.
2. Run the same command with `{1..200}` instead of `{1..201}` → the output is `{"echo":"aaaa…"}` holding 200 `a` characters, followed by `HTTP 200`.
3. Open `backend/app/routers/echo.py` → the `msg` parameter is declared with `Query(max_length=ECHO_MSG_MAX_LENGTH)`, and the handler body contains no length check and no `HTTPException`.
4. Open `http://localhost:8010/openapi.json` and find `paths` then `/api/echo` then `get` then `parameters` → the `msg` parameter shows `required: true` and a schema with `maxLength: 200`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the repository checked out on this branch.
1. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with one field `echo: str`.
2. Open `backend/app/routers/echo.py` → the route is declared with `response_model=EchoResponse` and the handler returns `EchoResponse(echo=msg)`, not a dict literal.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the summary line reports no failed or errored test and the command exits 0.
