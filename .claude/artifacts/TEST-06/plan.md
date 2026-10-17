# Implementation Plan, TEST-06: Echo endpoint

## Feature
> A small backend feature for the assisted lifecycle (Arm C of measured run 2). Deliberately narrow: one router, one schema, its tests.
>
> ## What
>
> `GET /api/echo?msg=:text` returns the text it was given, so a caller can prove the API is reachable and that query-string handling works end to end.
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

(The tracker text writes the query placeholder in curly braces; it is spelled `msg=:text` above only because a heredoc line may not hold a brace beside a quote. The meaning is unchanged.)

## Acceptance Criteria
- [ ] 1. `GET /api/echo?msg=hello` returns **200** with body `{"echo": "hello"}`.
- [ ] 2. `GET /api/echo` with no `msg` returns **422**, the framework's standard validation response, rather than a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns **422**. The bound is stated in the schema, not enforced by a hand-rolled check in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not by a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker), 9 framework-generated link comments, each of the shape "mayker-dev: plan PR opened for TEST-06 (PR URL, branch feature/TEST-06-echo-endpoint). Review the plan there; when approved, move this task to on hold (Ready for Build)." naming PRs 167, 143, 88, 62, 55, 51, 49, 35 and 23. Not acted on because they are links posted by earlier plan runs that were reset with the sandbox; they request nothing of the plan, and the branch was recreated from current main.
- Comment (tracker), 2026-09-07: "Reset to to do on 2026-09-07 for measured run 3 ... This item was built and merged in measured run 2 (PR #23, squash 8794a99 on main) ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." Not acted on because the condition it sets is met: current main holds no echo router (`backend/app/routers/` has only `health.py`, `notes.py` and `version.py`, and `backend/app/main.py` registers only those three), so the revert has merged and the hold no longer applies.
- Comment (tracker), 2026-09-03 (later): "Retracting the previous comment. It was a measured-run probe, not a real requirement ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler ... No action needed on this item." Addressed by: criterion 3 is planned as 422 with the bound declared as `Query(max_length=ECHO_MESSAGE_MAX_LENGTH)`, the constant (200) living beside the response schema in `backend/app/schemas/echo.py`; no handler check exists.
- Comment (tracker), 2026-09-03 (earlier): "A msg longer than 200 characters should return 400 with an error-object body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." (JSON literal reworded so the line holds no brace.) Not acted on because the newer comment above retracts it, and comments are read newest first; the plan keeps FastAPI's standard 422 as the description states.

## Plan Overview
One read-only backend endpoint, `GET /api/echo`, that returns the `msg` query parameter it was given, wrapped in a Pydantic response schema. Layers touched: one new router (`backend/app/routers/echo.py`), one new schema module (`backend/app/schemas/echo.py`), and the router registration in `backend/app/main.py`. No database, no service module (see Backend Plan), no frontend, no external API, no new dependency. Validation (missing `msg`, `msg` over 200 characters) is declared on the parameter and enforced by FastAPI, which answers its standard 422 before the handler runs. Tests: integration tests through the FastAPI test client for criteria 1 to 3 plus the 200-character boundary and the declared bound in the OpenAPI document, and a unit test in the existing app-factory test file for registration and the response model (criterion 4). No E2E spec: no criterion involves the UI. UAT artifacts (Gherkin scenarios, manual script and its artifact copy) are produced as usual.

