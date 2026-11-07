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
- [ ] 3. `msg` longer than 200 characters returns 422. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: precondition checked on this branch (freshly cut from `origin/main` at ecaacc6). `backend/app/routers/` holds only `__init__.py`, `health.py`, `notes.py`, `version.py`; `backend/app/schemas/` holds only `__init__.py`, `health.py`, `note.py`, `version.py`; `backend/app/main.py` registers the version, notes and health routers and no echo router; no echo test exists under `backend/tests/`. The feature is absent from main, so the plan proceeds and every file below is planned as net-new.
- Comment (tracker, 2026-09-03, retraction): "Retracting the previous comment ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. The code on feature/TEST-06-echo-endpoint already satisfies it and needs no change. ..." → Addressed by: acted on. Criterion 3 is planned as 422, and the bound is declared as `Query(max_length=ECHO_MSG_MAX_LENGTH)` with the constant defined in the schema module `backend/app/schemas/echo.py`, which satisfies both the description ("stated in the schema") and this comment ("declared via Query(max_length=...)"). Its sentence that the branch "already satisfies it and needs no change" is stale since the 2026-09-07 reset: the branch holds no echo code now (see the line above), so the plan builds it.
- Comment (tracker, 2026-09-03): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer retraction comment of the same day withdraws it explicitly as a measured-run probe and restores criterion 3 as written. No custom 400 handler and no `{"error": ...}` body are planned.

## Plan Overview
One read-only backend endpoint, `GET /api/echo`, added in the shape TEST-02 and TEST-05 established: a Pydantic response schema in `backend/app/schemas/echo.py`, a router in `backend/app/routers/echo.py` (prefix `/api`) registered in `backend/app/main.py`, and unit plus integration tests. Validation (required parameter, 200-character upper bound) is declared on the query parameter and enforced by FastAPI, which answers 422 with its standard `detail` body; the handler contains no validation logic. No database, no service layer (there is no business logic to hold: the handler returns its input), no frontend, no new dependency. Single repository.

Assumptions (no criterion or comment decides them, so the smallest reading is taken and no behaviour is added):
- `GET /api/echo?msg=` (present but empty) returns 200 with `{"echo": ""}`. Criterion 2 is about a missing `msg`; no minimum length is stated, so none is added.
- A `msg` of exactly 200 characters is accepted (criterion 3 says "longer than 200" is rejected).
- Whitespace around `msg` is neither trimmed nor asserted on: TEST-11 and BUG-05 later specify opposite whitespace behaviour for this endpoint, so TEST-06 echoes the value as FastAPI decodes it and its tests do not pin whitespace either way.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}`, returns the given text in an `EchoResponse` body.
- Schema (`backend/app/schemas/echo.py`): module constant `ECHO_MSG_MAX_LENGTH = 200` (the bound, stated once, in the schema module) and `class EchoResponse(BaseModel)` with one field `echo: str`, docstring naming the endpoint, matching `schemas/version.py`'s shape.
- Router (`backend/app/routers/echo.py`): `router = APIRouter(prefix="/api", tags=["echo"])`; `@router.get("/echo", response_model=EchoResponse)` on `def get_echo(msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]) -> EchoResponse`, returning `EchoResponse(echo=msg)`. The parameter has no default, so FastAPI marks it required and a missing `msg` yields 422 (criterion 2); `max_length` yields 422 above 200 characters (criterion 3). No `len()` check, no try/except, no custom exception handler in the handler.
- Registration (`backend/app/main.py`): import `from app.routers.echo import router as echo_router` and add `app.include_router(echo_router)` after the existing three; update the module docstring's list of features that register routers to name TEST-06. Nothing else in `create_app()` or `lifespan` changes (CORS already allows `GET`).
- Service layer: none. The handler has no business logic to delegate; a pass-through service would be the hasty abstraction `coding_standards.md` Section 1 warns against and the feature text asks for "one router, one schema, its tests".
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg`, string, required, maximum 200 characters. No body.
- Response:
  - 200, `EchoResponse`: `{"echo": "hello"}` for `?msg=hello`.
  - 422, FastAPI's standard validation body, when `msg` is missing, e.g. `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}`.
  - 422, FastAPI's standard validation body, when `msg` exceeds 200 characters, e.g. `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "input": "...", "ctx": {"max_length": 200}}]}`.
  - Tests assert the 422 status, `detail[0].loc == ["query", "msg"]` and `detail[0].type` (`missing` or `string_too_long`), never the human-readable `msg` text, which is FastAPI's and may change between versions.

