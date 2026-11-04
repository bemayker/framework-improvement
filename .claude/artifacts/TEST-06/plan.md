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
- [ ] 3. `msg` longer than 200 characters returns 422; the bound is declared in the schema (the query parameter's `max_length`), not checked by hand in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, newest): "Reset to to do on 2026-09-07 for measured run 3 ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: precondition verified before planning. On this branch (cut from current `origin/main`, head 7d159cd) `backend/app/routers/` holds `health.py`, `notes.py`, `version.py` and `backend/app/schemas/` holds `health.py`, `note.py`, `version.py`; there is no echo module and `backend/app/main.py` registers no echo router, so the revert has landed and this plan creates the feature from nothing.
- Comment (tracker, second newest): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. ..." → Addressed by: criterion 3 is planned as written in the description (422 via FastAPI's validation), and the bound is declared as `Query(max_length=ECHO_MSG_MAX_LENGTH)` exactly as this comment names. Its remark that "the code on feature/TEST-06-echo-endpoint already satisfies it" refers to the measured-run-2 branch, which the reset reverted; it is not acted on, because no such code exists on this branch.
- Comment (tracker, third newest): "A msg longer than 200 characters should return 400 with a {\"error\": \"...\"} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer comment above explicitly retracts it as a measured-run probe and restores criterion 3 as written (422). Newest-first ordering makes the retraction the operative instruction; no custom exception handler and no 400 body are planned.
- Comment (tracker, 19 others): framework-posted `mayker-dev: plan PR opened for TEST-06: ...` link notices from earlier release runs → Not acted on because they carry no requirement; they record past plan PRs only.
- Assumption (ambiguity, no comment covers it): "stated in the schema" in criterion 3 is read as the FastAPI parameter declaration that lands in the OpenAPI schema (`Query(max_length=...)`), with the limit held as a named constant in `backend/app/schemas/echo.py` beside the response model, so the bound has one source and the handler carries no length check. This is the reading the second-newest comment confirms.
- Assumption (ambiguity): an empty `msg` (`/api/echo?msg=`) is not addressed by any criterion. No `min_length` is added (no gold plating); it returns 200 with `{"echo": ""}`, which is FastAPI's default for a present-but-empty string parameter. Surrounding whitespace is echoed unchanged (TEST-11 and BUG-05 own any trim behaviour later).

## Plan Overview
Backend only. One new router `backend/app/routers/echo.py` exposing `GET /api/echo`, one new Pydantic schema module `backend/app/schemas/echo.py` (response model `EchoResponse` and the `ECHO_MSG_MAX_LENGTH = 200` constant), and one line of router registration in `backend/app/main.py`. No service, repository, database or frontend change: echoing a validated parameter is not business logic, and the architecture note asks for the smallest feature possible. Tests: unit (schema and app registration) and integration (full HTTP cycle through the shared `client` fixture). No external API integration. No E2E spec, because no criterion involves the UI.

## Frontend Plan
No frontend changes required. Nothing in the frontend calls `GET /api/echo`, and no criterion mentions a screen.
- Design reference notes: AI freestyle (Design Reference mode NONE; no UI is built by this item).

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}`, router `APIRouter(prefix="/api", tags=["echo"])`, handler `get_echo(msg: str = Query(max_length=ECHO_MSG_MAX_LENGTH)) -> EchoResponse`, declared with `response_model=EchoResponse`. `msg` has no default, so FastAPI makes it required and a missing one yields its standard 422 (`{"detail": [{"type": "missing", "loc": ["query", "msg"], ...}]}`); a value of 201 or more characters yields the standard 422 with `"type": "string_too_long"`. The handler body is a single `return EchoResponse(echo=msg)`: no length check, no try/except.
- Schemas: `backend/app/schemas/echo.py` holds `ECHO_MSG_MAX_LENGTH = 200` and `class EchoResponse(BaseModel): echo: str`, following `schemas/version.py`'s shape (module docstring naming TEST-06, class docstring naming the endpoint).
- Registration: `backend/app/main.py` imports `from app.routers.echo import router as echo_router` and calls `app.include_router(echo_router)` after the existing three; the module docstring gains one clause naming TEST-06's echo router. Nothing else in `create_app()` or the lifespan changes. The CORS middleware already allows `GET`, so no CORS change.
- Service layer: none. Wrapping `return msg` in a service function would add a layer with no logic (KISS, `coding_standards.md` Section 1); the Router → Service → Repository pattern applies to data-persisting work, which this is not.
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg`, string, required, at most 200 characters (OpenAPI shows `maxLength: 200`). No body, no headers beyond the defaults.
- Response 200: `{"echo": "<msg exactly as received after URL decoding>"}`, e.g. `GET /api/echo?msg=hello` returns `{"echo": "hello"}`.
- Response 422 (missing `msg`): FastAPI's standard body, e.g. `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}`.
- Response 422 (`msg` over 200 characters): FastAPI's standard body with `"type": "string_too_long"`, `"loc": ["query", "msg"]` and `"ctx": {"max_length": 200}`.

