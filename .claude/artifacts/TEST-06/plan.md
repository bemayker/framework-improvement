# Implementation Plan, TEST-06: Echo endpoint

## Feature
> A small backend feature for the assisted lifecycle (Arm C of measured run 2). Deliberately narrow: one router, one schema, its tests.
>
> **What**
>
> `GET /api/echo?msg={text}` returns the text it was given, so a caller can prove the API is reachable and that query-string handling works end to end.
>
> **Acceptance criteria**
>
> 1. GET /api/echo?msg=hello returns **200** with body {"echo": "hello"}.
> 2. `GET /api/echo` with no `msg` returns **422**, the framework's standard validation response, rather than a 500 or an empty 200.
> 3. `msg` longer than 200 characters returns **422**. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
> 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.
>
> **Notes**
>
> Follows the shape TEST-02 established: a router under `backend/app/routers/`, registered in `backend/app/main.py`, with unit and integration tests. It touches `main.py`'s router registration, so it must not run concurrently with another item that does the same.

## Acceptance Criteria
- [ ] 1. GET /api/echo?msg=hello returns 200 with body {"echo": "hello"}.
- [ ] 2. GET /api/echo with no msg returns 422, the framework's standard validation response, rather than a 500 or an empty 200.
- [ ] 3. msg longer than 200 characters returns 422. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in backend/app/schemas/, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). This item was built and merged in measured run 2 (PR #23, squash 8794a99 on main). It is the Arm C item again because playbook Section 4 step 3 requires the same item both times. Code revert pending: the operator reverts 8794a99 (with ffbfc12 and a9695cc) on the sandbox main in one chore/* PR before the run. Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: the precondition holds. The dispatching session verified that current `origin/main` (c35f17e) holds no echo router, echo schema or echo test, and this planner confirmed it: `backend/app/routers/` holds only health, notes and version, `backend/app/schemas/` only health, note and version, and `backend/app/main.py` registers only those three routers. The plan is written against main as it now stands.
- Comment (tracker, 2026-09-03): "Retracting the previous comment. It was a measured-run probe, not a real requirement. The 400-instead-of-422 comment above was posted deliberately on 2026-09-03 to test whether a re-plan absorbs a tracker comment that contradicts an accepted criterion (measured run 2, Arm D, bar MDF-008). It is withdrawn. Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. The code on feature/TEST-06-echo-endpoint already satisfies it and needs no change. [...] No action needed on this item. PR #23 remains correct against the description." → Addressed by: criterion 3 is planned at 422, with the bound declared as `Query(max_length=MAX_ECHO_MSG_LENGTH)` on the `msg` parameter and the constant defined in `backend/app/schemas/echo.py`. Its last two sentences refer to the measured-run-2 branch, which no longer exists on main; they need no action here.
- Comment (tracker, 2026-09-03): "A msg longer than 200 characters should return 400 with a [JSON body carrying an error key, elided here because the plan writer refuses a brace beside a quote], not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer comment above withdraws it explicitly. Criterion 3 stays at 422 with FastAPI's standard validation body.
- Comment (tracker, 8 comments): "mayker-dev: plan PR opened for TEST-06" link comments for PRs 143, 88, 62, 55, 51, 49, 35 and 23, from earlier measured runs → Not acted on because they are framework link records, not requirements.
- Merged since the last plan: n/a (fresh plan, branched from current main).
- Assumption (no comment covers it): an empty `msg` (`/api/echo?msg=`) is a present value of length 0 and echoes an empty string with 200. No criterion asks for a minimum length, so none is added (`user_story_alignment.md` Section 3).

## Plan Overview
Backend only. One new router, `backend/app/routers/echo.py`, exposing `GET /api/echo` with a required `msg` query parameter whose 200-character bound is declared on the parameter (`Query(max_length=...)`), so FastAPI's own validation returns 422 for a missing or oversized value. One new Pydantic response schema, `backend/app/schemas/echo.py` (`EchoResponse` with one `echo: str` field, plus the `MAX_ECHO_MSG_LENGTH = 200` constant the router declares). The router is registered in `backend/app/main.py` beside the existing three. No service layer: echoing the input has no business logic to move out of the router (`coding_standards.md` Section 2.2 keeps business logic out of the router; there is none here), and no repository or database access. Tests: integration tests through the real HTTP cycle for criteria 1 to 3, unit tests for the schema and for the OpenAPI declaration of the bound (criteria 3 and 4), and one registration assertion in the existing app-factory unit test. No frontend, no external API, no new dependency.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; this item renders nothing).

## Backend Plan
- Endpoints: `GET /api/echo` (router prefix `/api`, path `/echo`, tag `echo`, `response_model=EchoResponse`). Handler `get_echo(msg: str = Query(max_length=MAX_ECHO_MSG_LENGTH)) -> EchoResponse` returns `EchoResponse(echo=msg)`. `msg` has no default, so FastAPI marks it required and answers 422 when it is absent (criterion 2). The bound is a parameter declaration enforced by FastAPI and Pydantic before the handler runs; the handler contains no length check (criterion 3).
- Schemas: `backend/app/schemas/echo.py` defines `MAX_ECHO_MSG_LENGTH = 200` and `class EchoResponse(BaseModel): echo: str` (criterion 4), in the shape of `backend/app/schemas/version.py`.
- Registration: `backend/app/main.py` imports `router as echo_router` from `app.routers.echo` and calls `app.include_router(echo_router)` after the health router; the module docstring gains one clause naming TEST-06. CORS middleware is untouched (`allow_methods` already includes GET).
- Service layer: none. Echoing a validated value is not business logic, so a pass-through `echo_service` would be an abstraction with nothing in it (`coding_standards.md` Section 1, KISS).
- Repository layer: none. No database access.
- Migrations: none.
- Error responses: FastAPI's default `RequestValidationError` handler, status 422, body with a `detail` list. Missing `msg` yields `detail[0].type` = `missing`, `loc` = `query`, `msg`; an oversized `msg` yields `detail[0].type` = `string_too_long` with `ctx.max_length` = 200. No custom exception handler is added.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo?msg=<text>` (backend at http://localhost:8010 under `docker compose`)
- Request: query parameter `msg`, string, required, max length 200 characters. No body, no headers beyond the defaults.
- Response 200: `EchoResponse`, one field `echo` (string) holding `msg` exactly as received after URL decoding. Example for `?msg=hello`:
```json
{"echo": "hello"}
```
- Response 422 (missing msg), FastAPI standard validation body:
```json
{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}
```
- Response 422 (msg of 201 characters), FastAPI standard validation body, input abbreviated here:
```json
{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "input": "aaa...a", "ctx": {"max_length": 200}}]}
```

## Technology Selection
- `backend/app/schemas/echo.py` (`EchoResponse`): chose a Pydantic `BaseModel`, already installed through FastAPI, over a bare dict or a stdlib `dataclass`, because criterion 4 names a Pydantic schema and FastAPI serializes and documents a `response_model` from it.
- The 200-character bound: chose FastAPI's `Query(max_length=MAX_ECHO_MSG_LENGTH)` declaration (installed) over a hand-rolled `len()` check in the handler, because criterion 3 requires the bound to be declared rather than checked, and the declaration yields FastAPI's standard 422 body that criterion 2 also relies on.
- `backend/app/routers/echo.py`: chose FastAPI's `APIRouter` (installed), the shape TEST-02 and TEST-05 established; no stdlib call or native platform feature serves an HTTP route, so nothing substitutes it.
- Service module: none is created; returning the schema from the router was chosen over a pass-through `echo_service`, because there is no business logic to hold.
- Dependencies: none added. FastAPI, Pydantic and pytest are already installed (`backend/pyproject.toml`).

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `MAX_ECHO_MSG_LENGTH = 200` and `EchoResponse` with field `echo: str` (criteria 3 and 4)
- [B] backend/app/routers/echo.py: `GET /api/echo` with `msg: str = Query(max_length=MAX_ECHO_MSG_LENGTH)`, `response_model=EchoResponse` (criteria 1 to 4)
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoResponse` and for the OpenAPI declaration of `msg` (required, maxLength 200)
- [B] backend/tests/integration/test_echo_integration.py: HTTP-cycle tests for 200, missing msg 422, 201-character msg 422, 200-character boundary 200, URL-decoded msg
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus the 200-character boundary edge case (UAT Generation ENABLED)
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/main.py: import the echo router, `app.include_router(echo_router)`, one docstring clause naming TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is among the custom routes

No lockfile changes: the feature adds no dependency, so `backend/uv.lock` and `frontend/package-lock.json` are untouched.
No documentation edit: `README.md` and `docs/DEVELOPMENT.md` list no individual endpoints and this feature changes no project structure, run configuration, dependency or test infrastructure, so build-feature Section 15 has nothing to update.
No E2E spec file: no criterion is assigned to the E2E tier (see Criterion coverage), so no Testing Strategy E2E entry exists.

## Testing Strategy
- Unit tests: the schema and the declared bound, no HTTP and no database.
  - `test_echo_response_serializes_message_under_echo_key` (happy path: `EchoResponse(echo="hello").model_dump()` equals the dict with key `echo` and value `hello`)
  - `test_echo_response_without_echo_raises_validation_error` (error case: `EchoResponse()` raises `pydantic.ValidationError`)
  - `test_openapi_declares_msg_as_required_query_with_max_length_200` (edge case, criterion 3 second sentence: in `create_app().openapi()`, the `/api/echo` GET parameter named `msg` is `in: query`, `required: true`, and its schema `maxLength` equals `MAX_ECHO_MSG_LENGTH`, which equals 200). This is what proves the bound is declared, not hand-checked.
  - `test_create_app_registers_echo_route` added to the existing `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_echo_unit.py`
- Integration tests: the router through the real HTTP request/response cycle with the shared session-scoped `client` fixture from `backend/tests/conftest.py`. The endpoint touches no database, so no DB fixture is requested.
  - `test_get_echo_returns_200_with_the_given_message` (criterion 1: status 200, JSON equals key `echo` with value `hello`)
  - `test_get_echo_decodes_a_url_encoded_message` (edge case for "query-string handling end to end": `?msg=hello%20world` echoes `hello world`)
  - `test_get_echo_without_msg_returns_422` (criterion 2: status 422, `detail[0].type` is `missing`, `detail[0].loc` is `query`, `msg`)
  - `test_get_echo_with_201_character_msg_returns_422` (criterion 3: status 422, `detail[0].type` is `string_too_long`)
  - `test_get_echo_with_exactly_200_character_msg_returns_200` (criterion 3 boundary: the bound is inclusive)
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py, here `test_echo_integration.py`
- E2E tests: no criterion is assigned to E2E. No UI calls `/api/echo` and the feature adds no frontend, so no criterion needs navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question, asked per criterion). No spec file is written.
  - Directory: e2e/tests/ (unused by this item)
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case, phrased as HTTP requests and responses because there is no UI; the manual script expands the Manual verification plan below.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/echo?msg=hello returns 200 with the echo body | Integration | No UI consumes the endpoint: it is a router request/response behaviour, verified fully through the HTTP cycle |
| 2 | GET /api/echo with no msg returns 422 | Integration | A router validation response with no navigation or interaction; the HTTP cycle is where FastAPI produces it |
| 3 | msg over 200 characters returns 422, bound declared in the schema | Integration, plus Unit for the declaration | The 422 is a router validation response; the "declared, not hand-checked" half is a property of the OpenAPI declaration, read at unit level |
| 4 | Response body defined by a Pydantic schema in backend/app/schemas/ | Unit | A structural property of the schema module, checked without HTTP or a browser; the integration tests also exercise it as the response model |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/echo?msg=hello returns 200 with the echo body | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/echo?msg=hello, Then the status is 200 and the JSON field echo is hello |
| 2 | GET /api/echo with no msg returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/echo with no query string, Then the status is 422 and detail names the missing query parameter msg |
| 3 | msg over 200 characters returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request GET /api/echo with msg set to 201 letters a, Then the status is 422 with type string_too_long; edge: with exactly 200 letters a the status is 200 |
| 4 | Response body defined by a Pydantic schema | covered at Unit, see Criterion coverage | Given the backend is running, When I read the OpenAPI document, Then GET /api/echo responds with the EchoResponse schema carrying one string property echo |

## Manual verification plan
No screen of the task-notes app calls this endpoint, so every criterion is verified against the HTTP response itself: in a browser address bar, in FastAPI's interactive docs at http://localhost:8010/docs, or with curl. All four blocks share these prerequisites.

Prerequisites: on branch `feature/TEST-06-echo-endpoint` (or `main` once merged), from the repository root run `docker compose up -d --build`, then `docker compose ps` until `backend` reports running. The backend answers on http://localhost:8010 (README.md, docker-compose.yml). A terminal with `curl` and `python3`.

### Criterion 1: GET /api/echo?msg=hello returns 200 with the echo body
1. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK` and `content-type: application/json` is among the headers.
2. Read the response body of step 1 → it is exactly {"echo":"hello"}, one key and nothing else.
3. Open http://localhost:8010/api/echo?msg=hello%20world in a browser → the page shows {"echo":"hello world"}, the space decoded from %20.

### Criterion 2: GET /api/echo with no msg returns 422
1. Run `curl -i "http://localhost:8010/api/echo"` → the first line reads `HTTP/1.1 422 Unprocessable Entity`, not `500 Internal Server Error` and not `200 OK`.
2. Read the body of step 1 → a JSON object with one key `detail`, a list of one entry whose `type` is `missing`, whose `loc` is the list `query`, `msg`, and whose `msg` is `Field required`.
3. Open http://localhost:8010/docs, expand `GET /api/echo`, click `Try it out`, leave the `msg` field empty and click `Execute` → the docs page refuses to send and marks `msg` as a required field, which shows the parameter is declared required.

### Criterion 3: msg longer than 200 characters returns 422
1. Run `python3 -c "print('a' * 201)"` → a single line of 201 letters `a`. Copy it.
2. Run `curl -i "http://localhost:8010/api/echo?msg=<the 201 letters from step 1>"` → the first line reads `HTTP/1.1 422 Unprocessable Entity`.
3. Read the body of step 2 → `detail` holds one entry whose `type` is `string_too_long`, whose `msg` is `String should have at most 200 characters`, and whose `ctx.max_length` is `200`.
4. Run `python3 -c "print('a' * 200)"`, copy the 200 letters, and run `curl -i "http://localhost:8010/api/echo?msg=<the 200 letters>"` → `HTTP/1.1 200 OK`, and the `echo` field holds the same 200 letters (the bound is inclusive).
5. Open `backend/app/routers/echo.py` → `msg` is declared as `Query(max_length=MAX_ECHO_MSG_LENGTH)` and the handler body contains no `len(` call; `backend/app/schemas/echo.py` defines `MAX_ECHO_MSG_LENGTH = 200`.

### Criterion 4: the response body is defined by a Pydantic schema in backend/app/schemas/
This is a code-structure property with no UI behaviour; the observable checks are the OpenAPI document and the module.
1. Open http://localhost:8010/docs, expand `GET /api/echo`, look under `Responses` for code `200` → the schema is named `EchoResponse` and has one required string property `echo`.
2. Open http://localhost:8010/openapi.json and find `components` → `schemas` → `EchoResponse` → it lists `echo` under `properties` with type `string`, and under `required`.
3. Open `backend/app/schemas/echo.py` → `class EchoResponse(BaseModel)` with field `echo: str`; `backend/app/routers/echo.py` declares `response_model=EchoResponse` and returns an `EchoResponse`, never a dict literal.
4. Run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
