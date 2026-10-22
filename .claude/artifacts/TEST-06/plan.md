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

Source: ClickUp task 123k99ctgcf (https://app.clickup.com/t/123k99ctgcf), status "to do".

## Acceptance Criteria
- [ ] 1. `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`.
- [ ] 2. `GET /api/echo` with no `msg` returns 422, FastAPI's standard validation response, rather than a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns 422; the bound is declared (via `Query(max_length=...)`), not hand-checked in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). This item was built and merged in measured run 2 (PR #23, squash 8794a99 on main). [...] Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: the condition was verified against the tree before planning. The branch was cut from current origin/main (fe64d74), and `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, `backend/app/schemas/` only `health.py`, `note.py` and `version.py` (stale `__pycache__` entries only), and `backend/app/main.py` registers no echo router. The revert has merged, so the plan proceeds and plans every echo file as net-new.
- Comment (tracker, 2026-09-03): "Retracting the previous comment. It was a measured-run probe, not a real requirement. [...] It is withdrawn. Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. [...] No action needed on this item." → Addressed by: criterion 3 is planned at 422, and the bound is declared as `Query(max_length=ECHO_MSG_MAX_LENGTH)` on the `msg` parameter, with the constant defined in `backend/app/schemas/echo.py` so the bound lives with the schema module (the description's "stated in the schema") and is declared through `Query` (this comment's mechanism). No handler-side length check exists.
- Comment (tracker, 2026-09-03): "A msg longer than 200 characters should return 400 with a {\"error\": \"...\"} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer comment above (same day, posted after it) explicitly retracts it as a measured-run probe. No 400 path, no custom error body and no exception handler are planned.
- Comment (tracker, ten framework-generated link comments): "mayker-dev: plan PR opened for TEST-06 — https://github.com/bemayker/framework-improvement/pull/{222,190,167,143,88,62,55,51,49,35,23} ..." → Not acted on because they are link records from earlier sandbox runs, not feedback on the item's scope.
- Assumption (ambiguity, no comment covers it): an empty `msg` (`GET /api/echo?msg=`) is a present parameter of length 0 and is echoed back as `{"echo": ""}` with 200, FastAPI's default. No criterion asks for a minimum length, so none is added (no gold plating). Whitespace is returned unchanged; trimming is TEST-11's and BUG-05's question, not this item's.

## Plan Overview
Add one read-only backend endpoint, `GET /api/echo?msg={text}`, that returns `{"echo": "<msg>"}`. Layers touched: a new router (`backend/app/routers/echo.py`) declaring `msg` as a required query parameter bounded with `Query(max_length=200)`, a new Pydantic response schema (`backend/app/schemas/echo.py`, `EchoResponse` plus the `ECHO_MSG_MAX_LENGTH` constant), and one `include_router` line in `backend/app/main.py`. There is no service or repository layer: the endpoint has no business logic and no persistence, and FastAPI's own request validation produces both 422 responses (missing `msg`, `msg` over 200 characters). Tests: a unit test module for the schema and the declared parameter contract, one added route-registration unit test, and a router integration test module over the full HTTP cycle. No frontend, no external integration, no new dependency, no E2E spec (no criterion involves the UI). UAT artifacts: Gherkin scenarios, the manual UAT script and its artifact copy.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/echo` (router prefix `/api`, tag `echo`, path `/echo`), `response_model=EchoResponse`. Signature shape: `def get_echo(msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]) -> EchoResponse`, returning `EchoResponse(echo=msg)`. `msg` has no default, so FastAPI marks it required and answers its absence with 422 `missing`; a value over 200 characters is answered with 422 `string_too_long`. The handler contains no validation logic of its own.
- Schema: `backend/app/schemas/echo.py` defines `ECHO_MSG_MAX_LENGTH = 200` (UPPER_SNAKE_CASE constant) and `class EchoResponse(BaseModel): echo: str`, with a module docstring naming TEST-06, following `schemas/version.py`'s shape.
- Registration: `backend/app/main.py` imports `router as echo_router` from `app.routers.echo` and adds `app.include_router(echo_router)` after the existing three registrations; the module docstring's list of registering features gains TEST-06. Nothing else in the factory changes (CORS `allow_methods` already includes GET).
- Service layer: none. The response is the input; there is no business logic to place in a service, so a pass-through service module would be a layer with nothing in it (coding_standards backend Section 2.2 puts parameter validation in the router via schemas, which is exactly what this endpoint does).
- Repository layer: none (no persistence).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg`, string, required, maxLength 200. No body.
- Response:
  - 200: `{"echo": "hello"}` for `?msg=hello` (the `msg` value, unchanged, URL-decoded by the framework; `?msg=hello%20world` gives `{"echo": "hello world"}`).
  - 422 (no `msg`): FastAPI's standard body, `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}`.
  - 422 (`msg` of 201+ characters): `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "input": "<the value>", "ctx": {"max_length": 200}}]}`.
  - Tests assert the status code plus `detail[0].type` and `detail[0].loc`, not the full message text, so a FastAPI wording change does not break them.

## Technology Selection
- `backend/app/routers/echo.py` (query validation): chose FastAPI's declared `Query(max_length=ECHO_MSG_MAX_LENGTH)` on a required parameter (installed dependency) over a hand-rolled `len(msg) > 200` check in the handler, because the framework's declaration yields the standard 422 body, appears in the OpenAPI schema as `maxLength: 200`, and is what criterion 3 and the 2026-09-03 retraction comment ask for.
- `backend/app/schemas/echo.py` (`EchoResponse`): chose a Pydantic `BaseModel` (installed with FastAPI) over a bare dict or a `TypedDict` (stdlib), because criterion 4 requires a Pydantic schema and the project's existing endpoints use one as `response_model`.
- Service module: none chosen; no stdlib call or dependency is needed because the endpoint has no logic beyond returning its validated input.
- Dependencies: no new runtime or dev dependency; FastAPI, Pydantic (via FastAPI), pytest and httpx (TestClient) are already installed per `backend/pyproject.toml`.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and the `EchoResponse` Pydantic model (`echo: str`).
- [B] backend/app/routers/echo.py: `APIRouter(prefix="/api", tags=["echo"])` with `GET /echo`, `msg` declared required with `Query(max_length=ECHO_MSG_MAX_LENGTH)`, returning `EchoResponse(echo=msg)`.
- [B] backend/tests/unit/test_echo_unit.py: unit tests for the schema and the declared contract: `EchoResponse(echo="hello").model_dump() == {"echo": "hello"}`; `ECHO_MSG_MAX_LENGTH == 200`; the app's OpenAPI document declares the `/api/echo` GET parameter `msg` in `query` as `required: true` with `maxLength: 200` (proves the bound is declared, not hand-checked); `EchoResponse` without `echo` raises `ValidationError` (error case).
- [B] backend/tests/integration/test_echo_integration.py: router tests through the session `client` fixture: `?msg=hello` gives 200 and exactly `{"echo": "hello"}`; no `msg` gives 422 with `detail[0].type == "missing"` and `loc == ["query", "msg"]`; a 201-character `msg` gives 422 with `detail[0].type == "string_too_long"` and `loc == ["query", "msg"]`; a 200-character `msg` gives 200 echoing it (boundary); `?msg=hello%20world` gives `{"echo": "hello world"}` (query-string decoding end to end).
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus the 200-character boundary edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/TEST-06/uat_script.md: the artifact copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import `echo_router` from `app.routers.echo`, add `app.include_router(echo_router)`, and add TEST-06 to the module docstring's list of registering features.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the app's custom route paths (same shape as the existing version and health tests).

No dependency changes, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is regenerated. No docs change: the feature adds one endpoint inside the existing structure and changes no project structure, run configuration, dependency or test infrastructure, and neither `README.md` nor `docs/DEVELOPMENT.md` lists the API's endpoints, so build-feature Section 15's condition is not met.

## Testing Strategy
- Unit tests: `EchoResponse` serialization and its required-field error, the `ECHO_MSG_MAX_LENGTH` constant, the OpenAPI declaration of `msg` (required, query, maxLength 200), and the echo route's registration in `create_app()`. No external dependency is touched.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (new `test_echo_unit.py`; the registration test joins the existing `test_main_unit.py`)
- Integration tests: the router over the full HTTP request/response cycle via the shared session-scoped `client` fixture in `backend/tests/conftest.py`: happy path 200, missing `msg` 422, 201-character `msg` 422, 200-character boundary 200, URL-encoded space decoded. The endpoint needs no database; the `client` fixture's lifespan skips schema initialisation when `DATABASE_URL` is unset and runs it when set, and neither affects this router.
  - Directory: backend/tests/integration/
  - Naming: test_echo_integration.py
- E2E tests: not warranted for this feature (E2E Tests is ENABLED, but no acceptance criterion involves navigation or interaction through the UI: no frontend consumes `/api/echo`). No spec file is produced, so no `[D]` entry exists, and the per-feature edge-case spec obligation does not arise because E2E is not warranted at all (testing_standards Sections 4 and 6). Writing a browser spec that calls the API directly would be the anti-pattern testing_standards Section 5 names.
  - Directory: e2e/tests/ (unused by this feature)
  - File: none (would have been TEST-06_echo_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case, phrased as HTTP requests against the running backend, as TEST-02's scenarios are.
  - Directory: e2e/uat/scenarios/ (scripts in e2e/uat/scripts/)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | Verifying it needs no navigation or interaction: no UI consumes the endpoint, it is a router request/response behaviour. |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | Verifying it needs no navigation or interaction: it is the router's request validation, observable only in the HTTP response. |
| 3 | `msg` over 200 characters returns 422, bound declared not hand-checked | Integration (422 behaviour) and Unit (the declaration, via the OpenAPI parameter's `maxLength: 200`) | Verifying it needs no navigation or interaction: it is a validation rule plus a property of the declared contract, neither reachable through a UI. |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a structural property of the code (the `EchoResponse` model and its serialization), backed by the integration test's exact-body assertion. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `?msg=hello` returns 200 `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | No `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/echo` with no query string, Then the status is 422 and `detail[0].loc` is `["query", "msg"]` |
| 3 | `msg` over 200 characters returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client sends GET `/api/echo` with a 201-character `msg`, Then the status is 422 with `detail[0].type` `string_too_long`; and a 200-character `msg` returns 200 (edge case) |
| 4 | Response defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the API's OpenAPI document, When a reader opens `/openapi.json`, Then the 200 response of GET `/api/echo` references the `EchoResponse` schema with a string property `echo` |

