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
- [ ] 3. `msg` longer than 200 characters returns 422; the bound is declared in the schema (the query parameter declaration), not checked by hand in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker), 2026-09-07: "Reset to to do ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: verified against the checked-out tree before planning. The branch was cut from origin/main at 7ce6e965; `git ls-tree origin/main backend/app` lists no `routers/echo.py` and no `schemas/echo.py`, `backend/app/main.py` registers only the version, notes and health routers, and a grep for "echo" over `backend/app`, `backend/tests` and `e2e` finds no echo endpoint, test, UAT scenario or script. Main does not hold the feature, so the precondition holds and this plan builds it from nothing.
- Comment (tracker), 2026-09-03 (later): "Retracting the previous comment ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler." → Addressed by: criterion 3 is planned as written (422), and the bound is declared with `Query(max_length=ECHO_MSG_MAX_LENGTH)`, the constant living in `backend/app/schemas/echo.py`. Its remark that the code on the feature branch "already satisfies it" is about measured run 2's branch; this branch carries no echo code (see the 2026-09-07 line), so nothing is reused from it.
- Comment (tracker), 2026-09-03 (earlier): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422." → not acted on because the later comment of the same day retracts it explicitly as a measured-run probe and restores criterion 3 (422). No custom error handler or 400 response is planned.
- Assumption (criterion 3, "stated in the schema"): read as "declared on the request parameter's schema, so FastAPI's validation enforces it and the OpenAPI schema advertises it", matching the retraction comment's `Query(max_length=...)`. The 200 lives once, as `ECHO_MSG_MAX_LENGTH` in `backend/app/schemas/echo.py`, and the router imports it; an integration test asserts the OpenAPI document declares `maxLength: 200` on `msg`.
- Assumption (no lower bound): `GET /api/echo?msg=` (present but empty) returns 200 with `{"echo": ""}`. No criterion asks for a minimum length, so none is added (`user_story_alignment.md` Section 3).

## Plan Overview
Backend only. Add one Pydantic response schema (`EchoResponse`) plus the `ECHO_MSG_MAX_LENGTH` bound in `backend/app/schemas/echo.py`, one router `backend/app/routers/echo.py` exposing `GET /api/echo` with a required, length-bounded `msg` query parameter, and register the router in `create_app()` in `backend/app/main.py`. No service or repository layer: the endpoint has no business logic and no persistence (it returns its input verbatim), so `coding_standards.md` Section 2.2's Router to Service to Repository pattern, which applies "when the project includes a backend with data persistence", has no service or repository work to carry here; the router keeps to its Section 2.2 role (query parameter validation via schemas, no business logic). Tests: unit tests for the schema and the route registration, integration tests for the full HTTP cycle. No frontend, no external API, no database, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}`, returns the given text in an `EchoResponse` body. Router `APIRouter(prefix="/api", tags=["echo"])`, handler `get_echo(msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]) -> EchoResponse`, decorated with `response_model=EchoResponse`, returning `EchoResponse(echo=msg)`. `msg` has no default, so a missing `msg` is FastAPI's standard 422 (criterion 2); the `max_length` on the `Query` declaration yields FastAPI's standard 422 for 201 characters or more (criterion 3). The handler contains no length check and no branching.
- Schema: `backend/app/schemas/echo.py` holds `ECHO_MSG_MAX_LENGTH = 200` and `class EchoResponse(BaseModel): echo: str`, following `backend/app/schemas/version.py`'s shape.
- Registration: `backend/app/main.py` imports `router as echo_router` from `app.routers.echo` and calls `app.include_router(echo_router)` in `create_app()` after the existing three; the module docstring gains one clause naming TEST-06's echo router. No other change to the factory, the lifespan or the CORS middleware (it already allows GET).
- Service layer: none (no business logic; see Plan Overview).
- Repository layer: none (no persistence).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg`, string, required, at most 200 characters (OpenAPI: `required: true`, `maxLength: 200`).
- Response 200: `EchoResponse`, e.g. `GET /api/echo?msg=hello` returns `{"echo": "hello"}`; a URL-encoded value is returned decoded (`?msg=hello%20world` returns `{"echo": "hello world"}`).
- Response 422 (missing `msg`): FastAPI's standard validation body, `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`.
- Response 422 (`msg` over 200 characters): FastAPI's standard validation body, `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], ...}]}`.

## Technology Selection
- `EchoResponse` response schema: chose a Pydantic `BaseModel` (already installed with FastAPI) over a bare dict, because criterion 4 requires a schema and the project's other routers use one.
- Length bound on `msg`: chose FastAPI's native `Query(max_length=...)` validation (installed dependency) over a hand-rolled `len()` check in the handler, because criterion 3 forbids the handler check and the declaration also produces the standard 422 and the OpenAPI `maxLength`.
- Missing-`msg` handling: chose FastAPI's built-in required-parameter validation over custom code; no code is written for it.
- `backend/app/routers/echo.py`: no stdlib call, native platform feature or installed dependency replaces a route module; it is a few lines on the installed FastAPI `APIRouter`.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and the `EchoResponse` Pydantic schema (`echo: str`)
- [B] backend/app/routers/echo.py: `GET /api/echo` router with the required, length-bounded `msg` query parameter
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoResponse` and `ECHO_MSG_MAX_LENGTH`
- [B] backend/tests/integration/test_echo_integration.py: integration tests for the full `GET /api/echo` request/response cycle and its OpenAPI declaration
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-06/uat_script.md: the copy of the manual UAT script build-feature writes

