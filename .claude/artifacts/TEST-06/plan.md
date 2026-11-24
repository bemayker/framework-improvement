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
- [ ] 2. `GET /api/echo` with no `msg` returns 422, FastAPI's standard validation response, rather than a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns 422; the bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, newest): "Reset to to do on 2026-09-07 for measured run 3 ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: precondition checked against the tree at plan time. Branch `feature/TEST-06-echo-endpoint` was cut from `origin/main` at 669b9494; `backend/app/main.py` registers only the version, notes and health routers, there is no `backend/app/routers/echo.py`, no `backend/app/schemas/echo.py`, no echo test under `backend/tests/`, no `e2e/uat` TEST-06 artifact, and a grep for "echo" over `backend/app`, `backend/tests` and `frontend/src` finds only an unrelated docstring in `test_notes_integration.py`. The earlier implementation is therefore absent from main, the comment's precondition holds, and this plan builds the endpoint from scratch.
- Comment (tracker): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. The code on feature/TEST-06-echo-endpoint already satisfies it and needs no change. ..." → Addressed by: criterion 3 is planned as 422 (the 400 comment below is withdrawn). The comment's statement that the branch "already satisfies it" is stale: that code was reverted (see the newest comment), so the branch holds no echo code and the endpoint is built here. The comment's mechanism, `Query(max_length=...)`, is adopted: the bound is declared on the query parameter, with its value held as the constant `MAX_ECHO_MSG_LENGTH = 200` in `backend/app/schemas/echo.py` beside the response schema, so the bound lives in the schema module and in the generated OpenAPI schema (`maxLength: 200`), and the handler carries no length check. Assumption recorded: "stated in the schema" (description) and "declared via Query(max_length=...)" (comment) are read as one requirement, satisfied by that pairing; the newer comment decides the mechanism.
- Comment (tracker, oldest): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer comment above explicitly retracts it as a measured-run probe and restates criterion 3 as 422. No custom error body or exception handler is planned.
- Scope assumption (no comment, recorded per `user_story_alignment.md` Section 4): `GET /api/echo?msg=` (present but empty) is not covered by any criterion; it is left to FastAPI's default for a `str` query parameter, which answers 200 with `{"echo": ""}`. No minimum length is added (no gold plating). A `msg` of exactly 200 characters is accepted (the criterion rejects only "longer than 200").

## Plan Overview
Backend only. Add a stateless `GET /api/echo` router that takes a required `msg` query parameter bounded at 200 characters by FastAPI/Pydantic validation and returns it in an `EchoResponse` Pydantic model. Register the router in `backend/app/main.py` next to the existing three. No service, repository, model or migration: the endpoint has no business logic and no persistence, so the Router to Service to Repository layering (`coding_standards.md` Section 2.2, which applies "when the project includes a backend with data persistence") has nothing to put in a service; the router returns the validated input directly, matching the description's "one router, one schema, its tests". Tests: integration tests through the full HTTP cycle with the session `client` fixture (no database needed), plus unit tests for the schema, the OpenAPI declaration of the bound, and the route registration. No frontend, no E2E spec (no UI criterion).

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI)

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}` returns `EchoResponse(echo=msg)`; router `APIRouter(prefix="/api", tags=["echo"])` in `backend/app/routers/echo.py`, handler `get_echo(msg: Annotated[str, Query(max_length=MAX_ECHO_MSG_LENGTH)]) -> EchoResponse` with `response_model=EchoResponse`. `msg` has no default, so a missing parameter is FastAPI's standard 422 (criterion 2); a value over 200 characters fails the declared `max_length` and is FastAPI's standard 422 (criterion 3). The handler body is one line and contains no `len()` check.
- Schema: `backend/app/schemas/echo.py` defines `MAX_ECHO_MSG_LENGTH = 200` and `class EchoResponse(BaseModel): echo: str` (criterion 4), same shape as `schemas/version.py`.
- Registration: `backend/app/main.py` imports `router as echo_router` from `app.routers.echo` and adds `app.include_router(echo_router)` after the existing three; the module docstring gains one line naming TEST-06. No other change to the factory, lifespan or CORS (the CORS middleware already allows GET).
- Service layer: none (no business logic; see Plan Overview).
- Repository layer: none (no persistence).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg`, string, required, `maxLength` 200. No body.
- Response 200: `{"echo": "hello"}` for `?msg=hello` (the `EchoResponse` schema: one required string field `echo`, equal to `msg` verbatim).
- Response 422 (missing `msg`): FastAPI's standard validation body, e.g. `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}`.
- Response 422 (`msg` over 200 characters): FastAPI's standard validation body, e.g. `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "input": "...", "ctx": {"max_length": 200}}]}`.