## Technology Selection
- Echo router (`routers/echo.py`): chose FastAPI's `APIRouter`, already installed and used by every existing router, over any other option; no stdlib call or native feature serves an HTTP route.
- Response schema (`schemas/echo.py`, `EchoResponse`): chose a Pydantic `BaseModel` (installed with FastAPI) over a bare dict in the router, because criterion 4 requires a schema.
- 200-character bound: chose FastAPI's declarative `Query(max_length=...)` (installed) over a hand-rolled `len(msg) > 200` check in the handler, because criterion 3 forbids the hand-rolled check and the declarative bound also produces the standard 422 and appears in the OpenAPI schema.
- Missing-parameter rejection: chose FastAPI's built-in required-parameter validation (a parameter with no default) over custom handling, because it already yields the standard 422 criterion 2 asks for.
- Dependencies: no new dependency; `fastapi`, `pydantic`, `pytest` and `httpx` (for `TestClient`) are already in `backend/pyproject.toml`.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and the `EchoResponse` Pydantic model
- [B] backend/app/routers/echo.py: `GET /api/echo` router with the declarative `Query(max_length=ECHO_MSG_MAX_LENGTH)` bound
- [B] backend/tests/unit/test_echo_unit.py: unit tests for the handler, the schema and the declared OpenAPI contract
- [B] backend/tests/integration/test_echo_integration.py: full HTTP request/response tests for all four criteria
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus edge cases
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register `echo_router`; docstring names TEST-06 among the router-registering features
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`, matching the existing version and health registration tests

No dependency is added or changed, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) changes. `README.md` and `docs/DEVELOPMENT.md` need no edit: neither lists individual endpoints, and the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests (`backend/tests/unit/test_echo_unit.py`, plus one test in `test_main_unit.py`), no database, no HTTP server:
  - `test_get_echo_returns_echo_response_with_given_text`: calling `get_echo(msg="hello")` directly returns an `EchoResponse` instance whose `model_dump()` equals `{"echo": "hello"}` (happy path, criterion 4).
  - `test_get_echo_returns_empty_echo_for_empty_msg`: `get_echo(msg="")` returns `EchoResponse(echo="")` (edge case).
  - `test_echo_msg_max_length_is_200`: `ECHO_MSG_MAX_LENGTH == 200`.
  - `test_openapi_declares_msg_as_required_with_max_length_200`: in `create_app().openapi()["paths"]["/api/echo"]["get"]["parameters"]`, the `msg` query parameter has `required: true` and `schema.maxLength == 200`, which proves the bound is declared in the schema rather than checked in the handler (criterion 3) and that the parameter is required (criterion 2).
  - `test_openapi_declares_echo_response_as_200_body`: the `200` response schema of `GET /api/echo` references `EchoResponse` (criterion 4).
  - `test_echo_response_rejects_missing_echo_field`: `EchoResponse()` raises `pydantic.ValidationError` (error case).
  - `test_create_app_registers_echo_route` in `test_main_unit.py`: `/api/echo` is among the app's custom paths.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests (`backend/tests/integration/test_echo_integration.py`), through the shared session-scoped `client` fixture in `backend/tests/conftest.py` (no database fixture needed; the endpoint touches none):
  - `test_get_echo_with_msg_hello_returns_200_and_echo_body`: `?msg=hello` gives 200 and exactly `{"echo": "hello"}` (criterion 1).
  - `test_get_echo_decodes_url_encoded_msg`: `params={"msg": "a&b=c d"}` gives 200 and `{"echo": "a&b=c d"}`, proving query-string handling end to end (the feature's "What"; no whitespace at the edges, per the assumption above).
  - `test_get_echo_without_msg_returns_422`: no `msg` gives 422 with `detail[0].loc == ["query", "msg"]` and `detail[0].type == "missing"` (criterion 2).
  - `test_get_echo_with_201_char_msg_returns_422`: `"a" * 201` gives 422 with `detail[0].type == "string_too_long"` and `detail[0].loc == ["query", "msg"]` (criterion 3).
  - `test_get_echo_with_200_char_msg_returns_200`: `"a" * 200` gives 200 and echoes it back (criterion 3 boundary).
  - `test_get_echo_with_empty_msg_returns_200_and_empty_echo`: `?msg=` gives 200 and `{"echo": ""}` (edge case, per the assumption above).
  - `test_post_echo_returns_405_method_not_allowed`: only GET is routed.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py
- E2E tests: none for this feature, though the toggle is ENABLED. No criterion involves navigation or interaction through the UI: no frontend consumes `/api/echo`, and an E2E spec calling the API directly is a router integration test (`testing_standards.md` Section 5). Every criterion is covered at integration or unit level, per the table below.
  - Directory: e2e/tests/ (no file added)
  - File: none (the naming would be `TEST-06_echo_endpoint.spec.ts`)
- UAT scenarios: `e2e/uat/scenarios/TEST-06_echo_endpoint.feature`, one scenario per criterion plus the 200-character boundary and the empty-`msg` edge case, written against the HTTP response (Given the backend is running, When a client requests ..., Then the response status is ... and the body is ...). The manual script is expanded from `## Manual verification plan` below.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | Verifying it needs no navigation or interaction: no UI consumes the endpoint; it is a router request/response behaviour |
| 2 | `GET /api/echo` with no `msg` returns 422 | Integration (plus Unit: OpenAPI marks `msg` required) | Verifying it needs no navigation or interaction: it is FastAPI's parameter validation on a router |
| 3 | `msg` over 200 characters returns 422, bound stated in the schema | Integration (201 and 200 characters) plus Unit (OpenAPI declares `maxLength: 200`) | Verifying it needs no navigation or interaction: it is a declared validation rule; the "not hand-rolled" half is a property of the declaration, checked at unit level |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit (handler returns `EchoResponse`; OpenAPI 200 body references `EchoResponse`) | Verifying it needs no navigation or interaction: it is a code-structure property of the router and schema |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `?msg=hello` gives 200 `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `GET /api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | no `msg` gives 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests `GET /api/echo` with no query string, Then the status is 422 and the body's `detail` names the `msg` query parameter as missing |
| 3 | `msg` over 200 characters gives 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When a client requests `GET /api/echo` with a 201-character `msg`, Then the status is 422; And with a 200-character `msg` the status is 200 |
| 4 | body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When a reader opens `/openapi.json`, Then the 200 response of `GET /api/echo` references the `EchoResponse` schema |

