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
- [ ] 3. `msg` longer than 200 characters returns 422; the bound is declared (in the schema module, applied through `Query(max_length=...)`), not checked by hand in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: precondition verified against the code before planning. On `feature/TEST-06-echo-endpoint` (branched from current `origin/main`, tip 181ee5c), `grep -rin echo backend/app backend/tests` finds no echo router, schema, registration or test; the only hit is an unrelated docstring in `backend/tests/integration/test_notes_integration.py` line 63 ("echoed back with its id"). `backend/app/main.py` registers only the version, notes and health routers. The revert has effectively landed (main was reset by a90e181), so the plan is written against a main without the feature.
- Comment (tracker, 2026-09-03, later): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler." → Addressed by: criterion 3 is planned at 422, and the bound is declared as `Query(max_length=ECHO_MESSAGE_MAX_LENGTH)` with the constant defined in `backend/app/schemas/echo.py`, so the bound is stated in the schema module and applied declaratively. No custom exception handler, no length check in the handler body.
- Comment (tracker, 2026-09-03, earlier): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. ..." → Not acted on because the later comment of the same day explicitly retracts it as a measured-run probe. Criterion 3 stays at 422 with FastAPI's standard validation body.
- Comment (tracker, 15 comments): the framework's own "mayker-dev: plan PR opened for TEST-06" link comments from earlier runs → Not acted on: they carry no requirement, only links to earlier plan PRs.
- Merged since the last plan: n/a (fresh plan, branched from current main).

## Plan Overview
One read-only backend endpoint, `GET /api/echo`, that returns its `msg` query parameter wrapped in a Pydantic response schema. Layers touched: a new schema module (`EchoResponse` plus the `ECHO_MESSAGE_MAX_LENGTH = 200` bound), a new router registered in `create_app()`, and unit plus integration tests. No service layer: there is no business logic to hold (the handler only wraps its input), and the feature text asks for "one router, one schema, its tests". No database, no frontend, no new dependency.

Assumptions:
- An empty `msg` (`/api/echo?msg=`) is allowed and echoes `""`: the criteria bound only the upper length and require presence, and a `min_length` would be gold plating.
- A `msg` of exactly 200 characters returns 200 (the bound is "longer than 200 returns 422").
- `msg` is echoed verbatim, with no trimming or normalisation. Whitespace behaviour is the subject of later items (TEST-11, BUG-05) that depend on this one.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this feature renders no UI)

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}`, echoes `msg` back as `{"echo": msg}`. Router `backend/app/routers/echo.py` with `APIRouter(prefix="/api", tags=["echo"])`, same shape as `routers/version.py`. Handler signature: `def get_echo(msg: Annotated[str, Query(max_length=ECHO_MESSAGE_MAX_LENGTH)]) -> EchoResponse`, decorated with `response_model=EchoResponse`, returning `EchoResponse(echo=msg)`. `msg` has no default, so FastAPI makes it required and answers 422 when absent; `max_length` makes FastAPI answer 422 above 200 characters. The handler body contains no validation.
- Schema: `backend/app/schemas/echo.py` with `ECHO_MESSAGE_MAX_LENGTH = 200` (module constant, the single source of the bound) and `class EchoResponse(BaseModel): echo: str`. The bound is not repeated on the response field: it bounds input, and a second copy on the output model would turn a future mismatch into a 500.
- Registration: `backend/app/main.py` imports `router as echo_router` and adds `app.include_router(echo_router)` after the existing three; update the module docstring's list of registered routers to name TEST-06.
- Service layer: none (no business logic; see Technology Selection).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg`, string, required, maximum 200 characters (empty string allowed).
- Response 200: `{"echo": "hello"}` for `?msg=hello`. Schema `EchoResponse { echo: string }`.
- Response 422 (missing `msg`): FastAPI standard body, `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}`.
- Response 422 (`msg` over 200 characters): FastAPI standard body, `detail[0].type` is `string_too_long`, `detail[0].loc` is `["query", "msg"]`, `detail[0].ctx.max_length` is `200`.
- OpenAPI: the `msg` parameter carries `maxLength: 200`, and the 200 response references the `EchoResponse` component.

