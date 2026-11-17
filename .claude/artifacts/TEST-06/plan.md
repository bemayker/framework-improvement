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

## Plan Overview
Backend only. One new schema module (`backend/app/schemas/echo.py`) holding two Pydantic models: `EchoQuery`, the query-parameter model that declares `msg` as required with `max_length=200`, and `EchoResponse`, the response body `{"echo": str}`. One new router (`backend/app/routers/echo.py`) exposing `GET /api/echo`, which takes `EchoQuery` as a FastAPI query-parameter model and returns `EchoResponse(echo=query.msg)`. The router is registered in `create_app()` in `backend/app/main.py`, alongside the version, notes and health routers. Validation failures (missing `msg`, `msg` over 200 characters) are produced by FastAPI's own request validation, so the response is its standard 422 body and the handler contains no checks of its own.

Decisions and assumptions recorded:
1. No service module. The router follows the existing `routers/version.py` shape, but echo has no business logic to place in a service (it returns its input unchanged) and no persistence, so a pass-through `echo_service.py` would be an empty layer; `coding_standards/backend_frontend.md` Section 2.2 gives the router "query parameter validation via schemas", which is exactly what this endpoint is. This is the "one router, one schema" shape the item itself names.
2. "The bound is stated in the schema" (criterion 3) is read as: the 200-character limit lives on a Pydantic model in `backend/app/schemas/echo.py` (`Field(max_length=200)` on `EchoQuery.msg`), consumed by the router as `Annotated[EchoQuery, Query()]`. The installed FastAPI (0.139.2, `backend/uv.lock`) supports query-parameter models. An inline `Query(max_length=200)` in the router signature was rejected because it states the bound in the router, not the schema.
3. "200 characters" means Unicode characters as Pydantic's `max_length` counts them (code points); exactly 200 is accepted, 201 is rejected.
4. Scope containment (`user_story_alignment.md` Section 3): no minimum length, no trimming, no escaping, no other methods. An empty `msg` (`?msg=`) is not addressed by any criterion and is left as Pydantic's default behaviour (accepted, echoes `""`); no test asserts it either way.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}`, returns the given text as `{"echo": text}`; registered via `APIRouter(prefix="/api", tags=["echo"])`.
- Service layer: none (decision 1 above); the router builds `EchoResponse` from the validated query model.
- Repository layer: none, the endpoint touches no data.
- Migrations: none.
- Schemas: `backend/app/schemas/echo.py` with `EchoQuery(BaseModel)`, field `msg: str = Field(max_length=200)` (required, no default), and `EchoResponse(BaseModel)`, field `echo: str`. The 200 is a module constant `MAX_ECHO_MESSAGE_LENGTH = 200` referenced by the `Field`, so tests import the bound rather than repeat it.
- Router: `backend/app/routers/echo.py`, `@router.get("/echo", response_model=EchoResponse)`, handler `get_echo(query: Annotated[EchoQuery, Query()]) -> EchoResponse`, body `return EchoResponse(echo=query.msg)`. No length or presence check in the handler.
- Registration: `backend/app/main.py` imports `router as echo_router` from `app.routers.echo` and adds `app.include_router(echo_router)` in `create_app()`; the module docstring gains TEST-06 in its list of registered routers. Nothing else in `main.py` changes (CORS already allows `GET`).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg` (string, required, at most 200 characters). No body.
- Response: 200 with `EchoResponse`, for example `{"echo": "hello"}`. 422 with FastAPI's standard validation body when `msg` is absent, for example `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}`, or longer than 200 characters, for example `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "input": "...", "ctx": {"max_length": 200}}]}`. Tests assert the status, `type` and `loc`, not the full message text.

## Technology Selection
- Length bound on `msg`: chose Pydantic's built-in `Field(max_length=200)` on the query model over a hand-rolled `len()` check in the handler, because the installed dependency already enforces it and produces FastAPI's standard 422 (criterion 3 requires exactly this).
- Required-parameter handling: chose FastAPI's own request validation (a field with no default) over any custom check or exception handler, because the installed framework already returns the standard 422 for a missing query parameter (criterion 2).
- `EchoQuery` and `EchoResponse` schemas: chose Pydantic `BaseModel`, already installed (2.13.4) and used by every existing schema in `backend/app/schemas/`; no stdlib or new dependency considered, none needed.
- `backend/app/routers/echo.py`: chose FastAPI's `APIRouter`, already installed and used by the existing routers; no alternative applies.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `MAX_ECHO_MESSAGE_LENGTH`, `EchoQuery` (query model, `msg` required, max 200) and `EchoResponse` (`echo: str`)
- [B] backend/app/routers/echo.py: `GET /api/echo` router returning `EchoResponse` from the validated `EchoQuery`
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoQuery` validation and `EchoResponse` serialization
- [B] backend/tests/integration/test_echo_integration.py: router integration tests through the full HTTP cycle (200, missing `msg` 422, over-length 422, boundary, OpenAPI response schema)
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus the 200-character boundary edge case
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script written by build-feature

