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

Source: ClickUp task 123k99ctgcf (workspace 30307190, list 901524718831), `hybrid` work item source. Depends on: TEST-01 (done, the scaffold).

## Acceptance Criteria
- [ ] 1. `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`.
- [ ] 2. `GET /api/echo` with no `msg` returns 422, the framework's standard validation response, rather than a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns 422. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
Sixteen tracker comments were read (0 threaded replies). Thirteen are framework-posted `mayker-dev: plan PR opened for TEST-06` link notices from earlier sandbox runs; they carry no requirement and are not acted on. The three human-written ones, newest first:

- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). This item was built and merged in measured run 2 (PR #23, squash 8794a99 on main). [...] Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: precondition checked against the code, not assumed. On the current base (`origin/main` at 6439eec) `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`; `backend/app/main.py` registers only the version, notes and health routers; `backend/app/schemas/` has no echo schema; a grep for `echo` under `backend/app`, `backend/tests` and `e2e/` finds no echo code. History confirms the removal: `backend/app/routers/echo.py` last appears in ea5f29a (feat(TEST-06), #316) and was removed by the sandbox reset 9dcba19 (#326). The commit ids the comment names (8794a99, ffbfc12, a9695cc) belong to an earlier history and are not on this main; what matters for the precondition is that main holds no echo feature, and it holds none. The plan is therefore written against a main without the feature and creates every echo file new.
- Comment (tracker, 2026-09-03): "Retracting the previous comment. It was a measured-run probe, not a real requirement. The 400-instead-of-422 comment above was posted deliberately on 2026-09-03 to test whether a re-plan absorbs a tracker comment that contradicts an accepted criterion (measured run 2, Arm D, bar MDF-008). It is withdrawn. Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. [...]" → Addressed by: criterion 3 is planned as written, 422 on over-length. The comment also names the mechanism (`Query(max_length=...)`), which this plan adopts: the bound's value lives in the schema module as `ECHO_MSG_MAX_LENGTH = 200` and the router declares `msg` with `Query(max_length=ECHO_MSG_MAX_LENGTH)`, so the number is stated once, in `backend/app/schemas/echo.py`, and FastAPI enforces it before the handler runs. Its remark that "the code on feature/TEST-06-echo-endpoint already satisfies it" refers to the measured-run-2 branch, which no longer exists on this base; not acted on.
- Comment (tracker, 2026-09-03): "A msg longer than 200 characters should return 400 with a {\"error\": \"...\"} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer comment above explicitly retracts it as a measured-run probe. No custom 400 handler and no `{"error": ...}` body is planned.

## Plan Overview
One read-only backend endpoint: a Pydantic response schema in `backend/app/schemas/echo.py`, a router in `backend/app/routers/echo.py` exposing `GET /api/echo`, one `include_router` line in `create_app()`, and unit plus integration tests. No frontend, no database, no new dependency, no external API.

### Key decisions and assumptions
1. **No service module.** Returning the input unchanged is not business logic, so a `services/echo_service.py` would be a pass-through function with nothing to test beyond the router. The description scopes the item as "one router, one schema, its tests", and `CLAUDE.md` Architecture Notes say to keep every feature as small as possible. The router still holds no logic: it constructs the response schema from the validated parameter and returns it.
2. **The 200-character bound is declarative.** `backend/app/schemas/echo.py` defines `ECHO_MSG_MAX_LENGTH = 200`; the router declares `msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]`. A required parameter with no default makes a missing `msg` a 422 (criterion 2), and `max_length` makes a 201-character `msg` a 422 (criterion 3), both through FastAPI's own `RequestValidationError` handler. No `len()` check, no `HTTPException`, no custom exception handler in the router. This is the mechanism the 2026-09-03 tracker comment names.
3. **Boundary: exactly 200 characters is accepted.** "Longer than 200" returns 422, so a 200-character `msg` returns 200 and echoes it. The integration tests pin both sides of the boundary.
4. **Assumption: an empty `msg` (`?msg=`) is valid and echoes `""`.** The criteria bound only the upper length and the presence of the parameter. Adding `min_length=1` would be an unrequested rule, so none is added. Recorded here so the plan reviewer can change it before the build.
5. **No normalisation of the text.** The endpoint echoes `msg` exactly as FastAPI decodes it from the query string (no trim, no case change). Whitespace handling is the subject of later items (TEST-11, BUG-05) that depend on this one, and this plan does not pre-empt either.
6. **No error-response customisation.** FastAPI's default 422 body (`{"detail": [...]}`) is "the framework's standard validation response" criterion 2 asks for. The integration tests assert the status code and that the body carries a `detail` list naming `msg`, not the full FastAPI error text, so a FastAPI upgrade that rewords a message does not break them.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}`: returns `{"echo": "<msg>"}`. One required query parameter, `msg`, a string of at most 200 characters. No authentication (the project has none).
- Router layer (`backend/app/routers/echo.py`): `router = APIRouter(prefix="/api", tags=["echo"])`; one handler `get_echo(msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]) -> EchoResponse`, declared with `response_model=EchoResponse`, returning `EchoResponse(echo=msg)`. Same module shape as `backend/app/routers/version.py`.
- Schemas (`backend/app/schemas/echo.py`): module constant `ECHO_MSG_MAX_LENGTH = 200` (the bound criterion 3 requires to be stated in the schema) and `class EchoResponse(BaseModel)` with one field `echo: str`. Module docstring names TEST-06, matching `schemas/version.py`.
- Service layer: none (decision 1).
- Repository layer: none. The endpoint reads no data store.
- Migrations: none.
- App factory (`backend/app/main.py`): add `from app.routers.echo import router as echo_router` beside the other router imports and `app.include_router(echo_router)` after the health router's line in `create_app()`. The module docstring's list of registering features gains "and TEST-06 the echo router". Nothing else in the file changes; CORS `allow_methods` already includes `GET`.

## API Integration Plan
No external API integration.

## API Contract
- Method: `GET`
- URL: `/api/echo`
- Request: query parameter `msg` (required, string, max length 200). No body, no headers required.
- Response: `200 OK`, `Content-Type: application/json`, shape `EchoResponse`:

  ```json
  { "echo": "hello" }
  ```

- Error responses:
  - `422 Unprocessable Entity` when `msg` is absent (FastAPI validation, `detail[0].loc` is `["query", "msg"]`, `detail[0].type` is `missing`).
  - `422 Unprocessable Entity` when `msg` is longer than 200 characters (FastAPI validation, `detail[0].loc` is `["query", "msg"]`, `detail[0].type` is `string_too_long`).
  - A non-GET method yields FastAPI's built-in `405 Method Not Allowed`; not part of this feature's criteria and not tested.

## Technology Selection
- `backend/app/schemas/echo.py` (`EchoResponse`, `ECHO_MSG_MAX_LENGTH`): chose a Pydantic `BaseModel` from the already-installed `pydantic` (a FastAPI dependency) over a bare dict, which criterion 4 rules out; no new dependency.
- Length bound on `msg`: chose FastAPI's declarative `Query(max_length=...)` (installed framework feature) over a hand-rolled `len()` check plus `HTTPException` in the handler, because criterion 3 requires the bound to be declared and the framework then produces the standard 422 itself.
- `backend/app/routers/echo.py`: no stdlib call, native platform feature or installed dependency replaces an HTTP route, so it is built here with the installed FastAPI `APIRouter`.
- Service module: none created; chose no service layer over a pass-through `echo_service`, because there is no logic for it to hold (Key decision 1).
- Dependencies: none added. `fastapi` (0.139.2 in `backend/uv.lock`), `pydantic`, `pytest` and `httpx` are already installed.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and `EchoResponse(BaseModel)` with `echo: str`.
- [B] backend/app/routers/echo.py: `APIRouter(prefix="/api", tags=["echo"])` exposing `GET /echo` with `msg` declared as `Query(max_length=ECHO_MSG_MAX_LENGTH)` and `response_model=EchoResponse`.
- [B] backend/tests/unit/test_echo_schema_unit.py: unit tests for `EchoResponse` and the bound constant (happy path, edge case, error case).
- [B] backend/tests/integration/test_echo_integration.py: router tests through the full HTTP cycle with the shared `client` fixture: 200 echo, 422 missing, 422 over-length, 200 at exactly 200 characters.
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (exactly 200 characters).
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-06/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import `echo_router` and call `app.include_router(echo_router)` in `create_app()`; one docstring line. No other change.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the app's custom route paths, in the shape of the existing version and health route tests. Existing tests untouched.

No dependency change, so no lockfile entry: `backend/pyproject.toml` and `backend/uv.lock` are untouched.
No documentation change: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither `README.md` nor `docs/DEVELOPMENT.md` lists the API's endpoints, so neither is edited.

## Testing Strategy
Tiers judged per criterion against `testing_standards.md` Section 6. The feature adds an API endpoint (integration warranted) and a schema with a stated bound (unit warranted); no criterion involves navigation or interaction through the UI, so no criterion is assigned to E2E.

- Unit tests: the response schema and the bound constant, plus app registration.
  - Directory: `backend/tests/unit/`
  - Naming: `test_{module}_unit.py`, so `backend/tests/unit/test_echo_schema_unit.py`
  - Cases (pattern `test_{action}_{scenario}_{outcome}`):
    1. `test_echo_response_serializes_to_echo_key`: happy path, `EchoResponse(echo="hello").model_dump()` equals `{"echo": "hello"}` (criterion 4: the body shape comes from the schema).
    2. `test_echo_response_accepts_empty_string`: edge case, `EchoResponse(echo="")` serializes to `{"echo": ""}` (Key decision 4).
    3. `test_echo_response_without_echo_raises_validation_error`: error case, constructing `EchoResponse()` raises `pydantic.ValidationError`.
    4. `test_echo_msg_max_length_is_200`: the bound criterion 3 requires is stated in the schema module and equals 200.
  - Also in `backend/tests/unit/test_main_unit.py`: `test_create_app_registers_echo_route`.
- Integration tests: the router through the full HTTP cycle (toggle ENABLED). No database needed; uses the existing session-scoped `client` fixture, so `backend/tests/conftest.py` is not modified.
  - Directory: `backend/tests/integration/`
  - Naming: `test_{module}_integration.py`, so `backend/tests/integration/test_echo_integration.py`
  - Cases:
    1. `test_get_echo_with_msg_returns_200_and_echo_body`: `GET /api/echo?msg=hello` returns 200 and JSON exactly `{"echo": "hello"}` (criteria 1 and 4).
    2. `test_get_echo_without_msg_returns_422`: `GET /api/echo` returns 422 and the body's `detail` list has an entry whose `loc` ends in `msg` (criterion 2).
    3. `test_get_echo_with_msg_over_200_chars_returns_422`: `msg` of 201 characters (`"a" * 201`, passed through `params=`) returns 422 with a `detail` entry whose `loc` ends in `msg` (criterion 3).
    4. `test_get_echo_with_msg_of_exactly_200_chars_returns_200`: `"a" * 200` returns 200 and echoes it unchanged (criterion 3's boundary).
- E2E tests: none for this item. E2E is ENABLED, but no criterion requires navigation or interaction through the UI, and an E2E spec that calls the API directly is a router integration test, which `testing_standards.md` Section 5 rules out. Nothing is added under `e2e/tests/`.
  - Directory: `e2e/tests/` (unused by this item)
  - File: `TEST-06_echo_endpoint.spec.ts` would be the name; deliberately not created.
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (exactly 200 characters), API-level Given/When/Then, and the manual script expanded from the section below.
  - Directory: `e2e/uat/scenarios/` and `e2e/uat/scripts/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | verifying it needs no navigation or interaction: it is a router request/response, fully observed by the HTTP test client |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration | verifying it needs no navigation or interaction: it is a router validation response |
| 3 | `msg` over 200 characters returns 422, bound stated in the schema | Integration | verifying it needs no navigation or interaction: it is a router validation response; the bound's location is also pinned by unit test 4 |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | verifying it needs no navigation or interaction: it is a schema shape, checked by serializing `EchoResponse` directly, and integration case 1 checks the wire body |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `/api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | `GET /api/echo` with no `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `/api/echo` with no query string, Then the status is 422 and the body's `detail` names `msg` |
| 3 | `msg` over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `/api/echo` with a 201-character `msg`, Then the status is 422; and with a 200-character `msg` the status is 200 |
| 4 | Response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the API's OpenAPI document, When a reader opens the `GET /api/echo` 200 response, Then its schema is `EchoResponse` with a string property `echo` |

## Manual verification plan
Prerequisites for every criterion: the stack is running (`docker compose up -d` from the repository root), and the backend answers at `http://localhost:8010` (the host port `docker-compose.yml` publishes). No sign-in and no seed data are needed. Every step can be done in a browser address bar or with `curl`; the interactive docs page at `http://localhost:8010/docs` is the UI for this backend-only item.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: stack running as above.
1. Open `http://localhost:8010/api/echo?msg=hello` in a browser → the page shows exactly `{"echo":"hello"}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=hello"` in a terminal → the first line is `HTTP/1.1 200 OK`, the `content-type` header is `application/json`, and the body is `{"echo":"hello"}`.
3. Open `http://localhost:8010/api/echo?msg=Hello%20world` → the page shows `{"echo":"Hello world"}`, with the `%20` decoded to a space.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: stack running as above.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first line is `HTTP/1.1 422 Unprocessable Entity` (not 500 and not 200), and the body is a JSON object with a `detail` list whose first entry has `"loc":["query","msg"]` and `"type":"missing"`.
2. Open `http://localhost:8010/docs`, expand `GET /api/echo`, click "Try it out", leave `msg` empty and click "Execute" → the docs page refuses to send and marks `msg` as required (the parameter is declared required in the schema).

### Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema
Prerequisites: stack running as above.
1. Open `http://localhost:8010/docs`, expand `GET /api/echo` → the `msg` parameter shows `maxLength: 200` (the bound comes from the declaration, not from handler code).
2. Click "Try it out", paste into `msg` the text `0123456789` repeated 20 times followed by `X` (201 characters), click "Execute" → the response code shown is `422` and the body's `detail` entry has `"loc":["query","msg"]` and `"type":"string_too_long"`.
3. Remove the trailing `X` so `msg` is exactly 200 characters (`0123456789` repeated 20 times), click "Execute" → the response code is `200` and the body is `{"echo": "<the same 200 characters>"}`.
4. Open `backend/app/routers/echo.py` → the handler contains no length check of its own; `msg` is declared with `Query(max_length=ECHO_MSG_MAX_LENGTH)` and the constant is defined in `backend/app/schemas/echo.py` as `200`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: stack running as above.
1. Open `http://localhost:8010/docs`, expand `GET /api/echo`, look at the 200 response → its schema is named `EchoResponse` with one string property, `echo`.
2. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with `echo: str`; `backend/app/routers/echo.py` returns `EchoResponse(echo=msg)` and declares `response_model=EchoResponse`, with no dict literal as the response.
3. Run `uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` from the repository root → `0 failed` across those three test files.