## Technology Selection
- Query-string validation (presence and 200-character bound): chose FastAPI's own `Query(max_length=...)` on a required parameter (installed dependency, rung 3) over a hand-rolled length check and custom error in the handler, because FastAPI already produces the standard 422 the criteria ask for and criterion 3 forbids the hand-rolled check.
- Response schema `EchoResponse`: chose Pydantic `BaseModel` (installed with FastAPI, rung 3) over a bare dict, as criterion 4 requires.
- Service module: none created. No stdlib call or dependency is needed because there is no business logic to place in one; the router returns the schema directly, matching the "one router, one schema" scope.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MESSAGE_MAX_LENGTH = 200` and the `EchoResponse` Pydantic model
- [B] backend/app/routers/echo.py: `GET /api/echo` router with the required, length-bounded `msg` query parameter
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoResponse` serialisation and validation
- [B] backend/tests/integration/test_echo_integration.py: router tests over the full HTTP cycle (200, 422 missing, 422 too long, 200 at the boundary, OpenAPI declares the bound and the schema)
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/main.py: import and register the echo router in `create_app()`; docstring names TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`
No dependency changes, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `EchoResponse` in isolation (no app, no network): happy path `EchoResponse(echo="hello").model_dump() == {"echo": "hello"}`; edge case empty string and a non-ASCII string round-trip unchanged; error case constructing without `echo` (or with a non-string such as `None`) raises `pydantic.ValidationError`. Plus `test_create_app_registers_echo_route` in the existing app-factory tests.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_echo_unit.py`)
- Integration tests: the router through `TestClient`, using the session-scoped `client` fixture from `backend/tests/conftest.py`: `?msg=hello` gives 200 and exactly `{"echo": "hello"}`; no `msg` gives 422 with `detail[0].loc == ["query", "msg"]` and `type == "missing"`; a 201-character `msg` gives 422 with `type == "string_too_long"`; a 200-character `msg` gives 200 and echoes it (boundary); a URL-encoded value with a space (`msg=hello%20world`) echoes `"hello world"`; `/openapi.json` declares `maxLength` equal to `ECHO_MESSAGE_MAX_LENGTH` on the `msg` parameter and a 200 response referencing `EchoResponse`; `POST /api/echo` gives 405. Assert the bound through the imported constant, not a second literal.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion requires navigation or interaction through the UI (the feature has no frontend), so every criterion is covered at integration or unit tier; no spec file is produced.
  - Directory: e2e/tests/
  - File: none (would be `TEST-06_echo_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (exactly 200 characters accepted), API-level steps like TEST-02's scenarios.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | verifying it needs no navigation or interaction: it is a router request/response, and no UI consumes the endpoint |
| 2 | Missing `msg` returns 422 | Integration | verifying it needs no navigation or interaction: it is FastAPI request validation, observable only at the HTTP layer |
| 3 | `msg` over 200 characters returns 422, bound declared in the schema | Integration | verifying it needs no navigation or interaction: a validation rule, checked by the 201/200-character requests and the OpenAPI `maxLength` |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit and Integration | verifying it needs no navigation or interaction: a schema property, checked by the `EchoResponse` unit tests and the OpenAPI response reference |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | Missing `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/echo`, Then the status is 422 and `detail[0].loc` is `["query", "msg"]` |
| 3 | `msg` over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/echo` with a 201-character `msg`, Then the status is 422 with type `string_too_long`; edge: 200 characters returns 200 |
| 4 | Body defined by a Pydantic schema | covered at Unit and Integration, see Criterion coverage | Given the backend is running, When a client reads `/openapi.json`, Then the `/api/echo` 200 response references the `EchoResponse` schema |

No criterion is covered at E2E: the feature has no UI.

## Manual verification plan
None of the criteria is verifiable through the UI: no frontend consumes `GET /api/echo`, so the observable check is the HTTP response, read with `curl` against the compose stack (backend published on host port 8010 by `docker-compose.yml`).

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: on branch `feature/TEST-06-echo-endpoint`, Docker running, nothing else bound to host port 8010; from the repository root run `docker compose up -d --build` and wait until `docker compose ps` shows `backend` running.
1. In a terminal run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → `HTTP/1.1 200 OK` with body `{"echo":"hello world"}` (the encoded space is decoded end to end).

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: stack from criterion 1 still up.
1. Run `curl -i "http://localhost:8010/api/echo"` → `HTTP/1.1 422 Unprocessable Entity`, and the body's `detail[0]` has `"type":"missing"` and `"loc":["query","msg"]`. It is not a 500 and not an empty 200.

### Criterion 3: `msg` longer than 200 characters returns 422
Prerequisites: stack still up; `python3` available on the host to build the long strings.
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` → `HTTP/1.1 422 Unprocessable Entity`, body `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"` → `HTTP/1.1 200 OK` and the body echoes the 200 `a` characters (the boundary is accepted).
3. Open `backend/app/routers/echo.py` → the handler body contains no length check; the bound appears only as `Query(max_length=ECHO_MESSAGE_MAX_LENGTH)`, and `ECHO_MESSAGE_MAX_LENGTH = 200` is defined in `backend/app/schemas/echo.py`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: stack still up.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` → the 200 response shows the `EchoResponse` schema with one string field `echo`, and the `msg` parameter shows a maximum length of 200.
2. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with `echo: str`, and `backend/app/routers/echo.py` returns `EchoResponse(...)`, not a dict.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → `0 failed`.
