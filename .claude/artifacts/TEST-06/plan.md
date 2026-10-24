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
- [ ] 2. `GET /api/echo` with no `msg` returns 422, the framework's standard validation response, rather than a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns 422. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Merged since: replan: 2 entries, planned against main as it now stands. Verbatim check line: `[merged-since] base=96c40ac ref=origin/main@f293b27 commits=2 overlap=2 verdict=replan`. Commits on `origin/main` since 96c40ac: `f293b27 feat(FEAT-1): Server time endpoint (#318)` and `ef356f9 chore: switch Autonomy to autonomous (release run 0.3.443, Arm E) (#319)`. The branch now holds them through merge commit `b402f98`; both overlapping paths were re-read in the worktree at that head, which matches `origin/main@f293b27` for these files.
- Merged since the last plan: backend/app/main.py (FEAT-1 added `from app.routers.server_time import router as server_time_router` between the `notes` and `version` imports, `app.include_router(server_time_router)` as the fourth and last registration after `health_router`, and the docstring ending "and TEST-02 the health router, and FEAT-1 the server time router.") → re-scoped to: the import `from app.routers.echo import router as echo_router` goes in alphabetical order, as the first of the `app.routers` imports (before `health`), since the existing block is sorted by module name; `app.include_router(echo_router)` goes after `app.include_router(server_time_router)`, as the fifth and last registration (the previous plan said "after the existing three", which is now four); the docstring's last sentence gets ", and TEST-06 the echo router" before its full stop. No echo work landed on main, so nothing is dropped.
- Merged since the last plan: backend/tests/unit/test_main_unit.py (FEAT-1 added `test_create_app_registers_server_time_route`, asserting `/api/time` is in the custom paths, placed after the health case and before `test_create_app_returns_independent_instances`) → re-scoped to: `test_create_app_registers_echo_route` mirrors the server time case (same `_collect_route_paths(app.routes) - BUILT_IN_ROUTE_PATHS` shape, asserting `"/api/echo" in custom_paths`, docstring "Edge case: the app registers the TEST-06 echo route.") and goes right after `test_create_app_registers_server_time_route`, before the independent-instances case. The helper and `BUILT_IN_ROUTE_PATHS` are reused unchanged. Nothing is dropped.
- Merged since, the commit `ef356f9` (Autonomy switch): it changes no file this plan lists, so it changes nothing here.
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: precondition still holds after the merge of main. `backend/app/routers/` and `backend/app/schemas/` on the branch at `b402f98` hold no echo router or schema, and a search of `backend/app` and `backend/tests` for `echo` finds only an unrelated word in `test_notes_integration.py`. No criterion changes.
- Comment (tracker, 2026-09-03, later): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. ..." → Addressed by: criterion 3 kept as written (422). The plan uses the comment's mechanism: the bound is declared with `Query(max_length=ECHO_MSG_MAX_LENGTH)`, and the constant lives in `backend/app/schemas/echo.py` next to the response schema. That way the limit is declared once in the schema module, appears in the OpenAPI schema, and FastAPI's validation enforces it with no `len()` check in the handler. Its remarks about PR #23 and the code "already on feature/TEST-06-echo-endpoint" describe measured run 2's branch, which the reset removed. Not acted on, because no such code exists on this branch.
- Comment (tracker, 2026-09-03, earlier): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on: the newer comment above explicitly retracts it as a measured-run probe. The newest comment wins, so criterion 3's 422 stands, and the plan has no custom 400 error body or exception handler.
- Comment (tracker, framework and operator notices): framework-posted "mayker-dev: plan PR opened for TEST-06" link comments from earlier runs and other operator notes → Not acted on: they are notices and carry no requirement.

## Plan Overview
One read-only backend endpoint, `GET /api/echo`, built in the same shape as the existing `version`, `health` and `server_time` routers: a router module under `backend/app/routers/`, a Pydantic response schema under `backend/app/schemas/`, and one `include_router` line in `backend/app/main.py`. The required `msg` query parameter is declared with `Query(max_length=200)`, using a constant from the schema module, so FastAPI itself returns its standard 422 validation body when the value is missing or too long. There is no frontend, no database, and no service or repository layer. The handler only returns its input, so there is no business logic to put in a service, and nothing is persisted. Tests: one integration test module that runs the full HTTP cycle, and one route-registration case added to the existing app-factory unit test.

