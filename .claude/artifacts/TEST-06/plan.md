# Implementation Plan, TEST-06: Echo endpoint

## Feature
> A small backend feature for the assisted lifecycle (Arm C of measured run 2). Deliberately narrow: one router, one schema, its tests.
>
> ### What
>
> `GET /api/echo?msg={text}` returns the text it was given, so a caller can prove the API is reachable and that query-string handling works end to end.
>
> ### Acceptance criteria
>
> 1. `GET /api/echo?msg=hello` returns **200** with body `{"echo": "hello"}`.
> 2. `GET /api/echo` with no `msg` returns **422**, the framework's standard validation response, rather than a 500 or an empty 200.
> 3. `msg` longer than 200 characters returns **422**. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
>
> ### Notes
>
> Follows the shape TEST-02 established: a router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. It touches `main.py`'s router registration, so it must not run concurrently with another item that does the same.

## Acceptance Criteria
- [ ] 1. `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`.
- [ ] 2. `GET /api/echo` with no `msg` returns 422, the framework's standard validation response, rather than a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns 422, with the bound stated in the schema rather than enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback

Six tracker comments reached this dispatch, newest first. Each is recorded with its source tag and how this plan treats it, including the ones not acted on.

- Comment (tracker, 2026-09-16): "mayker-dev: plan PR opened for TEST-06 — https://github.com/bemayker/framework-improvement/pull/49 (branch feature/TEST-06-echo-endpoint). Review the plan there; when approved, move this task to 'on hold' (Ready for Build)." → Not acted on: it is the framework's own link comment for PR #49, which the dispatching session verified was closed unmerged on 2026-09-16 with its branch deleted (sandbox reset for measured run 4). It carries no requirement; this run produces a fresh plan on a fresh branch.
- Comment (tracker, 2026-09-11): "mayker-dev: plan PR opened for TEST-06 — https://github.com/bemayker/framework-improvement/pull/35 (branch feature/TEST-06-echo-endpoint). Review the plan there; when approved, move this task to 'on hold' (Ready for Build)." → Not acted on: same framework link comment for PR #35, which merged on 2026-09-14 and whose code was reverted off main by the sandbox reset. No requirement in it.
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 … Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: the precondition is satisfied and verified. The dispatching session confirmed `origin/main` (ea8a2f2) carries no echo router, schema, service or test — `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py` — and this dispatch re-read that tree directly. Every File Manifest entry below is therefore genuinely new or a genuinely new edit, not a restatement of merged work.
- Comment (tracker, 2026-09-03): "Retracting the previous comment. It was a measured-run probe, not a real requirement. … Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler." → Addressed by: criterion 3 is planned exactly as the description states it. `msg` is declared `Annotated[str, Query(max_length=200)]` on the handler signature, so FastAPI's own validation returns 422; no length check and no custom error body appear in the handler. This retraction is the newest word on the question and it overrides the 400 comment below.
- Comment (tracker, 2026-09-03): "A msg longer than 200 characters should return 400 with a {\"error\": \"...\"} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → **Not acted on**, and deliberately so: the comment immediately above it is newer and explicitly withdraws it as a measured-run probe rather than a requirement. Comments are read newest first because that is where corrections live, so the retraction wins. Nothing in this plan returns 400, and no custom exception handler or `{"error": ...}` body is planned for this endpoint.
- Comment (tracker, 2026-09-03): "mayker-dev: plan PR opened for TEST-06 — https://github.com/bemayker/framework-improvement/pull/23 (branch feature/TEST-06-echo-endpoint). Review the plan there; when approved, move this task to 'on hold' (Ready for Build)." → Not acted on: the framework's own link comment for PR #23, merged 2026-09-03 and reverted before measured run 3. No requirement in it.

No PR review comments exist: this is a first plan and no pull request is open. The merged-since-plan check does not apply — this branch was cut from `origin/main` as it now stands, so its base is current main by construction.

## Plan Overview

