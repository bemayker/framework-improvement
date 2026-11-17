# Implementation Plan, TEST-06: Echo endpoint

## Feature
> A small backend feature for the assisted lifecycle (Arm C of measured run 2). Deliberately narrow: one router, one schema, its tests.
>
> **What:** `GET /api/echo?msg={text}` returns the text it was given, so a caller can prove the API is reachable and that query-string handling works end to end.
>
> **Notes:** Follows the shape TEST-02 established: a router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. It touches `main.py`'s router registration, so it must not run concurrently with another item that does the same.

## Acceptance Criteria
- [ ] 1. `GET /api/echo?msg=hello` returns **200** with body `{"echo": "hello"}`.
- [ ] 2. `GET /api/echo` with no `msg` returns **422**, the framework's standard validation response, rather than a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns **422**. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: condition verified before planning. On `feature/TEST-06-echo-endpoint`, freshly branched from `origin/main` at 26588ef2, there is no echo code: `backend/app/routers/` holds only `health.py`, `notes.py`, `version.py`; `backend/app/schemas/` only `health.py`, `note.py`, `version.py`; `backend/app/main.py` registers only the version, notes and health routers; a case-insensitive search for `echo` across `backend/app`, `backend/tests`, `e2e` and `frontend/src` finds only an unrelated docstring in `test_notes_integration.py`. The feature is absent from main, so this is a real plan, not duplicate work.
- Comment (tracker, 2026-09-03, later): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. ..." → Addressed by: criterion 3 is planned as 422 (FastAPI's standard validation response). Following this comment's explicit mechanism, the router declares `msg` with `Query(max_length=ECHO_MSG_MAX_LENGTH)`, and the constant itself is defined in `backend/app/schemas/echo.py` (also applied as `Field(max_length=...)` on `EchoResponse.echo`), so the bound is stated in the schema module and enforced declaratively, never by a hand-rolled length check in the handler. Its remark that "the code on feature/TEST-06-echo-endpoint already satisfies it" referred to the run-2 branch, which no longer exists; not acted on, since the 2026-09-07 comment and the check above show that code is gone.
- Comment (tracker, 2026-09-03, earlier): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer comment of the same day explicitly retracts it as a measured-run probe and reinstates criterion 3 as written (422). Newer comments override older ones.

## Plan Overview
Backend only, and as small as `CLAUDE.md` Architecture Notes ask. One new Pydantic schema module (`backend/app/schemas/echo.py`) holding the length bound and the `EchoResponse` model, one new router (`backend/app/routers/echo.py`) exposing `GET /api/echo`, and one line of router registration in `backend/app/main.py`, following the router + schema shape of TEST-05 (`version.py`) and TEST-02 (`health.py`). No service layer: echoing the input contains no business logic, so a service module would be a pass-through with nothing to test (KISS, `coding_standards.md` Section 1). No database, no frontend, no external API. Tests: unit tests for the schema's bound and shape, integration tests for the full HTTP cycle, and an app-factory unit test that the route is registered.

Key decisions:
- Missing `msg` and over-length `msg` both fall to FastAPI's built-in request validation, which answers 422 with its standard `{"detail": [...]}` body. No custom exception handler.
- `ECHO_MSG_MAX_LENGTH = 200` is defined once, in the schema module, and referenced by the router's `Query(max_length=...)` and by `EchoResponse.echo`'s `Field(max_length=...)`: one value, one source.
- Assumption (recorded, no criterion covers it): an empty `msg` (`?msg=`) is a present value and echoes `{"echo": ""}` with 200; no `min_length` is added, since no criterion asks for one (no gold plating).

## Frontend Plan
No frontend changes required.

Design reference notes: AI freestyle (Design Reference mode NONE; this feature has no UI).

