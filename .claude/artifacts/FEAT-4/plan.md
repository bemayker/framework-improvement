# Implementation Plan, FEAT-4: VERIFY MDF-456: GET /api/ping returns a JSON status

## Feature
> Loop: staged for verify rows 212/213 (deliver).
>
> Add a backend endpoint GET /api/ping.
>
> Acceptance criteria:
> - [ ] GET /api/ping answers 200 with the JSON body {"status": "ok", "service": "backend"}
> - [ ] A POST to /api/ping answers 405 with the JSON body {"detail": "Method Not Allowed"}
> - [ ] A pytest in backend/tests covers both responses

## Acceptance Criteria
- [ ] 1. GET /api/ping answers 200 with the JSON body {"status": "ok", "service": "backend"}
- [ ] 2. A POST to /api/ping answers 405 with the JSON body {"detail": "Method Not Allowed"}
- [ ] 3. A pytest in backend/tests covers both responses

## Re-Plan Feedback
No feedback to record: the ClickUp task carries 0 comments, this is a first plan (no PR review comments), and no `[merged-since]` lines were passed. Two assumptions are recorded here in place of a question (`user_story_alignment.md` Section 4):
- Assumption: the body is exactly the two fields `status` and `service`, nothing more (no timestamp, no version), and both values are constants. Tests assert the whole body by equality, so an extra field fails them.
- Assumption: the 405 body is FastAPI's (Starlette's) built-in method-not-allowed response, which already renders as {"detail": "Method Not Allowed"}; the app registers no exception handler (backend/app/main.py read), so no custom handler is added. The test pins the exact body so a future global handler that changes it is caught.

## Plan Overview
One read-only backend endpoint, following the shape FEAT-1 used for GET /api/time: a router module `backend/app/routers/ping.py` (prefix `/api`, `GET /ping`) returning a Pydantic response schema `PingResponse` from `backend/app/schemas/ping.py`, registered in `create_app()` in `backend/app/main.py`. No service, repository, database or frontend work. Tests: unit tests for the schema and route declaration, integration tests through the existing session-scoped `client` fixture for the 200 and 405 responses, and one registration test in `test_main_unit.py`.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI)

## Backend Plan
- Endpoints: `GET /api/ping`, returns 200 with {"status": "ok", "service": "backend"}. Only GET is declared; any other method on the path (including POST) is answered by the framework with 405 and {"detail": "Method Not Allowed"} plus an `Allow: GET` header.
- Service layer: none. Planned deviation from `coding_standards.md` Section 2.2, the same one FEAT-1 recorded for /api/time: the handler returns two constants, which is neither business logic nor a transactional boundary, so a service would be an empty pass-through.
- Repository layer: none; no database access.
- Migrations: none.
- Schema: `PingResponse(BaseModel)` with `status: Literal["ok"]` and `service: Literal["backend"]`, so the router cannot emit any other value and the OpenAPI schema documents the constants. Module-level constants are not needed beyond the Literals.
- Registration: `backend/app/main.py` imports `router as ping_router` from `app.routers.ping` (alphabetical among the router imports, between notes and server_time) and appends `app.include_router(ping_router)` after the server_time registration; the module docstring gains FEAT-4. CORS `allow_methods` is unchanged (GET is already allowed). Nothing else in the factory changes.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/ping
- Request: no parameters, no body
- Response: 200, `application/json`

```json
{"status": "ok", "service": "backend"}
```

- Method: POST (and any other method except GET)
- URL: /api/ping
- Response: 405, `application/json`, header `Allow: GET`

```json
{"detail": "Method Not Allowed"}
```

## Technology Selection
- PingResponse schema: chose Pydantic (already installed, used by every sibling schema) with `typing.Literal` over a bare dict in the router, because the sibling endpoints define their bodies through schemas and Literal pins the two constant values; no new dependency.
- 405 response: chose FastAPI's built-in method-not-allowed handling (installed framework) over a hand-written exception handler or an explicit POST route returning 405, because the framework already produces exactly {"detail": "Method Not Allowed"}.
- Ping router: no stdlib call, native platform feature or installed dependency replaces a route declaration, so it is built here with the installed FastAPI `APIRouter`.

