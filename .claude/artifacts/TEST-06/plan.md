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
- [ ] 2. `GET /api/echo` with no `msg` returns 422, FastAPI's standard validation response, not a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns 422; the bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, newest): "Retracting the previous comment. It was a measured-run probe, not a real requirement. [...] Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. The code on feature/TEST-06-echo-endpoint already satisfies it and needs no change. [...]" → Addressed by: criterion 3 is planned exactly as the description states (422, bound declared through `Query(max_length=...)` fed from a constant in the schema module). Its claim that the code "already satisfies it" is no longer true: this branch was cut fresh from `origin/main` after the reset commit a3a1d7b, and `backend/app/routers/echo.py` and `backend/app/schemas/echo.py` do not exist on it (checked by listing both directories), so the File Manifest creates them rather than leaving them unchanged.
- Comment (tracker, older): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer comment above explicitly withdraws it as a measured-run probe and restates criterion 3 as written. Newest-first precedence makes the retraction authoritative; no custom 400 handler and no `{"error": ...}` body are planned.
- Comment (tracker, operator, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 [...] Code revert pending: the operator reverts 8794a99 [...] on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged." → Addressed by: the precondition is met. `origin/main` now carries a3a1d7b (the 0.3.460 P1 reset to the 0.3.455 start state) and no echo router, schema or tests exist on this branch, so planning proceeds and the manifest creates the echo files from scratch. Nothing in this comment changes the criteria.
- Assumption (no comment covers it): `GET /api/echo?msg=` (present but empty) returns 200 with `{"echo": ""}`. The criteria name only "absent" and "longer than 200" as invalid, so no `min_length` is added (`user_story_alignment.md` Section 3, no gold plating).
- Assumption: exactly 200 characters is valid (200 returns 200, 201 returns 422), reading "longer than 200" literally.

## Plan Overview
One read-only backend endpoint, no database, no frontend. A new router `backend/app/routers/echo.py` exposes `GET /api/echo` with a required `msg` query parameter declared as `Query(max_length=MAX_ECHO_MESSAGE_LENGTH)`. The bound constant and the `EchoResponse` Pydantic model live in a new `backend/app/schemas/echo.py`; the response field carries the same `max_length`, so the bound is stated in the schema module and FastAPI's own validation produces the 422s for criteria 2 and 3. No service layer: there is no business logic to place there (the handler only wraps its input in the schema), and `coding_standards.md` Section 2.2 (in `coding_standards/backend_frontend.md`) puts parameter validation via schemas in the router. The router is registered in `backend/app/main.py` beside the version, notes and health routers. Tests: router integration tests for all four criteria, unit tests for the schema bound and the route registration.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}`, returns the given text wrapped in `EchoResponse`. Router `APIRouter(prefix="/api", tags=["echo"])`, handler `get_echo(msg: str = Query(max_length=MAX_ECHO_MESSAGE_LENGTH)) -> EchoResponse`, decorated with `response_model=EchoResponse`, mirroring `backend/app/routers/version.py`. `msg` has no default, so FastAPI rejects an absent parameter with its standard 422 `{"detail": [...]}` body; no `if len(msg) > 200` check and no custom exception handler in the handler.
- Schema: `backend/app/schemas/echo.py` defines `MAX_ECHO_MESSAGE_LENGTH = 200` and `class EchoResponse(BaseModel): echo: str = Field(max_length=MAX_ECHO_MESSAGE_LENGTH)`. The router imports the constant from here, so the 200 is written once, in the schema module.
- Service layer: none. No business logic exists for this endpoint; adding a pass-through service would be a layer with nothing in it.
- Repository layer: none (no persistence).
- Migrations: none.
- Registration: `backend/app/main.py` imports `router as echo_router` from `app.routers.echo` and calls `app.include_router(echo_router)` after the existing three; the module docstring gains one clause naming TEST-06's router. CORS methods already allow `GET`; nothing else changes.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg`, string, required, at most 200 characters. No body.
- Response:
  - 200: `{"echo": "hello"}` for `?msg=hello` (the `echo` value equals `msg` unchanged).
  - 422 when `msg` is absent: FastAPI's standard validation body, `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`.
  - 422 when `msg` exceeds 200 characters: `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "ctx": {"max_length": 200}, ...}]}`.
  - 405 for any non-GET method (FastAPI default).

## Technology Selection
- Length bound on `msg`: chose FastAPI's `Query(max_length=...)` plus Pydantic `Field(max_length=...)` (installed dependencies, `fastapi>=0.115.0` in `backend/pyproject.toml`) over a hand-written length check in the handler, because the criterion forbids the hand-rolled check and the framework's validation yields the required standard 422.
- Missing-parameter handling: chose a required `Query` parameter (installed dependency) over manual `None` checks, because FastAPI returns the standard 422 for a missing required parameter by itself.
- `EchoResponse` schema module and echo router: no stdlib call, native platform feature or installed dependency replaces them; they are the feature itself, built on the already installed FastAPI and Pydantic.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `MAX_ECHO_MESSAGE_LENGTH = 200` and the `EchoResponse` Pydantic model (`echo: str`, `max_length` bound)
- [B] backend/app/routers/echo.py: `GET /api/echo` router, required `msg` query parameter bounded by `Query(max_length=MAX_ECHO_MESSAGE_LENGTH)`, `response_model=EchoResponse`
- [B] backend/tests/unit/test_echo_schema_unit.py: unit tests for `EchoResponse` (accepts 200 characters, rejects 201, constant equals 200)
- [B] backend/tests/integration/test_echo_integration.py: router tests through the HTTP cycle for criteria 1 to 4 plus the 200-character boundary and the empty-string case
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus the 200/201 boundary edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import and register the echo router; one docstring clause naming TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the custom routes

No lockfile entry: the feature adds no dependency, so neither `backend/uv.lock` nor `frontend/package-lock.json` changes. No `README.md` or `docs/DEVELOPMENT.md` entry: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the existing endpoints. No E2E spec: no criterion is assigned to E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: `EchoResponse` in isolation, happy path (a short string and exactly 200 characters accepted), edge case (empty string accepted), error case (201 characters raises `ValidationError`); plus route registration in `create_app()`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_echo_schema_unit.py`, and the existing `test_main_unit.py`)
- Integration tests: `GET /api/echo` through the session-scoped `client` fixture in `backend/tests/conftest.py`: `?msg=hello` returns 200 and exactly `{"echo": "hello"}`; no `msg` returns 422 with `detail[0].loc == ["query", "msg"]` and `type == "missing"`; 201 characters returns 422 with `type == "string_too_long"`; exactly 200 characters returns 200 echoing the input; `?msg=` returns 200 with `{"echo": ""}`; the OpenAPI schema at `/openapi.json` references `EchoResponse` for `/api/echo` (criterion 4, observable at the HTTP boundary); `POST /api/echo` returns 405. No database needed, so these tests do not use the `database_url` fixtures.
  - Directory: backend/tests/integration/
- E2E tests: not warranted for this feature. E2E is ENABLED, but no criterion involves navigation or interaction through the UI and no frontend consumes the endpoint (`testing_standards.md` Section 6, fourth question, asked per criterion below); a browser spec calling the API directly would be a router integration test (Section 5).
  - Directory: e2e/tests/
  - File: none for TEST-06
- UAT scenarios: one Gherkin scenario per criterion plus the 200/201 boundary edge case, phrased as HTTP request and response checks.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | Verifying it needs no navigation or interaction: no UI consumes the endpoint, it is a router request/response behaviour |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | Verifying it needs no navigation or interaction: it is a router validation response |
| 3 | `msg` over 200 characters returns 422, bound stated in the schema | Integration and Unit | Verifying it needs no navigation or interaction: the 422 is a router validation response (integration) and the bound is a schema rule (unit) |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration and Unit | Verifying it needs no navigation or interaction: it is a structural property, observable as `EchoResponse` in `/openapi.json` and in the schema unit test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | Missing `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo` with no query string, Then the status is 422 and the body's `detail` names `msg` as missing |
| 3 | Over 200 characters returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request `GET /api/echo` with a 201-character `msg`, Then the status is 422; and with exactly 200 characters, Then the status is 200 |
| 4 | Pydantic response schema | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I read `/openapi.json`, Then `/api/echo`'s 200 response references the `EchoResponse` schema |

## Manual verification plan
None of the four criteria can be verified through the UI: no frontend screen calls `GET /api/echo`. The observable check is the HTTP response, read with `curl` against the compose stack's backend on host port 8010.

Prerequisites (all criteria): Docker running; from the repository root `docker compose up -d --build`; `docker compose ps` shows `backend` running; a terminal with `curl`.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
1. Run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK`.
2. Read the body → exactly `{"echo":"hello"}`.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
1. Run `curl -i "http://localhost:8010/api/echo"` → the first line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200).
2. Read the body → a JSON object with a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(printf 'a%.0s' {1..201})"` in bash or zsh (201 letters `a`) → `HTTP/1.1 422 Unprocessable Entity`, and the body's first `detail` entry has `"type":"string_too_long"` and `"ctx":{"max_length":200}`.
2. Run the same command with `{1..200}` (exactly 200 letters `a`) → `HTTP/1.1 200 OK` and a body whose `echo` value is the 200-letter string.
3. Open `backend/app/routers/echo.py` → the handler body contains no length comparison; the bound appears only as `Query(max_length=MAX_ECHO_MESSAGE_LENGTH)`, and `MAX_ECHO_MESSAGE_LENGTH = 200` is defined in `backend/app/schemas/echo.py`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` → the 200 response schema is shown as `EchoResponse` with a single string field `echo`.
2. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)`; `backend/app/routers/echo.py` returns an `EchoResponse(...)` and no bare dict.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` → the summary line shows `0 failed`.