### Modified files
- [B] backend/app/main.py: import and register the echo router in `create_app()`; docstring clause for TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`

No lockfile changes: the feature adds no dependency. No `README.md` or `docs/DEVELOPMENT.md` edit: the feature changes no project structure, run configuration, dependency or test infrastructure. No E2E spec: no criterion involves UI navigation or interaction (see Criterion coverage).

## Testing Strategy
- Unit tests: `EchoResponse` serializes `{"echo": ...}`, rejects a missing `echo` field, and `ECHO_MSG_MAX_LENGTH` is 200; `create_app()` registers `/api/echo`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_echo_unit.py`; registration test added to the existing `test_main_unit.py`)
- Integration tests: full HTTP cycle through the session-scoped `client` fixture in `backend/tests/conftest.py`: 200 happy path, URL-decoding edge case, 200 at exactly 200 characters, 422 at 201 characters, 422 with no `msg`, and the OpenAPI document declaring `maxLength: 200` on `msg` and `EchoResponse` as the 200 response. No database needed.
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. The E2E toggle is ENABLED, but no criterion requires navigation or interaction through the UI (the endpoint has no frontend), so per `testing_standards.md` Section 6, asked per criterion, every criterion is covered at integration or unit level and no spec is written.
  - Directory: e2e/tests/
  - File: none (would be TEST-06_echo_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (exactly 200 characters accepted), API-level steps since there is no UI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | `test_get_echo_with_msg_returns_200_and_echoes_text`, `test_get_echo_decodes_url_encoded_msg` | verifying it needs no navigation or interaction: it is a router behaviour with no UI |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | `test_get_echo_without_msg_returns_422_validation_error` | verifying it needs no navigation or interaction: it is request validation at the router |
| 3 | `msg` over 200 characters returns 422, bound declared in the schema | Integration | `test_get_echo_with_msg_over_200_chars_returns_422`, `test_get_echo_with_msg_of_200_chars_returns_200`, `test_openapi_declares_msg_max_length_200`, `test_echo_msg_max_length_is_200` | verifying it needs no navigation or interaction: it is a declared validation rule, checked through HTTP and the OpenAPI document |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | `test_openapi_declares_echo_response_schema`, `test_echo_response_serializes_echo_field`, `test_echo_response_rejects_missing_echo_field` | verifying it needs no navigation or interaction: it is a code-structure property, visible in the OpenAPI document and the schema's own behaviour |

Route registration (`test_create_app_registers_echo_route`, unit) supports every criterion and is not a criterion of its own.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo?msg=hello, Then the status is 200 and the body is {"echo": "hello"} |
| 2 | no `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo with no query string, Then the status is 422 and the body's detail names the missing query parameter msg |
| 3 | over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo with a msg of 201 characters, Then the status is 422; and with exactly 200 characters, Then the status is 200 |
| 4 | Pydantic response schema | covered at Integration, see Criterion coverage | Given the backend is running, When a client reads /openapi.json, Then GET /api/echo's 200 response references the EchoResponse schema |

## Manual verification plan
This endpoint has no UI. Each block below is verified from a terminal with curl (or a browser address bar for the GET requests), against the running backend. The base URL is `http://localhost:8010` (the compose file's published backend port); if the handover rebuilt the stack on other ports, use the backend port the handover report names.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: the stack is up (`docker compose up -d --build` from the repo root) and `http://localhost:8010/api/version` answers 200.
1. Run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the status line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → status 200 and body `{"echo":"hello world"}` (the encoded space comes back decoded).
3. Open `http://localhost:8010/api/echo?msg=hello` in a browser → the page shows `{"echo":"hello"}`.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: as Criterion 1.
1. Run `curl -i "http://localhost:8010/api/echo"` → status line `HTTP/1.1 422 Unprocessable Entity`; the body is a JSON object with a `detail` list whose entry has `"type":"missing"` and `"loc":["query","msg"]`. It is not a 500 and not an empty 200.

### Criterion 3: `msg` longer than 200 characters returns 422
Prerequisites: as Criterion 1.
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` in your own terminal (201 letters `a`) → status 422; the `detail` entry has `"type":"string_too_long"` and `"loc":["query","msg"]`.
2. Run the same command with `{1..200}` (exactly 200 letters `a`) → status 200 and the body echoes all 200 letters.
3. Open `http://localhost:8010/docs`, expand `GET /api/echo` → the `msg` parameter is shown as required with a maximum length of 200.
4. Open `backend/app/routers/echo.py` → the handler body contains no length check; the bound appears only as `Query(max_length=ECHO_MSG_MAX_LENGTH)`.

### Criterion 4: the response body is a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/docs`, expand `GET /api/echo`, look at the 200 response → its schema is named `EchoResponse` with one string field `echo`.
2. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)`; `backend/app/routers/echo.py` returns `EchoResponse(...)` and contains no bare dict literal as the response.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the summary line reports no failed or errored test and the command exits 0.
