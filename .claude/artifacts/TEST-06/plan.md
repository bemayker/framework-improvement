# Implementation Plan, TEST-06: Echo endpoint

## Feature
> A small backend feature for the assisted lifecycle (Arm C of measured run 2). Deliberately narrow: one router, one schema, its tests.
>
> **What:** `GET /api/echo?msg={text}` returns the text it was given, so a caller can prove the API is reachable and that query-string handling works end to end.
>
> **Acceptance criteria:**
> 1. `GET /api/echo?msg=hello` returns **200** with body `{"echo": "hello"}`.
> 2. `GET /api/echo` with no `msg` returns **422**, the framework's standard validation response, rather than a 500 or an empty 200.
> 3. `msg` longer than 200 characters returns **422**. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
>
> **Notes:** Follows the shape TEST-02 established: a router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. It touches `main.py`'s router registration, so it must not run concurrently with another item that does the same.
>
> **Source:** ClickUp task 123k99ctgcf (https://app.clickup.com/t/123k99ctgcf), tracker-resident under Work Item Source `hybrid`. Tracker comments: none. Framework metadata (`feature_map.md`): branch `feature/TEST-06-echo-endpoint`; depends_on: TEST-01; scaffold: no; test_checkpoint: yes.

## Acceptance Criteria
- [ ] `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`.
- [ ] `GET /api/echo` with no `msg` returns 422, FastAPI's standard validation response (a `detail` array naming `["query", "msg"]`), never a 500 or an empty 200.
- [ ] `msg` longer than 200 characters returns 422; the bound is declared on the query parameter (`Query(max_length=...)`), never checked by hand in the handler.
- [ ] The response body is defined by a Pydantic model in `backend/app/schemas/` (`EchoResponse` in `backend/app/schemas/echo.py`), used as the endpoint's `response_model`; the router builds no bare dict.

## Plan Overview
Backend-only feature. Add `GET /api/echo` to the FastAPI app as a new router (`backend/app/routers/echo.py`, prefix `/api`, tags `["echo"]`, the same shape as `routers/version.py`) registered in `create_app()` in `backend/app/main.py`, with its response model `EchoResponse` in `backend/app/schemas/echo.py`. The `msg` query parameter is declared `Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]` with the constant `ECHO_MSG_MAX_LENGTH = 200` defined in the schema module next to the response model, so both the 422-on-missing and the 422-on-too-long behaviours come from FastAPI's own request validation and appear in the OpenAPI document; the handler contains no `if len(msg) ...` check and no `HTTPException`.

No service module and no repository: the endpoint has no business logic (it returns its input) and no data access, and the item's own scope statement is "one router, one schema, its tests". `coding_standards.md` Section 2.2 places business logic in the service layer; a layer with nothing in it would be gold plating (`user_story_alignment.md` Section 3). The decision is recorded in Technology Selection. No frontend work, no migration, no new dependency, no settings change.

Recorded assumptions (the item is silent, the plan decides rather than blocks):
- `?msg=` with an empty value returns 200 `{"echo": ""}`: no minimum length is stated, and adding `min_length=1` would be an invented rule. Tests assert only the four stated behaviours plus the 200-character boundary itself.
- The 422 body is FastAPI's default `{"detail": [...]}` shape, unmodified: the criterion says "the framework's standard validation response", and the project registers no custom validation handler.
- The response is exactly `{"echo": "<msg>"}` with no other fields; the text is returned verbatim (no trimming, no escaping beyond JSON encoding).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}` in `backend/app/routers/echo.py`. `router = APIRouter(prefix="/api", tags=["echo"])`; handler `get_echo(msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]) -> EchoResponse` decorated `@router.get("/echo", response_model=EchoResponse)`, returning `EchoResponse(echo=msg)`. Both `Query` and `Annotated` are imported from `fastapi` / `typing`, matching `routers/notes.py`'s `Annotated` usage. The parameter has no default, so a missing `msg` is a 422 from FastAPI's request validation (criterion 2). The `max_length` keyword is the whole of criterion 3's enforcement: **the 200-character bound lives in the query parameter declaration and nowhere else**; the handler body is one `return` statement, with no length check, no `HTTPException`, and no dict literal (criterion 4).
- Schema: `backend/app/schemas/echo.py` with `ECHO_MSG_MAX_LENGTH = 200` (module constant, `UPPER_SNAKE_CASE`, with a one-line "why" comment as `schemas/note.py` does for `NOTE_TEXT_MAX_LENGTH`) and `class EchoResponse(BaseModel): echo: str` with a docstring naming the endpoint, the same shape as `schemas/version.py`. The constant sits in the schema module so the bound is declared once beside the contract it belongs to, and the router only references it.
- Registration: one `from app.routers.echo import router as echo_router` import and one `app.include_router(echo_router)` line in `create_app()` in `backend/app/main.py`, after the existing three `include_router` calls; update the module docstring's list of registering features with one clause for TEST-06. Nothing else in `main.py` changes.
- Service layer: none (see Plan Overview and Technology Selection).
- Repository layer: none. No data access.
- Migrations: none. No schema change, no database involvement; the endpoint answers with or without `DATABASE_URL`, like `/api/version`.
- Logging and errors: nothing to log; there is no failure path of the feature's own (validation failures are FastAPI's, already returned as machine-readable JSON per `coding_standards.md` Section 2.3).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg` (string, required, `maxLength` 200). No body. No headers beyond defaults.
- Response 200 (`msg` present, 0 to 200 characters), `application/json`, schema `EchoResponse`:

  ```json
  {"echo": "hello"}
  ```