Assumption recorded: the backend is reached at `http://localhost:8010` in the manual steps, because `docker-compose.yml` publishes the backend on host port 8010 (the dispatch named 8000; the compose file is the source of that value).

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/echo`, query parameter `msg` (required string, at most 200 characters), returns the given text in an `EchoResponse` body. Router `backend/app/routers/echo.py`, built exactly like `backend/app/routers/version.py`: `router = APIRouter(prefix="/api", tags=["echo"])`, one function `get_echo(msg: str = Query(..., max_length=ECHO_MESSAGE_MAX_LENGTH)) -> EchoResponse` decorated with `@router.get("/echo", response_model=EchoResponse)`, body `return EchoResponse(echo=msg)`. `Query(...)` with no default makes the parameter required, so a missing `msg` is answered by FastAPI with its standard 422 (criterion 2); `max_length` is declared on the parameter, so FastAPI answers a longer value with its standard 422 and publishes `maxLength: 200` in the OpenAPI document (criterion 3). The handler holds no `len()` check, no try/except and no manual error response.
- Schema: `backend/app/schemas/echo.py` holds `class EchoResponse(BaseModel)` with the single field `echo: str` and a docstring naming the endpoint (shape of `backend/app/schemas/version.py`), plus the module constant `ECHO_MESSAGE_MAX_LENGTH = 200`, which the router imports into its `Query(max_length=...)` declaration so the bound lives with the endpoint schema and is written once (criteria 3 and 4).
- Service layer: none. Local precedent is a service per endpoint (`health_service.py`, `version_service.py`), but each of those holds real logic (a database probe, a package-metadata lookup with a fallback). Echo has no business logic at all: validation is declarative and the response is the input. A service whose body is `return msg` would be an indirection with nothing to test, against `coding_standards.md` Section 1 (KISS) and the project note "keep every feature as small as possible". The router therefore carries no business logic (Section 2.2 of the backend guidelines holds), and a service is added by whichever later item gives the endpoint logic (TEST-11 adds trimming; that is its decision, not this plan).
- Repository layer: none (no data access).
- Migrations: none.
- Registration: `backend/app/main.py` gains `from app.routers.echo import router as echo_router` beside the other router imports, `app.include_router(echo_router)` after `app.include_router(health_router)` in `create_app()`, and one clause in the module docstring naming TEST-06 as registering the echo router. CORS needs no change: `allow_methods` already includes `GET`.
- Out of scope (not in the criteria, so not built): trimming or normalising `msg` (TEST-11), a minimum length, logging the message, rate limiting, any other method on `/api/echo`.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo?msg=<text>` (`msg` required, string, maximum length 200, no minimum)
- Request: no body; one query parameter `msg`.
- Response 200: `EchoResponse`, a JSON object with the single key `echo` whose value is `msg` exactly as received (after URL decoding). Example for `GET /api/echo?msg=hello`:
```json
{"echo": "hello"}
```
- Response 422 (missing `msg`, or `msg` longer than 200 characters): FastAPI's standard validation response, unchanged by this feature: a JSON object with one key, `detail`, holding a list with one entry per failed parameter. For a missing `msg` the entry has `type` equal to `missing` and `loc` equal to the list `query`, `msg`; for an over-long `msg` it has `type` equal to `string_too_long` and the same `loc`, with `ctx.max_length` equal to 200.
- Responses never produced by this endpoint for the inputs above: 500, an empty 200, or a 400.

## Technology Selection
- `GET /api/echo` router (`backend/app/routers/echo.py`): chose FastAPI `APIRouter` with a `Query(..., max_length=...)` declaration, already installed (`fastapi>=0.115.0` in `backend/pyproject.toml`), over a hand-rolled presence and length check in the handler, because FastAPI's declared validation is what produces the standard 422 the criteria ask for and a handler check is exactly what criterion 3 forbids.
- `EchoResponse` schema (`backend/app/schemas/echo.py`): chose a Pydantic `BaseModel`, already installed with FastAPI, over a bare dict or a stdlib `dataclass`, because criterion 4 names a Pydantic schema and FastAPI serialises and documents a `response_model` from it.
- Echo service module: not created; no stdlib call, platform feature or dependency is needed for logic that does not exist (the response is the validated input). See Backend Plan.
- New dependencies: none. Tests use `fastapi.testclient.TestClient` (needs `httpx`, already a dev dependency) and `pytest`, both installed.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `EchoResponse` Pydantic schema (single field `echo: str`) and the `ECHO_MESSAGE_MAX_LENGTH = 200` constant.
- [B] backend/app/routers/echo.py: `GET /api/echo` router; `msg` declared as `Query(..., max_length=ECHO_MESSAGE_MAX_LENGTH)`, `response_model=EchoResponse`, returns `EchoResponse(echo=msg)`.
- [B] backend/tests/integration/test_echo_integration.py: integration tests through the test client for criteria 1 to 3, the 200-character boundary, and the declared `maxLength` in the OpenAPI document.
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus the 200-character boundary edge case.
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/TEST-06/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the echo router, `app.include_router(echo_router)` in `create_app()`, one clause in the module docstring naming TEST-06.
- [B] backend/tests/unit/test_main_unit.py: add a test that `create_app()` registers `/api/echo` and that its route's `response_model` is `app.schemas.echo.EchoResponse` (criterion 4).

