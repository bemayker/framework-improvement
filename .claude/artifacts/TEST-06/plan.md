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
- Comment (tracker, newest): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). This item was built and merged in measured run 2 (PR #23, squash 8794a99 on main). It is the Arm C item again because playbook Section 4 step 3 requires the same item both times. Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: checking the precondition before planning. On this branch, at `origin/main` `62e1b544`, `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, `backend/app/schemas/` holds only `health.py`, `note.py` and `version.py`, `backend/app/main.py` registers only the version, notes and health routers, and a search of `backend/app`, `backend/tests` and `e2e` finds no echo code. Main no longer holds the feature, so the plan proceeds and every file below is net-new against main.
- Comment (tracker): "Retracting the previous comment. It was a measured-run probe, not a real requirement. [...] Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. The code on feature/TEST-06-echo-endpoint already satisfies it and needs no change. [...] No action needed on this item. PR #23 remains correct against the description." (quoted in part; the omitted text records the earlier probe's outcome and a defect in an operator guide, and asks nothing of this item) → Addressed by: keeping criterion 3 at 422 and declarative, with no handler check. Two of its statements no longer hold and are not acted on. "The code on feature/TEST-06-echo-endpoint already satisfies it" described the run-2 branch: this branch was freshly cut from `62e1b544` and holds no echo code, so the code must be built. "Declared via Query(max_length=...)" described PR #23's mechanism. The comment itself says criterion 3 "stands as written in the description", and the description says the bound is "stated in the schema". So this plan declares the bound as `Field(max_length=200)` on a Pydantic query model in `backend/app/schemas/echo.py`, bound to the route with `Query()`. That gives the same FastAPI validation path and the same 422, and puts the bound in the schema module, which satisfies both readings.
- Comment (tracker, oldest): "A msg longer than 200 characters should return 400 with a {\"error\": \"...\"} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on, because the newer retraction above withdraws it explicitly as a measured-run probe. Criterion 3's 422 stands, and no custom error body or exception handler is planned.

## Plan Overview
One backend slice and nothing else: a read-only `GET /api/echo` route in a new `backend/app/routers/echo.py`. The request and response shapes live in a new `backend/app/schemas/echo.py`: `EchoQuery` (the query string, carrying the 200-character bound) and `EchoResponse` (the body). The router is registered in `backend/app/main.py` next to the existing three. No frontend, no database, no external API, no new dependency. Tests: schema unit tests, a registration unit test in the existing `test_main_unit.py`, and router integration tests through the session `TestClient`.

Decision (scope, recorded here): no `services/echo_service.py`. The version and health slices have a service because they resolve something (package metadata, a database probe). Echo returns its input unchanged, so it has no business logic for a service to hold. The description also names the shape as "one router, one schema, its tests", so an identity-function service would be gold plating. The router builds `EchoResponse(echo=query.msg)` directly.

Decision (scope, recorded here): an empty `msg` (`/api/echo?msg=`) is not rejected. No criterion asks for a minimum length, so it returns 200 with `{"echo": ""}` under FastAPI defaults, and no `min_length` is added. Unknown extra query parameters are likewise left at FastAPI's default (ignored), not forbidden.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo`, query parameter `msg` (required string, at most 200 characters), returning the given text as `{"echo": msg}`.
- Router: `backend/app/routers/echo.py`, `router = APIRouter(prefix="/api", tags=["echo"])`, matching `routers/version.py`. One handler, `get_echo(query: Annotated[EchoQuery, Query()]) -> EchoResponse`, declared with `response_model=EchoResponse`, returning `EchoResponse(echo=query.msg)`. The handler holds no `len()` check, no `if` on `msg`, and no `HTTPException`: a missing or over-long `msg` is rejected by FastAPI's request validation before the handler runs, which yields its standard 422 (criteria 2 and 3).
- Schemas: `backend/app/schemas/echo.py` holds `ECHO_MSG_MAX_LENGTH = 200`, `EchoQuery(BaseModel)` with `msg: str = Field(max_length=ECHO_MSG_MAX_LENGTH)` (required, because there is no default), and `EchoResponse(BaseModel)` with `echo: str`. Query-parameter models are supported by the installed FastAPI 0.139.2 (`backend/uv.lock`).
- Registration: `backend/app/main.py` imports `from app.routers.echo import router as echo_router` and calls `app.include_router(echo_router)` in `create_app()` after the existing three. The module docstring's list of routers that later features registered gains TEST-06. Nothing else in `main.py` changes: the CORS middleware already allows `GET`.
- Service layer: none (see the Plan Overview decision).
- Repository layer: none, because the endpoint touches no data.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg`, a required string of at most 200 characters (for example `/api/echo?msg=hello`). No body, no headers beyond the defaults.
- Response 200: `{"echo": "hello"}`, the `EchoResponse` schema, where `echo` equals the received `msg` exactly.
- Response 422, `msg` missing: FastAPI's standard validation body, for example `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}`.
- Response 422, `msg` over 200 characters: FastAPI's standard validation body, for example `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "input": "aaaa...", "ctx": {"max_length": 200}}]}`.
- Tests assert the status code, the `loc` and the `type`. They do not assert the full 422 body, whose extra keys are FastAPI's and not this feature's contract.

## Technology Selection
- Length bound on `msg` (criterion 3): chose Pydantic `Field(max_length=200)` on `EchoQuery`, from the installed Pydantic 2.13.4 and FastAPI 0.139.2, over a hand-rolled `len(msg) > 200` check in the handler that raises `HTTPException`. The installed validation layer already rejects the value with the standard 422, and the criterion forbids the hand-rolled check.
- Required `msg` (criterion 2): chose the installed FastAPI and Pydantic required-field validation (a field with no default) over an explicit `None` check in the handler. It produces the framework's standard 422 with no code of our own.
- `EchoQuery` and `EchoResponse` schemas (`backend/app/schemas/echo.py`): chose the installed Pydantic `BaseModel` over a bare dict and over `TypedDict` from the standard library. Criterion 4 names a Pydantic schema, and only a model gives FastAPI the response validation and the OpenAPI component.
- Echo router (`backend/app/routers/echo.py`): no standard-library call or native platform feature serves an HTTP route, so it is built here on the installed FastAPI `APIRouter`, the same way as the existing routers.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH`, `EchoQuery` (required `msg`, `Field(max_length=ECHO_MSG_MAX_LENGTH)`), `EchoResponse` (`echo: str`)
- [B] backend/app/routers/echo.py: `GET /api/echo` handler with `response_model=EchoResponse`, query bound with `Annotated[EchoQuery, Query()]`, no hand-rolled validation
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoQuery` and `EchoResponse` (required field, 200-character boundary, 201-character rejection, serialization to the `echo` key)
- [B] backend/tests/integration/test_echo_integration.py: router integration tests through the session `client` fixture (200 happy path, 422 missing, 422 over-long, 200 at exactly 200 characters, OpenAPI response schema is `EchoResponse`)
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus the 200-character boundary edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-06/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import `echo_router` and register it with `app.include_router(echo_router)` in `create_app()`, and add TEST-06 to the module docstring's list of router registrations
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`, asserting `/api/echo` is among the app's custom route paths, in the same shape as the version and health registration tests