## File Manifest
### New files
- [B] backend/app/routers/ping.py: `APIRouter(prefix="/api", tags=["ping"])` with `@router.get("/ping", response_model=PingResponse)` handler `get_ping()` returning `PingResponse(status="ok", service="backend")`; module docstring names FEAT-4 and the planned no-service deviation.
- [B] backend/app/schemas/ping.py: `PingResponse` with `status: Literal["ok"]` and `service: Literal["backend"]`.
- [B] backend/tests/unit/test_ping_unit.py: schema dump is exactly {"status": "ok", "service": "backend"} (happy path); schema rejects a status other than "ok" and a service other than "backend" (error cases); exactly one /api/ping route, declared for GET only, whose response_model is PingResponse (edge case: no POST route declared); `get_ping()` called directly returns the expected model.
- [B] backend/tests/integration/test_ping_integration.py: through the `client` fixture in backend/tests/conftest.py (no database): GET /api/ping returns 200 and `response.json() == {"status": "ok", "service": "backend"}` with an `application/json` content type; POST /api/ping returns 405 and `response.json() == {"detail": "Method Not Allowed"}` with the `Allow` header naming GET; edge case: POST with a JSON body still returns the same 405 body.
- [G] e2e/uat/scenarios/FEAT-4_ping_returns_json_status.feature: Gherkin scenarios, one per acceptance criterion plus at least one edge case (UAT Generation is ENABLED).
- [G] e2e/uat/scripts/FEAT-4_ping_returns_json_status_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/FEAT-4/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import `ping_router` from app.routers.ping, append `app.include_router(ping_router)` after the server_time registration, add FEAT-4 to the module docstring. Nothing else changes.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_ping_route` asserting /api/ping is among the app's custom route paths, in the same shape as the existing registration tests.

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: the PingResponse schema (exact shape, Literal rejection of other values) and the route declaration (GET only, response_model) plus the app-factory registration.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (test_ping_unit.py; test_main_unit.py extended)
- Integration tests: the full HTTP cycle through the session-scoped TestClient: GET 200 with the exact body, POST 405 with the exact body and Allow header. No database needed, so these run without the backing service.
  - Directory: backend/tests/integration/ (test_ping_integration.py)
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question asked per criterion below), and an E2E test that calls the API directly is a router integration test (Section 5). No spec file is produced.
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (POST with a body), validated for well-formedness only.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/ping answers 200 with {"status": "ok", "service": "backend"} | Integration | verifying it needs no navigation or interaction: it is a router response, checked through the real HTTP cycle |
| 2 | POST /api/ping answers 405 with {"detail": "Method Not Allowed"} | Integration | verifying it needs no navigation or interaction: it is the router's method handling, checked through the real HTTP cycle |
| 3 | A pytest in backend/tests covers both responses | Integration | the criterion is the existence of the pytest itself; backend/tests/integration/test_ping_integration.py is that test, and it runs in the integration tier |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/ping answers 200 with the status body | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/ping, Then the response is 200 with body {"status": "ok", "service": "backend"} |
| 2 | POST /api/ping answers 405 with the detail body | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends POST /api/ping, Then the response is 405 with body {"detail": "Method Not Allowed"} |
| 3 | A pytest covers both responses | covered at Integration, see Criterion coverage | Given the backend test suite, When the ping tests run, Then they report 0 failed |

## Manual verification plan
This item has no UI, so each criterion is verified with an HTTP client against the running backend, and criterion 3 by running the tests.

### Criterion 1: GET /api/ping answers 200 with {"status": "ok", "service": "backend"}
Prerequisites: the stack is up with `docker compose up -d --build` from the repository root, so the backend listens on http://localhost:8010 (docker-compose.yml backend port).
1. Run `curl -i http://localhost:8010/api/ping` → the status line reads `HTTP/1.1 200 OK` and the `content-type` header is `application/json`.
2. Read the body of the same response → it is exactly `{"status":"ok","service":"backend"}`, with no other field.

### Criterion 2: POST /api/ping answers 405 with {"detail": "Method Not Allowed"}
Prerequisites: as for Criterion 1.
1. Run `curl -i -X POST http://localhost:8010/api/ping` → the status line reads `HTTP/1.1 405 Method Not Allowed` and an `allow` header reads `GET`.
2. Read the body of the same response → it is exactly `{"detail":"Method Not Allowed"}`.
3. Run `curl -i -X POST -H "Content-Type: application/json" -d '{"x": 1}' http://localhost:8010/api/ping` → the same 405 status and the same `{"detail":"Method Not Allowed"}` body; a request body changes nothing.

### Criterion 3: A pytest in backend/tests covers both responses
Prerequisites: backend dependencies installed (`uv sync --directory backend`); no database is needed for these tests.
1. Open backend/tests/integration/test_ping_integration.py → it contains one test asserting GET /api/ping returns 200 with the exact status body, and one asserting POST /api/ping returns 405 with the exact detail body.
2. Run `uv run --directory backend pytest -q tests/integration/test_ping_integration.py tests/unit/test_ping_unit.py tests/unit/test_main_unit.py` → the summary line reports 0 failed.
