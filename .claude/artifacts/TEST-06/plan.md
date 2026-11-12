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
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). This item was built and merged in measured run 2 (PR #23, squash 8794a99 on main). [...] Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: checked before planning, against `origin/main` at b7f2644. The tree holds no echo code: `git ls-tree -r --name-only origin/main` lists no `echo` path under `backend/`, `frontend/` or `e2e/` (routers are `health.py`, `notes.py`, `version.py`; schemas `health.py`, `note.py`, `version.py`), and `git grep -i echo origin/main -- backend frontend e2e` matches only the word "echoed" in a docstring of `backend/tests/integration/test_notes_integration.py`. `backend/app/main.py` registers only the version, notes and health routers. Commit 8794a99 (and later TEST-06 merges such as ea5f29a, #316) are ancestors of `origin/main`, but their files were removed by subsequent reset commits (latest eaaa718, #724), so the precondition the comment sets (main does not hold the feature) is met and this plan proceeds as a full first build. I did not trace a revert commit naming ffbfc12 and a9695cc specifically; the tree state is the check that matters.
- Comment (tracker): the 24 "mayker-dev: plan PR opened for TEST-06 ..." link comments (newest #694) → not acted on because they are framework link notices for earlier, now closed plan PRs and ask for nothing.

## Plan Overview
Backend only. Add `GET /api/echo` as a new router (`backend/app/routers/echo.py`) registered in `create_app()` in `backend/app/main.py`, beside the version, notes and health routers. Two Pydantic schemas in `backend/app/schemas/echo.py`: `EchoQuery`, a FastAPI query-parameter model carrying `msg: str = Field(max_length=200)` (required, so a missing `msg` and an over-long `msg` both fail FastAPI's own request validation with the standard 422), and `EchoResponse` with `echo: str` as the response model. The handler holds no validation logic and no business logic: it returns `EchoResponse(echo=query.msg)`.

Key decisions:
- No service layer. `coding_standards/backend_frontend.md` Section 2.2 puts business logic in the service, and this endpoint has none (it returns its input unchanged), so a service module would be an empty pass-through; the issue scopes the item as "one router, one schema, its tests" and `CLAUDE.md` Architecture Notes say "Keep every feature as small as possible". The TEST-05 version router is the precedent for a router that builds its response schema directly.
- The 200-character bound lives in the schema as a named constant `MAX_ECHO_MESSAGE_LENGTH = 200` used by `Field(max_length=...)`, satisfying criterion 3's "stated in the schema" literally; the router never calls `len()`.
- `msg` is echoed exactly as received after URL decoding: no trimming, no case change. Whitespace handling is the subject of later items (TEST-11, BUG-05) and is out of scope here.

Assumptions (no criterion decides them; recorded rather than blocking):
- An empty `msg` (`?msg=`) is allowed and returns 200 `{"echo": ""}`. No criterion asks for a minimum length, and adding `min_length=1` would be an unrequested rule.
- Exactly 200 characters is accepted (criterion 3 says "longer than 200" is rejected), so 200 is the inclusive upper bound.
- Length is counted in characters as Pydantic counts them for `str` (Unicode code points after URL decoding), not bytes.
- Unknown extra query parameters are ignored (the query model is not set to forbid extras); no criterion asks for rejecting them.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo` (router prefix `/api`, tag `echo`), query parameter `msg` (required string, at most 200 characters), returns the message in an `EchoResponse` body.
- Service layer: none (see Plan Overview, key decisions).
- Repository layer: none; no data access.
- Migrations: none.
- Schemas: `backend/app/schemas/echo.py` with `MAX_ECHO_MESSAGE_LENGTH = 200`, `class EchoQuery(BaseModel): msg: str = Field(max_length=MAX_ECHO_MESSAGE_LENGTH)` and `class EchoResponse(BaseModel): echo: str`.
- Router: `backend/app/routers/echo.py`, `router = APIRouter(prefix="/api", tags=["echo"])`, `@router.get("/echo", response_model=EchoResponse)` with signature `def get_echo(query: Annotated[EchoQuery, Query()]) -> EchoResponse`. Query-parameter models are supported by the installed FastAPI (0.139.2 in `backend/uv.lock`).
- Registration: `backend/app/main.py` imports `router as echo_router` and calls `app.include_router(echo_router)` in `create_app()`; the module docstring's list of registering features gains TEST-06. Nothing else in `main.py` changes (CORS already allows `GET`).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg` (string, required, 0 to 200 characters). Example: `/api/echo?msg=hello`.
- Response:
  - 200: `{"echo": "hello"}` (schema `EchoResponse`).
  - 422 when `msg` is missing: FastAPI's standard validation body, e.g. `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`.
  - 422 when `msg` exceeds 200 characters: FastAPI's standard validation body with `"type": "string_too_long"`, `"loc": ["query", "msg"]`, and `"ctx": {"max_length": 200}`.

## Technology Selection
- `EchoQuery` (the 200-character bound): chose Pydantic `Field(max_length=200)` on a FastAPI query-parameter model (both already installed: fastapi 0.139.2, pydantic 2.13.4) over a hand-rolled `len()` check in the handler, because criterion 3 requires the bound in the schema and the framework's own validation already produces the standard 422 body.
- `EchoResponse`: chose a Pydantic `BaseModel` (installed) over a bare dict returned by the router, because criterion 4 requires a schema in `backend/app/schemas/`.
- `echo` router: no stdlib call, native platform feature or installed dependency replaces an HTTP endpoint, so it is built here on the installed FastAPI `APIRouter`.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `MAX_ECHO_MESSAGE_LENGTH`, `EchoQuery` (query model with the 200-character bound) and `EchoResponse` (response body)
- [B] backend/app/routers/echo.py: `GET /api/echo` router returning `EchoResponse` from the validated `EchoQuery`
- [B] backend/tests/unit/test_echo_unit.py: unit tests for the echo schemas (bound, required field, serialization)
- [B] backend/tests/integration/test_echo_integration.py: HTTP request/response tests for `GET /api/echo` through the app's test client
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus the 200-character boundary edge case
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import the echo router and register it in `create_app()`; add TEST-06 to the module docstring
- [B] backend/tests/unit/test_main_unit.py: add a test asserting the app registers `/api/echo`

No dependency changes, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is regenerated. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: the `EchoQuery` and `EchoResponse` schemas in isolation (no app, no HTTP): a message at exactly 200 characters validates, 201 characters raises `pydantic.ValidationError` with type `string_too_long`, a missing `msg` raises `ValidationError` with type `missing`, an empty string validates, and `EchoResponse(echo="hello").model_dump()` equals `{"echo": "hello"}`. Plus the app-factory test in `test_main_unit.py` that `/api/echo` is registered.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_echo_unit.py` (and the existing `test_main_unit.py`)
- Integration tests: the full HTTP cycle through the session-scoped `client` fixture in `backend/tests/conftest.py`: 200 happy path, 422 missing `msg`, 422 over 200 characters, 200 at exactly 200 characters, and the OpenAPI document naming `EchoResponse` as the 200 response schema. No database is touched; the tests need no `db_connection` fixture.
  - Directory: backend/tests/integration/
- E2E tests: no spec. No criterion involves navigation or interaction through the UI (no frontend consumes `/api/echo`), so per `testing_standards.md` Section 6's fourth question, asked per criterion, every criterion is covered at integration or unit level (see the table). Calling the API directly from Playwright would be a router integration test, which Section 5 lists as an anti-pattern.
  - Directory: e2e/tests/
  - File: none for this item (would be `TEST-06_echo_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case, verified against the HTTP response (UAT Generation is ENABLED).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | `test_get_echo_returns_200_with_echoed_message` | Verifying it needs no navigation or interaction: no UI consumes the endpoint, it is a router request/response behaviour |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration, Unit | `test_get_echo_without_msg_returns_422`, `test_echo_query_without_msg_raises_validation_error` | Verifying it needs no navigation or interaction: it is a request-validation rule on the router |
| 3 | `msg` longer than 200 characters returns 422, bound stated in the schema | Integration, Unit | `test_get_echo_with_msg_over_200_characters_returns_422`, `test_get_echo_with_msg_of_200_characters_returns_200`, `test_echo_query_with_msg_over_200_characters_raises_validation_error`, `test_echo_query_with_msg_of_200_characters_is_valid` | Verifying it needs no navigation or interaction: it is a schema validation rule, checked at the schema (unit) and through the HTTP cycle (integration) |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Integration, Unit | `test_get_echo_openapi_documents_echo_response_schema`, `test_echo_response_serializes_echo_field` | Verifying it needs no navigation or interaction: it is a structural property of the router, visible in the OpenAPI document and the schema itself |

App registration is additionally covered by `test_create_app_registers_echo_route` in `backend/tests/unit/test_main_unit.py`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `GET /api/echo?msg=hello`, Then the response is 200 with body `{"echo": "hello"}` |
| 2 | `GET /api/echo` with no `msg` returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client requests `GET /api/echo` without `msg`, Then the response is 422 with a validation detail naming `msg` |
| 3 | `msg` longer than 200 characters returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client requests `GET /api/echo` with a 201-character `msg`, Then the response is 422; and with a 200-character `msg` it is 200 |
| 4 | Response body defined by a Pydantic schema | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client reads `/openapi.json`, Then the 200 response of `GET /api/echo` references the `EchoResponse` schema |

## Manual verification plan
None of the four criteria is verifiable through the UI: no frontend screen calls `GET /api/echo`. The observable check is the HTTP response itself, read with `curl` against the backend the compose stack publishes on host port 8010 (`docker-compose.yml`).

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
Prerequisites: on branch `feature/TEST-06-echo-endpoint`, Docker running, `docker compose up -d --build` run from the repository root, and `docker compose ps` showing `backend` running; a terminal with `curl`.
1. Run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`, showing the query string is URL-decoded end to end.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: the stack from criterion 1 still up.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first line reads `HTTP/1.1 422 Unprocessable Entity` (some versions print `Unprocessable Content`), and the body is a JSON object whose `detail` list has one entry with `"type":"missing"` and `"loc":["query","msg"]`. It is not a 500 and not a 200.

### Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema
Prerequisites: the stack from criterion 1 still up; `python3` available to build the long strings.
1. Run `curl -i --get --data-urlencode "msg=$(python3 -c 'print("a"*201)')" "http://localhost:8010/api/echo"` → `HTTP/1.1 422 Unprocessable Entity`, body `detail` entry with `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
2. Run `curl -i --get --data-urlencode "msg=$(python3 -c 'print("a"*200)')" "http://localhost:8010/api/echo"` → `HTTP/1.1 200 OK` with body `{"echo":"aaaa…"}` holding the same 200 `a` characters, confirming 200 is the inclusive limit.
3. Open `backend/app/schemas/echo.py` and `backend/app/routers/echo.py` in an editor → the 200 limit appears in the schema (`MAX_ECHO_MESSAGE_LENGTH = 200` used by `Field(max_length=...)`), and the router contains no `len(` call and no `if` on the message length.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack from criterion 1 still up.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` → the 200 response's schema is shown as `EchoResponse` with one string property `echo`.
2. Open `backend/app/routers/echo.py` → the route declares `response_model=EchoResponse` and returns `EchoResponse(...)`, not a dict literal.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the run ends with `0 failed` for those three files.
