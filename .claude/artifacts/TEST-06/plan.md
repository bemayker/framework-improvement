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
- [ ] 3. `msg` longer than 200 characters returns 422; the bound is declared (schema / `Query(max_length=...)`), not hand-checked in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict in the router.

## Re-Plan Feedback
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → Addressed by: checked the current branch (freshly cut from `origin/main` at 921f7a5). `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, `backend/app/schemas/` holds no `echo.py`, and `backend/app/main.py` registers only the version, notes and health routers. Main holds no echo router today, so the revert this comment waits on has landed and its hold no longer applies; this plan builds the echo endpoint from nothing.
- Comment (tracker, 2026-09-03, later): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler. The code on feature/TEST-06-echo-endpoint already satisfies it and needs no change. [...] No action needed on this item. PR #23 remains correct against the description." → Addressed by: criterion 3 is planned as 422 with the bound declared through `Query(max_length=MAX_ECHO_MESSAGE_LENGTH)`, the constant living in `backend/app/schemas/echo.py` so the bound is stated beside the schema and nowhere in the handler body. The sentence "the code on feature/TEST-06-echo-endpoint already satisfies it" is not acted on: that code was reverted from main (see the 2026-09-07 comment) and this branch carries none of it.
- Comment (tracker, 2026-09-03, earlier): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → Not acted on because the newer tracker comment above explicitly retracts it as a measured-run probe; comments are read newest first and the retraction is the newest word on criterion 3, so the description's 422 stands. No custom 400 handler and no `{"error": ...}` body are planned.
- Comment (tracker, 14 comments): "mayker-dev: plan PR opened for TEST-06 — https://github.com/bemayker/framework-improvement/pull/{N} ..." (PRs 23, 35, 49, 51, 55, 62, 88, 143, 167, 190, 222, 270, 316, 343) → Not acted on because they are the framework's own PR-link notices from earlier sandbox runs and ask for nothing.
- Assumption (no comment covers it): `GET /api/echo?msg=` (present but empty) is not in any criterion. No `min_length` is added (no gold plating), so it returns 200 with `{"echo": ""}`. Whitespace is echoed unchanged; trimming is TEST-11's and BUG-05's later decision, not this item's.

## Plan Overview
One backend slice, no frontend and no database: a new `GET /api/echo` router whose single required query parameter `msg` is bounded at 200 characters declaratively through FastAPI's `Query(max_length=...)`, and whose response is a Pydantic `EchoResponse` model. The router is registered in `create_app()` beside the existing three. FastAPI's own request validation produces the 422 for a missing or over-long `msg`, so the handler holds no checks at all. There is no business logic, so no service or repository module is added (KISS: a service that returns its own argument would be a layer with nothing in it). Tests: one unit file for the schema and the declared bound, one integration file for the HTTP cycle, and one added test in the existing `test_main_unit.py` for the router registration.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item renders no UI)

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}`, returns the given text as `{"echo": text}`.
- Router: `backend/app/routers/echo.py`, `router = APIRouter(prefix="/api", tags=["echo"])`, same shape as `routers/version.py`. Handler signature: `def get_echo(msg: Annotated[str, Query(max_length=MAX_ECHO_MESSAGE_LENGTH)]) -> EchoResponse`, decorated `@router.get("/echo", response_model=EchoResponse)`, body `return EchoResponse(echo=msg)`. `msg` has no default, so FastAPI marks it required and answers 422 when it is absent. No `if len(msg) > ...` check, no try/except, no `JSONResponse`.
- Schema: `backend/app/schemas/echo.py` holds `MAX_ECHO_MESSAGE_LENGTH = 200` and `class EchoResponse(BaseModel): echo: str`, with a docstring naming the endpoint, same shape as `schemas/version.py`.
- Registration: `backend/app/main.py` imports `from app.routers.echo import router as echo_router` and calls `app.include_router(echo_router)` after the health router; the module docstring gains one clause naming TEST-06's echo router. Nothing else in `main.py` changes (CORS already allows `GET`).
- Service layer: none. There is no business logic to hold; the response is the validated input.
- Repository layer: none (no persistence).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query parameter `msg`, string, required, at most 200 characters (declared as `maxLength: 200` in the OpenAPI schema). No body.
- Response 200: `{"echo": "hello"}` for `?msg=hello` (the exact `msg` value, unchanged).
- Response 422 (missing `msg`): FastAPI's standard validation body, `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}`.
- Response 422 (`msg` of 201+ characters): FastAPI's standard validation body with `detail[0].type == "string_too_long"`, `detail[0].loc == ["query", "msg"]` and `detail[0].ctx.max_length == 200`.

