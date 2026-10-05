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
- [ ] 2. `GET /api/echo` with no `msg` returns 422 (FastAPI's standard validation response), not a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns 422; the bound is declared on the parameter/schema (`Query(max_length=...)`), not hand-checked in the handler.
- [ ] 4. The response body is a Pydantic schema in `backend/app/schemas/`, not a bare dict in the router.

## Re-Plan Feedback
Fresh plan: nine top-level tracker comments, zero threaded replies, read newest first. Every line is recorded below with its source tag.

- Comment (tracker): six framework-generated "mayker-dev: plan PR opened for TEST-06" link comments (PRs #62, #55, #51, #49, #35, #23, branch feature/TEST-06-echo-endpoint) → not acted on because they are framework link notices from earlier measured runs, not feedback; the branch they name was re-cut from current main (36e231a) and this is a fresh plan.
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 … Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) … Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: precondition verified satisfied. `origin/main` at 36e231a has no echo router or schema (`backend/app/routers/` holds only `health.py`, `notes.py`, `version.py`; `backend/app/schemas/` only `health.py`, `note.py`, `version.py`), so this plan creates the feature from nothing. Stale `echo.*.pyc` files under `__pycache__/` are untracked bytecode left from earlier runs, not source, and are ignored.
- Comment (tracker): "Retracting the previous comment. It was a measured-run probe, not a real requirement. … Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. The code on feature/TEST-06-echo-endpoint already satisfies it …" → Addressed by: criterion 3 is planned at 422 with the bound declared as `Query(max_length=MAX_ECHO_MESSAGE_LENGTH)`, the constant living in `backend/app/schemas/echo.py`. Its remark that existing code already satisfies it is stale (the branch was reset; no echo code exists), so the code is planned from scratch.
- Comment (tracker): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → not acted on because the newer comment above retracts it explicitly; criterion 3 stands at 422 with FastAPI's standard validation body.

Assumptions (no comment settles these; recorded instead of blocking, `user_story_alignment.md` Section 4):
- An empty `msg` (`/api/echo?msg=`) is a present parameter and echoes the empty string with 200. The criteria reject only a missing `msg` and one over 200 characters; a minimum length would be unrequested scope.
- The bound is inclusive: exactly 200 characters returns 200, 201 returns 422 ("longer than 200").
- `msg` is echoed verbatim, with no trimming or normalisation. Whitespace trimming is TEST-11's scope (it depends on TEST-06) and must not be pre-empted here.

## Plan Overview
One backend-only GET endpoint, `GET /api/echo`, following the TEST-02/TEST-05 router shape: a new router `backend/app/routers/echo.py` (prefix `/api`, tag `echo`), a new response schema `EchoResponse` plus the `MAX_ECHO_MESSAGE_LENGTH = 200` bound in `backend/app/schemas/echo.py`, one `include_router` line in `backend/app/main.py`, a unit test module, an integration test module, one added route-registration unit test, and the UAT artifacts. No database, no service, no frontend.

Validation is entirely declarative: `msg` is a required query parameter declared `Annotated[str, Query(max_length=MAX_ECHO_MESSAGE_LENGTH)]`, so FastAPI's request validation produces the 422 for both a missing and an over-long `msg` before the handler runs. The handler body is one line returning `EchoResponse(echo=msg)`.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this feature renders nothing).

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}`, returns the given text as `EchoResponse`. `response_model=EchoResponse`.
- Router (`backend/app/routers/echo.py`): `router = APIRouter(prefix="/api", tags=["echo"])`; handler `get_echo(msg: Annotated[str, Query(max_length=MAX_ECHO_MESSAGE_LENGTH)]) -> EchoResponse`. No default value, so the parameter is required. No `if len(msg) > ...` check, no try/except, no custom exception handler: the 422 is FastAPI's own `RequestValidationError` response (criteria 2 and 3).
- Schema (`backend/app/schemas/echo.py`): `MAX_ECHO_MESSAGE_LENGTH = 200` (module constant, the single source of the bound) and `class EchoResponse(BaseModel): echo: str` with a docstring, matching `schemas/version.py`'s style (criterion 4).
- Service layer: none. Returning the input unchanged is not business logic, so there is nothing for a service to hold (`coding_standards.md` Section 2.2: the router does validation and DI only, which is all this endpoint needs). See Technology Selection.
- Repository layer: none (no persistence).
- Migrations: none.
- Registration: `backend/app/main.py` imports `from app.routers.echo import router as echo_router` and adds `app.include_router(echo_router)` after the existing three, and the module docstring gains one clause naming TEST-06's echo router. Nothing else in `create_app()` changes; CORS `allow_methods` already includes GET.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg`, string, required, maximum 200 characters (inclusive). No body.
- Response 200: `EchoResponse`, for `/api/echo?msg=hello`:

  `{"echo": "hello"}`