### Modified files
- [B] backend/app/main.py: import and register the echo router in `create_app()`; docstring lists TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `EchoQuery` accepts a short message and a message of exactly `MAX_ECHO_MESSAGE_LENGTH` characters, rejects one character over with a `string_too_long` `ValidationError`, and rejects a missing `msg` with a `missing` error; `EchoResponse(echo="hello").model_dump()` equals `{"echo": "hello"}`. Plus `test_create_app_registers_echo_route` in the existing app-factory test file. No database, no client.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_echo_unit.py` (and the existing `test_main_unit.py`)
- Integration tests: the router through `TestClient` (the session-scoped `client` fixture in `backend/tests/conftest.py`): 200 with `{"echo": "hello"}`; 422 with `detail[0].type == "missing"` and `loc == ["query", "msg"]` when `msg` is absent; 422 with `detail[0].type == "string_too_long"` for 201 characters; 200 echoing all 200 characters at the boundary; and the app's OpenAPI document declares the 200 response of `GET /api/echo` as a `$ref` to the `EchoResponse` schema. No database needed: the endpoint touches none, so no `notes_table` or `database_url` fixture.
  - Directory: backend/tests/integration/
- E2E tests: none for this feature. E2E is enabled in `CLAUDE.md`, but no criterion involves navigation or interaction through the UI (no frontend consumes this endpoint), so no spec is warranted (`testing_standards.md` Section 6, asked per criterion below).
  - Directory: e2e/tests/
  - File: none (would be `TEST-06_echo_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case, phrased as HTTP requests and responses.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | `test_get_echo_returns_200_with_message`, `test_create_app_registers_echo_route` | Verifying it needs no navigation or interaction: no UI calls this endpoint, it is a router request/response cycle |
| 2 | `GET /api/echo` with no `msg` returns 422, the standard validation response | Integration, Unit | `test_get_echo_without_msg_returns_422`, `test_echo_query_rejects_missing_msg` | Verifying it needs no navigation or interaction: it is request validation on the router |
| 3 | `msg` over 200 characters returns 422, bound stated in the schema | Integration, Unit | `test_get_echo_with_msg_over_200_characters_returns_422`, `test_get_echo_with_msg_of_exactly_200_characters_returns_200`, `test_echo_query_rejects_msg_longer_than_200_characters`, `test_echo_query_accepts_msg_of_exactly_200_characters` | Verifying it needs no navigation or interaction: it is a schema validation rule |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit, Integration | `test_echo_response_serializes_echo_field`, `test_get_echo_openapi_declares_echo_response_schema` | Verifying it needs no navigation or interaction: it is a property of the schema and the route's declared response model |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | No `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo` with no query string, Then the status is 422 and the error names `msg` as missing |
| 3 | `msg` over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo` with a 201-character `msg`, Then the status is 422 with a `string_too_long` error; and with exactly 200 characters the status is 200 |
| 4 | Response body defined by a Pydantic schema | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When I open the OpenAPI document, Then the 200 response of `GET /api/echo` references the `EchoResponse` schema |

## Manual verification plan
No criterion can be verified through the app's UI: no frontend screen calls `GET /api/echo`. Every check below reads the HTTP response directly, with `curl` in a terminal or the browser's address bar, against the backend on `http://localhost:8010` (the port `docker-compose.yml` publishes).

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: the stack is running (`docker compose up -d --build` from the repo root) and `docker compose ps` shows the backend service up.
1. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK` and the body is `{"echo":"hello"}`.
2. In a browser, open `http://localhost:8010/api/echo?msg=hello` → the page shows `{"echo":"hello"}`.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: as for Criterion 1.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first line reads `HTTP/1.1 422 Unprocessable Entity` (or `Unprocessable Content`), and the body is a JSON object whose `detail` list has one entry with `"type":"missing"` and `"loc":["query","msg"]`. It is not a 500 and not a 200.

### Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema
Prerequisites: as for Criterion 1, plus `python3` on the PATH to generate the long message.
1. Run `curl -i --get --data-urlencode "msg=$(python3 -c 'print("a" * 201)')" http://localhost:8010/api/echo` (a `msg` of 201 letters `a`) → `HTTP/1.1 422`, and the `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
2. Run the same command with `201` changed to `200` (a `msg` of exactly 200 letters) → `HTTP/1.1 200 OK` with `{"echo":"aaaa…"}` holding all 200 letters.
3. Open `backend/app/schemas/echo.py` → `EchoQuery.msg` carries `max_length` set to `MAX_ECHO_MESSAGE_LENGTH` (200). Open `backend/app/routers/echo.py` → the handler contains no `len(` call and no `if` on `msg`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: as for Criterion 1.
1. In a browser, open `http://localhost:8010/docs` and expand `GET /api/echo` → under Responses, the 200 response shows the `EchoResponse` schema with one string field `echo`.
2. Open `backend/app/routers/echo.py` → the route declares `response_model=EchoResponse` and returns `EchoResponse(...)`, not a dict literal.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the summary line reports no failed or errored test and the command exits 0.
