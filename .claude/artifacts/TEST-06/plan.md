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

Source: ClickUp task 123k99ctgcf (tracker item, `hybrid` work item source). Type: feature. Depends on: TEST-01 (done, the scaffold). Priority: none. Labels: none.

## Acceptance Criteria

- [ ] 1. `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`.
- [ ] 2. `GET /api/echo` with no `msg` returns 422, the framework's standard validation response, rather than a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns 422. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback

Five tracker comments exist on this item, read newest first. None of them changes an acceptance criterion: the one that did was retracted by a newer comment, and the description therefore stands as written.

- Comment (tracker, 2026-09-11, framework-generated): "mayker-dev: plan PR opened for TEST-06, https://github.com/bemayker/framework-improvement/pull/35 (branch feature/TEST-06-echo-endpoint). Review the plan there; when approved, move this task to 'on hold' (Ready for Build)." → Not acted on because it is a framework link comment and carries no requirement. PR 35 was merged and its code reverted by the run-4 sandbox reset, so it names nothing that still exists.
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Precondition verified and satisfied, so nothing further to act on: the dispatching session confirmed that `origin/main` at plan time holds no echo router, schema or test (`git grep -i echo origin/main -- backend/ e2e/` returns only an unrelated docstring in `test_notes_integration.py`), and this branch was cut from that main. This plan therefore plans the feature from zero rather than against an already-built one.
- Comment (tracker, 2026-09-03): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. ... No action needed on this item." → Acted on as the newest word on criterion 3: this plan keeps 422 and declares the bound on the query parameter via `Query(max_length=200)`, exactly as this comment describes. It also settles the older 400 comment below.
- Comment (tracker, 2026-09-03): "A msg longer than 200 characters should return 400 with a {\"error\": \"...\"} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because it was explicitly retracted by the newer comment above, which is the later correction and wins under the newest-first rule. No 400 path and no `{"error": ...}` envelope is planned; criterion 3's 422 stands.
- Comment (tracker, 2026-09-03, framework-generated): "mayker-dev: plan PR opened for TEST-06, .../pull/23 ..." → Not acted on: a framework link comment for a superseded plan PR, carrying no requirement.

No PR review comments exist (no pull request is open for this branch), and no `[merged-since]` notice applies: this is a fresh plan on a branch created from current `origin/main`.

## Plan Overview

One read-only backend endpoint, two thin layers plus tests. A router module exposes `GET /api/echo` under the existing `/api` prefix and returns the `msg` query parameter it was handed; a Pydantic response schema types the payload; the router is registered in the existing `create_app()` factory without restructuring it. No service layer, no repository, no models, no migrations, no frontend, no new dependency. The only pre-existing files touched are `backend/app/main.py` (one import plus one `include_router` call, and one docstring line) and `backend/tests/unit/test_main_unit.py` (one added registration assertion, matching what TEST-02 and TEST-05 each added there).

### Key decisions and assumptions

