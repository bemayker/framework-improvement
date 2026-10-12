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
- [ ] `GET /api/echo?msg=hello` returns **200** with body `{"echo": "hello"}`.
- [ ] `GET /api/echo` with no `msg` returns **422**, the framework's standard validation response, rather than a 500 or an empty 200.
- [ ] `msg` longer than 200 characters returns **422**. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Not acted on because its condition is already met: verified at plan time that `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, no `echo` router or schema exists under `backend/app/`, and `backend/app/main.py` registers no echo router, so the revert has landed and this plan is against a main without the feature.
- Comment (tracker, 2026-09-03, later): "Retracting the previous comment. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler." → Addressed by: criterion 3 is kept verbatim (422), and the bound is declared as `Query(max_length=ECHO_MSG_MAX_LENGTH)` on the `msg` parameter, with no length check in the handler body (Backend Plan, API Contract).
- Comment (tracker, 2026-09-03, earlier): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the later 2026-09-03 comment retracts it explicitly as a measured-run probe; no custom 400 handler or `error` body is planned.
- The item's seven "mayker-dev: plan PR opened for TEST-06" comments (PRs #23, #35, #49, #51, #55, #62, #88) are framework link comments from earlier sandbox rounds, not feedback, and change nothing in this plan.
- Assumption (no comment, recorded instead of a question): criterion 3's "stated in the schema" is read as the request parameter's declared schema, i.e. `Query(max_length=...)`, which FastAPI publishes as `maxLength: 200` on `msg` in `/openapi.json`, with the numeric bound kept as the named constant `ECHO_MSG_MAX_LENGTH` in `backend/app/schemas/echo.py` beside the response schema. This matches the retraction comment's own mechanism.
- Assumption: the dispatch suggested `http://localhost:8000` for manual checks; `docker-compose.yml` publishes the backend on host port `8010`, so the Manual verification plan uses `http://localhost:8010`.

## Plan Overview
One read-only backend endpoint, `GET /api/echo`, that returns its required `msg` query parameter unchanged in an `EchoResponse` Pydantic body. Layers touched: a new schema module, a new router, one `include_router` line in the app factory, and tests (one unit test of the registration, one integration test module over the full HTTP cycle). No frontend, no database, no external API, no new dependency. The 200-character bound is declared on the query parameter, so FastAPI's own request validation produces both 422 cases (missing and too long) with its standard body. Scope is criteria 1 to 4 only: no trimming (TEST-11 adds it), no minimum length, no logging, no POST variant.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/echo` with required query parameter `msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]` (no default, so FastAPI treats it as required). Handler returns `EchoResponse(echo=msg)`; declared with `response_model=EchoResponse`. Router file `backend/app/routers/echo.py`, `APIRouter(prefix="/api", tags=["echo"])`, the same shape as `version.py`.
- Schema: `backend/app/schemas/echo.py` holds `ECHO_MSG_MAX_LENGTH = 200` (module constant with a one-line "why" comment) and `class EchoResponse(BaseModel): echo: str`, mirroring `schemas/version.py`.
- Registration: `backend/app/main.py` imports `router as echo_router` and adds `app.include_router(echo_router)` in `create_app()` after the existing three; the module docstring's list of registering features gains TEST-06. Nothing else in the factory changes (CORS already allows GET).
- Service layer: none. The handler has no business logic to put in one: it copies a validated input into a response model. `coding_standards.md` Section 2.2's Router to Service to Repository pattern is for persistence-backed logic; `version.py` has a service because it resolves package metadata, and `health.py` because it probes a database, neither of which applies here. TEST-11 (trim surrounding whitespace) can extend this without restructuring: either declaratively on the `msg` annotation or by introducing a service at that point, and the `EchoResponse` contract is unaffected either way.
- Repository layer: none (no data access).
- Migrations: none.
- Errors: no custom exception or handler. Both 422 paths are FastAPI's built-in `RequestValidationError` response; the handler contains no `if len(msg) ...` check (criterion 3).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg`, string, required, at most 200 characters (Python `str` length, i.e. characters, not bytes). No body.
- Response 200: `EchoResponse`, e.g. for `?msg=hello`:
  `{"echo": "hello"}`
