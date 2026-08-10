# Implementation Plan, TEST-02: Health endpoint

## Feature
> Add a health-check endpoint to the FastAPI backend so the frontend and CI can verify the backend is up. Deliberately trivial; exercises the backend slice of the framework lifecycle.

## Acceptance Criteria
- [ ] `GET /api/health` returns HTTP 200 with JSON `{"status": "ok"}`.
- [ ] The endpoint reports database connectivity: when PostgreSQL is unreachable it returns HTTP 503 with `{"status": "degraded"}`.

## Plan Overview
Backend-only feature. Add a `GET /api/health` endpoint to the existing FastAPI app following the codebase's established router → service → schema slice (mirroring the TEST-05 version endpoint: `app/routers/version.py`, `app/services/version_service.py`, `app/schemas/version.py`). The service performs a bounded database connectivity check (`SELECT 1` over the already-installed `psycopg` driver, with a connect timeout so an unreachable host cannot hang the probe). The router maps the boolean result to 200 `{"status": "ok"}` or 503 `{"status": "degraded"}`. No repository layer is warranted: the check is a connectivity ping, not domain data access. No frontend, migration, or dependency changes.

**Assumptions (documented, not blocking):**
1. `{"status": "ok"}` is returned only when PostgreSQL is reachable; the two criteria together imply 200/ok is the DB-reachable case.
2. An **unset** `DATABASE_URL` counts as "PostgreSQL is unreachable" and returns 503 `{"status": "degraded"}`: connectivity cannot be verified, and the existing app deliberately boots without a database (`app/main.py` lifespan), so the health endpoint must answer rather than crash in that state.
3. The connectivity check must never raise to the client: any `psycopg` error (refused connection, timeout, auth failure) is logged with context and reported as degraded, never as a 500.

## Frontend Plan
No frontend changes required. The criteria are backend-only; the frontend and CI are consumers of the endpoint, and wiring a consumer is not in the acceptance criteria (no gold plating).