1. **No service layer, deliberately, and this is the one place the layering standard is not applied as written.** `coding_standards.md` Section 2.2's Router to Service to Repository pattern is scoped to "a backend with data persistence". This endpoint has no persistence and no business logic: the response value is the request value. A `echo_service.get_echo(msg) -> msg` module would be an empty indirection, which contradicts Section 1 (KISS), `user_story_alignment.md` Section 3 and `CLAUDE.md` Architecture Notes ("Keep every feature as small as possible"), and the work item itself says "one router, one schema, its tests". The layers that do exist, the router and the schema (DTO), follow Section 2.2 items 1 and 4 exactly.
2. **Criterion 3's bound is declared on the query parameter, never checked in the handler body.** The handler signature is `def get_echo(msg: Annotated[str, Query(max_length=200)]) -> EchoResponse`. FastAPI raises `RequestValidationError` for an over-length value and returns its standard 422 body. There is no `if len(msg) > 200:` anywhere, which is what the criterion and the 2026-09-03 retraction comment both require. 200 characters exactly is valid (the bound is "longer than 200"), and 201 is the first rejected length.
3. **Criterion 2 comes from the same declaration and needs no code.** `msg` is declared with no default, so it is a required query parameter and FastAPI answers a request without it with 422 rather than 500 or an empty 200. Nothing is added to produce that behaviour, and the integration tier asserts it rather than assuming it.
4. **Assumption, an empty `msg` is valid.** `GET /api/echo?msg=` returns 200 with `{"echo": ""}`. No `min_length` is declared: the criteria bound the maximum only, and adding a minimum would be an unrequested rule (`user_story_alignment.md` Section 3). Recorded here rather than raised as a question.
5. **Assumption, the response carries the text verbatim.** No trimming, no case change, no HTML or URL escaping in the handler. The value is whatever the framework's query-string decoding produced, which is what "returns the text it was given" asks for, and JSON serialization handles quoting. A caller sending `msg=a b&c` is decoded by the server as normal.
6. **No exception hierarchy or global handler is introduced.** `coding_standards.md` Section 2.3 prescribes `AppException` plus registered handlers; the scaffold has neither, and this endpoint raises nothing of its own. Introducing that infrastructure for an endpoint whose only error path is the framework's own validation response would be exactly the gold plating the criteria rule out, and criterion 2 names FastAPI's standard shape as the wanted one. The first feature that needs error translation should introduce it.
7. **Prefix placement follows the two existing routers.** `APIRouter(prefix="/api", tags=["echo"])` with `@router.get("/echo", ...)` yields exactly `/api/echo`, and `create_app()` calls `app.include_router(echo_router)` with no extra prefix, so the path cannot drift.
8. **Concurrency.** This item and TEST-07 and FEAT-1 all register a router in `backend/app/main.py` and all touch `backend/tests/unit/test_main_unit.py`. They are independent in the graph, so they must be serialized rather than built concurrently. See `shared_risks.md`.

## Frontend Plan

No frontend changes required. This item is backend-only by design, and `CLAUDE.md` Design Reference mode is `NONE`.

- Design reference notes: AI freestyle (no UI in this feature, so nothing is rendered and nothing is implemented from a design value).

## Backend Plan