## Technology Selection
- Length bound on `msg`: chose FastAPI's `Query(max_length=...)` (installed dependency, rung 3) over a hand-rolled `len(msg) > 200` check in the handler, because the framework's declarative validation produces the standard 422 and publishes the bound in the OpenAPI schema, which criterion 3 requires.
- Missing-parameter handling: chose FastAPI's required-parameter validation (installed dependency) over an explicit `None` check, because a parameter with no default is already required and returns the standard 422 criterion 2 asks for.
- `EchoResponse` schema: chose Pydantic `BaseModel` (installed with FastAPI) over a bare dict, as criterion 4 requires; no stdlib or platform alternative applies.
- No new dependency is added; `backend/pyproject.toml` and `backend/uv.lock` are untouched.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and the `EchoResponse` Pydantic model (`echo: str`).
- [B] backend/app/routers/echo.py: `GET /api/echo` router, `msg` declared as a required `Query(max_length=ECHO_MSG_MAX_LENGTH)`, returns `EchoResponse`.
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoResponse` and the `get_echo` handler called directly.
- [B] backend/tests/integration/test_echo_integration.py: full HTTP-cycle tests for criteria 1 to 4 through the shared `client` fixture.
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus the 200-character boundary edge case.
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/TEST-06/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import and `include_router` the echo router; one clause added to the module docstring.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the app's custom route paths.

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `EchoResponse(echo="hello").model_dump() == {"echo": "hello"}` (happy path); an empty string and a 200-character string round-trip unchanged (edge cases); constructing `EchoResponse()` with no `echo` raises `pydantic.ValidationError` (error case); `ECHO_MSG_MAX_LENGTH == 200`; calling `get_echo(msg="hello")` directly returns an `EchoResponse` instance (proves criterion 4: the router returns the schema, not a dict). App registration: `/api/echo` is in `create_app()`'s custom route paths.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_echo_unit.py`; `test_main_unit.py` extended)
- Integration tests: through the session-scoped `client` fixture in `backend/tests/conftest.py` (no database needed, so no `database_url` fixture): `GET /api/echo?msg=hello` is 200 with exactly `{"echo": "hello"}`; `GET /api/echo` is 422 with `detail[0]["loc"] == ["query", "msg"]` and `detail[0]["type"] == "missing"`; `msg` of 200 `a` characters is 200 and echoed (boundary); `msg` of 201 `a` characters is 422 with `detail[0]["type"] == "string_too_long"`; the OpenAPI document (`client.get("/openapi.json")`) shows the `msg` parameter as required with `schema.maxLength == 200` and the 200 response referencing the `EchoResponse` component (criteria 3 and 4: the bound and the body are declared, not hand-rolled); a URL-encoded value with a space (`msg=hello%20world`) echoes `hello world` (query-string handling end to end); `POST /api/echo` is 405.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion requires navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question, asked per criterion below): no frontend calls this endpoint, and an E2E spec calling the API directly is the anti-pattern `testing_standards.md` Section 5 names. No file under `e2e/tests/` is produced.
  - Directory: e2e/tests/
  - File: none (would have been `TEST-06_echo_endpoint.spec.ts`)
- UAT scenarios: one scenario per criterion plus the 200-character boundary edge case, written against the HTTP API in the same shape as `e2e/uat/scenarios/TEST-02_health_endpoint.feature` (backend published at `http://localhost:8010`).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | Verifying it needs no navigation or interaction: no UI calls the endpoint, it is a router request/response behaviour |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | Verifying it needs no navigation or interaction: it is FastAPI's request validation on the router |
| 3 | `msg` over 200 characters returns 422, bound declared in the schema | Integration | Verifying it needs no navigation or interaction: it is a validation rule, checked over HTTP (201 vs 200 characters) and in the OpenAPI document's `maxLength` |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a code-structure property, checked by the handler returning an `EchoResponse` instance (plus the integration OpenAPI check) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | `GET /api/echo` with no `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/echo` with no query string, Then the status is 422 and `detail[0].loc` is `["query", "msg"]` |
| 3 | `msg` over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/echo` with a 201-character `msg`, Then the status is 422 with type `string_too_long`; edge: a 200-character `msg` is 200 |
| 4 | Response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When a client reads `/openapi.json`, Then the 200 response of GET `/api/echo` references the `EchoResponse` schema |

## Manual verification plan
None of the four criteria is verifiable through the application UI: no frontend screen calls `GET /api/echo`. The observable check is the HTTP response, read with `curl` in a terminal (or through FastAPI's Swagger page at `http://localhost:8010/docs` → `GET /api/echo` → "Try it out").

Shared prerequisites: Docker running; from the repository root, `docker compose up -d --build`, then `docker compose ps` shows the `backend` service running and published on host port `8010`; a terminal with `curl` and `python3`.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: shared prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers.
2. Read the body → exactly `{"echo":"hello"}`.
3. Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"` → the body is exactly `{"echo":"hello world"}` (the URL-encoded space is decoded end to end).

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: shared prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200).
2. Read the body → a JSON object with a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422, bound declared in the schema
Prerequisites: shared prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` (201 letters `a`) → the first line reads `HTTP/1.1 422 Unprocessable Entity`, and the body's `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"` (exactly 200 letters `a`) → `HTTP/1.1 200 OK`, and the body's `echo` value is the same 200 letters.
3. Run `curl -s http://localhost:8010/openapi.json | python3 -m json.tool | grep -n maxLength` → a line reading `"maxLength": 200` appears (the bound is declared in the published schema).
4. Open `backend/app/routers/echo.py` → the handler contains no `len(` check and no manual `HTTPException`; the bound appears only as `Query(max_length=ECHO_MSG_MAX_LENGTH)`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: shared prerequisites above. This is a code-structure property; the observable checks are the source file and the OpenAPI document.
1. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with a single field `echo: str`.
2. Open `backend/app/routers/echo.py` → the route is declared with `response_model=EchoResponse` and returns `EchoResponse(echo=msg)`, never a `{...}` dict literal.
3. Run `curl -s http://localhost:8010/openapi.json | python3 -m json.tool | grep -n EchoResponse` → `EchoResponse` appears both under `components.schemas` and as the `$ref` of the `/api/echo` 200 response.
4. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` → the summary line shows `0 failed`.
