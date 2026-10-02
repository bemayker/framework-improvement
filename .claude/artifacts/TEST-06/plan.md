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

Source: ClickUp task [TEST-06: Echo endpoint](https://app.clickup.com/t/123k99ctgcf).

## Acceptance Criteria
- [ ] 1. `GET /api/echo?msg=hello` returns 200 with body `{"echo": "hello"}`.
- [ ] 2. `GET /api/echo` with no `msg` returns 422 (FastAPI's standard validation response), never a 500 or an empty 200.
- [ ] 3. `msg` longer than 200 characters returns 422; the bound is declared in the schema module, not hand-checked in the handler.
- [ ] 4. The response body is defined by a Pydantic schema in `backend/app/schemas/`, not a bare dict in the router.

## Re-Plan Feedback (if applicable)
This is a first plan (not a re-plan); the section records the item's tracker comments, newest first, so the reviewer can see each was read. Five further comments are framework-posted "plan PR opened" link notices (PRs #55, #51, #49, #35, #23) and carry no requirement.
- Comment (tracker, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). This item was built and merged in measured run 2 (PR #23, squash 8794a99 on main). ... Do not plan or build this item until that revert has merged; a plan against a main that already holds the feature measures nothing." → not acted on because its precondition already holds: the revert landed on main as 36d8f0d ("chore: revert TEST-06 and TEST-07 for the 0.3.250 measured run (#60)"), and no echo router, schema or test exists in `backend/` on this branch, so this plan is written against a main without the feature.
- Comment (tracker, 2026-09-03, later): "Retracting the previous comment. It was a measured-run probe, not a real requirement. ... Acceptance criterion 3 stands as written in the description: a msg over 200 characters returns 422, with the bound declared via Query(max_length=...) rather than checked in the handler." → Addressed by: criterion 3 is planned exactly as the description states (422), and the bound is declared with `Query(max_length=ECHO_MSG_MAX_LENGTH)`. Assumption recorded for the ambiguity between "stated in the schema" (description) and "declared via Query(max_length=...)" (this comment): both are satisfied by declaring the query parameter's type once, as a reusable `Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]` alias named `EchoMessage` in `backend/app/schemas/echo.py`, next to `ECHO_MSG_MAX_LENGTH = 200` and `EchoResponse`. The router signature uses that alias (`msg: EchoMessage`) and contains no length check of its own.
- Comment (tracker, 2026-09-03, earlier): "A msg longer than 200 characters should return 400 with a {"error": "..."} body, not 422. The 422 shape is FastAPI's and we don't want it on this endpoint." → not acted on because the newer comment above explicitly retracts it as a measured-run probe; a later comment overrides an earlier one, and the description's 422 stands. No custom exception handler and no error schema are planned.

## Plan Overview
Backend-only, three small units following the TEST-05/TEST-02 router + schema shape:
- `backend/app/schemas/echo.py`: the `ECHO_MSG_MAX_LENGTH = 200` constant, the `EchoMessage` annotated query-parameter type that carries the bound declaratively, and the `EchoResponse` Pydantic model (`echo: str`).
- `backend/app/routers/echo.py`: `APIRouter(prefix="/api", tags=["echo"])` with `GET /echo`, `response_model=EchoResponse`, returning `EchoResponse(echo=msg)`.
- `backend/app/main.py`: one `include_router` line plus the import, matching version/notes/health.

No service layer: the handler maps its input straight to the response schema and holds no business logic, so a service module would be an empty pass-through (KISS, Architecture Notes "Keep every feature as small as possible"). No repository, no database access, no migration, no new dependency. Missing `msg` and over-length `msg` are rejected by FastAPI's own request validation with its standard 422 body; the handler contains no validation code.

Assumptions:
- `msg` is required (no default), which is what turns a missing parameter into a 422 (criterion 2).
- An empty value (`/api/echo?msg=`) is not addressed by any criterion; it is accepted and echoed as `{"echo": ""}`. No `min_length` is added (no gold plating).
- Exactly 200 characters is accepted (the criterion says "longer than 200" is rejected); the integration tests pin both sides of the boundary.
- No trimming or transformation of `msg`: it is echoed exactly as received after URL decoding.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/echo?msg={text}`, returns the given text in an `EchoResponse` body; 422 on missing or over-length `msg` via FastAPI request validation.
- Schema: `backend/app/schemas/echo.py` with `ECHO_MSG_MAX_LENGTH = 200`, `EchoMessage = Annotated[str, Query(max_length=ECHO_MSG_MAX_LENGTH)]`, and `class EchoResponse(BaseModel): echo: str`. Module docstring names TEST-06, like the sibling schema modules.
- Router: `backend/app/routers/echo.py`, `router = APIRouter(prefix="/api", tags=["echo"])`; `@router.get("/echo", response_model=EchoResponse)` on `def get_echo(msg: EchoMessage) -> EchoResponse`, body `return EchoResponse(echo=msg)`. No hand-rolled `len(msg)` check, no bare dict.
- Registration: `backend/app/main.py` imports `router as echo_router` and calls `app.include_router(echo_router)` in `create_app()`; the module docstring's list of registered routers gains TEST-06.
- Service layer: none (no business logic; see Plan Overview).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/echo`
- Request: query string `msg` (string, required, max 200 characters). No body.
- Response 200: `{"echo": "hello"}` for `?msg=hello`. Schema `EchoResponse`, one field `echo: string`.
- Response 422 (missing `msg`): FastAPI's standard validation body, e.g. `{"detail": [{"type": "missing", "loc": ["query", "msg"], "msg": "Field required", "input": null}]}`.
- Response 422 (over-length `msg`): FastAPI's standard validation body, e.g. `{"detail": [{"type": "string_too_long", "loc": ["query", "msg"], "msg": "String should have at most 200 characters", "input": "...", "ctx": {"max_length": 200}}]}`.
- Tests assert the status code, the `detail[0].type` and `detail[0].loc`; they do not pin FastAPI's full message text.

## Technology Selection
- `msg` length bound (criterion 3): chose FastAPI's own `Query(max_length=...)` declared once in the `EchoMessage` annotated type over a hand-rolled `len(msg) > 200` check in the handler, because the installed framework already enforces it and returns the standard 422; a handler check is exactly what the criterion forbids.
- Required-parameter rejection (criterion 2): chose FastAPI's built-in required-query validation (a parameter with no default) over any custom check or exception handler, because it already returns the standard 422.
- `EchoResponse` response schema (criterion 4): chose Pydantic `BaseModel`, already installed with FastAPI, over a bare dict or a dataclass, because the criterion requires a Pydantic schema and the sibling endpoints use the same.
- Echo router module: no stdlib call, native platform feature or installed dependency replaces a FastAPI router for a new endpoint, so it is built here, using the installed FastAPI `APIRouter`.
- No new dependency is added; FastAPI and Pydantic are already installed.

## File Manifest
### New files
- [B] backend/app/schemas/echo.py: `ECHO_MSG_MAX_LENGTH = 200`, the `EchoMessage` annotated query type carrying `Query(max_length=ECHO_MSG_MAX_LENGTH)`, and the `EchoResponse` Pydantic model (`echo: str`).
- [B] backend/app/routers/echo.py: `GET /api/echo` router, `response_model=EchoResponse`, returns `EchoResponse(echo=msg)`; no validation or business logic in the handler.
- [B] backend/tests/unit/test_echo_unit.py: unit tests for the schema module: `EchoResponse` serialises to the `echo` key, rejects a missing `echo` field, and `ECHO_MSG_MAX_LENGTH` is 200.
- [B] backend/tests/integration/test_echo_integration.py: full HTTP cycle via the shared `client` fixture: 200 echo, 422 missing `msg`, 422 at 201 characters, 200 at exactly 200 characters, URL-encoded text round-trips, OpenAPI response schema is `EchoResponse`.
- [G] e2e/uat/scenarios/TEST-06_echo_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (exactly 200 characters accepted).
- [G] e2e/uat/scripts/TEST-06_echo_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-06/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import the echo router and register it in `create_app()` (one `include_router` line, matching version/notes/health); docstring lists TEST-06.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_echo_route` asserting `/api/echo` is wired in, matching the existing version/health registration tests.

No dependency manifest changes, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure, and neither document lists individual endpoints.

## Testing Strategy
- Unit tests: the schema module (`EchoResponse` shape and serialisation, missing-field rejection, the 200 bound constant). No service layer exists to test.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_echo_unit.py`; plus one added case in `test_main_unit.py` for route registration.
- Integration tests: router layer through the real HTTP request/response cycle (`fastapi.testclient.TestClient`, shared session-scoped `client` fixture from `backend/tests/conftest.py`). Cases: `?msg=hello` returns 200 and `{"echo": "hello"}`; no `msg` returns 422 with `detail[0].type == "missing"` and `loc == ["query", "msg"]`; 201-character `msg` returns 422 with `detail[0].type == "string_too_long"`; exactly 200 characters returns 200 echoing it; a URL-encoded value (`hello world & more`, sent through `params=`) round-trips unchanged; `app.openapi()` shows the 200 response schema of `/api/echo` referencing `EchoResponse`. The endpoint uses no database, so these tests need no `DATABASE_URL` and do not use the DB fixtures.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py, so `test_echo_integration.py`.
- E2E tests: none for this feature. E2E is ENABLED, but no acceptance criterion involves navigation or interaction through the UI: there is no frontend change and no page consumes `/api/echo`. Per `testing_standards.md` Section 5, an E2E test that calls the API directly is a router integration test, so every criterion is covered at integration (and, for criterion 4, also unit) level instead. No `e2e/tests/` spec is produced.
  - Directory: e2e/tests/ (unused for this feature)
  - File: none (would be `TEST-06_echo_endpoint.spec.ts`)
- UAT scenarios: one Gherkin scenario per criterion plus the 200-character boundary edge case, read as HTTP request/response steps (validated for well-formedness only).
  - Directory: e2e/uat/scenarios/ (scenarios), e2e/uat/scripts/ (manual script)
- Test names follow `test_{method_or_action}_{scenario}_{expected_outcome}`, e.g. `test_get_echo_without_msg_returns_422`.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | Integration | No UI consumes the endpoint; verifying it needs no navigation or interaction, only the HTTP response, which is a router behaviour |
| 2 | `GET /api/echo` without `msg` returns 422 | Integration | It is FastAPI request validation on the router; no UI path exists to reach it |
| 3 | `msg` over 200 characters returns 422, bound declared in the schema | Integration | It is a validation rule observable only as an HTTP status; both sides of the boundary (200 and 201 characters) are asserted at router level |
| 4 | Response body defined by a Pydantic schema in `backend/app/schemas/` | Unit + Integration | It is a structural property of the code: the unit test exercises `EchoResponse`, the integration test asserts the OpenAPI 200 schema of `/api/echo` references `EchoResponse`; there is nothing to click |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo?msg=hello, Then the status is 200 and the body is `{"echo": "hello"}` |
| 2 | `GET /api/echo` without `msg` returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo with no query string, Then the status is 422 and the validation detail names the missing query parameter `msg` |
| 3 | `msg` over 200 characters returns 422 | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/echo with a 201-character msg, Then the status is 422 with a `string_too_long` detail; edge: with exactly 200 characters, Then the status is 200 and the text is echoed |
| 4 | Response body defined by a Pydantic schema | covered at Unit + Integration, see Criterion coverage | Given the backend is running, When a reader opens the OpenAPI document, Then the 200 response of GET /api/echo references the `EchoResponse` schema with a single string property `echo` |

## Manual verification plan
No acceptance criterion is verifiable through the application UI: no frontend page calls `/api/echo`. The observable check is the HTTP response, read with `curl` in a terminal (and, for criterion 4, the OpenAPI document in a browser).

Common prerequisites for every block: Docker running; repository on branch `feature/TEST-06-echo-endpoint` (or `main` once merged); from the repository root run `docker compose up -d --build` and wait until `docker compose ps` shows `backend` running; host port 8010 free (the backend mapping in `docker-compose.yml`); a terminal with `curl` and `python3`.

### Criterion 1: `GET /api/echo?msg=hello` returns 200 with `{"echo": "hello"}`
Prerequisites: common prerequisites above.
1. In a terminal run `curl -i "http://localhost:8010/api/echo?msg=hello"` → the first line reads `HTTP/1.1 200 OK` and the header `content-type: application/json` is present.
2. Read the body of the same response → it is exactly `{"echo":"hello"}` (FastAPI omits the space; same JSON as `{"echo": "hello"}`).
3. Run `curl -i -G http://localhost:8010/api/echo --data-urlencode "msg=hello world & more"` → status 200 and body `{"echo":"hello world & more"}`, proving query-string decoding works end to end.

### Criterion 2: `GET /api/echo` with no `msg` returns 422
Prerequisites: common prerequisites above.
1. Run `curl -i http://localhost:8010/api/echo` → the first line reads `HTTP/1.1 422 Unprocessable Entity` (never `500`, never `200`).
2. Read the body → a JSON object with a `detail` array whose first entry has `"type":"missing"` and `"loc":["query","msg"]`.

### Criterion 3: `msg` longer than 200 characters returns 422
Prerequisites: common prerequisites above.
1. Run `python3 -c "print('a'*201, end='')" > /tmp/echo_msg_201.txt` → the file holds 201 letters `a` (check with `wc -c /tmp/echo_msg_201.txt`, which prints `201`).
2. Run `curl -i -G http://localhost:8010/api/echo --data-urlencode msg@/tmp/echo_msg_201.txt` → `HTTP/1.1 422 Unprocessable Entity`, and the body's first `detail` entry has `"type":"string_too_long"`, `"loc":["query","msg"]` and `"ctx":{"max_length":200}`.
3. Run `python3 -c "print('a'*200, end='')" > /tmp/echo_msg_200.txt` then `curl -i -G http://localhost:8010/api/echo --data-urlencode msg@/tmp/echo_msg_200.txt` → `HTTP/1.1 200 OK` and the body's `echo` value is the 200 letters `a` (boundary accepted).
4. Open `backend/app/routers/echo.py` in an editor → the handler contains no `len(` call and no length comparison; the bound appears only as `ECHO_MSG_MAX_LENGTH = 200` and `Query(max_length=ECHO_MSG_MAX_LENGTH)` in `backend/app/schemas/echo.py`.

### Criterion 4: the response body is defined by a Pydantic schema in `backend/app/schemas/`
Prerequisites: common prerequisites above.
1. In a browser open `http://localhost:8010/docs` → the Swagger UI page lists `GET /api/echo` under the `echo` tag.
2. Expand `GET /api/echo` and open its `200` response's Schema tab → the schema is named `EchoResponse` with one required string property `echo`.
3. Scroll to the Schemas section at the bottom of the page → `EchoResponse` is listed.
4. Open `backend/app/routers/echo.py` in an editor → the route declares `response_model=EchoResponse` and returns `EchoResponse(echo=msg)`, not a dict literal; `EchoResponse` is imported from `app.schemas.echo`.
