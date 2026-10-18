# Implementation Plan, TEST-06: Echo endpoint

## Feature
> **TEST-06: Echo endpoint** (ClickUp task 123k99ctgcf). Priority: none. Labels: none.
>
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
- [ ] `GET /api/echo?msg=hello` returns **200** with body `{"echo": "hello"}`.
- [ ] `GET /api/echo` with no `msg` returns **422**, the framework's standard validation response, rather than a 500 or an empty 200.
- [ ] `msg` longer than 200 characters returns **422**. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
<!-- First plan on an item that carries tracker comments. The item carries 13 comments and 0 threaded replies; ten are framework-written plan-PR link comments from earlier runs that ask for nothing and are not listed. The three substantive ones follow, newest first. None changes the acceptance criteria. -->
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). This item was built and merged in measured run 2 (PR #23, squash 8794a99 on main). It is the Arm C item again because playbook Section 4 step 3 requires the same item both times. Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." - Addressed by: not acted on, because its precondition is met. Current `origin/main` holds no echo router (`backend/app/routers/` has only `health.py`, `notes.py` and `version.py`, and `backend/app/main.py` registers only those three), so this plan builds the feature from scratch.
- Comment (tracker): "Retracting the previous comment. It was a measured-run probe, not a real requirement. The 400-instead-of-422 comment above was posted deliberately on 2026-09-03 to test whether a re-plan absorbs a tracker comment that contradicts an accepted criterion (measured run 2, Arm D, bar MDF-008). It is withdrawn. Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. [...] No action needed on this item." - Addressed by: criterion 3 kept exactly as written (422). This newest correction overrides the older 400 comment below. The bound is declared declaratively, never checked in the handler; it is declared on the query-parameter model in `backend/app/schemas/echo.py` and bound to the route with `Query()`, which satisfies both this comment and the criterion wording that the bound is stated in the schema (see Assumption A1 in Plan Overview).
- Comment (tracker): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI and we do not want it on this endpoint." (quoted as relayed, possessive dropped) - Addressed by: not acted on, because the newer retraction above withdraws it. Criterion 3 stays 422 with the standard FastAPI validation body.
- Merged since the last plan: n/a (fresh plan, branched from current main; no merged-since lines).

## Plan Overview
Backend-only. Add one read-only endpoint, `GET /api/echo`, that returns the `msg` query parameter it was given, wrapped in a Pydantic response schema. Layers touched: one new schema module (`backend/app/schemas/echo.py`), one new router (`backend/app/routers/echo.py`), and the router registration in `backend/app/main.py`'s `create_app()`, following the shape of the sibling `version` router (prefix `/api`, `response_model` from a schema in `backend/app/schemas/`). No database, no service, no repository, no frontend, no external API, no new dependency.

Validation is entirely declarative. `msg` is a required string with a maximum length of 200, both stated on a Pydantic query-parameter model in the schema module, so FastAPI itself returns its standard 422 validation response for a missing or over-long `msg` and the handler carries no length or presence check.

Assumptions (recorded here per `user_story_alignment.md` Section 4, no blocking question):
- A1, where the bound lives: criterion 3 says the bound is stated in the schema; the retraction comment says it is declared via `Query(max_length=...)`. Both are honoured by declaring an `EchoQuery` Pydantic model in `backend/app/schemas/echo.py` with `msg: str = Field(max_length=200)` (no default, so required) and binding it in the router as `Annotated[EchoQuery, Query()]` (query-parameter models, supported by the installed FastAPI 0.139.2). The 200 is a named constant `ECHO_MSG_MAX_LENGTH` in the same schema module.
- A2, no service layer: the endpoint has no business logic (it returns its input), so the router builds `EchoResponse` directly from the validated query, exactly as small as `CLAUDE.md` Architecture Notes ask ("Keep every feature as small as possible"). A service module would be an empty pass-through. `coding_standards.md` Section 2.2 forbids business logic in the router; there is none to place.
- A3, empty and boundary values: nothing in the criteria constrains an empty `msg`, so `GET /api/echo?msg=` returns 200 with an empty echo (no minimum length is added; adding one would be gold plating per `user_story_alignment.md` Section 3). A `msg` of exactly 200 characters is accepted (200); 201 is rejected (422).
- A4, whitespace: the message is echoed byte-for-byte as FastAPI decodes it, with no trimming. Whitespace behaviour is what dependants TEST-11 (trim) and BUG-05 (keep) later decide; this item takes no position beyond echoing unchanged.
- A5, methods: only GET is registered; other methods get FastAPI's default 405. The existing CORS middleware already allows GET, so `main.py` needs no CORS change.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo` with required query parameter `msg` (string, at most 200 characters). Returns 200 with an `EchoResponse` body whose single field `echo` holds `msg` unchanged. A missing `msg` or one over 200 characters returns FastAPI's standard 422 validation response, produced by the framework from the schema, never by the handler.
- Schemas (`backend/app/schemas/echo.py`): `ECHO_MSG_MAX_LENGTH = 200`; `EchoQuery(BaseModel)` with `msg: str = Field(max_length=ECHO_MSG_MAX_LENGTH)` and no default (required); `EchoResponse(BaseModel)` with `echo: str`. Module and class docstrings name TEST-06, as `schemas/version.py` does for TEST-05.
- Router (`backend/app/routers/echo.py`): `router = APIRouter(prefix="/api", tags=["echo"])`; one handler `get_echo(query: Annotated[EchoQuery, Query()]) -> EchoResponse`, decorated `@router.get("/echo", response_model=EchoResponse)`, returning `EchoResponse(echo=query.msg)`. No `len()` check, no `if not msg`, no `HTTPException` in the handler.
- App factory (`backend/app/main.py`): import `router as echo_router` from `app.routers.echo` beside the three existing router imports, and add `app.include_router(echo_router)` after the existing three `include_router` calls in `create_app()`. Update the module docstring line that lists which feature registers which router to add TEST-06 the echo router. Nothing else in the factory changes (no lifespan, CORS or settings change).
- Service layer: none (Assumption A2: no business logic to hold).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string only, no body. `msg` is required, type string, maximum length 200 characters (URL-decoded). Unknown extra query parameters are ignored (the query model default).
- Response (200): `EchoResponse`, a JSON object with exactly one field, `echo` (string), equal to `msg`. Example for `GET /api/echo?msg=hello`:
```json
{"echo": "hello"}
```
- Response (422, msg missing): FastAPI standard validation body, a detail list whose single entry has type missing and loc query, msg. Example:
```json
{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}
```
- Response (422, msg over 200 characters): the same standard shape, its single entry with type string_too_long, loc query, msg, and ctx max_length 200. Example (input abbreviated):
```json
{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "input": "...", "ctx": {"max_length": 200}}]}
```
- Exact detail entry fields beyond type, loc and the status code are FastAPI and Pydantic output and are not asserted by tests (they are framework-owned, not part of this contract).

## Technology Selection
- `msg` presence and length validation: chose a Pydantic query-parameter model (`EchoQuery` with `Field(max_length=200)`, bound with `Query()`) on the installed FastAPI 0.139.2 and Pydantic 2.13.4 over a hand-rolled `len()` and presence check in the handler, because criterion 3 requires the bound to be stated in the schema and the framework then produces the standard 422 for criteria 2 and 3 with no handler code.
- `EchoResponse` body: chose a Pydantic `BaseModel` (installed) over a bare dict returned from the router, because criterion 4 requires a schema in `backend/app/schemas/`.
- Echo router: no stdlib call, native platform feature or installed dependency covers a project route, so it is built here on the installed FastAPI `APIRouter`, the same as the sibling routers.
- No new dependency is added; `backend/pyproject.toml` and `backend/uv.lock` do not change.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH`, `EchoQuery` (required `msg`, max length 200) and `EchoResponse` (`echo: str`)
- [B] backend/app/routers/echo.py: `GET /api/echo` router returning `EchoResponse` from the validated `EchoQuery`
- [B] backend/tests/unit/test_echo_unit.py: unit tests of the schema (required, length bound, boundary at 200 and 201, response field) and of the route declaration (response model is `EchoResponse`)
- [B] backend/tests/integration/test_echo_integration.py: router integration tests through the HTTP cycle (200 body, 422 missing, 422 over 200, 200 at exactly 200, 405 on POST)
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus edge cases (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import the echo router and register it with `app.include_router(echo_router)` in `create_app()`; docstring names TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the custom routes, in the existing pattern

No E2E spec is produced: no criterion needs navigation or interaction through the UI (no frontend consumes this endpoint), so every criterion is covered at unit or integration tier per `### Criterion coverage`, and the E2E phase has no file to write.
No lockfile changes: the feature adds no dependency, so neither `backend/uv.lock` nor `frontend/package-lock.json` is touched.
No documentation changes: `README.md` and `docs/DEVELOPMENT.md` need no edit, because the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure (build-feature Section 15 condition not met).

## Testing Strategy
- Unit tests: the schema module and the route declaration, in isolation with no HTTP cycle and no database. `EchoQuery`: a 5-character `msg` validates (happy path); exactly 200 characters validates and 201 raises `ValidationError` with type `string_too_long` (edge and error); a missing `msg` raises `ValidationError` with type `missing` (error); an empty string validates (Assumption A3). `ECHO_MSG_MAX_LENGTH == 200`. `EchoResponse(echo="hello").model_dump()` equals a dict with only the `echo` key. The registered `/api/echo` route's `response_model` is `EchoResponse` (found on `create_app()` routes with the same recursion helper `test_main_unit.py` uses, or on `app.routers.echo.router.routes`). Plus `test_main_unit.py`: `/api/echo` is registered.
  - Directory: backend/tests/unit/
  - Naming: test_echo_unit.py (pattern test_{module}_unit.py); test names follow `test_{action}_{scenario}_{expected}` (`testing_standards.md` Section 3)
- Integration tests: the router through the real HTTP request and response cycle with the session `client` fixture from `backend/tests/conftest.py`: `GET /api/echo?msg=hello` is 200 with the echo body (criterion 1); `GET /api/echo` is 422 with a `detail` entry of type `missing` and loc ending in `msg` (criterion 2); a 201-character `msg` is 422 with type `string_too_long` (criterion 3); a 200-character `msg` is 200 and echoed (boundary); a URL-encoded `msg` with a space and an ampersand (`hello%20world%26more`) is echoed decoded (query-string handling, from the What); `POST /api/echo` is 405. No database is needed; the tests use no DB fixture.
  - Directory: backend/tests/integration/
  - File: test_echo_integration.py
- E2E tests: no spec. E2E Tests is ENABLED, but no acceptance criterion requires navigation or interaction through the UI (no frontend consumes `/api/echo`), so `testing_standards.md` Section 6 fourth question is no for every criterion and Section 4 E2E row assigns this feature no spec. Calling the API directly from a browser spec would be a router integration test (`testing_standards.md` Section 5).
  - Directory: e2e/tests/ (unused by this feature)
  - File: none (would be TEST-06_echo_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus edge cases (exactly 200 characters accepted, empty msg echoed, URL-encoded msg decoded), validated for well-formedness in CI; plus the manual UAT script expanded from `## Manual verification plan`.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/echo?msg=hello returns 200 with a body whose only field echo holds hello | Integration | Verifying it needs no navigation or interaction: no UI consumes the endpoint, it is a router request and response behaviour |
| 2 | GET /api/echo with no msg returns 422, the standard validation response | Integration (plus Unit on `EchoQuery` required field) | Verifying it needs no navigation or interaction: it is a request-validation behaviour of the router |
| 3 | msg longer than 200 characters returns 422, bound stated in the schema | Integration (HTTP 422) plus Unit (the bound lives on `EchoQuery`, 200 passes and 201 fails) | Verifying it needs no navigation or interaction: it is a schema validation rule |
| 4 | Response body is defined by a Pydantic schema in backend/app/schemas/ | Unit | Verifying it needs no navigation or interaction: it is a structural property of the route (its response_model is `EchoResponse` from `app.schemas.echo`) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/echo?msg=hello returns 200 with echo holding hello | Covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/echo?msg=hello, Then the status is 200 and the body field echo is hello |
| 2 | GET /api/echo with no msg returns 422 | Covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/echo with no query string, Then the status is 422 and the detail names the missing msg parameter |
| 3 | msg longer than 200 characters returns 422 | Covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request GET /api/echo with a 201-character msg, Then the status is 422 with a string_too_long detail; and with exactly 200 characters the status is 200 |
| 4 | Response body defined by a Pydantic schema | Covered at Unit, see Criterion coverage | Given the source tree, When I open backend/app/routers/echo.py, Then the route declares response_model EchoResponse imported from app.schemas.echo and returns no bare dict |

## Manual verification plan
<!-- Backend-only feature: no screen in the app consumes /api/echo, so every check is made in a terminal with curl (status line and body) or in a browser address bar (body only), against the backend the compose stack publishes on host port 8010. -->
Shared prerequisites for every criterion: Docker running; repository on branch `feature/TEST-06-echo-endpoint` (or `main` once merged); from the repository root run `docker compose up -d --build`, then `docker compose ps` until the `backend` service shows running. The backend answers on `http://localhost:8010` (published by `docker-compose.yml`).

### Criterion 1: GET /api/echo?msg=hello returns 200 with a body whose only field echo holds hello
Prerequisites: shared prerequisites above.
1. In a terminal run `curl -i "http://localhost:8010/api/echo?msg=hello"` - expected: the first response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body printed under the headers - expected: exactly one JSON field, `echo`, whose value is `hello`, and nothing else in the object.
3. Open `http://localhost:8010/api/echo?msg=hello%20world` in a browser address bar - expected: the page shows the JSON object with `echo` holding `hello world` (the `%20` is decoded to a space, proving query-string handling end to end).

### Criterion 2: GET /api/echo with no msg returns 422, the standard validation response
Prerequisites: shared prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo"` - expected: the first response line reads `HTTP/1.1 422 Unprocessable Entity` (never a 500 and never a 200).
2. Read the body - expected: a `detail` list with one entry whose `type` is `missing` and whose `loc` is the pair `query` and `msg`.

### Criterion 3: msg longer than 200 characters returns 422, the bound stated in the schema
Prerequisites: shared prerequisites above. The two values below are digits 0 to 9 repeated; the first is exactly 200 characters, the second is the same plus a trailing `X` (201 characters).
1. Run `curl -i "http://localhost:8010/api/echo?msg=01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789"` - expected: `HTTP/1.1 200 OK` and the body echo field holds the same 200-character string (the boundary is accepted).
2. Run `curl -i "http://localhost:8010/api/echo?msg=01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789X"` - expected: `HTTP/1.1 422 Unprocessable Entity`, the body `detail` entry has `type` `string_too_long`, `loc` query and msg, and a `ctx` whose `max_length` is 200.
3. Open `backend/app/schemas/echo.py` - expected: `EchoQuery.msg` is declared with `Field(max_length=ECHO_MSG_MAX_LENGTH)` and `ECHO_MSG_MAX_LENGTH = 200`.
4. Open `backend/app/routers/echo.py` - expected: the handler contains no `len(` call, no length comparison and no `HTTPException`; it only returns `EchoResponse(echo=query.msg)`.

### Criterion 4: the response body is defined by a Pydantic schema in backend/app/schemas/
Prerequisites: a checkout of the branch; for step 3, `uv` installed and the backend dependencies synced (`uv sync --directory backend`).
1. Open `backend/app/schemas/echo.py` - expected: `class EchoResponse(BaseModel)` with the single field `echo: str`.
2. Open `backend/app/routers/echo.py` - expected: the route decorator declares `response_model=EchoResponse`, `EchoResponse` is imported from `app.schemas.echo`, and the handler returns an `EchoResponse` instance, not a dict literal.
3. From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` - expected: `0 failed` across those three files (they cover all four criteria; no database is needed for them).
4. Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` - expected: the 200 response schema is shown as `EchoResponse` with the field `echo` (string), and `msg` is listed as a required query parameter with a maximum length of 200.
