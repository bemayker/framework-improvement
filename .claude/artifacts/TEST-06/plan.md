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
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: checked against the base this branch was cut from (origin/main at c6684ce, which follows 34d49a5 "chore: reset sandbox to the 0.3.467 start state"). `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`; `backend/app/main.py` registers only the version, notes and health routers; a case-insensitive search for `echo` across `backend/app/` matches nothing. The feature is therefore absent from main, the precondition the comment sets is met in effect (by the sandbox reset rather than by a dedicated revert PR, which this plan does not need to distinguish), and the plan is written as a full net-new implementation.
- Comment (tracker, 2026-09-03, retraction): "Retracting the previous comment. It was a measured-run probe, not a real requirement ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler ..." → Addressed by: acted on. Criterion 3 is planned as written (422), with the bound declared on the query parameter through `Query(max_length=ECHO_MSG_MAX_LENGTH)`, the constant living in `backend/app/schemas/echo.py`. Its remark that "the code on feature/TEST-06-echo-endpoint already satisfies it" no longer holds: that branch was reset and holds no echo code, so nothing is reused from it.
- Comment (tracker, 2026-09-03): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on, because the newer comment above retracts it explicitly as a measured-run probe and reinstates criterion 3 (422). No custom 400 handler and no `{"error": ...}` body are planned.
- Comment (tracker, 18 framework-generated plan-PR notices, for PRs 481, 444, 409, 380, 343, 316, 270, 222, 190, 167, 143, 88, 62, 55, 51, 49, 35, 23): "mayker-dev: plan PR opened for TEST-06: ... Review the plan there; when approved, move this task to on hold (Ready for Build)." → Not acted on: they link to plan PRs from earlier runs on a sandbox that has since been reset, and carry no requirement.
- Merged since the last plan: n/a (fresh plan, branched from current main; no previous plan exists).

## Plan Overview
One backend slice, no frontend, no database. A new router `backend/app/routers/echo.py` exposes `GET /api/echo` with a required `msg` query parameter bounded to 200 characters by FastAPI's declarative `Query(max_length=...)`, so a missing or over-long `msg` is rejected by the framework with its standard 422 before the handler runs. The handler returns `EchoResponse(echo=msg)`, a Pydantic model in the new `backend/app/schemas/echo.py`, which also owns the `ECHO_MSG_MAX_LENGTH = 200` constant so the bound is stated once, in the schemas package. The router is registered in `backend/app/main.py` beside the existing three. There is no service or repository layer: the endpoint holds no business logic and touches no data, so a service module would be an empty pass-through (`coding_standards.md` Section 1, KISS; Section 2.2's router layer already owns parameter validation via schemas). Tests: unit tests for the schema and the route registration, integration tests for the four HTTP behaviours through the real app.

Assumptions recorded (no blocking question):
1. `msg` is echoed byte-for-byte as received after URL decoding: no trimming, no normalisation, no lower bound. An empty value (`GET /api/echo?msg=`) is a present parameter and returns 200 with `{"echo": ""}`; the criteria set no minimum, and adding one would be gold plating. Whitespace handling is deliberately left to the later items TEST-11 and BUG-05, which depend on this one.
2. "Longer than 200 characters" means `len(msg) > 200` on the decoded string, so exactly 200 characters returns 200 and 201 returns 422. Pydantic's `max_length` counts characters, which matches.
3. "Stated in the schema" (criterion 3) is satisfied by declaring the bound on the request's query-parameter schema (`Query(max_length=...)`, which FastAPI turns into the OpenAPI parameter schema `maxLength: 200`), with the numeric value defined in `backend/app/schemas/echo.py`. This is the reading the 2026-09-03 retraction comment names.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo` (router prefix `/api`, tag `echo`), query parameter `msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]`, required (no default), `response_model=EchoResponse`; returns `EchoResponse(echo=msg)` with status 200. The handler contains no length or presence check of its own.
- Schema: `backend/app/schemas/echo.py` defines `ECHO_MSG_MAX_LENGTH = 200` and `class EchoResponse(BaseModel)` with one field `echo: str`, docstring naming `GET /api/echo`, mirroring `backend/app/schemas/version.py`.
- Registration: `backend/app/main.py` imports `router as echo_router` from `app.routers.echo` and calls `app.include_router(echo_router)` after the existing three; the module docstring gains one clause naming TEST-06's echo router. CORS middleware is untouched (`allow_methods` already includes GET).
- Service layer: none (no business logic; see Plan Overview).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg` (string, required, at most 200 characters). No body, no headers beyond defaults.
- Response 200: `{"echo": "hello"}` for `?msg=hello`; schema `EchoResponse { echo: string }`.
- Response 422 (missing `msg`): FastAPI's standard validation body, `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`.
- Response 422 (`msg` over 200 characters): FastAPI's standard validation body, `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "ctx": {"max_length": 200}, ...}]}`.
- Response 405: any method other than GET (framework default, not specially planned).

## Technology Selection
- Echo router (`backend/app/routers/echo.py`): chose FastAPI's `APIRouter`, already installed and used by every existing router, over any other routing mechanism; no stdlib or platform alternative applies to an HTTP route.
- Presence and length validation of `msg`: chose FastAPI's declarative `Query(max_length=...)` on a required parameter (installed dependency, enforced by Pydantic) over a hand-rolled `if len(msg) > 200` check in the handler, because the declarative bound produces the framework's standard 422 and appears in the OpenAPI schema, which is exactly what criteria 2 and 3 ask for.
- `EchoResponse` schema (`backend/app/schemas/echo.py`): chose Pydantic `BaseModel` (installed with FastAPI, the pattern of `schemas/version.py`) over a bare dict or a stdlib `TypedDict`/dataclass, because criterion 4 requires a Pydantic schema and FastAPI serialises it natively.
- No new dependency is added, so no dependency manifest or lockfile changes.

## File Manifest
### New files
- [B] backend/app/routers/echo.py: `GET /api/echo` router; required `msg` query parameter bounded by `Query(max_length=ECHO_MSG_MAX_LENGTH)`; returns `EchoResponse`.
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and the `EchoResponse` Pydantic model (`echo: str`).
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoResponse` and the router's declared bound and response model.
- [B] backend/tests/integration/test_echo_integration.py: integration tests through the real app for 200, missing-msg 422, over-long 422 and the 200-character boundary.
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus an edge case (exactly 200 characters).
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/TEST-06/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import and register the echo router; docstring names TEST-06.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the app's custom routes.

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure (one more router in the existing layout, tests in the existing directories).