One backend endpoint, in the shape TEST-02 and TEST-05 already established in this codebase: an `APIRouter(prefix="/api", tags=["echo"])` in `backend/app/routers/echo.py`, a Pydantic response model in `backend/app/schemas/echo.py`, and one line of registration in `create_app()`. The endpoint reads a required `msg` query parameter bounded at 200 characters and returns it inside the response model.

**No service module is created**, and that is a decision rather than an omission: `coding_standards.md` Section 2.2 scopes the Router → Service → Repository pattern to a backend "with data persistence", and echo has neither persistence nor business logic — a service would be a one-line pass-through with no behaviour of its own to test. The existing code agrees: `version_service.py` exists because resolving a version has a fallback path, `health_service.py` because probing a database has a timeout and a failure mode, `note_service.py` because notes have a repository. Query-parameter validation is explicitly the Router's job in Section 2.2 point 1 ("path/query parameter validation via schemas"), and `CLAUDE.md` Architecture Notes say to keep every feature as small as possible. The decision is recorded in `## Technology Selection` so the reviewer grades the diff against it.

No database, no migration, no new dependency, no configuration change. **No frontend work**: nothing in `frontend/` consumes this endpoint, and the acceptance criteria are all HTTP responses. Design Reference mode is `NONE` and this feature renders no UI, so no design values are recorded anywhere in this plan and nothing downstream has any to implement from.

The one file this feature shares with other in-flight work is `backend/app/main.py` (plus the router-registration test beside it); see `shared_risks.md`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo` — returns the value of the required `msg` query parameter, unchanged, inside the response model. Registered on the existing `/api` prefix, tagged `echo`, `response_model=EchoResponse`. The handler is a plain synchronous function matching `backend/app/routers/version.py`.
- Input validation: `msg: Annotated[str, Query(max_length=200)]` on the handler signature, with **no default** — the missing-parameter 422 (criterion 2) and the over-length 422 (criterion 3) are both FastAPI's own `RequestValidationError` response, produced by the declaration. No length check, no `try`/`except`, and no custom exception handler in the router. An empty `msg=` is a valid 200 returning `{"echo": ""}`: no minimum length is specified in the criteria, and inventing one would be gold plating.
- Service layer: **none.** No business logic and no persistence, so nothing earns the layer (`coding_standards.md` Section 2.2, and the reasoning in `## Plan Overview` and `## Technology Selection`). The router constructs the response model directly from the validated parameter.
- Repository layer: none. No data access.
- Migrations: none. No schema change.
- Registration: `backend/app/main.py` imports `router as echo_router` from `app.routers.echo` and calls `app.include_router(echo_router)` inside `create_app()`, alongside the three existing routers. Nothing else in that file changes.
- Logging: none added. There is no failure path in the handler to log, and `coding_standards.md` Section 2.3 asks for logs on exceptions and unexpected situations, of which this handler has none.

## API Integration Plan
No external API integration.

## API Contract
- Method: `GET`
- URL: `/api/echo`
- Request: one **required** query parameter, `msg`, type `string`, `max_length` 200. No request body, no headers beyond the defaults, no authentication (this project has none).
- Response, 200:
  ```json
  {"echo": "hello"}
  ```
  Shape: `EchoResponse` — one field, `echo: str`, carrying the request's `msg` verbatim.
- Response, 422 (`msg` absent, or longer than 200 characters): FastAPI's standard validation body, unmodified:
  ```json
  {"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}
  ```
  The `type`, `msg` and `ctx` values differ between the missing case (`missing`) and the over-length case (`string_too_long`); the framework produces both and this feature does not reshape either.
- Response, 405: `POST /api/echo` is not defined, so FastAPI answers Method Not Allowed. Not a criterion; stated so the integration test's method-not-allowed case is a planned expectation rather than a surprise.

## Technology Selection