## Manual verification plan
No criterion is verifiable through the app's UI: no frontend screen calls `/api/echo`. Every block below is verified with `curl` against the running backend, the observable check being the HTTP status line and the JSON body.

Shared prerequisites: Docker running, repository checked out on `feature/TEST-06-echo-endpoint`, from the repository root `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running, published on `http://localhost:8010` (the `docker-compose.yml` mapping). A terminal with `curl` and `python3`.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
Prerequisites: shared prerequisites above.
1. In a terminal run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK` and the body is exactly `{"echo":"hello"}`.
2. Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"` → the body is `{"echo":"hello world"}` (the encoded space is decoded, proving query-string handling end to end).

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: shared prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first line reads `HTTP/1.1 422 Unprocessable Entity` (never 500, never 200).
2. Read the body → it is FastAPI's validation shape, `{"detail":[{"type":"missing","loc":["query","msg"],"msg":"Field required","input":null}]}`.

### Criterion 3: `msg` longer than 200 characters returns 422, bound declared in the schema
Prerequisites: shared prerequisites above.
1. Run `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8010/api/echo?msg=$(python3 -c "print('a'*201)")"` → prints `422`.
2. Run `curl -s "http://localhost:8010/api/echo?msg=$(python3 -c "print('a'*201)")"` → the body's `detail[0].type` is `string_too_long`, `detail[0].loc` is `["query","msg"]` and `detail[0].ctx` is `{"max_length":200}`.
3. Run `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8010/api/echo?msg=$(python3 -c "print('a'*200)")"` → prints `200` (exactly 200 characters is accepted).
4. Open `http://localhost:8010/openapi.json` in a browser (or `curl -s http://localhost:8010/openapi.json`) and find `paths` → `/api/echo` → `get` → `parameters` → the `msg` entry has `"in": "query"`, `"required": true` and a schema with `"maxLength": 200`, showing the bound is declared rather than checked in the handler.
5. Open `backend/app/routers/echo.py` → the handler body contains no length comparison; the bound appears only as `Query(max_length=ECHO_MSG_MAX_LENGTH)`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: shared prerequisites above.
1. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with a single field `echo: str`.
2. Open `backend/app/routers/echo.py` → the route declares `response_model=EchoResponse` and returns `EchoResponse(echo=msg)`, not a dict literal.
3. In `http://localhost:8010/openapi.json`, find `paths` → `/api/echo` → `get` → `responses` → `200` → its schema is `{"$ref": "#/components/schemas/EchoResponse"}`, and `components.schemas.EchoResponse` lists `echo` as a required string.
4. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` → the run reports `0 failed` for those three files.