No E2E spec (`[D]`) is listed: no acceptance criterion requires navigation or interaction through the UI (see Criterion coverage), so `e2e/tests/` gets no file for this item.
No lockfile entry: the feature adds and changes no dependency, so neither `backend/uv.lock` nor `frontend/package-lock.json` changes.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure (one endpoint inside the existing routers and schemas packages, tests in the existing directories).

## Testing Strategy
Tier selection per `testing_standards.md` Section 6: the feature adds an API endpoint (integration warranted); it adds no service-layer or utility business logic (the existing app-factory unit test file is extended for registration and the response model, following the TEST-02 and TEST-05 precedent, but no new unit test module is warranted); it touches no repository, model or migration; and no criterion involves navigation or interaction through the UI (E2E not warranted for any criterion).

- Unit tests: `create_app()` registers `/api/echo`, and that route declares `response_model` as `app.schemas.echo.EchoResponse` (criterion 4). Added to the existing file, reusing its `_collect_route_paths` helper pattern and `BUILT_IN_ROUTE_PATHS`; locate the echo route the same way the helper walks `original_router` wrappers.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing file `test_main_unit.py`)
- Integration tests: full HTTP cycle through the session-scoped `client` fixture from `backend/tests/conftest.py` (no database fixture: the endpoint touches no database). Tests, named per `testing_standards.md` Section 3:
  - `test_get_echo_returns_200_with_the_given_message`: `msg=hello` answers 200 and the parsed body equals a dict with the single key `echo` and value `hello` (criteria 1 and 4: no extra keys).
  - `test_get_echo_without_msg_returns_422_missing`: no query string answers 422; `detail[0]["type"]` is `missing` and `detail[0]["loc"]` is the list `query`, `msg` (criterion 2).
  - `test_get_echo_with_message_over_max_length_returns_422`: a `msg` of `ECHO_MESSAGE_MAX_LENGTH + 1` letters answers 422 with `detail[0]["type"]` equal to `string_too_long` (criterion 3).
  - `test_get_echo_with_message_at_max_length_returns_200`: a `msg` of exactly `ECHO_MESSAGE_MAX_LENGTH` letters answers 200 and is echoed back unchanged (boundary edge case for criterion 3).
  - `test_openapi_declares_msg_max_length`: `GET /openapi.json` shows the `msg` query parameter of `/api/echo` as required with `maxLength` equal to `ECHO_MESSAGE_MAX_LENGTH`, proving the bound is declared in the schema rather than checked in the handler (criterion 3). Asserting against the imported constant tests the wiring, not a restated literal.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (`test_echo_integration.py`)
