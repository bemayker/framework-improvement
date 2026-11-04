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
- [ ] `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`.
- [ ] `GET /api/echo` with no `msg` returns 422, the framework's standard validation response, rather than a 500 or an empty 200.
- [ ] `msg` longer than 200 characters returns 422. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: precondition checked against origin/main at b0ed4c9 before planning. `backend/app/routers/` holds only health.py, notes.py and version.py, `backend/app/schemas/` only health.py, note.py and version.py, and a case-insensitive search for `echo` across backend/, frontend/ and e2e/ on origin/main finds no echo route, schema or test (its only hit is a docstring in test_notes_integration.py using the word "echoed"). The feature is absent from main, so the revert precondition holds and this plan proceeds; no plan entry depends on the reverted code.
- Comment (tracker, 2026-09-03): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. ..." → Addressed by: criterion 3 is planned at 422 exactly as the description states, and the bound is declared declaratively as `Query(max_length=200)` on the `msg` parameter (the shape this comment names), with the 200 held as a named constant in `backend/app/schemas/echo.py`. Its remark that the code on this branch "already satisfies it" refers to measured run 2's branch, which was reset; this branch was cut fresh from main and holds no echo code, so the plan builds it.
- Comment (tracker, 2026-09-03): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer comment above explicitly retracts it as a measured-run probe. Read newest first, the retraction is the latest word, so the description's 422 stands and no custom 400 handler or error body is planned.
- Assumption (no comment covers it): `GET /api/echo?msg=` (present but empty) is not addressed by any criterion. The plan adds no minimum length, so it returns 200 with `{"echo": ""}`. Adding `min_length` would be scope beyond the four criteria.

## Plan Overview
One read-only backend endpoint, `GET /api/echo`, added in the same shape as TEST-05's version router: a new router module `backend/app/routers/echo.py` (prefix `/api`), a new Pydantic response schema `EchoResponse` in `backend/app/schemas/echo.py`, and one `include_router` line in `backend/app/main.py`'s `create_app()`. The required `msg` query parameter and its 200-character bound are declared with FastAPI's `Query(max_length=...)`, so a missing or over-long value is rejected by FastAPI's own request validation with its standard 422 body before the handler runs. No service layer: the handler does no business logic (it returns its input unchanged), so a service module would be a pass-through with nothing to test. No database, no frontend, no external API. Tests: integration tests for the full HTTP cycle (every criterion), a unit test for the schema, and one route-registration assertion added to the existing app-factory unit tests.

## Frontend Plan
No frontend changes required. No criterion has a UI surface and no component consumes this endpoint.

## Backend Plan
- Endpoints: `GET /api/echo`, query parameter `msg` (required string, at most 200 characters), returns `EchoResponse`. Router `backend/app/routers/echo.py`: `router = APIRouter(prefix="/api", tags=["echo"])`, handler `get_echo(msg: Annotated[str, Query(max_length=MAX_ECHO_LENGTH)]) -> EchoResponse` decorated `@router.get("/echo", response_model=EchoResponse)`, body `return EchoResponse(echo=msg)`. No `if len(msg) > ...` in the handler, and no default value on `msg` (no default is what makes it required, so its absence yields 422).
- Schema: `backend/app/schemas/echo.py` defines `MAX_ECHO_LENGTH = 200` (the bound, stated once in the schema module) and `class EchoResponse(BaseModel): echo: str`, mirroring `schemas/version.py`.
- Registration: `backend/app/main.py` imports `from app.routers.echo import router as echo_router` and adds `app.include_router(echo_router)` after the existing three; the module docstring gains one clause naming TEST-06's echo router. CORS methods are unchanged (`GET` is already allowed).
- Service layer: none (no business logic; the handler returns its input).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg` (string, required, max length 200). No body.
- Response: 200 `{"echo": "hello"}` for `?msg=hello`. 422 with FastAPI's standard validation body when `msg` is missing (`detail[0].type` is `missing`, `detail[0].loc` is `["query", "msg"]`) or longer than 200 characters (`detail[0].type` is `string_too_long`, `detail[0].loc` is `["query", "msg"]`).

## Technology Selection
- `msg` presence and length validation: chose FastAPI's installed `Query(max_length=200)` declaration on a parameter with no default over a hand-rolled length check and `HTTPException` in the handler, because the installed dependency already produces the standard 422 and criterion 3 forbids a handler check.
- `EchoResponse` schema: chose a Pydantic `BaseModel` (installed with FastAPI) over a bare dict, as criterion 4 requires; no stdlib or native alternative is relevant.
- `backend/app/routers/echo.py`: an `APIRouter` from the installed FastAPI, the project's existing router convention; no alternative needed, and no new dependency is added.

## File Manifest
### New files
- [B] backend/app/routers/echo.py: `GET /api/echo` router with the `Query(max_length=MAX_ECHO_LENGTH)` declaration, returning `EchoResponse`
- [B] backend/app/schemas/echo.py: `MAX_ECHO_LENGTH = 200` and the `EchoResponse` Pydantic model (`echo: str`)
- [B] backend/tests/integration/test_echo_integration.py: HTTP-cycle tests for criteria 1 to 3 and the 200-character boundary, plus the response matching the schema shape (criterion 4)
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoResponse` (serialises to `{"echo": ...}`, rejects a missing `echo`) and `MAX_ECHO_LENGTH == 200`
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus the boundary edge case
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import the echo router and register it with `app.include_router(echo_router)`; docstring names TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the custom route paths

