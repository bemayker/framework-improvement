# Implementation Plan, TEST-06: Echo endpoint

## Feature
> A small backend feature for the assisted lifecycle (Arm C of measured run 2). Deliberately narrow: one router, one schema, its tests.
>
> **What:** `GET /api/echo?msg={text}` returns the text it was given, so a caller can prove the API is reachable and that query-string handling works end to end.
>
> **Acceptance criteria**
> 1. `GET /api/echo?msg=hello` returns **200** with body `{"echo": "hello"}`.
> 2. `GET /api/echo` with no `msg` returns **422**, the framework's standard validation response, rather than a 500 or an empty 200.
> 3. `msg` longer than 200 characters returns **422**. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
>
> **Notes:** Follows the shape TEST-02 established: a router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. It touches `main.py`'s router registration, so it must not run concurrently with another item that does the same.
>
> Source: ClickUp task 123k99ctgcf (Validation sandbox list), status `to do`.

## Acceptance Criteria
- [ ] 1. `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`.
- [ ] 2. `GET /api/echo` with no `msg` returns 422, FastAPI's standard validation response, never a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns 422; the bound is declared, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
This is a first plan (no `.claude/artifacts/TEST-06/plan.md` existed; merged-since check n/a, fresh plan branched from current main e262ed6). The section is kept because the tracker item carries comments. 24 top-level comments, 0 threaded replies; 21 are framework-posted plan-PR link notices (PRs 23 to 570) that ask nothing of the plan and are not acted on for that reason. The three substantive ones, newest first:

- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: checking the condition against the branch before planning. On `origin/main` at e262ed6, `git ls-tree -r origin/main` holds no path matching `echo` (no `backend/app/routers/echo.py`, no `backend/app/schemas/echo.py`, no echo tests) and no `.claude/artifacts/TEST-06/plan.md`; `backend/app/main.py` registers only the version, notes and health routers. The echo code is absent from main, so the revert's precondition holds and this plan builds the endpoint from scratch rather than re-scoping against existing code.
- Comment (tracker): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. ..." → Addressed by: criterion 3 is planned as 422, and the bound is declared through FastAPI's `Query(max_length=...)` exactly as this comment states. To also satisfy the description's "stated in the schema", the bound's value lives once in the schema module (`ECHO_MSG_MAX_LENGTH = 200` in `backend/app/schemas/echo.py`) and the router's `Query(max_length=ECHO_MSG_MAX_LENGTH)` declares it, so it appears in the OpenAPI schema as `maxLength: 200` and no handler code compares lengths. Assumption recorded: "the schema" means the declared request-parameter schema (OpenAPI) with its value in `backend/app/schemas/`, which reconciles the description with this newer, more specific comment.
- Comment (tracker): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → not acted on because the newer comment above explicitly retracts it as a measured-run probe and restores criterion 3 as written (422, FastAPI's standard shape). No custom exception handler and no 400 body are planned.

## Plan Overview
One backend slice and nothing else: a new `GET /api/echo` router that takes a required `msg` query parameter bounded at 200 characters and returns it unchanged in an `EchoResponse` Pydantic schema, registered in `backend/app/main.py` beside the existing version, notes and health routers. Validation (missing `msg`, `msg` over 200 characters) is left entirely to FastAPI's declared parameter validation, which already answers 422 with its standard `{"detail": [...]}` body. No database, no service layer (there is no business logic to hold: the handler returns its input), no frontend, no external API, no new dependency. Tests: one unit file for the schema and the route's declared contract, the existing `test_main_unit.py` extended with a route-registration test, and one integration file through the real HTTP cycle. No E2E spec: no criterion involves the UI. UAT artifacts per CLAUDE.md (manual script, its artifact copy, Gherkin scenarios).

The message is echoed exactly as received: no trimming, no case change, no minimum length. An empty `msg=` is a present value and returns 200 with `{"echo": ""}`; the criteria are silent on it and adding a `min_length` would be scope the item does not ask for (later items TEST-11 and BUG-05 are where whitespace behaviour is specified).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo` — echoes the required `msg` query parameter back in the response body. Router `backend/app/routers/echo.py`, `APIRouter(prefix="/api", tags=["echo"])`, handler `get_echo(msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]) -> EchoResponse`, decorated `@router.get("/echo", response_model=EchoResponse)`, returning `EchoResponse(echo=msg)`. `msg` has no default, so FastAPI marks it required and answers 422 when absent; `max_length` makes FastAPI answer 422 above 200 characters. The handler contains no `len()` check, no `if`, and no `HTTPException`.
- Schema: `backend/app/schemas/echo.py` holds `ECHO_MSG_MAX_LENGTH = 200` (the bound, stated once) and `class EchoResponse(BaseModel): echo: str`, following `schemas/version.py`'s shape (module docstring, class docstring).
- Registration: `backend/app/main.py` imports `from app.routers.echo import router as echo_router` and calls `app.include_router(echo_router)` after the existing three; the module docstring gains one clause naming TEST-06's echo router. CORS middleware already allows `GET`; nothing else in `create_app()` changes.
- Service layer: none. The handler has no business logic (it returns its validated input), so a service module would be a pass-through; `coding_standards/backend_frontend.md` Section 2.2 puts parameter validation via schemas in the router, which is exactly what this endpoint is.
- Repository layer: none, no data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg`, required, string, at most 200 characters (OpenAPI: `required: true`, `maxLength: 200`). No body, no headers beyond the defaults.
- Response:
  - 200, `EchoResponse`: `{"echo": "hello"}` for `?msg=hello`; the value is `msg` exactly as decoded from the query string.
  - 422, FastAPI's standard validation body, unchanged. Missing `msg`: `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`. Over 200 characters: `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "ctx": {"max_length": 200}, ...}]}`.
  - 405 for any other method (FastAPI default, not added by this plan).