- Response 422 (missing `msg`): FastAPI's standard validation body, e.g.
  `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}`
- Response 422 (`msg` of 201+ characters): FastAPI's standard validation body with `"type": "string_too_long"`, `"loc": ["query", "msg"]` and `"ctx": {"max_length": 200}`.
- Response 405: any method other than GET (FastAPI default).

## Technology Selection
- `GET /api/echo` length bound (criterion 3): chose FastAPI's `Query(max_length=...)` (installed dependency `fastapi`) over a hand-rolled `len()` check in the handler, because the framework validates, documents (`maxLength` in OpenAPI) and formats the 422 itself, and the criterion forbids the handler check.
- Required-parameter rejection (criterion 2): chose a `msg` parameter with no default, which FastAPI enforces natively, over an `Optional` parameter plus a manual 422, because the installed framework already covers it.
- `EchoResponse` schema (criterion 4): chose a Pydantic `BaseModel` (installed with `fastapi`) over a bare dict or a stdlib `dataclass`, because the criterion names Pydantic and the sibling schemas use it.
- `backend/app/routers/echo.py`: no stdlib call, native platform feature or installed dependency replaces a route handler, so it is built here as one `APIRouter` function.
- New dependencies: none. `backend/pyproject.toml` and `backend/uv.lock` are unchanged.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and the `EchoResponse` Pydantic response schema (`echo: str`) for `GET /api/echo`.
- [B] backend/app/routers/echo.py: `GET /api/echo` router; `msg` declared as `Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]`, returns `EchoResponse(echo=msg)`, no business logic and no hand-rolled length check.
- [B] backend/tests/integration/test_echo_integration.py: full HTTP cycle through the shared `client` fixture: 200 for `msg=hello`, 422 missing, 422 at 201 characters, 200 at exactly 200 characters, URL-encoded inner space round-trips, OpenAPI declares `maxLength` 200 and the `EchoResponse` model, 405 on POST.
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (exactly 200 characters is accepted).
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-06/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the echo router and add `app.include_router(echo_router)` in `create_app()`; add TEST-06 to the module docstring's list.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the app's custom routes, matching the version and health tests.

No E2E spec is produced: no acceptance criterion involves the UI (see Criterion coverage), so there is no `[D]` entry.
No lockfile changes: the feature adds no dependency, so `backend/uv.lock`, `package-lock.json` and `backend/pyproject.toml` stay untouched.
README.md and docs/DEVELOPMENT.md need no edit: the feature changes no project structure, run configuration, dependency or test infrastructure (it adds files inside existing directories and reuses the existing `client` fixture).