No dependency is added, so no lockfile changes. README.md and docs/DEVELOPMENT.md need no edit: the feature adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `EchoResponse` serialisation (happy path `{"echo": "hello"}`), edge case (empty string `""` serialises), error case (constructing without `echo` raises `ValidationError`), and `MAX_ECHO_LENGTH` equals 200; app factory registers `/api/echo`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (test_echo_unit.py; the registration test joins the existing test_main_unit.py)
- Integration tests: through the shared session-scoped `client` fixture (`backend/tests/conftest.py`), no database needed: `?msg=hello` returns 200 and exactly `{"echo": "hello"}`; no `msg` returns 422 with `detail[0].loc == ["query", "msg"]` and type `missing`; a 201-character `msg` returns 422 with type `string_too_long`; an exactly 200-character `msg` returns 200 echoing it (boundary edge case); a value with spaces and `&` URL-encoded round-trips unchanged (query-string handling end to end, passed via `params=`). Test names follow `test_{action}_{scenario}_{expected_outcome}`.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion involves navigation or interaction through the UI, and no frontend consumes the endpoint; every criterion is covered at integration or unit level (see Criterion coverage). Calling the API from a Playwright spec would be a router integration test in the wrong tier.
  - Directory: e2e/tests/ (no file for this item)
  - File: none (would be TEST-06_echo_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case, phrased at the HTTP level since there is no UI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}` | Integration | verifying it needs no navigation or interaction: it is a router request/response cycle with no UI consumer |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | verifying it needs no navigation or interaction: it is FastAPI request validation at the router |
| 3 | `msg` longer than 200 characters returns 422, bound stated in the schema | Integration | verifying it needs no navigation or interaction: it is a declared validation rule, checked at the router with 201 and 200 characters; the unit test pins the constant |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is a schema definition, checked by the `EchoResponse` unit tests and the integration body assertion |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/echo?msg=hello, Then the status is 200 and the body is {"echo": "hello"} |
| 2 | no `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/echo with no query string, Then the status is 422 and the error names the msg query parameter |
| 3 | over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/echo with a 201-character msg, Then the status is 422; and with a 200-character msg the status is 200 |
| 4 | response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend source, When I open backend/app/schemas/echo.py and backend/app/routers/echo.py, Then the router returns EchoResponse and builds no dict |

## Manual verification plan
No criterion is verifiable through the UI: no frontend screen calls `GET /api/echo`. The observable check is the HTTP response, read with `curl` against the compose stack's backend on host port 8010 (`docker-compose.yml`).

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
Prerequisites: on branch `feature/TEST-06-echo-endpoint`, stack started from the repository root with `docker compose up -d --build`, and `docker compose ps` shows the `backend` service running.
1. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first response line reads `HTTP/1.1 200 OK`.
2. Read the response body → exactly `{"echo":"hello"}`.
3. Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world%20%26%20more"` → the body is `{"echo":"hello world & more"}`, the decoded text unchanged.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: stack from Criterion 1 still up.
1. Run `curl -i http://localhost:8010/api/echo` → the first response line reads `HTTP/1.1 422 Unprocessable Entity` (never 500, never 200).
2. Read the response body → a JSON `detail` array whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422
Prerequisites: stack from Criterion 1 still up.
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a" * 201)')"` (a `msg` of exactly 201 letters `a`) → `HTTP/1.1 422 Unprocessable Entity`, and the body's first `detail` entry has `"type":"string_too_long"` and `"loc":["query","msg"]`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a" * 200)')"` (exactly 200 letters `a`) → `HTTP/1.1 200 OK` and the body is `{"echo":"aaa…"}` holding the same 200 letters.
3. Open `backend/app/routers/echo.py` → the `msg` parameter is declared with `Query(max_length=MAX_ECHO_LENGTH)` and the handler body contains no length check.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Not a runtime behaviour; the observable check is the source and the tests.
1. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with the single field `echo: str`, and `MAX_ECHO_LENGTH = 200`.
2. Open `backend/app/routers/echo.py` → the route declares `response_model=EchoResponse` and returns `EchoResponse(echo=msg)`, with no dict literal.
3. From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the run ends with `0 failed`.