- E2E tests: not warranted for this feature. E2E Tests is ENABLED, but `testing_standards.md` Section 6's fourth question, asked per criterion, answers no for all four: each is an HTTP status or payload behaviour of an endpoint no UI consumes, and an E2E spec calling the API directly is a router integration test by Section 5's anti-pattern list. No `e2e/tests/TEST-06_*.spec.ts` is produced, and the per-feature edge-case spec obligation does not attach (Section 4 scopes the E2E row to criteria assigned to E2E). This matches TEST-02, the backend-only precedent, which has UAT artifacts and no spec.
  - Directory: e2e/tests/ (no file for this item)
  - File: none (would have been TEST-06_echo_endpoint.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case, phrased as HTTP requests and responses (no UI steps); manual script and its artifact copy expanded from the Manual verification plan below.
  - Directory: e2e/uat/scenarios/ (scenarios), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with an `echo` body holding `hello` | Integration | Verifying it needs no navigation or interaction: it is a router response over the real HTTP cycle, and no UI calls the endpoint |
| 2 | `GET /api/echo` with no `msg` returns 422, the standard validation response | Integration | Verifying it needs no navigation or interaction: it is FastAPI parameter validation, observable only as the HTTP status and body |
| 3 | `msg` longer than 200 characters returns 422, bound stated in the schema | Integration | Verifying it needs no navigation or interaction: it is a declared validation rule, checked by request and by the published OpenAPI parameter schema |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit | Verifying it needs no navigation or interaction: it is a structural property of the route (its declared `response_model`), with the body shape also asserted by criterion 1 integration test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `msg=hello` returns 200 with an `echo` body of `hello` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo?msg=hello, Then the response is HTTP 200 and the body has the single key echo with value hello |
| 2 | No `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo with no query string, Then the response is HTTP 422 with a validation detail of type missing for query parameter msg |
| 3 | `msg` over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/echo with msg set to 201 letters a, Then the response is HTTP 422 with a validation detail of type string_too_long; edge case: with exactly 200 letters the response is HTTP 200 echoing them |
| 4 | Body defined by a Pydantic schema in `backend/app/schemas/` | covered at Unit, see Criterion coverage | Given the backend is running, When a client opens the OpenAPI document, Then the 200 response of GET /api/echo references the schema EchoResponse with one string property echo |

## Manual verification plan
No acceptance criterion is verifiable through the UI: no frontend screen calls `GET /api/echo`. Each block below therefore gives the observable check instead, an HTTP request made with `curl` in a terminal (or the same URL pasted into a browser address bar) and the exact response to read.

Shared prerequisites for every block: Docker and Docker Compose running; the repository on branch `feature/TEST-06-echo-endpoint`; from the repository root, `docker compose up -d --build` has been run and `docker compose ps` shows the `backend` service running. The backend answers on `http://localhost:8010` (the host port `docker-compose.yml` publishes). A terminal with `curl`, and `python3` for generating the long input in Criterion 3.

### Criterion 1: GET /api/echo?msg=hello returns 200 with an echo body holding hello
Prerequisites: shared prerequisites above.
1. In a terminal, run `curl -i "http://localhost:8010/api/echo?msg=hello"` and read the first response line: it reads `HTTP/1.1 200 OK`.
2. Read the `content-type` header of the same response: it is `application/json`.
3. Read the response body: it is a JSON object with exactly one key, `echo`, whose value is the string `hello`, and nothing else (the compact form is the word echo and the word hello, each in double quotes, separated by a colon, inside curly braces).
4. Paste `http://localhost:8010/api/echo?msg=hello` into a browser address bar: the page shows the same one-key JSON object.

### Criterion 2: GET /api/echo with no msg returns 422, the standard validation response
Prerequisites: shared prerequisites above.
1. Run `curl -i "http://localhost:8010/api/echo"`: the first response line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200).
2. Read the body: a JSON object with one key, `detail`, holding a list with one entry whose `type` is `missing`, whose `loc` is the list `query`, `msg`, and whose `msg` reads `Field required`.
3. Run `curl -i "http://localhost:8010/api/echo?msg="` (the parameter present but empty): the first line reads `HTTP/1.1 200 OK` and the body holds the key `echo` with an empty string value. This is expected, not a defect: the criteria require `msg` to be present and set no minimum length.

### Criterion 3: msg longer than 200 characters returns 422, with the bound stated in the schema
Prerequisites: shared prerequisites above.
1. Run `python3 -c "print('a' * 201)"` and copy the printed line of 201 letters `a`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=PASTE"` with the copied 201 letters in place of `PASTE`: the first line reads `HTTP/1.1 422 Unprocessable Entity`.
3. Read the body: one `detail` entry whose `type` is `string_too_long`, whose `loc` is the list `query`, `msg`, and whose `ctx` names `max_length` 200.
4. Run `python3 -c "print('a' * 200)"`, and repeat step 2 with those 200 letters: the first line reads `HTTP/1.1 200 OK` and the `echo` value is the same 200 letters, so the bound is exactly 200.
5. Open `http://localhost:8010/docs` in a browser, expand `GET /api/echo`, and read the `msg` parameter: it is marked required, of type string, with `maxLength` 200. That is the bound stated in the published schema.
6. Open `backend/app/routers/echo.py` and read `get_echo`: the only statement in its body returns `EchoResponse(echo=msg)`; there is no `len(` call and no manual error response.

### Criterion 4: the response body is defined by a Pydantic schema in backend/app/schemas/
Prerequisites: shared prerequisites above.
1. Open `http://localhost:8010/docs` in a browser, expand `GET /api/echo`, and read the 200 response: its schema is named `EchoResponse` and has one required string property, `echo`.
2. Open `backend/app/schemas/echo.py`: it defines `class EchoResponse(BaseModel)` with the single field `echo: str`.
3. Open `backend/app/routers/echo.py`: the route decorator names `response_model=EchoResponse` and the handler returns an `EchoResponse`, not a dict literal.
4. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_echo_integration.py tests/unit/test_main_unit.py`: the summary line reports `0 failed`.