## Backend Plan
- Endpoints: `GET /api/health` — reports service liveness and database connectivity. Router `backend/app/routers/health.py`, `APIRouter(prefix="/api", tags=["health"])`, registered in `create_app()` in `backend/app/main.py` alongside the existing version and notes routers. No business logic in the router: it calls the service and maps `True` → 200 with `HealthResponse(status="ok")`, `False` → 503 with `HealthResponse(status="degraded")` (inject `Response` and set `status_code`, or return a `JSONResponse`; keep the declared `response_model=HealthResponse` accurate for both bodies).
- Service layer: `backend/app/services/health_service.py` — `check_database_connectivity() -> bool`. Reads settings via the existing `get_settings()` (fresh-from-environment semantics already established in `app/core/config.py`). Returns `False` with a logged warning when `database_url` is `None`. Otherwise opens a short-lived `psycopg.connect(url, connect_timeout=CONNECT_TIMEOUT_SECONDS)` (module-level `UPPER_SNAKE_CASE` constant, small value such as 2 seconds), executes `SELECT 1`, returns `True`; catches `psycopg.Error` (and `OSError` from name resolution), logs with context via the module `logging` logger (never `print`), returns `False`. It deliberately does not reuse `app.core.db.get_connection`: that dependency raises on a missing `DATABASE_URL` and has no timeout bound, both wrong for a health probe that must always answer.
- Repository layer: none. The check is a connection ping with no domain table access; a repository here would be gold plating.
- Schemas: `backend/app/schemas/health.py` — `HealthResponse(BaseModel)` with `status: Literal["ok", "degraded"]`, mirroring `schemas/version.py`.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/health`
- Request: no parameters, no body.
- Response (database reachable): HTTP 200, `Content-Type: application/json`
  ```json
  {"status": "ok"}
  ```
- Response (PostgreSQL unreachable or `DATABASE_URL` unset): HTTP 503, `Content-Type: application/json`
  ```json
  {"status": "degraded"}
  ```
- `POST /api/health` (and other methods): 405 Method Not Allowed (FastAPI default; no handler is added).

## Technology Selection
- Database connectivity check: chose a `SELECT 1` over the already-installed `psycopg` driver, over adding a health-check dependency (e.g. `fastapi-healthcheck`) — the check is a few lines and the driver is already a project dependency; never a new dependency for what a few lines can do.
- Bounding the probe: chose `psycopg`'s built-in `connect_timeout` connection parameter (a feature of the installed dependency) over a hand-rolled thread/signal timeout.
- Health router, schema, and service modules: net-new modules built on the already-installed FastAPI and pydantic; no stdlib call or platform feature replaces an HTTP endpoint the criteria require, so they are built here, matching the existing version-endpoint slice.
- No new dependency is added anywhere in this feature.

## File Manifest
### New files
- [B] backend/app/routers/health.py: `GET /api/health` router mapping the connectivity result to 200/503
- [B] backend/app/schemas/health.py: `HealthResponse` response model (`status: Literal["ok", "degraded"]`)
- [B] backend/app/services/health_service.py: `check_database_connectivity()` bounded `SELECT 1` probe
- [B] backend/tests/unit/test_health_service_unit.py: unit tests for the service (happy path, unset `DATABASE_URL` edge case, `psycopg` error case)
- [B] backend/tests/integration/test_health_integration.py: full HTTP cycle against the real database (200 ok; 503 degraded with `DATABASE_URL` pointed at a closed port; 405 on POST)
- [D] e2e/tests/TEST-02_health_endpoint.spec.ts: Playwright request-context spec against the backend base URL asserting the 200 contract
- [G] e2e/uat/scenarios/TEST-02_health_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/TEST-02_health_endpoint_uat_script.md: manual clickthrough script (includes stopping the db container to observe 503)
- [G] .claude/artifacts/TEST-02/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [B] backend/app/main.py: register the health router in `create_app()` (one `include_router` line plus import; the module docstring's router inventory comment is updated)
- [B] backend/tests/unit/test_main_unit.py: extend the route-registration assertions to include `/api/health`

No dependency manifest changes: `psycopg`, FastAPI, and pydantic are already installed, so `uv.lock` (and every other lockfile) is unchanged and carries no manifest entry.

Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependencies, or test infrastructure (build-feature Section 15's condition), so no `[Docs]` entry is listed.

## Testing Strategy
- Unit tests: `check_database_connectivity()` in isolation, `psycopg.connect` mocked (happy path returns `True`; edge case: unset `DATABASE_URL` returns `False` without attempting a connection; error case: `psycopg.OperationalError` from connect returns `False` and logs). Also extend the existing app-factory tests to assert the `/api/health` route is registered (`test_main_unit.py`, using its existing `_collect_route_paths` helper).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py → `test_health_service_unit.py`, `test_main_unit.py` (modified)
- Integration tests: router through the full HTTP request/response cycle using the shared session-scoped `client` fixture from `backend/tests/conftest.py` (which skips locally / fails in CI when `DATABASE_URL` is absent): 200 `{"status": "ok"}` against the real database; 503 `{"status": "degraded"}` with `DATABASE_URL` monkeypatched to an unreachable address (fresh `create_app()` + `TestClient`, same pattern as `test_version_integration.py`); 405 on POST as the validation-error case.
  - Directory: backend/tests/integration/ → `test_health_integration.py`
- E2E tests: Playwright request-context spec (`request` fixture) issuing `GET {backend base}/api/health` against the running compose stack and asserting status 200 and the exact JSON body. The backend base URL is `process.env.BACKEND_URL ?? "http://localhost:8010"`, matching docker-compose.yml's remapped backend port (host ports are offset; do not assume 8000). Criterion 2 (unreachable database) is not exercised in E2E: making the shared PostgreSQL container unreachable mid-run would break the parallel specs of other features and violate spec independence, so the degraded path is covered deterministically at the unit and integration tiers and manually in the UAT script.
  - Directory: e2e/tests/
  - File: TEST-02_health_endpoint.spec.ts
- UAT scenarios: one Gherkin scenario per acceptance criterion (healthy → 200 ok; database stopped → 503 degraded) plus one edge-case scenario (health endpoint answers without the frontend involved / wrong method rejected). Manual script walks starting the stack, calling the endpoint (browser or curl), then `docker compose stop db` and observing the 503, then `docker compose start db`.
  - Directory: e2e/uat/scenarios/ (feature file), e2e/uat/scripts/ (manual script)

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/health` returns HTTP 200 with `{"status": "ok"}` | Playwright request-context GET to the backend base URL; assert status 200, `content-type: application/json`, body deeply equals `{"status": "ok"}` | Given the compose stack is running with the database healthy, When I request `GET /api/health`, Then I receive HTTP 200 with body `{"status": "ok"}` |
| 2 | PostgreSQL unreachable → HTTP 503 with `{"status": "degraded"}` | Not exercised in E2E (stopping the shared database would break parallel specs and spec independence); covered by unit tests (mocked connect failure) and integration tests (`DATABASE_URL` pointed at a closed port → real 503 over HTTP) | Given the compose stack is running And the database container is stopped (`docker compose stop db`), When I request `GET /api/health`, Then I receive HTTP 503 with body `{"status": "degraded"}`; And after `docker compose start db` the endpoint returns 200 again |