## Testing Strategy
- Unit tests: one registration test for the app factory (`/api/echo` is wired in). No service or utility module is added, so `testing_standards.md` Section 6's first question is NO and no service unit tests are warranted; the schema is a two-line declaration whose behaviour the integration tier exercises through the real request cycle.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (extends the existing `test_main_unit.py`)
- Integration tests: the router over the real HTTP request/response cycle via the session-scoped `client` fixture in `backend/tests/conftest.py`: happy path 200, 422 missing `msg`, 422 too long, 200 at the exact 200-character boundary, URL-encoded `hello world` returned as `hello world` (inner space only, so TEST-11's later trimming does not invalidate it), `/openapi.json` showing `msg` as required with `maxLength` 200 and the 200 response referencing the `EchoResponse` component, and 405 on POST. The endpoint needs no database; the tests must not request the `database_url` fixture.
  - Directory: backend/tests/integration/
  - File: test_echo_integration.py
- E2E tests: none warranted for this feature. E2E is ENABLED, but no criterion requires navigation or interaction through the UI (no frontend consumes `/api/echo`), and a Playwright spec that calls the API directly is the anti-pattern `testing_standards.md` Section 5 names: it would be a router integration test in the slowest tier.
  - Directory: e2e/tests/ (no file added)
  - File: none (would have been TEST-06_echo_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case; the manual script is HTTP-level (curl), like TEST-02's.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}` | Integration | Verifying it needs no navigation or interaction: it is a router response, fully observable over HTTP, and no UI consumes it. |
| 2 | `GET /api/echo` with no `msg` returns 422, the standard validation response | Integration | Verifying it needs no navigation or interaction: it is request validation at the router, asserted on status and `detail[0].type == "missing"`. |
| 3 | `msg` longer than 200 characters returns 422; bound stated in the schema | Integration | Verifying it needs no navigation or interaction: it is a validation rule; the 201/200 boundary and the OpenAPI `maxLength` declaration are both asserted over HTTP. |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: it is a contract property, asserted by the OpenAPI 200 response referencing `EchoResponse`, and by review of the router code. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo?msg=hello, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | No `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo with no query string, Then the status is 422 and the detail names the missing `msg` query parameter |
| 3 | `msg` over 200 characters returns 422, bound in the schema | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends a `msg` of 201 characters, Then the status is 422 with type `string_too_long`; and a `msg` of exactly 200 characters returns 200 (edge case) |
| 4 | Response body is a Pydantic schema in `backend/app/schemas/` | covered at Integration, see Criterion coverage | Given the backend is running, When a client reads /openapi.json, Then the 200 response of GET /api/echo references the `EchoResponse` schema |

## Manual verification plan
No acceptance criterion is verifiable through the application UI: no frontend screen consumes `GET /api/echo`. The observable check is the HTTP response, read with `curl` against the compose stack, plus the backend's own interactive docs page for criterion 4.

Shared prerequisites for every block: Docker running; repository on branch `feature/TEST-06-echo-endpoint` (or `main` once merged); from the repository root, `docker compose up -d --build` has completed and `docker compose ps` shows the `backend` service running; host port `8010` is the backend (from `docker-compose.yml`); a terminal with `curl` and `python3`. `curl` prints JSON without spaces, so `{"echo":"hello"}` on screen is the same body as `{"echo": "hello"}` below.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
Prerequisites: the shared prerequisites above.
1. In a terminal run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first response line reads `HTTP/1.1 200 OK`.
2. Read the last line of the output (the body) → exactly `{"echo": "hello"}`, with a `content-type: application/json` header above it.
3. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → `HTTP/1.1 200 OK` with body `{"echo": "hello world"}`, showing the URL-encoded space was decoded end to end.

### Criterion 2: `GET /api/echo` with no `msg` returns 422, the standard validation response
Prerequisites: the shared prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first response line reads `HTTP/1.1 422 Unprocessable Entity` (never `500`, never `200`).
2. Read the body → a `detail` list whose single entry has `"type": "missing"`, `"loc": ["query", "msg"]` and `"msg": "Field required"`.

### Criterion 3: `msg` longer than 200 characters returns 422; the bound is stated in the schema
Prerequisites: the shared prerequisites above.
1. Run `python3 -c "print('a' * 201, end='')" | curl -s -i -G --data-urlencode "msg@-" "http://localhost:8010/api/echo"` (sends `msg` as 201 letters `a`) → `HTTP/1.1 422 Unprocessable Entity`.
2. Read the body → one `detail` entry with `"type": "string_too_long"`, `"loc": ["query", "msg"]` and `"ctx": {"max_length": 200}`.
3. Run the same command with `201` replaced by `200` → `HTTP/1.1 200 OK` and a body whose `echo` value is the 200 letters `a`, confirming the bound is inclusive at 200.
4. Open `http://localhost:8010/docs` in a browser, expand `GET /api/echo` → the `msg` parameter is marked required and shows `maxLength: 200`, the schema-level declaration the criterion asks for.
5. Open `backend/app/routers/echo.py` in the editor → the length bound appears only as `Query(max_length=ECHO_MSG_MAX_LENGTH)` on the parameter; the handler body contains no `len(` check.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the shared prerequisites above.
1. Open `http://localhost:8010/docs`, expand `GET /api/echo`, look at the 200 response → its schema is named `EchoResponse` with one string property `echo`.
2. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with `echo: str`; `backend/app/routers/echo.py` declares `response_model=EchoResponse` and returns an `EchoResponse`, not a dict.
3. Run `uv run --directory backend pytest -q tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