Assumptions (recorded, not blocking):
1. An empty value (`GET /api/echo?msg=`) counts as a present `msg` and returns 200 with `{"echo": ""}`. The criteria set no minimum length, so none is added (`user_story_alignment.md` Section 3).
2. "Longer than 200 characters" means a length of 201 or more returns 422, and exactly 200 returns 200. The integration tests pin both sides of the boundary.
3. The text is echoed unchanged, with no trimming or other normalisation. Whitespace handling belongs to the later items TEST-11 and BUG-05, which depend on this one.
4. No service module: the router builds the response from the validated parameter. This keeps the feature as small as `CLAUDE.md` Architecture Notes ask. The router still holds no business logic, only the construction of the response schema.

## Frontend Plan
No frontend changes required.
- Design reference notes: no values recorded: Design Reference mode is NONE and this item has no UI.

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}` returns the given text in an `EchoResponse` body. Router: `APIRouter(prefix="/api", tags=["echo"])`. Handler: `get_echo(msg: Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]) -> EchoResponse`, decorated with `response_model=EchoResponse`. `msg` has no default, so FastAPI treats it as required: it returns 422 (`type: missing`) when `msg` is absent and 422 (`type: string_too_long`) when it is over 200 characters.
- Schema: `backend/app/schemas/echo.py` defines `ECHO_MSG_MAX_LENGTH = 200` and `class EchoResponse(BaseModel): echo: str`.
- Registration in `backend/app/main.py`, against main as it now stands:
  - Add `from app.routers.echo import router as echo_router` as the first `app.routers` import, before `health`, keeping the block's alphabetical order.
  - Add `app.include_router(echo_router)` after `app.include_router(server_time_router)`, as the last registration.
  - Extend the module docstring's last sentence from "... and FEAT-1 the server time router." to "... and FEAT-1 the server time router, and TEST-06 the echo router."
  - Nothing else in the factory changes (CORS already allows `GET`).
- Service layer: none (see Plan Overview assumption 4).
- Repository layer: none, no data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg`, string, required, maximum length 200 characters. No body.
- Response: 200 with `EchoResponse`:

```json
{"echo": "hello"}
```

  Errors (FastAPI's standard validation response, no custom handler):
  - `msg` missing: 422 with `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", ...}]}`
  - `msg` longer than 200 characters: 422 with `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "ctx": {"max_length": 200}, ...}]}`

## Technology Selection
- `backend/app/routers/echo.py` (router): chose FastAPI's `APIRouter`, which is already installed and used by every existing router, over any new routing dependency. No stdlib call or native feature handles HTTP routing here.
- Length bound and required-parameter validation: chose FastAPI's declarative `Query(max_length=...)` with a required parameter (already installed) over a hand-rolled `len()` check and `HTTPException` in the handler. Criterion 3 requires the bound to be declared rather than coded, and FastAPI's built-in validation produces criterion 2's standard 422 with no extra code.
- `backend/app/schemas/echo.py` (response schema): chose Pydantic's `BaseModel`, which is already installed and used by every existing schema, over a bare dict, which criterion 4 forbids.
- Tests: chose FastAPI's `TestClient` and the existing session-scoped `client` fixture in `backend/tests/conftest.py` over any new test dependency.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200` and the `EchoResponse` Pydantic model (`echo: str`)
- [B] backend/app/routers/echo.py: `GET /api/echo` router with the required, length-bounded `msg` query parameter, returning `EchoResponse`
- [B] backend/tests/integration/test_echo_integration.py: full HTTP-cycle tests for criteria 1 to 4 (200 echo, 422 missing, 422 at 201 characters, 200 at exactly 200, response schema in OpenAPI)
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-06/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)

