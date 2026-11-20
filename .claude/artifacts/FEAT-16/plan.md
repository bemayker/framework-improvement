# Implementation Plan, FEAT-16: VERIFY MDF-455: backend GET /api/verify455 returns ok

## Feature
> Loop: verify staging for MDF-455 (stale remote ref on plan-feature). Add a backend GET /api/verify455 that returns {"status": "ok"} with one unit test. Plan only; do not build. Cancel after the verify run.

## Acceptance Criteria
- [ ] GET /api/verify455 responds with HTTP 200 and the JSON body {"status": "ok"}.
- [ ] The endpoint is covered by one unit test.

## Plan Overview
Backend only. One new FastAPI router, `backend/app/routers/verify455.py`, declares `GET /verify455` under the `/api` prefix (the same `APIRouter(prefix="/api", tags=[...])` shape the version and health routers use) and returns a fixed `{"status": "ok"}` body through a Pydantic response model in `backend/app/schemas/verify455.py`. `create_app()` in `backend/app/main.py` registers it with one `app.include_router(...)` line next to the existing three. No database access, no service layer, no frontend, no external API.

Assumptions and scope decisions (no tracker comments exist; these are mine, recorded so a reviewer can overturn them on the plan PR):
1. No service module. The response is a constant with no business logic, so a `services/verify455_service.py` returning a literal would be a layer with nothing in it (`coding_standards.md` Section 1, KISS). The router builds the response model directly.
2. Exactly one test, as the item states. CLAUDE.md has Integration Tests ENABLED and the tier guidance would normally add a router integration test for a new endpoint; the item explicitly asks for "one unit test" and `user_story_alignment.md` Section 3 bounds scope to the item, so no integration test and no extra assertion in `backend/tests/unit/test_main_unit.py` is planned. The single unit test drives the route through `TestClient(create_app())` **without** the `with` block, so the lifespan (schema initialisation) never runs and the test needs no database. That keeps it a unit test: the router and app factory in isolation, no external dependency.
3. No E2E spec: neither criterion involves navigation or interaction through the UI.
4. The item says "Plan only; do not build. Cancel after the verify run." That is an instruction to the run operator, not an acceptance criterion; the plan is still written build-ready so the verify run exercises a real plan.

## Frontend Plan
No frontend changes required.

Design reference notes: not applicable. CLAUDE.md Design Reference mode is NONE and this item renders no UI.

## Backend Plan
- Endpoints: GET /api/verify455, returns 200 with `{"status": "ok"}`; read-only, takes no input, needs no database.
- Service layer: none (assumption 1 above).
- Repository layer: none, no data access.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/verify455
- Request: no body, no query parameters, no path parameters.
- Response: 200, `application/json`, body `{"status": "ok"}`. Pydantic model `Verify455Response` with one field `status: Literal["ok"]`. Any other method on the path returns FastAPI's default 405.

## Technology Selection
- backend/app/routers/verify455.py (net-new module): chose a FastAPI `APIRouter`, a dependency the project already installs and the pattern every existing endpoint follows, over registering a bare `@app.get` inside `create_app()`; the router keeps `main.py` a registration list, which is how its docstring says later features extend it.
- backend/app/schemas/verify455.py (net-new module): chose a Pydantic model with `typing.Literal["ok"]` (Pydantic already installed, `Literal` from the standard library) over returning a plain dict, because the response model is what documents the contract in the OpenAPI schema, matching `schemas/health.py`.
- No new dependency is added; nothing in `backend/pyproject.toml` or `backend/uv.lock` changes.