No dependency changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` change: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure. No E2E spec, because no criterion involves the UI (see `### Criterion coverage`).

## Testing Strategy
- Unit tests: the `EchoQuery` and `EchoResponse` schemas in isolation (no app, no HTTP): `msg` required, accepted at exactly 200 characters, rejected at 201 with a `string_too_long` error, `EchoResponse` serializes to `{"echo": ...}`. Also, in the existing `test_main_unit.py`, that `create_app()` registers `/api/echo`.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py`, so `test_echo_unit.py`
- Integration tests: the router's full HTTP request/response cycle through the session `client` fixture in `backend/tests/conftest.py`: the 200 happy path, 422 for a missing `msg`, 422 for a 201-character `msg`, 200 for a 200-character `msg` (boundary), and the OpenAPI document's 200 response for `/api/echo` referencing `#/components/schemas/EchoResponse` (criterion 4 at the wiring level). No database fixture is used, because the endpoint touches no data.
  - Directory: `backend/tests/integration/`
  - Naming: `test_{module}_integration.py`, so `test_echo_integration.py`
- E2E tests: not warranted. No frontend consumes `/api/echo` and no criterion involves navigation or interaction through the UI. An E2E spec calling the API directly would be a router integration test, which the integration tier already is.
  - Directory: `e2e/tests/` (no file for this feature)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case, phrased against the HTTP response, because the feature has no UI.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | `test_get_echo_with_msg_returns_200_with_echoed_text` | No UI consumes the endpoint, so verifying it needs no navigation or interaction. It is a router request/response behaviour. |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration, Unit | `test_get_echo_without_msg_returns_422`, `test_echo_query_without_msg_raises_validation_error` | Verifying it needs no navigation or interaction. It is request validation, checked at the router and on the schema. |