- Query-parameter length bound (criterion 3): chose FastAPI's `Query(max_length=200)` — already installed, via the `fastapi>=0.115.0` dependency the project carries — over a hand-rolled length check plus a raise in the handler. The installed dependency covers it completely, criterion 3 names that mechanism explicitly, and a hand-rolled check would also have to reproduce the error body the framework already produces.
- Missing-parameter rejection (criterion 2): chose FastAPI's required-parameter validation, obtained by giving `msg` no default, over an explicit presence check or a custom 400/422 branch. Rung 3 of the ladder: the installed framework already returns exactly the response the criterion asks for, so there is nothing to write.
- `backend/app/schemas/echo.py` (`EchoResponse`): chose a Pydantic `BaseModel` — Pydantic is already installed as a FastAPI dependency — over a bare `dict` return or a `TypedDict`. Criterion 4 requires the schema; a dict would satisfy the wire format and fail the criterion, and would also drop the OpenAPI documentation the existing endpoints all carry.
- `backend/app/routers/echo.py`: no standard-library call, native platform feature or installed dependency exposes this route, so the router module is built here. It is the smallest unit this project registers a route with (`APIRouter`), matching `version.py` and `health.py`.
- Echo service module (`backend/app/services/echo_service.py`): **chose not to create one**, over adding the pass-through service the layered pattern would otherwise suggest. `coding_standards.md` Section 2.2 scopes Router → Service → Repository to a backend with data persistence; this endpoint has no persistence and no business logic, so the service would be `def echo(msg): return msg` — an indirection with nothing to test, contradicting KISS (Section 1) and `CLAUDE.md`'s "keep every feature as small as possible". Recorded here because the absence is deliberate and the reviewer grades the diff against this plan.
- New dependency: none. Nothing in this feature needs a package the project does not already install, so no dependency manifest and no lockfile changes.

## File Manifest