## Technology Selection
- Length bound on `msg`: chose FastAPI's `Query(max_length=...)` (an installed dependency, `fastapi>=0.115.0`) over a hand-rolled `len()` check plus `HTTPException`, because the declarative bound yields the standard 422 and appears in the OpenAPI schema, which is what criterion 3 asks for.
- Response model `EchoResponse`: chose a Pydantic `BaseModel` (installed with FastAPI) over a bare dict, which criterion 4 rules out; nothing else to weigh.
- Echo router module: no stdlib call, native platform feature or installed dependency covers an application route, so it is built here, as the smallest `APIRouter` in the existing shape.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `MAX_ECHO_MESSAGE_LENGTH = 200` and the `EchoResponse` Pydantic model (criteria 3 and 4)
- [B] backend/app/routers/echo.py: `GET /api/echo` router, `msg` required with `Query(max_length=MAX_ECHO_MESSAGE_LENGTH)`, returns `EchoResponse` (criteria 1, 2, 3)
- [B] backend/tests/unit/test_echo_unit.py: unit tests for `EchoResponse` and the declared bound in the app's OpenAPI schema
- [B] backend/tests/integration/test_echo_integration.py: integration tests for the 200, missing-`msg` 422, 200-character boundary and 201-character 422 cases
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per criterion plus the 200-character boundary edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-06/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import and `include_router` the echo router; docstring names TEST-06
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route`, asserting `/api/echo` is among the app's custom route paths
No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists the API's endpoints.

## Testing Strategy
- Unit tests: `EchoResponse` serialization (happy path `{"echo": "hello"}`, edge case empty string, error case missing `echo` raises `ValidationError`); the app's OpenAPI document declares `msg` on `GET /api/echo` as a required query parameter with `maxLength` equal to `MAX_ECHO_MESSAGE_LENGTH` (200), which is what proves the bound is declared rather than hand-checked; `create_app()` registers `/api/echo`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_echo_unit.py`; the registration test goes in the existing `test_main_unit.py`)
- Integration tests: through the shared session `client` fixture in `backend/tests/conftest.py` (the endpoint needs no database, as with the version tests): `?msg=hello` is 200 with exactly `{"echo": "hello"}`; no `msg` is 422 with `detail[0].loc == ["query", "msg"]` and `detail[0].type == "missing"`; a 200-character `msg` is 200 and echoed unchanged (boundary); a 201-character `msg` is 422 with `detail[0].type == "string_too_long"`. Test names follow `test_{action}_{scenario}_{outcome}`, e.g. `test_get_echo_without_msg_returns_422`.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No acceptance criterion involves navigation or interaction through the UI and no frontend consumes this endpoint, so every criterion is covered at integration or unit level and no `e2e/tests/TEST-06_echo_endpoint.spec.ts` is produced (`testing_standards.md` Section 6, fourth question asked per criterion; Section 4's per-feature edge-case spec applies only where E2E is warranted at all).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case; the manual script runs `curl` against the backend.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | No UI consumes the endpoint; it is a router request/response cycle, fully observable through the test client |
| 2 | No `msg` returns 422 | Integration | A router validation behaviour with no navigation or interaction; the test client sees the exact status and body |
| 3 | `msg` over 200 characters returns 422, bound declared | Integration (status) and Unit (declared `maxLength` in OpenAPI) | A validation rule: the 422 is a router behaviour and the "declared, not hand-rolled" half is a property of the app's schema, neither needs a browser |
| 4 | Response defined by a Pydantic schema in `backend/app/schemas/` | Unit | A code-structure property: the unit test exercises `EchoResponse`, and the router's `response_model` makes the integration body that schema's output |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo?msg=hello`, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | No `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When I request `GET /api/echo` with no query string, Then the status is 422 and the error names the `msg` query parameter as missing |
| 3 | Over 200 characters returns 422 | covered at Integration and Unit, see Criterion coverage | Given the backend is running, When I request `GET /api/echo` with a 201-character `msg`, Then the status is 422; and with a 200-character `msg`, Then the status is 200 |
| 4 | Pydantic response schema | covered at Unit, see Criterion coverage | Given the backend is running, When I open the OpenAPI document, Then `GET /api/echo`'s 200 response references the `EchoResponse` schema |

## Manual verification plan
No criterion is verifiable through the UI: no frontend screen calls `GET /api/echo`. The observable check for every criterion is the HTTP response, read with `curl` in a terminal, or the OpenAPI document in a browser.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: on branch `feature/TEST-06-echo-endpoint`, Docker running, nothing else bound to host port 8010; from the repository root run `docker compose up -d --build` and wait until `docker compose ps` shows the `backend` service running.
1. In a terminal run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK`.
2. Read the response body → exactly `{"echo":"hello"}`.
3. Run `curl -i "http://localhost:8010/api/echo?msg=hello%20world"` → `HTTP/1.1 200 OK` with body `{"echo":"hello world"}`, showing the query string is decoded and echoed unchanged.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: the stack from criterion 1 still up.
1. Run `curl -i "http://localhost:8010/api/echo"` → the first line reads `HTTP/1.1 422 Unprocessable Entity` (not 500, not 200).
2. Read the response body → a JSON object with a `detail` list whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422, bound declared in the schema
Prerequisites: the stack from criterion 1 still up; `python3` available in the terminal to build the long strings.
1. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*201)')"` → `HTTP/1.1 422 Unprocessable Entity`, and the body's first `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
2. Run `curl -i "http://localhost:8010/api/echo?msg=$(python3 -c 'print("a"*200)')"` → `HTTP/1.1 200 OK` with `{"echo":"aaaa...a"}` holding exactly 200 `a` characters (the boundary is inclusive).
3. In a browser open `http://localhost:8010/docs`, expand `GET /api/echo` → the `msg` parameter is shown as required, in `query`, with `maxLength 200`.
4. Open `backend/app/routers/echo.py` → the handler body is a single `return EchoResponse(echo=msg)` with no length check; the bound appears only as `Query(max_length=MAX_ECHO_MESSAGE_LENGTH)` in the signature.

### Criterion 4: the response body is a Pydantic schema in `backend/app/schemas/`
Prerequisites: the stack from criterion 1 still up.
1. In a browser open `http://localhost:8010/docs`, expand `GET /api/echo`, look at the 200 response → its schema is `EchoResponse` with one string property `echo`.
2. Open `backend/app/schemas/echo.py` → it defines `class EchoResponse(BaseModel)` with `echo: str`; `backend/app/routers/echo.py` declares `response_model=EchoResponse` and returns an `EchoResponse`, not a dict.
3. From the repository root run `uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py` → the summary line reports `0 failed`.
