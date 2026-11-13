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
- Comment (tracker): 25 framework-authored link comments of the form "mayker-dev: plan PR opened for TEST-06: https://github.com/bemayker/framework-improvement/pull/{n} ..." (newest names pull/758, CLOSED) → not acted on because none carries a request, correction or amendment to the feature; they are the framework's own PR-link notices from earlier sandbox runs. This is a fresh plan: no PR comments, and no merged-since lines (n/a, fresh plan branched from current main at 385e1bb).
- Assumption (ambiguity, recorded rather than blocking): `GET /api/echo?msg=` (present but empty) returns 200 with `{"echo": ""}`. The criteria set only an upper bound and require `msg` to be present; a minimum length would be unrequested scope.
- Assumption: `msg` is echoed verbatim, with no trimming or normalisation. Whitespace handling is deliberately left to TEST-11 and BUG-05, which depend on this item and specify opposite behaviour; deciding it here would pre-empt them.
- Assumption: exactly 200 characters is accepted (200), 201 is rejected (422). "Longer than 200" means a length strictly greater than 200, which is Pydantic's `max_length=200` semantics.

## Plan Overview
One read-only backend endpoint, `GET /api/echo`, following the existing TEST-05 and TEST-02 shape: a router module under `backend/app/routers/`, request and response schemas under `backend/app/schemas/`, and one `include_router` line in `backend/app/main.py`. The query parameter is declared as a Pydantic query-parameter model (`EchoQuery`), so both the "required" rule (criterion 2) and the 200-character bound (criterion 3) live in the schema and FastAPI's own request validation returns its standard 422 body; the handler contains no validation code. The response is the `EchoResponse` model (criterion 4). No database, no service, no repository, no frontend.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this item).

## Backend Plan
- Endpoints: `GET /api/echo`, returns the `msg` query parameter back in an `EchoResponse` body. Router `APIRouter(prefix="/api", tags=["echo"])`, matching `version.py` and `health.py`. Signature shape: `def get_echo(query: Annotated[EchoQuery, Query()]) -> EchoResponse`, `response_model=EchoResponse`, returning `EchoResponse(echo=query.msg)`.
- Schemas: `backend/app/schemas/echo.py` holds `MAX_ECHO_LENGTH = 200`, `EchoQuery(BaseModel)` with `msg: str = Field(max_length=MAX_ECHO_LENGTH)` (required: no default), and `EchoResponse(BaseModel)` with `echo: str`. Query-parameter models are supported by the installed FastAPI (0.139.2 in `backend/uv.lock`).
- Service layer: none. There is no business logic to hold: the handler copies one validated field into the response. A pass-through `echo_service.py` would be an empty layer (KISS, `coding_standards.md` Section 1), and the layered pattern in `coding_standards.md` Section 2.2 applies "when the project includes a backend with data persistence", which this endpoint does not touch.
- Repository layer: none (no data access).
- Migrations: none.
- Registration: `backend/app/main.py` imports `router as echo_router` from `app.routers.echo` and adds `app.include_router(echo_router)` after the existing three; the module docstring gains one clause naming TEST-06. CORS `allow_methods` already includes `GET`, so no middleware change.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg` (string, required, at most 200 characters). No body, no headers beyond the defaults.
- Response 200: `{"echo": "<msg verbatim>"}`, e.g. `GET /api/echo?msg=hello` returns `{"echo": "hello"}`.
- Response 422 (missing `msg`): FastAPI's standard validation body, `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`.
- Response 422 (`msg` over 200 characters): `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "ctx": {"max_length": 200}, ...}]}`.

## Technology Selection
- Length bound and required-field rule: chose Pydantic `Field(max_length=200)` on a required field in a query-parameter model (installed dependency) over a hand-rolled `len(msg) > 200` check in the handler, because criterion 3 requires the bound in the schema and FastAPI then produces the standard 422 for free.
- Query-parameter model `EchoQuery`: chose FastAPI's `Annotated[EchoQuery, Query()]` (installed, FastAPI 0.139.2) over `Annotated[str, Query(max_length=200)]` directly on the handler, because the criterion says the bound is stated in the schema in `backend/app/schemas/`, and an inline `Query(max_length=...)` would put it in the router.
- Response model `EchoResponse`: chose a Pydantic `BaseModel` (installed) over a bare dict, as criterion 4 requires; no alternative rung applies.
- New dependencies: none. Everything uses FastAPI, Pydantic and pytest already in `backend/pyproject.toml`.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `MAX_ECHO_LENGTH`, `EchoQuery` (required `msg`, `max_length=200`) and `EchoResponse` (`echo: str`)
- [B] backend/app/routers/echo.py: `GET /api/echo` router returning `EchoResponse(echo=query.msg)`, no validation logic of its own
- [B] backend/tests/unit/test_echo_schema_unit.py: unit tests for `EchoQuery` and `EchoResponse` validation (boundary at 200 and 201, missing field, empty string)
- [B] backend/tests/integration/test_echo_integration.py: full HTTP request and response cycle for `GET /api/echo` (200, missing 422, too-long 422, boundary 200, OpenAPI response schema reference)
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from this plan's `## Manual verification plan`
- [G] .claude/artifacts/TEST-06/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)