### New files
- [B] backend/app/routers/echo.py: `APIRouter(prefix="/api", tags=["echo"])` with `GET /echo`, `response_model=EchoResponse`, parameter `msg: Annotated[str, Query(max_length=200)]` (no default). Returns `EchoResponse(echo=msg)`. Module docstring names TEST-06, matching the sibling routers.
- [B] backend/app/schemas/echo.py: `EchoResponse(BaseModel)` with the single field `echo: str`, in the shape of `backend/app/schemas/version.py`.
- [B] backend/tests/unit/test_echo_router_unit.py: unit tests for the handler and the response contract in isolation — the handler returns `EchoResponse` carrying its argument verbatim (happy path), an empty string round-trips unchanged (edge case), and the 200-character bound is declared as `Query` metadata on the route rather than checked in the handler body (criterion 3's "stated in the schema" half, asserted structurally). Also asserts `EchoResponse` is a `pydantic.BaseModel` with the one `echo: str` field and that the route's `response_model` is that class (criterion 4).
- [B] backend/tests/integration/test_echo_integration.py: router tests through the full HTTP cycle on the shared session-scoped `client` fixture from `backend/tests/conftest.py` — 200 with `{"echo": "hello"}`, 422 with `msg` absent, 422 with a 201-character `msg`, 200 at the 200-character boundary, 200 with an empty `msg`, and 405 on `POST`. Needs no database, exactly like `test_version_integration.py`.
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus the boundary edge case, in the shape of `e2e/uat/scenarios/TEST-02_health_endpoint.feature` (a backend-only feature whose scenarios are stated as HTTP requests and responses).
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: the manual UAT script, expanded from `## Manual verification plan` below with the pass/fail checkboxes, prerequisites and summary table build-feature Section 14 adds.
- [G] .claude/artifacts/TEST-06/uat_script.md: the artifact copy of that script, written by build-feature Section 14 step 3.

### Modified files
- [B] backend/app/main.py: add `from app.routers.echo import router as echo_router` and one `app.include_router(echo_router)` call inside `create_app()`, beside the three existing registrations; extend the module docstring by one clause naming TEST-06, matching how TEST-02 and TEST-05 recorded themselves there. No other change, and no change to the lifespan, the CORS middleware or the settings.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`, asserting `/api/echo` is among the app's custom route paths, in the shape of the existing `test_create_app_registers_version_route` and `test_create_app_registers_health_route`. The existing tests are untouched.

No lockfile entry: this feature adds no dependency, so neither `backend/pyproject.toml` nor `backend/uv.lock` changes.

No documentation entry: the feature changes no project structure, no run configuration, no dependency and no test infrastructure, so build-feature Section 15's condition is not met and neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. A new endpoint on an existing router prefix is not a structural change.

Not modified: `backend/tests/conftest.py` (the existing `client` fixture is sufficient and needs no new fixture), `backend/app/core/`, `docker-compose.yml`, anything under `frontend/`, `e2e/tests/`, or `.github/`.

## Testing Strategy
- Unit tests: the echo handler and its response contract in isolation — the pure function's return value, the `Query(max_length=200)` declaration site, and `EchoResponse`'s shape and use as `response_model`. No service layer exists to test (see `## Technology Selection`), so the unit tier's subject here is the router function and the schema. **Documented deviation from `coding_standards.md` Section 2.4's three-case minimum:** the handler has no reachable error case — every failure mode is framework validation that never enters the function body — so the third case is covered at the integration tier as the two 422s rather than fabricated as a unit test of code that cannot raise.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py` → `test_echo_router_unit.py`
- Integration tests: the full HTTP request/response cycle against the router through the shared `TestClient`: the 200 happy path and its exact body, both 422 paths, the 200-character boundary, the empty-`msg` case, and 405 on `POST`. Per `testing_standards.md` Section 1.2's router rule (happy path plus a validation error), and needing no backing service — this endpoint touches no database, so the run's PostgreSQL container is irrelevant to it.
  - Directory: `backend/tests/integration/`
- E2E tests: **not warranted for this feature.** `E2E Tests` is ENABLED in `CLAUDE.md`, but `testing_standards.md` Section 6's fourth question is no for all four criteria: no page, component or route in `frontend/` consumes `GET /api/echo`, so there is nothing to navigate to and nothing to interact with, and an E2E spec could only re-issue the HTTP request the integration tier already issues — which `testing_standards.md` Section 5 names as an anti-pattern ("E2E tests that bypass the UI … that is a router integration test"). Section 4's per-feature edge-case E2E spec is scoped to features where the tier is warranted at all, so none is written. TEST-02, the other backend-only endpoint in this project, has no spec in `e2e/tests/` for the same reason. Build-feature Phase D is therefore not dispatched for this item.
  - Directory: `e2e/tests/` (no file added)
  - File: `{feature_id}_{slug}.spec.ts` (not used)
- UAT scenarios: one scenario per acceptance criterion plus the 200-character boundary edge case, stated as HTTP requests and responses because no UI exists to click through — the shape `e2e/uat/scenarios/TEST-02_health_endpoint.feature` already uses in this repo.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}` | Integration | Verifying it needs no navigation or interaction: no frontend consumes the endpoint, so the whole criterion is one router response over the full HTTP cycle, which the integration tier runs in milliseconds. |
| 2 | `GET /api/echo` with no `msg` returns 422 rather than 500 or an empty 200 | Integration | Verifying it needs no navigation or interaction: it is the router's validation response, observable only in the HTTP status and body. No UI can produce a request with the parameter missing. |
| 3 | `msg` longer than 200 characters returns 422, with the bound stated in the schema rather than hand-rolled in the handler | Integration | Verifying it needs no navigation or interaction: the 422 is a router response. Its second half — that the bound is declared, not checked in the handler — is a structural property of the source and is additionally asserted at the unit tier, which is cheaper still than an HTTP call. |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router | Unit | Verifying it needs no navigation or interaction, and no HTTP call either: it is a property of the module — `EchoResponse` is a `BaseModel` in `app.schemas.echo` and is the route's `response_model`. A browser could not tell this apart from a bare dict returning the same JSON. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `{"echo": "hello"}` | Covered at Integration, see Criterion coverage | Given the backend is running, When a client sends `GET /api/echo?msg=hello`, Then the status is 200 and the body is exactly `{"echo": "hello"}` |
| 2 | Missing `msg` returns 422 | Covered at Integration, see Criterion coverage | Given the backend is running, When a client sends `GET /api/echo` with no query string, Then the status is 422 and the body is the framework's validation detail naming `msg`, never a 500 and never an empty 200 |
| 3 | `msg` over 200 characters returns 422, bound declared in the schema | Covered at Integration (response) and Unit (declaration site), see Criterion coverage | Given the backend is running, When a client sends `GET /api/echo` with a 201-character `msg`, Then the status is 422 and the validation detail reports a string-too-long constraint of 200 |
| 3b | Boundary (edge case) | Covered at Integration, see Criterion coverage | Given the backend is running, When a client sends `GET /api/echo` with a `msg` of exactly 200 characters, Then the status is 200 and the body echoes all 200 characters |
| 4 | Response body defined by a Pydantic schema | Covered at Unit, see Criterion coverage | Given the backend is running, When a client reads `GET /openapi.json`, Then the `/api/echo` 200 response references a named `EchoResponse` schema with the single property `echo` of type string, which a bare dict would not produce |

## Manual verification plan

**None of the four criteria is verifiable through the UI:** nothing in `frontend/` calls `GET /api/echo`, so there is no page to open and no control to click. The observable check for every criterion is the HTTP response itself, read with `curl`. Criterion 4 additionally has a source-level check, given as the second step of its block.

Prerequisites for every block below, done once:

1. Docker and Docker Compose installed and running; repository checked out on branch `feature/TEST-06-echo-endpoint` (or on `main` once merged).
2. Host ports `8010` (backend) and `5442` (database) free, per `docker-compose.yml`.
3. From the repository root, run `docker compose up -d --build`, then `docker compose ps` until `db` reports healthy and `backend` reports running.
4. A terminal with `curl`. The database is not needed by this endpoint, but the stack is what publishes the backend on `http://localhost:8010`.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
1. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first response line reads `HTTP/1.1 200 OK`.
2. Read the response body of that same command → exactly `{"echo":"hello"}`, with no other field and no wrapping object.
3. Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"` → the body is exactly `{"echo":"hello world"}`, proving the value is echoed verbatim after URL-decoding rather than transformed.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
1. Run `curl -i "http://localhost:8010/api/echo"` → the first response line reads `HTTP/1.1 422 Unprocessable Entity`. It must not be `200`, `500` or a hang.
2. Read the response body of that same command → a JSON object with a `detail` array whose single entry has `"loc":["query","msg"]` and `"type":"missing"`. This is FastAPI's own validation body, unaltered.
3. Run `curl -s "http://localhost:8010/api/echo?msg="` → the status is `200` and the body is exactly `{"echo":""}`. An empty value is present, not missing, so it is valid; this step distinguishes the two and confirms step 1 fired on absence rather than on emptiness.