- **Endpoints:** `GET /api/echo?msg={text}`, returns the text it was given. One required query parameter, no path parameters, no request body, no authentication (the project has none).
- **Router layer** (`backend/app/routers/echo.py`): `router = APIRouter(prefix="/api", tags=["echo"])`; one handler `get_echo(msg: Annotated[str, Query(max_length=200)]) -> EchoResponse` declared with `response_model=EchoResponse`, returning `EchoResponse(echo=msg)`. No branching, no validation code, no logging: there is nothing to log and nothing to decide (`coding_standards.md` Section 2.2 item 1, no business logic in routers).
- **Service layer:** none, and that is a decision rather than an omission. There is no persistence and no business logic for a service to hold, so the Router to Service to Repository pattern does not apply here (`coding_standards.md` Section 2.2's own scoping sentence, plus key decision 1 above).
- **Repository layer:** none. This feature reads and writes no data store; `backend/app/repositories/` and `backend/app/models/` stay untouched.
- **Schemas** (`backend/app/schemas/echo.py`): `class EchoResponse(BaseModel)` with a single field `echo: str`, in its own module beside `health.py` and `version.py`. This is criterion 4's subject: the router returns this model, never a bare dict.
- **Migrations:** none. No schema change, no database access on this request path, and `backend/app/core/db.py` and `backend/app/core/config.py` are not touched.
- **App factory** (`backend/app/main.py`): add `from app.routers.echo import router as echo_router` and, inside `create_app()`, `app.include_router(echo_router)` before `return app`. The factory's shape, CORS middleware, lifespan and module-level `app = create_app()` are unchanged; the module docstring gains one line noting that TEST-06 registers the echo router, matching how TEST-02 and TEST-05 recorded theirs.

## API Integration Plan

No external API integration.

## API Contract

- **Method:** `GET`
- **URL:** `/api/echo`
- **Request:** one required query parameter, `msg` (string, maximum 200 characters). No headers required, no body.
- **Response:** `200 OK`, `Content-Type: application/json`

  ```json
  { "echo": "hello" }
  ```

  `echo` is the value of `msg`, verbatim. `GET /api/echo?msg=hello` therefore answers `{"echo": "hello"}`, and `GET /api/echo?msg=` answers `{"echo": ""}`.
- **Error responses:**
  - `422 Unprocessable Entity` when `msg` is absent, and when `msg` is longer than 200 characters. Both are FastAPI's standard validation response, produced by the parameter declaration rather than by handler code, and the body is FastAPI's own `{"detail": [ ... ]}` shape. No custom error envelope is introduced (see the retracted 400 comment in Re-Plan Feedback).
  - `405 Method Not Allowed` for any verb other than GET, from FastAPI's routing. Nothing in this feature produces a 404, a 4xx of its own, or a 5xx.

## Technology Selection

- Query-parameter length bound (criterion 3): chose FastAPI's `Query(max_length=200)`, from `fastapi`, a dependency this project already installs, over a hand-rolled `if len(msg) > 200: raise ...` in the handler, because the declarative form is what criterion 3 asks for by name, it produces the standard 422 body criterion 3 also asks for, and it is one annotation against a branch plus an exception plus its own test.
- Required-parameter enforcement (criterion 2): chose FastAPI's own required-parameter behaviour (a parameter declared with no default), already installed, over any explicit presence check, because the framework already returns exactly the 422 the criterion specifies and a check would only be able to reproduce it less faithfully.
- Response body model (criterion 4): chose Pydantic `BaseModel`, already installed transitively via `fastapi` and already used by `backend/app/schemas/health.py` and `version.py`, over a bare dict in the router and over adding any serialization library. No `pyproject.toml` change, so no lockfile change.
- Echo router module (`backend/app/routers/echo.py`): no standard-library call, native platform feature or installed dependency provides this project's `GET /api/echo` route, so it is built here, as the third instance of a shape `health.py` and `version.py` already established.
- Echo response schema (`backend/app/schemas/echo.py`): no installed dependency can declare this feature's response shape for it, so the two-line model is written here; the alternative considered and rejected was reusing or generalizing an existing schema, which would couple two unrelated endpoints to satisfy nothing.
- Service module: not created. Considered and rejected, see key decision 1: there is no logic for it to hold, so the ladder never reaches a build-or-install question.
- New dependencies: none. Nothing in this feature needs a package the project does not already install.

## File Manifest

### New files

- [B] backend/app/routers/echo.py: `APIRouter(prefix="/api", tags=["echo"])` exposing `GET /echo` with `response_model=EchoResponse`; handler `get_echo(msg: Annotated[str, Query(max_length=200)])` returning `EchoResponse(echo=msg)`.
- [B] backend/app/schemas/echo.py: `EchoResponse(BaseModel)` with a single `echo: str` field, the response contract criterion 4 requires.
- [B] backend/tests/unit/test_echo_unit.py: unit tests over the echo router module, the declared 200-character bound and the `EchoResponse` response model (criteria 3 and 4 at the declaration level).
- [B] backend/tests/integration/test_echo_integration.py: router tests through the full HTTP request/response cycle with the shared `client` fixture (criteria 1, 2 and 3 as observed behaviour, plus the 405 case).
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case, matching the shape of the existing `TEST-02_health_endpoint.feature` for a backend-only item.
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: the manual UAT script, expanded from this plan's `## Manual verification plan` with checkboxes, prerequisites and the summary table.
- [G] .claude/artifacts/TEST-06/uat_script.md: the copy of that manual script build-feature Section 14 step 3 writes into the item's artifact directory.

### Modified files

- [B] backend/app/main.py: import `echo_router` and call `app.include_router(echo_router)` inside `create_app()`; one docstring line added. No other change, and no reordering of the existing registrations.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`, asserting `/api/echo` is among the app's custom route paths, using the existing `_collect_route_paths` helper and `BUILT_IN_ROUTE_PATHS` exclusion set. The existing tests are untouched. This is the same one-assertion addition TEST-02 and TEST-05 each made, and it is the file this item most likely collides on with TEST-07 and FEAT-1.

No dependency change, so no lockfile entry: `backend/pyproject.toml` is not edited and `backend/uv.lock` is therefore not regenerated. No documentation entry either: this feature changes no project structure, run configuration, dependency or test infrastructure, which is build-feature Section 15's own condition, and neither `README.md` nor `docs/DEVELOPMENT.md` enumerates the backend's endpoints (`README.md` names only the backend base URL, http://localhost:8010), so neither needs an edit.

Not modified: `backend/tests/conftest.py`, `backend/app/core/`, anything under `frontend/`, `e2e/tests/`, `.github/`, `docker-compose.yml`.

## Testing Strategy

Tiers judged per `testing_standards.md` Section 6 rather than assumed; two of four are warranted, and UAT artifacts are generated because the toggle is ENABLED.

- Unit tests: the module-level declarations criteria 3 and 4 are really about, asserted without an HTTP round trip: that the route's `response_model` is `EchoResponse`, that the `msg` parameter declares a 200-character maximum, and that `EchoResponse` serializes to a single `echo` key. Plus the app-factory registration assertion in the modified `test_main_unit.py`. No service-layer tests, because there is no service layer (key decision 1); this tier is thin here by design and the integration tier carries the behavioural weight.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `backend/tests/unit/test_echo_unit.py`
- Integration tests: the full HTTP request/response cycle against the endpoint, per `testing_standards.md` Section 1.2's router-test definition: happy path (200 and body), missing parameter (422), over-length parameter (422), the 200-character boundary (accepted), and a wrong-method 405. Uses the existing session-scoped `client` fixture; `backend/tests/conftest.py` is not modified, and no database fixture is needed because this endpoint touches no database.
  - Directory: backend/tests/integration/
- E2E tests: not warranted, so none are written, although the toggle is ENABLED. The feature has no user-facing surface, no route in the frontend, no navigation and no interaction, and `testing_standards.md` Section 5 forbids an E2E spec that drives the API directly, because that is a router integration test, which the integration tier above already is. Nothing is added under `e2e/tests/`, and no acceptance criterion in the table below is assigned to E2E.
  - Directory: e2e/tests/ (deliberately not used)
  - File: TEST-06_echo_endpoint.spec.ts (deliberately not created)
- UAT scenarios: generated, because `UAT Generation` is ENABLED. They are API-level Given/When/Then scenarios, one per acceptance criterion plus an edge case, validated for well-formedness rather than executed, in the same shape TEST-02 (also a backend-only item) produced.
  - Directory: e2e/uat/scenarios/

### Criterion coverage

| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}` | Integration | Verifying it needs no navigation or interaction: it is a router behaviour observed over one HTTP request, and there is no UI that reaches this endpoint. |
| 2 | `GET /api/echo` with no `msg` returns 422 rather than 500 or an empty 200 | Integration | Verifying it needs no navigation or interaction: it is a request-validation status code on a single HTTP request, which no browser step could observe more faithfully. |
| 3 | `msg` longer than 200 characters returns 422, with the bound stated in the schema | Integration | Verifying it needs no navigation or interaction: it is a validation rule observed over one HTTP request. The declarative half (the bound is on the parameter, not in the handler) is additionally asserted at unit level in `test_echo_unit.py`. |
| 4 | The response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict | Unit | Verifying it needs no navigation or interaction, and no HTTP call either: it is a structural property of the route declaration, asserted by reading the route's `response_model` and the schema module. |

## Acceptance Test Outline

| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Covered at Integration, see Criterion coverage | Given the backend is running, When a caller requests `/api/echo?msg=hello`, Then the response is 200 and the body is `{"echo": "hello"}` |
| 2 | `GET /api/echo` with no `msg` returns 422 | Covered at Integration, see Criterion coverage | Given the backend is running, When a caller requests `/api/echo` with no `msg`, Then the response is 422 and the body is the standard validation detail, not a 500 and not an empty 200 |
| 3 | `msg` longer than 200 characters returns 422 | Covered at Integration, see Criterion coverage | Given the backend is running, When a caller requests `/api/echo` with a 201-character `msg`, Then the response is 422 |
| 4 | The response body comes from a Pydantic schema, not a bare dict | Covered at Unit, see Criterion coverage | Given the application's OpenAPI document, When the `/api/echo` GET operation is inspected, Then its 200 response references the `EchoResponse` schema with a single `echo` string property |
| Edge | The 200-character boundary is inclusive | Covered at Integration (boundary case in `test_echo_integration.py`) | Given the backend is running, When a caller requests `/api/echo` with a `msg` of exactly 200 characters, Then the response is 200 and the body echoes all 200 characters |

## Manual verification plan

This feature ships no UI: it adds one backend endpoint and no frontend route, component or control reaches it. Every criterion below is therefore verified by an observable check against the running backend rather than by a click path, which is the complete answer for a criterion that cannot be verified through the UI at all.

Prerequisites for every criterion below: the stack is running from the repository root with `docker compose up -d` (or the backend alone with `uv run --directory backend uvicorn app.main:create_app --factory --port 8010`), and `curl -s -i http://localhost:8010/api/version` answers 200. The backend is published on host port **8010** by `docker-compose.yml`, and http://localhost:8010/docs is the interactive API documentation FastAPI serves, which is the browser equivalent of every curl below.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`
No UI path exists. Observable check:
1. Run `curl -s -i "http://localhost:8010/api/echo?msg=hello"` in a terminal. Expect the first line to read `HTTP/1.1 200 OK` and the body to be exactly `{"echo":"hello"}`.
2. Or open `http://localhost:8010/api/echo?msg=hello` in a browser. Expect the page to show `{"echo":"hello"}`.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
No UI path exists. Observable check:
1. Run `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8010/api/echo"`. Expect it to print `422`, not `500` and not `200`.
2. Run `curl -s "http://localhost:8010/api/echo"` to read the body. Expect FastAPI's standard validation shape, a JSON object whose `detail` is a list whose single entry names `msg` in its `loc` and reports it as missing. Expect no `{"error": ...}` envelope, which was proposed in a tracker comment and then retracted.

### Criterion 3: `msg` longer than 200 characters returns 422, with the bound in the schema
No UI path exists. Observable check, in three steps because the boundary is the interesting part:
1. Run `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"`. Expect `422`.
2. Run the same command with `"a"*200` instead of `"a"*201`. Expect `200`, because the criterion rejects "longer than 200" and 200 exactly is valid.
3. Confirm the bound is declared rather than hand-rolled: open `http://localhost:8010/openapi.json` (or the `/docs` page) and find the `/api/echo` GET operation. Expect its `msg` query parameter to carry `"maxLength": 200` in the schema. Then read `backend/app/routers/echo.py` and expect no length comparison anywhere in the handler body.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
No UI path exists. Observable check:
1. Open `http://localhost:8010/openapi.json`. Find the `/api/echo` GET operation's 200 response. Expect its content schema to be a `$ref` to `EchoResponse`, and expect `components.schemas.EchoResponse` to declare exactly one property, `echo`, of type `string`.
2. Confirm the file exists: `backend/app/schemas/echo.py` defines `class EchoResponse(BaseModel)` with `echo: str`, and `backend/app/routers/echo.py` returns an `EchoResponse` instance rather than a dict literal.