## Technology Selection
- Echo router `backend/app/routers/echo.py`: chose FastAPI's `APIRouter` (an installed dependency, the pattern the version and health routers use) over any alternative; no stdlib or native feature serves an HTTP route in this stack.
- Length bound and required-ness of `msg`: chose FastAPI's declared `Query(max_length=...)` with no default (installed dependency, rung 3) over a hand-written `len(msg) > 200` check plus a raised 422 in the handler, because the declaration yields FastAPI's standard 422 body and the OpenAPI `maxLength` for free and is what criterion 3 and the retraction comment require.
- `EchoResponse` schema `backend/app/schemas/echo.py`: chose a Pydantic `BaseModel` (installed with FastAPI) over a bare dict or a stdlib dataclass, because criterion 4 requires a Pydantic schema and FastAPI serializes it as the `response_model`.
- Tests: chose the installed pytest and FastAPI `TestClient` (httpx, already in the dev group) over any new test tooling; no new dependency.
- No new dependency at all: `backend/pyproject.toml` and `backend/uv.lock` are untouched.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and the `EchoResponse` Pydantic schema (`echo: str`)
- [B] backend/app/routers/echo.py: `GET /api/echo` router; `msg` declared as `Query(max_length=ECHO_MSG_MAX_LENGTH)`, required, returns `EchoResponse`
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoResponse` (serializes to `{"echo": ...}`, rejects a missing `echo`), the declared bound constant, and the route's declared contract (response_model is `EchoResponse`, `msg` is required and carries `max_length` 200), with no HTTP and no database
- [B] backend/tests/integration/test_echo_integration.py: full HTTP cycle through the shared `client` fixture: 200 for `msg=hello`, 422 with `loc` `["query", "msg"]` when `msg` is absent, 200 at exactly 200 characters, 422 `string_too_long` at 201, message echoed verbatim (spaces and URL-encoded characters), `maxLength` 200 published in `/openapi.json`, 405 for POST
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-06/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)

### Modified files
- [B] backend/app/main.py: import the echo router and `app.include_router(echo_router)` after the health router; module docstring names TEST-06's echo router
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the app's custom route paths, in the existing tests' shape

No dependency change, so no lockfile is regenerated: `backend/pyproject.toml`, `backend/uv.lock` and `frontend/package-lock.json` stay untouched.
Neither README.md nor docs/DEVELOPMENT.md changes: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure, and README.md lists no per-endpoint inventory to extend.
No E2E spec file is created: no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: `EchoResponse` in isolation (happy path: `EchoResponse(echo="hello").model_dump() == {"echo": "hello"}`; edge: an empty string and a 200-character string serialize unchanged; error: constructing it without `echo` raises `ValidationError`), `ECHO_MSG_MAX_LENGTH == 200`, and the route's declared contract read from `create_app()`'s route for `/api/echo` (its `response_model` is `EchoResponse`; its `msg` query parameter is required and its metadata carries `max_length` 200). Plus the route-registration test in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_echo_unit.py`; function names `test_{method_or_action}_{scenario}_{expected_outcome}`
- Integration tests: the router through the real HTTP request and response cycle with the session-scoped `client` fixture from `backend/tests/conftest.py`: `GET /api/echo?msg=hello` → 200 `{"echo": "hello"}`; no `msg` → 422 with a `detail` entry whose `loc` is `["query", "msg"]` and `type` `missing`; `msg` of exactly 200 characters → 200 echoing all 200; 201 characters → 422 with `type` `string_too_long`; `msg=hello%20world%21` → `{"echo": "hello world!"}`; `/openapi.json` declares `msg` on `/api/echo` as required with `maxLength` 200; `POST /api/echo` → 405. The endpoint needs no database, so these tests do not request `database_url` and run without `DATABASE_URL` (the `client` fixture's lifespan already tolerates its absence).
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py, here `test_echo_integration.py`
- E2E tests: none for this feature. E2E Tests is ENABLED, but no acceptance criterion involves navigation or interaction through the UI and no frontend consumes `/api/echo`; calling the API from Playwright would be a router integration test in the wrong tier (`testing_standards.md` Section 5).
  - Directory: e2e/tests/
  - File: none created (would be `e2e/tests/TEST-06_echo_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus one edge-case scenario (exactly 200 characters accepted, echoed verbatim), written as API-level Given/When/Then in the shape of `TEST-02_health_endpoint.feature`.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/echo?msg=hello returns 200 with body {"echo": "hello"} | Integration | verifying it needs no navigation or interaction: no UI calls the endpoint, it is a router request and response behaviour |
| 2 | GET /api/echo with no msg returns 422, never a 500 or an empty 200 | Integration | verifying it needs no navigation or interaction: it is FastAPI's parameter validation on the router, observable only in the HTTP response |
| 3 | msg longer than 200 characters returns 422, with the bound declared rather than hand-checked | Integration | verifying it needs no navigation or interaction: it is a declared validation rule, proven by the 200 and 201 character requests and the published OpenAPI maxLength |
| 4 | The response body is defined by a Pydantic schema in backend/app/schemas/ | Unit | verifying it needs no navigation or interaction: it is a structural property of the code, checked by asserting the route's response_model is EchoResponse |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/echo?msg=hello returns 200 with {"echo": "hello"} | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo?msg=hello, Then the status is 200 and the body is {"echo": "hello"} |
| 2 | GET /api/echo with no msg returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo with no query string, Then the status is 422 and the detail names query parameter msg as missing |
| 3 | msg over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo with a 201-character msg, Then the status is 422 and the detail reports a string too long with max_length 200 |
| 4 | Response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the API's published OpenAPI document, When a reader looks up the 200 response of GET /api/echo, Then it references the EchoResponse schema with one string property echo |

## Manual verification plan
No acceptance criterion is verifiable through the UI: no screen calls `/api/echo`. Every block below reads the HTTP response with `curl` against the running stack instead, in the shape of the TEST-02 UAT script.

Prerequisites for every block: Docker running; repository on branch `feature/TEST-06-echo-endpoint`; from the repository root run `docker compose up -d --build`, then `docker compose ps` until the `backend` service reports running (backend published at `http://localhost:8010`, per `docker-compose.yml`); a terminal with `curl`.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
Prerequisites: stack up as above.
1. Run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world%21"` → `HTTP/1.1 200 OK` with body `{"echo":"hello world!"}`: the decoded message comes back unchanged, space and punctuation included.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: stack up as above.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first line reads `HTTP/1.1 422 Unprocessable Entity` (never `500`, never `200`).
2. Read the body → a JSON object with a `detail` array whose entry has `"type":"missing"`, `"loc":["query","msg"]` and `"msg":"Field required"`.

### Criterion 3: `msg` longer than 200 characters returns 422, bound declared rather than hand-checked
Prerequisites: stack up as above; a shell that expands `{1..200}` (bash or zsh).
1. Run `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..200})"` (exactly 200 letters `a`) → prints `200`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` (201 letters `a`) → `HTTP/1.1 422 Unprocessable Entity`, and the body's `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
3. Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` → the `msg` query parameter is marked required and shows `maxLength: 200`, the declared bound.
4. Open `backend/app/routers/echo.py` → the handler body only builds `EchoResponse(echo=msg)`; there is no `len(` call, no `if` and no `HTTPException` in it.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Not a runtime behaviour a UI shows; the observable checks are the code and the published schema.
1. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with the single field `echo: str`.
2. Open `backend/app/routers/echo.py` → the route is declared with `response_model=EchoResponse` and returns an `EchoResponse`, never a dict literal.
3. Run `curl -s http://localhost:8010/openapi.json` and find `paths` → `/api/echo` → `get` → `responses` → `200` → its schema is a `$ref` to `#/components/schemas/EchoResponse`, whose only property is `echo` of type `string`.
4. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` → the summary line reports `0 failed` (no failures and no errors) for those three files.