## Technology Selection
- Length bound on `msg`: chose FastAPI's `Query(max_length=...)` (installed dependency, Pydantic constraint) over a hand-rolled `len()` check in the handler, because criterion 3 forbids the hand-rolled check and the declared constraint also yields the standard 422 and an OpenAPI `maxLength`.
- Missing-parameter handling: chose a required (no default) `str` query parameter, FastAPI's built-in validation, over any custom check, because it produces exactly the standard 422 criterion 2 asks for.
- `EchoResponse` schema: chose a Pydantic `BaseModel` (installed dependency) over a bare dict, because criterion 4 requires it; no stdlib or native alternative applies.
- `echo` router module: no stdlib call, native platform feature or installed dependency replaces a route definition, so it is built here on the installed FastAPI `APIRouter`.
- New dependencies: none.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `MAX_ECHO_MSG_LENGTH = 200` and the `EchoResponse` Pydantic model (criteria 3 and 4)
- [B] backend/app/routers/echo.py: `GET /api/echo` router, `msg` declared `Query(max_length=MAX_ECHO_MSG_LENGTH)`, returns `EchoResponse` (criteria 1 to 3)
- [B] backend/tests/integration/test_echo_integration.py: HTTP-cycle tests for 200, missing-msg 422, over-200 422 and the exactly-200 boundary (criteria 1 to 3)
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoResponse` and for the OpenAPI declaration of the bound and response model (criteria 3 and 4)
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus the exactly-200 edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and `include_router` the echo router; docstring line naming TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`
No lockfile changes: the feature adds no dependency (FastAPI and Pydantic are already installed).
No README.md or docs/DEVELOPMENT.md change: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `EchoResponse` serialization and validation; the app's OpenAPI document declares `msg` as a required query parameter with `maxLength` 200 and the 200 response as a `$ref` to `EchoResponse` (proves the bound and the body are schema-declared, not hand-rolled); the route is registered by `create_app()`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_echo_unit.py`; `test_main_unit.py` extended)
- Integration tests: full HTTP request/response cycle through the session-scoped `client` fixture from `backend/tests/conftest.py`; no database fixture is requested, so these run without `DATABASE_URL`.
  - Directory: backend/tests/integration/ (`test_echo_integration.py`)
- E2E tests: none for this item. No criterion involves navigation or interaction through the UI (the item has no UI), so per `testing_standards.md` Section 6 the E2E tier is not warranted; every criterion is covered at integration or unit level below.
  - Directory: e2e/tests/ (no file for TEST-06)
  - File: none (would be `TEST-06_echo_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus the exactly-200-characters edge case, phrased as HTTP requests to the running backend.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | `test_get_echo_returns_200_with_given_message`, `test_create_app_registers_echo_route` | verifying it needs no navigation or interaction: it is a router behaviour, and there is no UI |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | `test_get_echo_without_msg_returns_422` | verifying it needs no navigation or interaction: it is request validation at the router |
| 3 | `msg` over 200 characters returns 422, bound stated in the schema | Integration | `test_get_echo_with_msg_over_200_chars_returns_422`, `test_get_echo_with_msg_of_exactly_200_chars_returns_200`, `test_echo_route_declares_msg_max_length_in_openapi` | verifying it needs no navigation or interaction: it is a validation rule, and its declaration is read from the OpenAPI schema |
| 4 | The response body is a Pydantic schema in `backend/app/schemas/` | Unit | `test_echo_response_serializes_message_under_echo_key`, `test_echo_response_rejects_missing_echo`, `test_echo_route_response_model_is_echo_response` | verifying it needs no navigation or interaction: it is a schema definition and the route's declared response model |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When I request `/api/echo?msg=hello`, Then I get 200 and `{"echo": "hello"}` |
| 2 | `GET /api/echo` with no `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When I request `/api/echo` with no query string, Then I get 422 with a `detail` naming `msg` as missing |
| 3 | `msg` over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When I request `/api/echo` with a 201-character `msg`, Then I get 422; and with a 200-character `msg` I get 200 |
| 4 | Response body is a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When I open `/docs` and expand `GET /api/echo`, Then its 200 response shows the `EchoResponse` schema with field `echo` |

## Manual verification plan
This item has no UI of its own; every step runs against the backend's HTTP API, from a browser address bar or a terminal, with the stack running (`docker compose up`) and the backend on its default host port 8010 (`VITE_API_BASE_URL` in `.env.example`; use the port the handover reports if it rebuilt on free ports).

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: backend running and reachable at `http://localhost:8010`.
1. Open `http://localhost:8010/api/echo?msg=hello` in a browser → the page shows exactly `{"echo":"hello"}`.
2. In a terminal run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the status line reads `HTTP/1.1 200 OK` and the body is `{"echo":"hello"}`.
3. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → 200 and body `{"echo":"hello world"}` (the query string is decoded end to end).

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: backend running.
1. Run `curl -i "http://localhost:8010/api/echo"` → status line `HTTP/1.1 422 Unprocessable Entity`; the body has a `detail` list whose entry has `"type":"missing"` and `"loc":["query","msg"]`.
2. Confirm the status is neither 500 nor 200 → no `echo` key appears in the body.

### Criterion 3: `msg` longer than 200 characters returns 422
Prerequisites: backend running.
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` in bash (a `msg` of 201 letters `a`) → status 422; the body's `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
2. Run the same command with `{1..200}` (exactly 200 letters `a`) → status 200 and body `{"echo":"aaa…"}` holding all 200 letters.
3. Open `http://localhost:8010/docs`, expand `GET /api/echo` → the `msg` parameter is marked required and shows a maximum length of 200 (the bound is declared in the schema, not in handler code).

### Criterion 4: the response body is a Pydantic schema in `backend/app/schemas/`
Prerequisites: backend running.
1. Open `http://localhost:8010/docs`, expand `GET /api/echo`, look at the 200 response → its schema is named `EchoResponse` with one required string field `echo`.
2. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with `echo: str`; `backend/app/routers/echo.py` declares `response_model=EchoResponse` and returns an `EchoResponse`, not a dict.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