## Testing Strategy
- Unit tests: `EchoResponse` happy path (`EchoResponse(echo="hello").model_dump() == {"echo": "hello"}`), edge case (empty string accepted), error case (missing `echo` field raises `pydantic.ValidationError`); `ECHO_MSG_MAX_LENGTH == 200`; the `/api/echo` route's `response_model` is `EchoResponse` and its `msg` query parameter is required and carries `max_length` equal to `ECHO_MSG_MAX_LENGTH` (read from the route's dependant/param metadata or from `create_app().openapi()` for `/api/echo`, asserting the resolution rather than restating a literal); `create_app()` registers `/api/echo` (in `test_main_unit.py`). No external dependency to mock.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_echo_unit.py`)
- Integration tests: through the shared `client` fixture (full HTTP cycle, no database needed by this endpoint): `?msg=hello` returns 200 and exactly `{"echo": "hello"}`; no `msg` returns 422 with a `detail` entry whose `loc` is `["query", "msg"]` and `type` is `missing`; a 201-character `msg` returns 422 with `type` `string_too_long`; a 200-character `msg` returns 200 echoing it unchanged (boundary); a URL-encoded value (`msg=hello%20world`) returns `{"echo": "hello world"}`. Test names follow `test_{method_or_action}_{scenario}_{expected_outcome}`.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (`test_echo_integration.py`)
- E2E tests: none for this feature. E2E is ENABLED, but no criterion involves navigation or interaction through the UI (no frontend consumes the endpoint), so per `testing_standards.md` Section 6's fourth question, asked per criterion, every criterion is covered at integration or unit level and no spec file is written.
  - Directory: e2e/tests/ (unused by this feature)
  - File: none (would have been `TEST-06_echo_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case, stated as HTTP requests and responses (no browser steps).
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | Verifying it needs no navigation or interaction: it is a router request/response cycle, and no UI consumes the endpoint |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | Verifying it needs no navigation or interaction: it is the router's framework validation response |
| 3 | `msg` over 200 characters returns 422, bound stated in the schema | Integration (status) and Unit (bound declared on the parameter, not in the handler) | Verifying it needs no navigation or interaction: it is a validation rule plus its HTTP effect |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a structural property of the route (its `response_model`) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | `GET /api/echo` with no `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo` with no query string, Then the status is 422 and the error names the missing `msg` query parameter |
| 3 | `msg` over 200 characters returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request `GET /api/echo` with a 201-character `msg`, Then the status is 422 and the error type is `string_too_long`; edge case: a 200-character `msg` returns 200 |
| 4 | Response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When I open the OpenAPI schema at `/openapi.json`, Then `GET /api/echo`'s 200 response references the `EchoResponse` schema with one string property `echo` |

## Manual verification plan
None of the four criteria can be verified through the UI: no frontend screen calls `GET /api/echo`. The observable check is the HTTP response, read with `curl` against the backend the compose stack publishes on host port `8010` (`docker-compose.yml`).

Prerequisites (all criteria): Docker running; from the repository root on branch `feature/TEST-06-echo-endpoint`, run `docker compose up -d --build` and wait until `docker compose ps` shows `backend` running and `db` healthy; a terminal with `curl` and `python3`.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
Prerequisites: the stack is up as above.
1. Run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first response line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body printed under the headers → exactly `{"echo":"hello"}`.
3. Run `curl -s "http://localhost:8010/api/echo?msg=hello%20world"` → the body is exactly `{"echo":"hello world"}` (the URL-encoded space is decoded and echoed unchanged).

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: the stack is up.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first response line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200).
2. Read the body → a `detail` array with one entry whose `type` is `missing`, `loc` is `["query","msg"]` and `msg` is `Field required`.

### Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema
Prerequisites: the stack is up.
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` (a `msg` of 201 letters `a`) → the first response line reads `HTTP/1.1 422 Unprocessable Entity`.
2. Read the body → a `detail` entry with `type` `string_too_long`, `loc` `["query","msg"]`, `msg` `String should have at most 200 characters` and `ctx` `{"max_length":200}`.
3. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"` (exactly 200 letters `a`) → `HTTP/1.1 200 OK`, and the body's `echo` value is the same 200 letters.
4. Open `backend/app/routers/echo.py` in an editor → the handler body only builds the response; it contains no `len(` call and no `if` on `msg`; the bound appears as `Query(max_length=ECHO_MSG_MAX_LENGTH)` on the parameter, and `ECHO_MSG_MAX_LENGTH = 200` is defined in `backend/app/schemas/echo.py`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack is up.
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` → the 200 response shows the schema `EchoResponse` with one field `echo` of type string, and the `msg` parameter shows as required with `maxLength 200`.
2. Open `backend/app/schemas/echo.py` in an editor → `class EchoResponse(BaseModel)` with a single field `echo: str`; `backend/app/routers/echo.py` declares `response_model=EchoResponse` and returns an `EchoResponse(...)` instance, not a dict literal.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` → `0 failed`.
