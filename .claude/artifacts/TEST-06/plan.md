# Implementation Plan, TEST-06: Echo endpoint

## Feature
> A small backend feature for the assisted lifecycle (Arm C of measured run 2). Deliberately narrow: one router, one schema, its tests.
>
> **What:** `GET /api/echo?msg={text}` returns the text it was given, so a caller can prove the API is reachable and that query-string handling works end to end.
>
> **Notes:** Follows the shape TEST-02 established: a router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. It touches `main.py`'s router registration, so it must not run concurrently with another item that does the same.
>
> Source: ClickUp task 123k99ctgcf (https://app.clickup.com/t/123k99ctgcf).

## Acceptance Criteria
- [ ] 1. `GET /api/echo?msg=hello` returns **200** with body `{"echo": "hello"}`.
- [ ] 2. `GET /api/echo` with no `msg` returns **422**, the framework's standard validation response, rather than a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns **422**. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Plan Overview
Backend only. One new schema module (`backend/app/schemas/echo.py`) holding two Pydantic models: `EchoQuery`, the query-parameter model whose `msg` field is required and carries `max_length=200` (criteria 2 and 3), and `EchoResponse`, the response body `{"echo": str}` (criterion 4). One new router (`backend/app/routers/echo.py`) exposing `GET /api/echo`, which binds the query through FastAPI's query-parameter-model support (`Annotated[EchoQuery, Query()]`, available in the installed FastAPI 0.139.2) and returns `EchoResponse(echo=query.msg)`. FastAPI's own `RequestValidationError` handling produces the 422 for a missing or over-long `msg`, so the handler has no validation code at all. The router is registered in `create_app()` in `backend/app/main.py` with one `include_router` line, matching version, notes and health.

No service or repository layer: the endpoint has no business logic and no persistence, so a service that only returns its argument would be an abstraction with nothing to abstract (`coding_standards.md` Section 1, KISS; Section 2.2 applies the Router, Service, Repository pattern to a backend with data persistence, and this endpoint touches none).

Assumptions (recorded, not blocking):
- The message is echoed verbatim: no trimming, no case change. Whitespace handling is the subject of later items (TEST-11 trims, BUG-05 keeps) and is out of this item's scope.
- An empty `msg` (`/api/echo?msg=`) is present, so it returns 200 with `{"echo": ""}`. Criterion 2 names only the absent parameter; no minimum length is added.
- Exactly 200 characters is accepted (the bound is "longer than 200"), and that boundary is tested.
- Unknown extra query parameters are ignored (Pydantic's default), not rejected: no criterion asks for rejection.

## Frontend Plan
No frontend changes required. Nothing in the acceptance criteria renders the echo response; Design Reference mode is NONE.

## Backend Plan
- Endpoints: `GET /api/echo`, query parameter `msg` (required string, at most 200 characters), returns the message in an `EchoResponse` body.
- Router: `backend/app/routers/echo.py`, `APIRouter(prefix="/api", tags=["echo"])`, one handler `get_echo(query: Annotated[EchoQuery, Query()]) -> EchoResponse` with `response_model=EchoResponse`. No validation logic in the handler.
- Schemas: `backend/app/schemas/echo.py`, `EchoQuery` (`msg: str = Field(max_length=200)`, the bound expressed as a named constant `MAX_ECHO_LENGTH = 200`) and `EchoResponse` (`echo: str`).
- Service layer: none (see Plan Overview).
- Repository layer: none.
- Migrations: none.
- Registration: `app.include_router(echo_router)` in `create_app()`, `backend/app/main.py`, plus the import line; the module docstring's list of registered routers gains TEST-06.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg` (required, string, length 0 to 200). No body.
- Response:
  - 200: `{"echo": "hello"}` for `?msg=hello`
  - 422 (no `msg`): FastAPI's standard validation body, e.g. `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`
  - 422 (`msg` of 201+ characters): FastAPI's standard validation body, e.g. `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "ctx": {"max_length": 200}, ...}]}`

## Technology Selection
- Length bound on `msg`: chose Pydantic's `Field(max_length=200)` on the query model (installed dependency) over a hand-rolled `len()` check in the handler, because criterion 3 requires the bound in the schema and Pydantic plus FastAPI already produce the standard 422.
- Query binding: chose FastAPI's query-parameter model (`Annotated[EchoQuery, Query()]`, installed FastAPI 0.139.2) over `Query(max_length=200)` in the router signature, because the latter states the bound in the router rather than in `backend/app/schemas/`.
- Response body: chose a Pydantic `BaseModel` (installed) over a bare dict, as criterion 4 requires.
- No new dependency is added; no stdlib, native platform or installed alternative was missing.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `EchoQuery` (required `msg`, `max_length=200`) and `EchoResponse` (`echo: str`) Pydantic models.
- [B] backend/app/routers/echo.py: `GET /api/echo` router binding `EchoQuery` from the query string and returning `EchoResponse`, no handler-side validation.
- [B] backend/tests/unit/test_echo_unit.py: schema unit tests: `EchoQuery` accepts `hello` and exactly 200 characters, rejects 201 characters and a missing `msg`; `EchoResponse` serializes to `{"echo": ...}`.
- [B] backend/tests/integration/test_echo_integration.py: full HTTP cycle: 200 with `{"echo": "hello"}`, 422 with no `msg`, 422 with 201 characters, 200 at exactly 200 characters.
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (exactly 200 characters accepted).
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-06/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the echo router and register it in `create_app()` with one `include_router` line; docstring names TEST-06.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is wired in.

No dependency manifest changes, so no lockfile is touched (FastAPI and pydantic are already installed). Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure, and neither document lists the existing endpoints. No E2E spec is produced (see Testing Strategy).

## Testing Strategy
- Unit tests: the schema layer, in isolation (no app, no HTTP): `EchoQuery` validation (happy path `hello`, boundary edge case of exactly 200 characters, error cases of 201 characters and a missing `msg`) and `EchoResponse` serialization; plus the app-factory registration test.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py` (here `test_echo_unit.py`; the registration test joins the existing `test_main_unit.py`)
- Integration tests: the router through the full HTTP request/response cycle with the session-scoped `client` fixture from `backend/tests/conftest.py` (no database is touched): 200 happy path, 422 missing parameter, 422 over-long parameter, 200 at the boundary.
  - Directory: `backend/tests/integration/`
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6's fourth question, asked per criterion: all four are HTTP status and payload behaviours of a backend endpoint no UI consumes), so no `e2e/tests/TEST-06_*.spec.ts` is produced.
  - Directory: `e2e/tests/` (not used by this feature)
  - File: `TEST-06_echo_endpoint.spec.ts` (not produced)
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case, phrased as API requests and responses.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | `test_get_echo_with_msg_returns_200_with_echoed_text` | Verifying it needs no navigation or interaction: it is a router request/response behaviour no UI consumes |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration, Unit | `test_get_echo_without_msg_returns_422`, `test_echo_query_without_msg_raises_validation_error` | Verifying it needs no navigation or interaction: it is the framework's request validation on a router |
| 3 | `msg` longer than 200 characters returns 422, bound stated in the schema | Integration, Unit | `test_get_echo_with_201_character_msg_returns_422`, `test_echo_query_with_201_characters_raises_validation_error`, `test_echo_query_with_200_characters_is_accepted` | Verifying it needs no navigation or interaction: it is a schema validation rule, observed through the router |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | `test_echo_response_serializes_echo_field` | Verifying it needs no navigation or interaction: it is a structural property of the schema module, plus criterion 1's body shape |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | `GET /api/echo` with no `msg` returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request `GET /api/echo` with no query string, Then the status is 422 and the body names the missing `msg` |
| 3 | `msg` longer than 200 characters returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request `GET /api/echo` with a 201-character `msg`, Then the status is 422; and with exactly 200 characters, Then the status is 200 |
| 4 | Response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When I open `/docs`, Then `GET /api/echo` shows the `EchoResponse` response schema |

## Manual verification plan
None of these criteria can be verified by clicking through the app's UI: the endpoint has no screen. The checks below use a terminal against the running backend (host port 8010 from `docker-compose.yml`, or the port the handover names in the PR description) and the FastAPI docs page, which is the observable surface.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: the backend is running (`docker compose up -d` at the repo root, or the handover stack named in the PR description).
1. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the status line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → status 200 and the body is `{"echo":"hello world"}` (URL-encoded input is decoded and echoed verbatim).

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: the backend is running.
1. Run `curl -i "http://localhost:8010/api/echo"` → the status line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200) and the body is a JSON `detail` list whose entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422
Prerequisites: the backend is running.
1. Run `curl -i "http://localhost:8010/api/echo?msg=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"` (201 letters `a`) → status 422 and the `detail` entry has `"type":"string_too_long"` with `"ctx":{"max_length":200}`.
2. Run the same request with exactly 200 letters `a` (remove one `a`) → status 200 and the body echoes all 200 letters.
3. Open `backend/app/routers/echo.py` → the handler contains no length check; open `backend/app/schemas/echo.py` → `EchoQuery.msg` declares `max_length` of 200.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the backend is running.
1. In a browser, open `http://localhost:8010/docs` → the endpoint list shows `GET /api/echo` under the `echo` tag.
2. Expand `GET /api/echo` → the 200 response shows the `EchoResponse` schema with a single string field `echo`, and the parameters list shows `msg` as required with a maximum length of 200.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the run reports `0 failed`.