## File Manifest
### New files
- [B] backend/app/schemas/verify455.py: `Verify455Response` Pydantic model, `status: Literal["ok"]`.
- [B] backend/app/routers/verify455.py: `router = APIRouter(prefix="/api", tags=["verify455"])` with `GET /verify455` returning `Verify455Response(status="ok")`, `response_model=Verify455Response`.
- [B] backend/tests/unit/test_verify455_unit.py: the single unit test `test_get_verify455_returns_status_ok`, calling `TestClient(create_app()).get("/api/verify455")` without entering the client context, asserting status 200 and body `{"status": "ok"}`.
- [G] e2e/uat/scenarios/FEAT-16_verify_mdf_455_api_verify455.feature: Gherkin scenarios (UAT Generation ENABLED).
- [G] e2e/uat/scripts/FEAT-16_verify_mdf_455_api_verify455_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/FEAT-16/uat_script.md: the copy of the manual UAT script build-feature writes alongside it.

### Modified files
- [B] backend/app/main.py: import `router as verify455_router` from `app.routers.verify455` and add `app.include_router(verify455_router)` in `create_app()` after the existing three registrations.

No lockfile changes: the item adds no dependency. No README.md or docs/DEVELOPMENT.md edit: the item changes no project structure, run configuration, dependency or test infrastructure (one more router in the existing routers package is not a structural change).

## Testing Strategy
- Unit tests: one test of the route through the app factory, lifespan not entered, no database (assumption 2).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, here `test_verify455_unit.py`
- Integration tests: none for this item. The toggle is ENABLED, but the item bounds coverage to one unit test (assumption 2) and the endpoint touches no repository or database.
  - Directory: backend/tests/integration/
- E2E tests: none. No criterion requires navigation or interaction through the UI; the endpoint has no frontend consumer.
  - Directory: e2e/tests/
  - File: not produced (would be `FEAT-16_verify_mdf_455_api_verify455.spec.ts`)
- UAT scenarios: one scenario per criterion plus one edge case (POST to the path returns 405), as an API-level check, not a browser interaction.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | GET /api/verify455 responds with HTTP 200 and the JSON body {"status": "ok"} | Unit | `test_get_verify455_returns_status_ok` | verifying it needs no navigation or interaction: it is an HTTP response of a router with no UI consumer |
| 2 | The endpoint is covered by one unit test | Unit | `test_get_verify455_returns_status_ok` | verifying it needs no navigation or interaction: it is a property of the test suite, met by the unit test itself |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/verify455 responds with HTTP 200 and the JSON body {"status": "ok"} | covered at Unit, see Criterion coverage | Given the backend is running, When a client sends GET /api/verify455, Then the response status is 200 and the body is {"status": "ok"} |
| 2 | The endpoint is covered by one unit test | covered at Unit, see Criterion coverage | Given the backend test suite, When `tests/unit/test_verify455_unit.py` runs, Then its test passes |

## Manual verification plan
### Criterion 1: GET /api/verify455 responds with HTTP 200 and the JSON body {"status": "ok"}
This criterion has no UI: the endpoint has no frontend consumer, so it is verified by reading the HTTP response.
Prerequisites: the stack is running from the repo root with `docker compose up -d --build backend` (the backend publishes port 8010 per docker-compose.yml; the database is not needed for this endpoint).
1. Open `http://localhost:8010/api/verify455` in a browser → the page shows the raw JSON `{"status":"ok"}`.
2. In a terminal, run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/api/verify455` → it prints `200`.
3. Open `http://localhost:8010/docs` → the Swagger page lists `GET /api/verify455` under the `verify455` tag, with a response schema holding the single field `status`.
4. In a terminal, run `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8010/api/verify455` → it prints `405` (edge case: the route is read-only).

### Criterion 2: The endpoint is covered by one unit test
This criterion has no UI: it is checked by running the test.
Prerequisites: backend dependencies installed (`uv sync --directory backend`); no database needs to be running.
1. From the repo root, run `uv run --directory backend pytest -q tests/unit/test_verify455_unit.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Open `backend/tests/unit/test_verify455_unit.py` → it holds the one test `test_get_verify455_returns_status_ok`, asserting status 200 and body `{"status": "ok"}`.
