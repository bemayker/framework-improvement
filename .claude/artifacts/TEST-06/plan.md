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
- [ ] 3. `msg` longer than 200 characters returns 422; the bound is declared in the schema, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: precondition verified on `feature/TEST-06-echo-endpoint` (branched from `origin/main` 3b33c37) before planning. `backend/app/main.py` registers only the version, notes and health routers; `backend/app/routers/` holds `health.py`, `notes.py`, `version.py`; `backend/app/schemas/` holds `health.py`, `note.py`, `version.py`; no `test_echo_*` file exists under `backend/tests/`. The echo feature is absent, so the plan proceeds and lists every echo file as new.
- Comment (tracker, 2026-09-03): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. ..." → Addressed by: criterion 3 is planned as the description states (422). The bound is declared on the query parameter as `Query(max_length=ECHO_MSG_MAX_LENGTH)`, with the constant defined once in `backend/app/schemas/echo.py`, which is the shape this comment names. Its remark that "the code on feature/TEST-06-echo-endpoint already satisfies it" describes the measured-run-2 branch, which the 2026-09-07 reset reverted; it is not true of the current branch and is not relied on.
- Comment (tracker, 2026-09-03, earlier): "A msg longer than 200 characters should return 400 with a {\"error\": \"...\"} body, not 422. ..." → not acted on because the newer 2026-09-03 comment withdraws it explicitly as a measured-run probe. No custom exception handler, no 400 status and no `{"error": ...}` body are planned.
- Assumption (no comment covers it): the description says "stated in the schema" and the newer comment says "declared via Query(max_length=...)". The plan reads both as one requirement: the 200 bound is a declarative constraint FastAPI and Pydantic enforce (and publish as `maxLength: 200` in the OpenAPI schema), its value lives in the schemas module, and the handler contains no `len()` check.
- Assumption: whitespace is passed through unchanged and an empty `msg=` returns 200 with `{"echo": ""}`. No criterion asks for trimming or a minimum length (TEST-11 and BUG-05 later decide whitespace behaviour on top of this endpoint), so adding either would be gold plating.

## Plan Overview
Backend only. One new schema module (`backend/app/schemas/echo.py`) holding the 200-character bound and the `EchoResponse` Pydantic model, one new router (`backend/app/routers/echo.py`) exposing `GET /api/echo` with a required, length-bounded `msg` query parameter, and one `include_router` line in `backend/app/main.py`. No service, repository, model or migration: the endpoint holds no business logic and touches no data, so a service layer would be an empty pass-through (the version router has a service only because it resolves package metadata). Tests: a unit test for the schema, a route-registration unit test in the existing `test_main_unit.py`, and router integration tests through the session `client` fixture. No frontend, no E2E spec, UAT artifacts as build-feature mandates.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; this item renders no UI)

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}`, returns the given text in `EchoResponse`. Router `APIRouter(prefix="/api", tags=["echo"])`, matching `version.py` and `health.py`.
- Handler signature: `def get_echo(msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]) -> EchoResponse`, decorated `@router.get("/echo", response_model=EchoResponse)`, body `return EchoResponse(echo=msg)`. No default value, so a missing `msg` is FastAPI's 422 (criterion 2); the `max_length` makes 201+ characters FastAPI's 422 (criterion 3). No `len()` check, no `HTTPException`, no custom exception handler in the handler.
- Schema: `backend/app/schemas/echo.py` defines `ECHO_MSG_MAX_LENGTH = 200` (with a one-line comment saying why the bound is a contract value) and `class EchoResponse(BaseModel): echo: str`, docstring "Response body for GET /api/echo." (criterion 4).
- Registration: `backend/app/main.py` imports `from app.routers.echo import router as echo_router` and adds `app.include_router(echo_router)` after the existing three; the module docstring gains one clause naming TEST-06's echo router, in the style of the existing TEST-05/TEST-03/TEST-02 sentence. No other change to the factory, CORS or lifespan.
- Service layer: none (no business logic to hold; see Plan Overview).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg`, required, string, at most 200 characters. No body.
- Response 200: `EchoResponse`, `{"echo": "hello"}` for `?msg=hello`; the value is returned verbatim (no trimming, `msg=` gives `{"echo": ""}`).
- Response 422 (missing `msg`): FastAPI's standard body, `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`.
- Response 422 (`msg` over 200 characters): FastAPI's standard body, `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "ctx": {"max_length": 200}, ...}]}`.
- Response 405: any method other than GET (FastAPI default).