- Response 422 (`msg` missing), FastAPI's standard validation body:

  ```json
  {"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}
  ```

- Response 422 (`msg` longer than 200 characters), same shape with `type` `"string_too_long"`, `loc` `["query", "msg"]`, and `ctx.max_length` 200. Tests assert status, `loc` and `type`; the human-readable `msg` string is Pydantic's and is not asserted verbatim.
- OpenAPI (`GET /openapi.json`): `paths["/api/echo"].get.parameters[0]` has `name` `"msg"`, `in` `"query"`, `required` `true`, `schema.maxLength` 200; the 200 response's `application/json` schema is `{"$ref": "#/components/schemas/EchoResponse"}` and `components.schemas.EchoResponse` exists. This is the machine-readable proof that the bound and the body are declared rather than hand-coded.
- Any other method on the path: 405 (FastAPI default, as with `/api/version`).

## Technology Selection
- Router module `backend/app/routers/echo.py`: chose a dedicated `APIRouter` (installed FastAPI) over adding the route to an existing router (`health.py`, `version.py`), because the item names "one router" and the project's convention is one router module per endpoint; no stdlib or platform alternative exists for an HTTP route.
- Query parameter bound (criterion 3): chose `fastapi.Query(max_length=ECHO_MSG_MAX_LENGTH)` (installed FastAPI, validation by the already-installed Pydantic) over a hand-rolled `len(msg) > 200` check plus `HTTPException` in the handler (forbidden by the criterion, and invisible to OpenAPI) and over a Pydantic request model for a single scalar query parameter (a model would add a class for one field that `Query` already declares and documents).
- Response schema `EchoResponse` in `backend/app/schemas/echo.py`: chose a `pydantic.BaseModel` (installed with FastAPI, the shape of every existing file in `app/schemas/`) over a bare dict (forbidden by criterion 4) and over a stdlib `TypedDict` (FastAPI accepts it as a `response_model` but it is not a Pydantic schema, which is what the criterion names).
- Service module: none is created. The stdlib/platform/installed ladder does not apply because there is no logic to place; the alternative considered was a pass-through `echo_service.py` for symmetry with `health_service.py` and `version_service.py`, rejected because those modules hold real logic (a database probe, a metadata read) and this endpoint holds none, so the module would exist only to be tested.
- Tests (`backend/tests/unit/test_echo_schema_unit.py`, `backend/tests/integration/test_echo_integration.py`, one added case in `backend/tests/unit/test_main_unit.py`): chose the installed `pytest` and `fastapi.testclient.TestClient` (installed `httpx`) through the existing session `client` fixture in `backend/tests/conftest.py`; the OpenAPI assertions read `client.get("/openapi.json").json()` (FastAPI built-in) rather than adding a JSON-schema library. No new test dependency.
- No net-new dependency is added by this feature: `pyproject.toml` and `uv.lock` are untouched.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and the `EchoResponse` Pydantic response model for `GET /api/echo` (criteria 3 and 4).
- [B] backend/app/routers/echo.py: `GET /api/echo` router; `msg` declared `Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]`, `response_model=EchoResponse`, one-line handler with no business logic (criteria 1 to 4).
- [B] backend/tests/unit/test_echo_schema_unit.py: unit tests for the schema module and its binding to the route: `EchoResponse(echo="hello").model_dump() == {"echo": "hello"}` (happy path), `EchoResponse` is a `pydantic.BaseModel` subclass whose `__module__` is `app.schemas.echo` and the `/api/echo` route in `app.routers.echo.router.routes` has `response_model is EchoResponse` (criterion 4, structure), `ECHO_MSG_MAX_LENGTH == 200` (edge: the bound's value), and `EchoResponse()` with no field raises `pydantic.ValidationError` (error case).
- [B] backend/tests/integration/test_echo_integration.py: full HTTP cycle through the shared `client` fixture: `GET /api/echo?msg=hello` → 200 `{"echo": "hello"}` (criterion 1); `GET /api/echo` → 422 with `detail[0].loc == ["query", "msg"]` and `type == "missing"` (criterion 2); `msg` of 201 characters → 422 with `type == "string_too_long"` (criterion 3); `msg` of exactly 200 characters → 200 echoing it back (boundary edge case); `GET /openapi.json` declares `maxLength: 200` on the `msg` query parameter and references `#/components/schemas/EchoResponse` for the 200 response (criterion 3's "stated in the schema" half and criterion 4); `POST /api/echo` → 405 (read-only, matching the version and health precedents).
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (exactly 200 characters echoes back with 200).
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-06/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the echo router and add one `app.include_router(echo_router)` line in `create_app()`; add TEST-06 to the module docstring's list of registering features. Nothing else changes.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the app's custom route paths, in the shape of the existing version and health cases.

No dependency manifest changes, so no lockfile is touched: FastAPI, Pydantic, pytest and httpx are already installed and cover every module above. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure, and the README documents none of the existing endpoints (checked: no `/api/` path appears in it).

## Testing Strategy
- Unit tests: the schema module and its binding to the route, with no HTTP cycle and no app startup. `EchoResponse` serialization (happy path), the route's `response_model` identity and the model's module location (criterion 4 as a code-structure property), the value of `ECHO_MSG_MAX_LENGTH` (edge), and a `ValidationError` on a missing field (error case). Plus the app-factory registration case added to the existing `test_main_unit.py`. There is no service module, so the service-layer unit tier `testing_standards.md` Section 6 asks about is not warranted and that is why none is listed; the schema/route structure test is the unit-tier work this feature does have.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_echo_schema_unit.py`; the route-registration case goes into the existing `test_main_unit.py`)
- Integration tests: the router through the full HTTP request/response cycle via the session-scoped `client` fixture in `backend/tests/conftest.py`. 200 happy path (criterion 1); 422 on missing `msg` asserting `loc` and `type` (criterion 2); 422 on a 201-character `msg` asserting `type == "string_too_long"` (criterion 3); 200 on exactly 200 characters (boundary); OpenAPI declares `maxLength: 200` on the parameter and `$ref`s `EchoResponse` for the 200 body (criterion 3's declaration half, criterion 4's contract half); 405 on POST. Note for the builder: these tests need no database and must not use the `database_url` or `db_connection` fixtures, so they run with `DATABASE_URL` unset locally exactly as `test_version_integration.py` does; the `client` fixture's lifespan tolerates an unset `DATABASE_URL` with a logged warning.
  - Directory: backend/tests/integration/ (`test_echo_integration.py`)
- E2E tests: not warranted for this feature, so no `e2e/tests/TEST-06_echo_endpoint.spec.ts` is produced and no `[D]` manifest entry exists. `testing_standards.md` Section 6's fourth question, asked per criterion below, answers no four times: every criterion is an HTTP status/body behaviour of a backend endpoint that no UI consumes, so verifying it needs no navigation or interaction, and a browser spec would either call the API directly (Section 5's anti-pattern: that is a router integration test) or drive a page that does not exist. Section 4's per-feature edge-case spec obligation attaches only when E2E is warranted at all, so it does not attach here; the edge case (the 200-character boundary) is covered at integration instead. This matches the TEST-02 precedent, which produced no spec for its backend-only endpoint.
  - Directory: e2e/tests/ (nothing written there by this feature)
  - File: {feature_id}_{slug}.spec.ts naming would give `TEST-06_echo_endpoint.spec.ts`; deliberately not produced, see above
- UAT scenarios: one Gherkin scenario per acceptance criterion (four) plus one edge-case scenario (exactly 200 characters → 200), validated for well-formedness on merge, not executed as browser tests. The manual script is expanded from `## Manual verification plan` below.
  - Directory: e2e/uat/scenarios/ (Gherkin, `TEST-06_echo_endpoint.feature`), e2e/uat/scripts/ (manual script, `TEST-06_echo_endpoint_uat_script.md`)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}` | Integration | Verifying it needs no navigation or interaction: it is a router behaviour over the real HTTP request/response cycle, and no UI consumes the endpoint |
| 2 | `GET /api/echo` with no `msg` returns 422, the standard validation response | Integration | Same: a request-validation behaviour asserted over the real HTTP cycle (status plus the `detail` shape); a browser adds nothing and no page issues this request |
| 3 | `msg` longer than 200 characters returns 422, with the bound declared in the schema rather than checked in the handler | Integration | Same for the 422 half (a 201-character request over the real HTTP cycle); the "declared, not hand-rolled" half is asserted by reading `maxLength: 200` off the parameter in `/openapi.json`, which a hand-rolled check would never produce, again with no UI involved |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict | Unit | A code-structure property: import `app.schemas.echo.EchoResponse`, assert it is a `BaseModel` in that module and that the `/api/echo` route's `response_model is EchoResponse`; needs no HTTP cycle, so unit is the cheapest tier. The integration tier's OpenAPI `$ref` assertion confirms the same fact from the outside |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo?msg=hello, Then the response is HTTP 200 with body `{"echo": "hello"}` |
| 2 | Missing `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo with no query string, Then the response is HTTP 422 with a `detail` array naming the missing query parameter `msg` |
| 3 | `msg` over 200 characters returns 422, bound declared in the schema | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo with a 201-character `msg`, Then the response is HTTP 422 with `type` `string_too_long`, And the OpenAPI document declares `maxLength` 200 on the `msg` parameter |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When a client reads GET /openapi.json, Then the 200 response of `/api/echo` references the component schema `EchoResponse`, And that component exists |

## Manual verification plan
None of the four criteria is verifiable through the UI: no frontend consumes `GET /api/echo`, so the observable check for each is the HTTP response itself, read with `curl` or a browser address bar. Backend host port is 8010 (`docker-compose.yml`, service `backend`).

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
Prerequisites: Docker running; the stack up via `docker compose up -d --build` from the repository root on branch `feature/TEST-06-echo-endpoint`; `docker compose ps` shows `backend` running (the `db` service state is irrelevant to this endpoint).
1. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first response line reads `HTTP/1.1 200 OK` and the headers include `content-type: application/json`.
2. Read the response body → exactly `{"echo":"hello"}`.
3. Alternatively open `http://localhost:8010/api/echo?msg=hello` in a browser → the page shows `{"echo":"hello"}`.

### Criterion 2: `GET /api/echo` with no `msg` returns 422, the standard validation response
Prerequisites: criterion 1 just verified, stack still up.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first response line reads `HTTP/1.1 422 Unprocessable Entity` (Starlette may spell the reason phrase `Unprocessable Content`; the status code 422 is what counts).
2. Read the response body → a JSON object with a `detail` array whose single entry has `"loc":["query","msg"]` and `"type":"missing"` (FastAPI's standard validation shape); it is not a 500 and not an empty 200.

### Criterion 3: `msg` longer than 200 characters returns 422, with the bound declared in the schema
Prerequisites: stack still up; `python3` available on the host (used only to build the long string).
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201, end="")')"` (a `msg` of 201 `a` characters) → the first response line reads `HTTP/1.1 422 ...`, and the body's `detail[0]` has `"type":"string_too_long"` and `"loc":["query","msg"]`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200, end="")')"` (exactly 200 characters, the boundary) → `HTTP/1.1 200 OK` with body `{"echo":"aaaa...a"}` containing 200 `a` characters.
3. Open `http://localhost:8010/openapi.json` in a browser (or run `curl -s http://localhost:8010/openapi.json`) and locate `paths` → `/api/echo` → `get` → `parameters` → the entry with `"name":"msg"` → its `schema` carries `"maxLength":200` and the entry has `"required":true`. This is the declared bound; a check hand-rolled in the handler would not appear here.
4. Open `backend/app/routers/echo.py` in the repository → the handler body contains no `len(` comparison and no `HTTPException`; the only length reference is the `Query(max_length=ECHO_MSG_MAX_LENGTH)` declaration on the parameter.

### Criterion 4: The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict
Prerequisites: stack still up; repository checked out.
1. Open `backend/app/schemas/echo.py` in the repository → it defines `class EchoResponse(BaseModel)` with a single field `echo: str`.
2. Open `backend/app/routers/echo.py` → the route decorator reads `@router.get("/echo", response_model=EchoResponse)` and the handler returns `EchoResponse(echo=msg)`, not a dict literal.
3. Open `http://localhost:8010/openapi.json` → `components` → `schemas` contains `EchoResponse` with property `echo` of type `string`, and `paths` → `/api/echo` → `get` → `responses` → `200` → `content` → `application/json` → `schema` reads `{"$ref":"#/components/schemas/EchoResponse"}`.
4. Open `http://localhost:8010/docs` in a browser → under the `echo` tag, expand `GET /api/echo` → the 200 response's "Example Value | Schema" toggle names the schema `EchoResponse`.