## Backend Plan
- Endpoints: `GET /api/echo` with required query parameter `msg` (string, max 200 characters), returns `EchoResponse`.
- Schema (`backend/app/schemas/echo.py`): module constant `ECHO_MSG_MAX_LENGTH = 200`; `class EchoResponse(BaseModel)` with `echo: str = Field(max_length=ECHO_MSG_MAX_LENGTH)`.
- Router (`backend/app/routers/echo.py`): `router = APIRouter(prefix="/api", tags=["echo"])`; `@router.get("/echo", response_model=EchoResponse)` handler `get_echo(msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]) -> EchoResponse` returning `EchoResponse(echo=msg)`. No default for `msg`, so it is required. The handler contains no validation logic of its own.
- Registration (`backend/app/main.py`): import `router as echo_router` from `app.routers.echo` and `app.include_router(echo_router)` in `create_app()`; add TEST-06 to the module docstring's list of features that register routers. Nothing else in the factory changes.
- Service layer: none (see Plan Overview).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg` (required, string, at most 200 characters). Example: `/api/echo?msg=hello`.
- Response 200: `EchoResponse`, JSON `{"echo": "hello"}`.
- Response 422 (missing `msg`): FastAPI's standard validation body, e.g. `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`.
- Response 422 (`msg` over 200 characters): FastAPI's standard validation body, e.g. `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], ...}]}`.

## Technology Selection
- `backend/app/schemas/echo.py` (EchoResponse and the length bound): chose a Pydantic `BaseModel` with `Field(max_length=...)` (Pydantic is already installed with FastAPI, and the existing schemas use it) over a bare dict or a hand-written length check, because criterion 4 requires a Pydantic schema and criterion 3 requires a declared bound.
- `backend/app/routers/echo.py` (the GET handler and its 422s): chose FastAPI's own `Query(max_length=...)` and required-parameter validation (installed dependency) over a custom check and exception handler, because FastAPI already produces the standard 422 for both a missing and an over-length parameter.
- No new dependency is added; `backend/pyproject.toml` and `backend/uv.lock` are unchanged.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and the `EchoResponse` Pydantic model
- [B] backend/app/routers/echo.py: `GET /api/echo` router with `msg` declared via `Query(max_length=ECHO_MSG_MAX_LENGTH)`
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoResponse` and the bound
- [B] backend/tests/integration/test_echo_integration.py: HTTP request/response tests for `GET /api/echo`
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register `echo_router`; docstring mentions TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: the `EchoResponse` schema and its bound (pure Pydantic validation, no app, no database).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_echo_unit.py`; plus one new test in the existing `test_main_unit.py` for the router registration.
  - Tests: `test_echo_response_serializes_message_under_echo_key`, `test_echo_response_accepts_message_at_max_length`, `test_echo_response_rejects_message_over_max_length`, `test_echo_msg_max_length_is_200`, `test_create_app_registers_echo_route`.
- Integration tests: the full HTTP cycle through FastAPI's `TestClient`, using the shared session-scoped `client` fixture in `backend/tests/conftest.py`. The endpoint needs no database, so these tests use no database fixture.
  - Directory: backend/tests/integration/
  - File: `test_echo_integration.py`
  - Tests: `test_get_echo_returns_200_with_message_echoed`, `test_get_echo_decodes_url_encoded_message` (edge: `msg=hello%20world` returns `{"echo": "hello world"}`, proving query-string handling end to end), `test_get_echo_without_msg_returns_422`, `test_get_echo_with_msg_over_200_chars_returns_422`, `test_get_echo_with_msg_of_exactly_200_chars_returns_200` (boundary), `test_get_echo_openapi_declares_echo_response_schema` (the OpenAPI 200 response for `/api/echo` references the `EchoResponse` component, proving the body is schema-defined).
- E2E tests: none warranted. E2E Tests are ENABLED, but no criterion involves navigation or interaction through the UI; this feature has no UI at all (`testing_standards.md` Section 6, fourth question, asked per criterion below).
  - Directory: e2e/tests/
  - File: none for this feature.
- UAT scenarios: one Gherkin scenario per criterion plus one edge-case scenario (exactly 200 characters returns 200).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | `test_get_echo_returns_200_with_message_echoed`, `test_get_echo_decodes_url_encoded_message` | verifying it needs no navigation or interaction: it is a router request/response behaviour with no UI |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | `test_get_echo_without_msg_returns_422` | verifying it needs no navigation or interaction: it is FastAPI request validation at the router |
| 3 | `msg` over 200 characters returns 422; bound stated in the schema | Integration and Unit | `test_get_echo_with_msg_over_200_chars_returns_422`, `test_get_echo_with_msg_of_exactly_200_chars_returns_200`, `test_echo_msg_max_length_is_200`, `test_echo_response_rejects_message_over_max_length` | verifying it needs no navigation or interaction: it is a validation rule, checked at the router and on the schema |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit and Integration | `test_echo_response_serializes_message_under_echo_key`, `test_echo_response_accepts_message_at_max_length`, `test_get_echo_openapi_declares_echo_response_schema` | verifying it needs no navigation or interaction: it is a code-structure property, checked on the schema and the OpenAPI contract |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET `/api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | `GET /api/echo` with no `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When I GET `/api/echo` with no query string, Then the status is 422 and the body has a `detail` entry for `msg` |
| 3 | `msg` over 200 characters returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I GET `/api/echo` with a 201-character `msg`, Then the status is 422; and with a 200-character `msg` the status is 200 |
| 4 | Response body defined by a Pydantic schema | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When I open `/openapi.json`, Then the 200 response of `GET /api/echo` references the `EchoResponse` schema |

## Manual verification plan
This feature has no UI, so every check is made against the backend directly: in a browser address bar (which shows the JSON body) or with `curl -i` in a terminal (which also shows the status line). The backend from `docker compose up` listens on `http://localhost:8010`.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: the stack is running (`docker compose up -d` at the repo root) and `http://localhost:8010/api/version` answers in a browser.
1. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the status line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.
2. In a browser, open `http://localhost:8010/api/echo?msg=hello%20world` → the page shows `{"echo":"hello world"}` (the encoded space is decoded).

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: as for Criterion 1.
1. Run `curl -i "http://localhost:8010/api/echo"` → the status line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200), and the body is a JSON object with a `detail` list whose entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422
Prerequisites: as for Criterion 1.
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` in bash or zsh (a 201-character string of `a`) → the status line reads `HTTP/1.1 422 Unprocessable Entity`, and the `detail` entry has `"type":"string_too_long"` and `"loc":["query","msg"]`.
2. Run the same command with `{1..200}` (exactly 200 characters) → the status is `HTTP/1.1 200 OK` and the body echoes the 200 `a` characters under `echo`.
3. Open `backend/app/routers/echo.py` → the handler body only builds `EchoResponse(echo=msg)`; there is no `len(...)` check or `if` on the length. Open `backend/app/schemas/echo.py` → it defines `ECHO_MSG_MAX_LENGTH = 200`, which the router's `Query(max_length=...)` references.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for Criterion 1.
1. In a browser, open `http://localhost:8010/docs`, expand `GET /api/echo` → the 200 response's schema is shown as `EchoResponse` with one string property `echo`.
2. Open `backend/app/routers/echo.py` → the route declares `response_model=EchoResponse` and returns an `EchoResponse` instance, not a dict literal.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` from the repo root → the run passes: its summary line reports no failed or errored test, and the command exits 0.