## Manual verification plan
None of the four criteria is verifiable through the UI: no frontend screen consumes `GET /api/echo`. The observable check is the HTTP response itself, read with `curl` against the compose stack (backend published on host port `8010` by `docker-compose.yml`), plus the OpenAPI document for criterion 4.

Prerequisites (all criteria): Docker running; repository on branch `feature/TEST-06-echo-endpoint`; from the repository root run `docker compose up -d --build`, then `docker compose ps` until `backend` reports running; a terminal with `curl`.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
1. In a terminal run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first response line reads `HTTP/1.1 200 OK`.
2. Read the response body → exactly `{"echo":"hello"}`.
3. Run `curl -s "http://localhost:8010/api/echo?msg=a%26b%3Dc%20d"` → the body is `{"echo":"a&b=c d"}`, showing the encoded query string was decoded end to end.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
1. Run `curl -i "http://localhost:8010/api/echo"` → the first response line reads `HTTP/1.1 422 Unprocessable Entity` (never 500, never 200).
2. Read the body → a JSON object with a `detail` array whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422, bound stated in the schema
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` (a `msg` of 201 letters `a`) → the first line reads `HTTP/1.1 422 Unprocessable Entity` and the body's `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
2. Run the same command with `"a"*200` instead of `"a"*201` (200 letters) → `HTTP/1.1 200 OK` with the 200 letters echoed back in `echo`.
3. Open `backend/app/routers/echo.py` → the `msg` parameter is declared with `Query(max_length=ECHO_MSG_MAX_LENGTH)`, the constant is defined in `backend/app/schemas/echo.py` as `200`, and the handler body contains no length check.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
1. Open `http://localhost:8010/docs` in a browser and expand `GET /api/echo` → the 200 response shows the `EchoResponse` schema with one string field `echo`, and the `msg` parameter is marked required with max length 200.
2. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with `echo: str`; `backend/app/routers/echo.py` declares `response_model=EchoResponse` and returns `EchoResponse(echo=msg)`, not a dict.
3. From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` → the run ends with `0 failed`.