## Technology Selection
- `GET /api/echo` request validation (required + 200-character bound): chose FastAPI's declarative `Query(max_length=...)` on an `Annotated` parameter, an installed dependency, over a hand-written `len()` check plus `HTTPException`, because the declarative form yields the standard 422 body and the OpenAPI `maxLength` with no code in the handler, and criterion 3 forbids the hand-rolled check.
- `EchoResponse` response model: chose a Pydantic `BaseModel` (installed with FastAPI) over a bare dict, because criterion 4 requires it and it matches `VersionResponse`.
- Echo service module: not created; no stdlib or dependency question arises because there is no logic to place in one.
- No new dependency is added; `backend/pyproject.toml` and `backend/uv.lock` are unchanged.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and the `EchoResponse` Pydantic model
- [B] backend/app/routers/echo.py: `GET /api/echo` router with the required, length-bounded `msg` query parameter
- [B] backend/tests/unit/test_echo_schema_unit.py: unit tests for `EchoResponse` and the bound constant
- [B] backend/tests/integration/test_echo_integration.py: router integration tests for criteria 1 to 3 through the full HTTP cycle
- [G] e2e/uat/scenarios/TEST-06_echo-endpoint.feature: Gherkin scenarios, one per criterion plus the 200-character boundary edge case
- [G] e2e/uat/scripts/TEST-06_echo-endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the echo router; docstring names TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`
No lockfile entry: the feature adds no dependency. No `README.md` or `docs/DEVELOPMENT.md` entry: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file keeps an endpoint list that would need the new route.

## Testing Strategy
- Unit tests: `backend/tests/unit/test_echo_schema_unit.py`, testing the schema layer in isolation: `test_echo_response_serializes_echo_field` (happy path, `EchoResponse(echo="hello").model_dump() == {"echo": "hello"}`), `test_echo_response_keeps_empty_string` (edge case, `""` round-trips unchanged), `test_echo_response_without_echo_raises_validation_error` (error case, `pydantic.ValidationError`), and `test_echo_msg_max_length_is_200` (pins the contract value). In `backend/tests/unit/test_main_unit.py`, `test_create_app_registers_echo_route` asserts `"/api/echo"` is in the custom route paths, using the existing `_collect_route_paths` helper.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `backend/tests/integration/test_echo_integration.py`, using the session-scoped `client` fixture from `backend/tests/conftest.py` (no database fixture: the endpoint needs none). Tests: `test_get_echo_returns_200_with_message` (criterion 1, body exactly `{"echo": "hello"}`), `test_get_echo_without_msg_returns_422` (criterion 2, asserts 422 and that `detail[0]["loc"] == ["query", "msg"]` and `detail[0]["type"] == "missing"`), `test_get_echo_with_201_characters_returns_422` (criterion 3, `"a" * 201`, asserts 422 and `detail[0]["type"] == "string_too_long"`), `test_get_echo_with_exactly_200_characters_returns_200` (criterion 3 boundary, `"a" * 200` echoed back), `test_get_echo_returns_url_decoded_message` (criterion 1 edge, `params={"msg": "hello world & more"}` echoed verbatim, proving query-string handling end to end), `test_post_echo_returns_405_method_not_allowed`. Strings are built from `ECHO_MSG_MAX_LENGTH`, never a literal 200/201, so the tests assert the resolution.
  - Directory: backend/tests/integration/
- E2E tests: no spec. The E2E toggle is ENABLED, but no criterion involves navigation or interaction through a UI (the item has no frontend), so none is assigned to E2E and no edge-case spec is warranted (`testing_standards.md` Section 6).
  - Directory: e2e/tests/
  - File: none for this item (would be `TEST-06_echo-endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus the exactly-200-characters edge case, stated against the HTTP response, not duplicating integration assertions beyond status and body.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | verifying it needs no navigation or interaction: it is FastAPI request validation on a router |
| 3 | `msg` over 200 characters returns 422, bound declared in the schema | Integration | verifying it needs no navigation or interaction: it is a declared validation rule, checked at the router with the 200/201 boundary |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is the schema's own shape, checked in isolation, plus the integration body assertion |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running When I request `/api/echo?msg=hello` Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | 422 when `msg` is missing | covered at Integration, see Criterion coverage | Given the backend is running When I request `/api/echo` without `msg` Then the status is 422 and the detail names `query.msg` as missing |
| 3 | 422 over 200 characters | covered at Integration, see Criterion coverage | Given the backend is running When I request `/api/echo` with a 201-character `msg` Then the status is 422; with exactly 200 characters Then the status is 200 |
| 4 | Pydantic response schema | covered at Unit, see Criterion coverage | Given the API documentation When I open `/docs` Then `GET /api/echo` lists `EchoResponse` as its 200 response schema |

## Manual verification plan
This item has no UI, so every block is verified through the backend's own HTTP surface: a browser address bar, the FastAPI docs page at `/docs`, or `curl` in a terminal. Host port 8010 is the one `docker-compose.yml` publishes for the backend.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: the stack is up (`docker compose up -d --build` from the repository root) and `http://localhost:8010/api/version` answers in a browser.
1. In a browser, open `http://localhost:8010/api/echo?msg=hello` → the page shows exactly `{"echo":"hello"}`.
2. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK` and the body is `{"echo":"hello"}`.
3. Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"` → the body is `{"echo":"hello world"}`, the URL-encoded space decoded.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: as Criterion 1.
1. Run `curl -i "http://localhost:8010/api/echo"` → the status line reads `422 Unprocessable Entity` (not 500, not 200), and the body is a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/docs`, expand `GET /api/echo`, click "Try it out", paste a string of 201 letter `a` characters into `msg`, click "Execute" → the response code shown is 422 and the body's first `detail` entry has `"type":"string_too_long"` and `"ctx":{"max_length":200}`.
2. Delete one character so `msg` holds exactly 200 letter `a` characters and click "Execute" → the response code is 200 and the body's `echo` is the same 200-character string.
3. Open `backend/app/routers/echo.py` → the handler body is a single `return EchoResponse(echo=msg)`, with no `len(` call and no `HTTPException`; the 200 appears only as `ECHO_MSG_MAX_LENGTH` in `backend/app/schemas/echo.py`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as Criterion 1.
1. Open `http://localhost:8010/docs`, expand `GET /api/echo` → the 200 response's schema is named `EchoResponse` with one string property `echo`.
2. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with `echo: str`, and `backend/app/routers/echo.py` declares `response_model=EchoResponse` and returns no dict literal.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` → the summary reports `0 failed`.