### Criterion 3: `msg` longer than 200 characters returns 422, with the bound stated in the schema
1. Run `curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` → the terminal prints `422`. (The `printf` builds a 201-character string of `a`; any other way of producing 201 characters works the same.)
2. Run `curl -s "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` → the body's `detail` entry reports `"type":"string_too_long"` with `"ctx":{"max_length":200}`, naming the bound the declaration sets.
3. Run `curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..200})"` → the terminal prints `200`. Exactly 200 characters is inside the bound, so the limit is "longer than 200", not "200 or more".
4. Source check for the "stated in the schema" half: open `backend/app/routers/echo.py` → the `msg` parameter is annotated `Annotated[str, Query(max_length=200)]`, and the function body contains no `len(`, no `if` on the length, and no `raise`. A hand-rolled check would appear here; its absence is the criterion.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
1. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with the single field `echo: str`, and `backend/app/routers/echo.py` declares `response_model=EchoResponse` on the route and returns `EchoResponse(echo=msg)` rather than `{"echo": msg}`.
2. Run `curl -s http://localhost:8010/openapi.json | python3 -m json.tool | grep -A4 '"EchoResponse"'` → the generated OpenAPI document contains a named `EchoResponse` schema with the one property `echo` of type `string`. A handler returning a bare dict produces no named schema here, so this output is the observable difference.