### Modified files
- [B] backend/app/main.py: import `echo_router` first among the `app.routers` imports, register it after `server_time_router` as the last `include_router`, and extend the docstring's last sentence with ", and TEST-06 the echo router"
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` right after FEAT-1's `test_create_app_registers_server_time_route`, mirroring it and asserting `/api/echo`

No dependency changes, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints. No E2E spec file, because no criterion is assigned to E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: one case added to the app-factory test, asserting `/api/echo` is among the app's custom routes, which is the established pattern for each registered router (FEAT-1's server time case is the latest). No new unit module: the feature adds no service-layer or utility logic for a unit test to isolate (`testing_standards.md` Section 6's first question answers no). The validation behaviour is FastAPI's, so it is covered through the HTTP cycle instead.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (modifies the existing `test_main_unit.py`)
- Integration tests: router tests through the real HTTP request/response cycle, using the session-scoped `client` fixture. No database is needed, so no database fixture. Cases, named per `testing_standards.md` Section 3:
  - `test_get_echo_returns_200_with_given_message` (criterion 1: exact body `{"echo": "hello"}`)
  - `test_get_echo_without_msg_returns_422` (criterion 2: status 422, `detail[0].type == "missing"`, `detail[0].loc == ["query", "msg"]`)
  - `test_get_echo_with_msg_over_200_characters_returns_422` (criterion 3: 201 characters, status 422, `detail[0].type == "string_too_long"`)
  - `test_get_echo_with_msg_of_exactly_200_characters_returns_200` (criterion 3 boundary edge case)
  - `test_get_echo_response_schema_is_echo_response` (criterion 4: `/openapi.json` shows that the 200 response of `GET /api/echo` references `#/components/schemas/EchoResponse`, and that the `msg` parameter carries `maxLength: 200`, which proves the bound is declared rather than hand-checked)
  - Directory: backend/tests/integration/
  - File: test_echo_integration.py
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI (no frontend consumes this endpoint), and an E2E test that calls the API directly is a router integration test (`testing_standards.md` Section 5).
  - Directory: e2e/tests/
  - File: none
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a message of exactly 200 characters is accepted), verified with HTTP requests against the running backend.
  - Directory: e2e/uat/scenarios/ (scenarios), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | Verifying it needs no navigation or interaction: no UI calls the endpoint, it is a router response checked through the HTTP cycle |
| 2 | No `msg` returns 422, the standard validation response | Integration | Verifying it needs no navigation or interaction: it is a request-validation rule of the router |
| 3 | `msg` over 200 characters returns 422, bound declared in the schema | Integration | Verifying it needs no navigation or interaction: it is a request-validation rule, and the declared bound is read from the OpenAPI schema |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Integration | Verifying it needs no navigation or interaction: it is a property of the response contract, read from `/openapi.json` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | Missing `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/echo` with no query string, Then the status is 422 and the body's `detail` names the missing query parameter `msg` |
| 3 | Over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET `/api/echo` with a `msg` of 201 characters, Then the status is 422 and the body's `detail` reports the 200-character limit |
| 4 | Pydantic response schema | covered at Integration, see Criterion coverage | Given the backend is running, When a client reads `/openapi.json`, Then the 200 response of GET `/api/echo` references the `EchoResponse` schema |

## Manual verification plan
No criterion can be verified through the application's own UI, because no frontend screen calls `GET /api/echo`. The observable check is the HTTP response itself, read with `curl` in a terminal or in a browser pointed at the backend, plus FastAPI's interactive docs page at `http://localhost:8010/docs`.

Shared prerequisites: Docker running; repository on branch `feature/TEST-06-echo-endpoint`; nothing else bound to host port 8010. From the repository root run `docker compose up -d --build`, then run `docker compose ps` until the `backend` service is running (port 8010 comes from `docker-compose.yml`).

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
Prerequisites: the shared prerequisites above.
1. In a terminal run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK`.
2. Read the body of that response → exactly `{"echo":"hello"}`.
3. Open `http://localhost:8010/api/echo?msg=hello` in a browser → the page shows the JSON `{"echo":"hello"}`.

### Criterion 2: `GET /api/echo` with no `msg` returns 422, the standard validation response
Prerequisites: the shared prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200).
2. Read the body → a JSON object with a `detail` list whose first entry has `"type":"missing"`, `"loc":["query","msg"]` and `"msg":"Field required"`.

### Criterion 3: `msg` longer than 200 characters returns 422, bound declared in the schema
Prerequisites: the shared prerequisites above, and `python3` on the host to build the long strings.
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` (a message of 201 letters `a`) → the first line reads `HTTP/1.1 422 Unprocessable Entity`, and the body's `detail[0]` has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"` (exactly 200 letters `a`) → `HTTP/1.1 200 OK`, and the body's `echo` value is the same 200-letter string.
3. Open `http://localhost:8010/docs` and expand `GET /api/echo` → the `msg` parameter is shown as required, with a maximum length of 200.
4. Open `backend/app/routers/echo.py` → the handler contains no `len(` check and raises no exception of its own; the limit appears only as `Query(max_length=ECHO_MSG_MAX_LENGTH)`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: the shared prerequisites above.
1. Open `http://localhost:8010/docs`, expand `GET /api/echo` and look at the 200 response → its schema is named `EchoResponse`, with one string field `echo`.
2. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with `echo: str`, and `backend/app/routers/echo.py` returns an `EchoResponse`, not a dict.

### All criteria: automated tests
Prerequisites: `uv` installed on the host.
1. From the repository root run `uv run --directory backend pytest -q tests/integration/test_echo_integration.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