- Response 422 (missing `msg`): FastAPI's standard validation body, for example

  `{"detail": [ {"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null} ]}`

- Response 422 (`msg` over 200 characters): FastAPI's standard validation body with `"type": "string_too_long"`, `"loc": ["query", "msg"]` and `"ctx": {"max_length": 200}`.
- Response 405: any non-GET method (FastAPI default; tested as the router's extra error case, matching TEST-02/TEST-05).

## Technology Selection
- Length bound and required-parameter check (criteria 2, 3): chose FastAPI's own `Query(max_length=...)` on a required `Annotated[str, ...]` parameter over a hand-rolled `len(msg)` check or a custom exception handler, because the installed framework already validates query parameters declaratively and returns the standard 422 body the criteria ask for.
- Response schema `EchoResponse` (criterion 4): chose a Pydantic `BaseModel` from the already-installed `pydantic` over a bare `dict` or a `TypedDict`, because the criterion names a Pydantic schema and the existing schemas (`version.py`, `health.py`) use the same mechanism.
- Echo router module: no stdlib call, native platform feature or installed dependency replaces a route definition, so it is built here on the installed FastAPI `APIRouter`, one handler of one line.
- Service module: deliberately not created. Returning the input unchanged has no business logic for a service to hold; adding `echo_service.py` would be a layer with nothing in it.
- New dependencies: none. `fastapi` and `pydantic` are already installed (`backend/pyproject.toml`), so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `MAX_ECHO_MESSAGE_LENGTH = 200` and the `EchoResponse` Pydantic response schema (`echo: str`) for `GET /api/echo`.
- [B] backend/app/routers/echo.py: `GET /api/echo` router; `msg` declared `Annotated[str, Query(max_length=MAX_ECHO_MESSAGE_LENGTH)]`, returns `EchoResponse(echo=msg)`, no handler-side validation.
- [B] backend/tests/unit/test_echo_unit.py: unit tests for the schema and handler in isolation: `EchoResponse` serialises to the `echo` key, the bound constant is 200, `get_echo` called directly returns `EchoResponse` with the input unchanged (happy path, empty-string edge case), and `EchoResponse` without `echo` raises `ValidationError` (error case).
- [B] backend/tests/integration/test_echo_integration.py: full HTTP cycle through the `client` fixture: 200 `hello` round-trip, 422 missing `msg` (loc `query`/`msg`), 422 at 201 characters, 200 at exactly 200 characters, 200 for a URL-encoded value with a space, 405 on POST.
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (exactly 200 characters is accepted).
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-06/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import `echo_router` and add `app.include_router(echo_router)` in `create_app()` after the health router; one docstring clause naming TEST-06.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the custom routes, matching the existing version/health registration tests.

No dependency changes, so no lockfile entry (`uv.lock` and `frontend/package-lock.json` are untouched). No `[Docs]` entries: the feature adds one endpoint and changes no project structure, run configuration, dependencies or test infrastructure, and `README.md` / `docs/DEVELOPMENT.md` do not enumerate endpoints, so build-feature Section 15's condition is not met. No E2E spec file: no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: `EchoResponse` schema (serialisation, required field) and the `get_echo` handler called as a plain function, plus the route-registration assertion in the app-factory tests. Test names follow `test_{method_or_action}_{scenario}_{expected_outcome}` (`testing_standards.md` Section 3).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py → `test_echo_unit.py`; registration test added to the existing `test_main_unit.py`
- Integration tests: the router through the real HTTP request/response cycle using the session-scoped `client` fixture in `backend/tests/conftest.py`: happy path 200, both 422 paths, the 200-character boundary, and 405 on POST (`testing_standards.md` Section 1.2's router cases). No database is touched, so none of the database fixtures are needed.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py → `test_echo_integration.py`
- E2E tests: enabled per CLAUDE.md but not warranted for this feature: it has no UI, and no acceptance criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question asked per criterion). No spec under `e2e/tests/` is written. An E2E test calling the API directly is a router integration test by definition (`testing_standards.md` Section 5), which the integration tier already covers.
  - Directory: e2e/tests/ (not used)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character edge case, and the manual UAT script expanded from the Manual verification plan.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 2 | Missing `msg` returns 422, not 500 or empty 200 | Integration | verifying it needs no navigation or interaction: it is FastAPI request validation on the router |
| 3 | `msg` over 200 characters returns 422, bound declared on the parameter | Integration | verifying it needs no navigation or interaction: it is declarative query validation; the 200/201 boundary is asserted over HTTP and the declaration is visible in the router diff |
| 4 | Response body is a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is a structural property, asserted by the unit test on `EchoResponse` and the handler's return type, and by the reviewer against the diff |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `GET /api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | Missing `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `GET /api/echo` with no query string, Then the status is 422 and the body's `detail` names the missing `msg` query parameter |
| 3 | `msg` over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `GET /api/echo` with a 201-character `msg`, Then the status is 422 with a `string_too_long` error for `msg`; edge case: a 200-character `msg` returns 200 echoing it |
| 4 | Response body is a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When a reader opens the OpenAPI docs for `GET /api/echo`, Then the 200 response is documented as the `EchoResponse` schema with a string `echo` field |

## Manual verification plan
This feature has no screen in the app. Every check runs against the backend directly, in the browser's address bar and in FastAPI's interactive docs (Swagger UI), which is the closest thing to a UI the endpoint has.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: the stack is up (`docker compose up -d` at the repository root) and the backend answers on http://localhost:8010 (opening http://localhost:8010/api/version shows a `version` value).
1. In a browser, open `http://localhost:8010/api/echo?msg=hello` → the page shows exactly `{"echo":"hello"}` (the browser may pretty-print it as `echo: "hello"`).
2. Open `http://localhost:8010/docs`, expand `GET /api/echo`, click "Try it out", type `hello` in the `msg` field and click "Execute" → "Server response" shows Code `200` and Response body `{"echo": "hello"}`.
3. In the same panel replace `msg` with `hello world` and click "Execute" → the Request URL shows `msg=hello%20world`, the Code is `200` and the body is `{"echo": "hello world"}` (the text comes back exactly as sent).

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: as Criterion 1.
1. In a browser, open `http://localhost:8010/api/echo` (no query string) → the page shows a JSON body whose `detail` list has one entry with `"type": "missing"`, `"loc": ["query", "msg"]` and `"msg": "Field required"`; it is not an "Internal Server Error" page and not an `echo` body.
2. In a terminal run `curl -i http://localhost:8010/api/echo` → the first line reads `HTTP/1.1 422 Unprocessable Entity` (or `422 Unprocessable Content`, depending on the server version), never `500` or `200`.
3. In Swagger UI (`http://localhost:8010/docs`), on `GET /api/echo` click "Try it out", leave `msg` empty and click "Execute" → Swagger refuses to send and marks `msg` as required, which confirms the parameter is declared required in the OpenAPI schema.

### Criterion 3: `msg` longer than 200 characters returns 422, bound declared in the schema
Prerequisites: as Criterion 1, plus a terminal with `python3`.
1. In a terminal run `python3 -c "print('a' * 201)"` and copy the 201-character line of `a`s it prints.
2. In Swagger UI (`http://localhost:8010/docs`), on `GET /api/echo` click "Try it out", paste that 201-character value into `msg` and click "Execute" → Code `422`, and the Response body's `detail` entry shows `"type": "string_too_long"`, `"loc": ["query", "msg"]` and `"ctx": {"max_length": 200}`.
3. Run `python3 -c "print('a' * 200)"`, paste that 200-character value into `msg` instead and click "Execute" → Code `200`, and the body is `{"echo": "aaa…a"}` carrying the same 200 characters (the boundary is inclusive).
4. In Swagger UI expand the `msg` parameter's schema on `GET /api/echo` → it shows `string`, `maxLength: 200`, proving the bound is declared on the parameter rather than checked inside the handler.

### Criterion 4: the response body is a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/docs` and expand `GET /api/echo` → under Responses, `200` shows the example value `{"echo": "string"}` and its Schema tab names `EchoResponse`.
2. Scroll to the "Schemas" section at the bottom of the page and expand `EchoResponse` → it lists exactly one required property, `echo`, of type `string`.
3. Not verifiable further through a UI: the observable check is the code itself, where `backend/app/schemas/echo.py` defines `class EchoResponse(BaseModel)` and `backend/app/routers/echo.py` returns `EchoResponse(echo=msg)` with no dict literal.