### Modified files
- [B] backend/app/main.py: import the echo router and register it with `app.include_router(echo_router)`; docstring names TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`, following the existing version and health registration tests

No lockfile changes: this item adds no dependency. No `README.md` or `docs/DEVELOPMENT.md` edit: the feature changes no project structure, run configuration, dependency or test infrastructure, so build-feature Section 15's condition is not met.

## Testing Strategy
- Unit tests: `EchoQuery` and `EchoResponse` schema validation in isolation (no app, no HTTP): accepts `hello`, accepts exactly 200 characters, accepts the empty string, rejects 201 characters with a `string_too_long` error, rejects a missing `msg` with a `missing` error; `EchoResponse` serialises to `{"echo": ...}`. Plus the router registration check in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (here `test_echo_schema_unit.py`)
- Integration tests: the router through the real HTTP cycle with the session-scoped `client` fixture from `backend/tests/conftest.py` (no database fixture needed; the endpoint touches none): 200 happy path, 422 on missing `msg`, 422 on 201 characters, 200 on exactly 200 characters, and the OpenAPI document's 200 response for `/api/echo` referencing `#/components/schemas/EchoResponse`.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion involves navigation or interaction through the UI (no frontend consumes this endpoint), and `testing_standards.md` Section 5 forbids an E2E test that bypasses the UI to call the API, which is a router integration test.
  - Directory: e2e/tests/ (no file for this item)
  - File: n/a, no spec is written
- UAT scenarios: one scenario per criterion plus one edge case (exactly 200 characters accepted), phrased as API-level checks.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | `test_get_echo_returns_200_with_message` | Verifying it needs no navigation or interaction: it is a router request and response behaviour, and no UI calls it |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration, Unit | `test_get_echo_without_msg_returns_422`, `test_echo_query_without_msg_raises_missing_error` | Verifying it needs no navigation or interaction: it is request validation at the router |
| 3 | `msg` over 200 characters returns 422, bound in the schema | Unit, Integration | `test_echo_query_with_201_characters_raises_string_too_long`, `test_echo_query_accepts_exactly_200_characters`, `test_get_echo_with_201_characters_returns_422` | Verifying it needs no navigation or interaction: it is a schema validation rule, and the unit test proves the bound lives in the schema rather than the handler |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit, Integration | `test_echo_response_serialises_echo_field`, `test_openapi_declares_echo_response_schema` | Verifying it needs no navigation or interaction: it is a structural property of the route, read from the schema and the OpenAPI document |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running When I request `/api/echo?msg=hello` Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | Missing `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running When I request `/api/echo` with no query string Then the status is 422 and the detail names `msg` as missing |
| 3 | Over 200 characters returns 422 | covered at Unit and Integration, see Criterion coverage | Given the backend is running When I request `/api/echo` with a 201-character `msg` Then the status is 422 and the detail reports `string_too_long` |
| 4 | Response defined by a Pydantic schema | covered at Unit and Integration, see Criterion coverage | Given the backend is running When I read `/openapi.json` Then the 200 response of `GET /api/echo` references the `EchoResponse` schema |

## Manual verification plan
No criterion is verifiable through the UI: no frontend consumes `GET /api/echo`. The observable check is the HTTP response itself, read with `curl` against the backend at `http://localhost:8010` (the host port `docker-compose.yml` publishes; use the port your stack reports if a handover rebuild moved it).

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: the stack is running (`docker compose up -d`), and `curl -i http://localhost:8010/api/version` answers `HTTP/1.1 200 OK`.
1. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`, showing the query string is decoded end to end.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: as for Criterion 1.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first line reads `HTTP/1.1 422 Unprocessable Entity` (never 500, never 200), and the body is a `detail` list whose entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422
Prerequisites: as for Criterion 1.
1. Run `curl -i "http://localhost:8010/api/echo?msg=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"` (201 letters `a`) → `HTTP/1.1 422 Unprocessable Entity`, and the `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
2. Remove one `a` from the URL (200 letters) and run it again → `HTTP/1.1 200 OK` with the 200 letters echoed back under `echo`.
3. Open `backend/app/routers/echo.py` → the handler contains no length check; the bound appears only as `max_length` in `backend/app/schemas/echo.py`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for Criterion 1.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` → the 200 response's schema is named `EchoResponse` with one string field `echo`.
2. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with `echo: str`, and `backend/app/routers/echo.py` declares `response_model=EchoResponse` and returns an `EchoResponse`, not a dict.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the run ends with `0 failed`.