| 3 | `msg` over 200 characters returns 422, bound stated in the schema | Integration, Unit | `test_get_echo_with_msg_over_200_characters_returns_422`, `test_get_echo_with_msg_of_exactly_200_characters_returns_200`, `test_echo_query_with_msg_over_200_characters_raises_validation_error`, `test_echo_query_with_msg_of_exactly_200_characters_is_valid` | Verifying it needs no navigation or interaction. It is a validation rule, and the unit tests prove the bound lives on the schema itself. That there is no hand-rolled handler check is a code property the review reads in the diff. |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit, Integration | `test_echo_response_serializes_to_echo_key`, `test_get_echo_openapi_response_schema_is_echo_response` | Verifying it needs no navigation or interaction. It is a schema and wiring property, visible in the OpenAPI document. |

Also required, not a criterion row: `test_create_app_registers_echo_route` in `backend/tests/unit/test_main_unit.py`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `/api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | No `msg` returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client requests `/api/echo` with no query string, Then the status is 422 and the error names `msg` as missing |
| 3 | `msg` over 200 characters returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client requests `/api/echo` with a 201-character `msg`, Then the status is 422 with error type `string_too_long`; and with exactly 200 characters, Then the status is 200 |
| 4 | Response body is a Pydantic schema | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When a client reads `/openapi.json`, Then the 200 response of `GET /api/echo` references the `EchoResponse` schema |

## Manual verification plan
None of the four criteria can be verified through the UI: no frontend screen calls `/api/echo`. The observable check is the HTTP response, read with `curl` against the compose stack's backend on host port `8010` (the mapping in `docker-compose.yml`).

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: on branch `feature/TEST-06-echo-endpoint`, from the repository root run `docker compose up -d --build`, and wait until `docker compose ps` shows the `backend` service running. A terminal with `curl`.
1. Run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first response line reads `HTTP/1.1 200 OK`.
2. Read the response body → exactly `{"echo":"hello"}`.
3. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`, showing the URL-encoded space decoded.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: the stack from criterion 1 is still up.
1. Run `curl -i http://localhost:8010/api/echo` → the first response line reads `HTTP/1.1 422 Unprocessable Entity`, never a 500 or a 200.
2. Read the response body → a `detail` list whose entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422
Prerequisites: the stack from criterion 1 is still up, and `python3` on the host to build the long strings.
1. Run `curl -i -G http://localhost:8010/api/echo --data-urlencode "msg=$(python3 -c 'print("a"*201)')"`, which sends a 201-character `msg` of the letter `a` → the first response line reads `HTTP/1.1 422 Unprocessable Entity`.
2. Read the response body → a `detail` entry with `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
3. Run `curl -i -G http://localhost:8010/api/echo --data-urlencode "msg=$(python3 -c 'print("a"*200)')"`, which sends exactly 200 characters → `HTTP/1.1 200 OK`, and the body's `echo` value is the same 200 `a` characters.
4. Open `backend/app/routers/echo.py` → the handler contains no length check, no `if` on `msg` and no `HTTPException`. Open `backend/app/schemas/echo.py` → `EchoQuery.msg` is declared with `Field(max_length=ECHO_MSG_MAX_LENGTH)` and `ECHO_MSG_MAX_LENGTH = 200`.

### Criterion 4: the response body is a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack from criterion 1 is still up.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` → under Responses, the 200 response's schema is shown as `EchoResponse` with one string field `echo`.
2. Open `backend/app/schemas/echo.py` → `class EchoResponse(BaseModel)` with `echo: str`. Open `backend/app/routers/echo.py` → the route declares `response_model=EchoResponse` and returns an `EchoResponse(...)`, not a dict literal.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the summary line reports no failed or errored test, and the command exits 0.
