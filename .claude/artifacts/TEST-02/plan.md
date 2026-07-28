# Implementation Plan, TEST-02: Health endpoint

## Feature
> Add a health-check endpoint to the FastAPI backend so the frontend and CI can verify the backend is up. Deliberately trivial; exercises the backend slice of the framework lifecycle.
>
> (Authoritative source: ClickUp task `86caweme3`, "Health endpoint", status "to do". `docs/issues/TEST-02.md` is a shadow copy and matches.)

## Acceptance Criteria
- [ ] `GET /api/health` returns HTTP 200 with JSON `{"status": "ok"}`.
- [ ] The endpoint reports database connectivity: when PostgreSQL is unreachable it returns HTTP 503 with `{"status": "degraded"}`.

## Plan Overview
A backend-only feature: one router, one service, one repository, one schema, added to the existing FastAPI app on the Router → Service → Repository pattern the TEST-01 scaffold established as empty packages (`coding_standards.md` Section 2.2). `GET /api/health` probes PostgreSQL and answers `200 {"status": "ok"}` when the probe succeeds, `503 {"status": "degraded"}` when it does not.

The scaffold left no database layer: `backend/app/core/config.py` reads `DATABASE_URL` from the environment but opens no connection, and there is no engine, session, or model anywhere in the tree. TEST-02 therefore has to obtain database connectivity itself, and does so in the smallest way that satisfies the criterion (`CLAUDE.md` → Architecture Notes, "keep every feature as small as possible"): a short-lived `psycopg` connection running `SELECT 1` with a bounded connect timeout, isolated in a single repository module. **No shared engine/session layer, no ORM, no models, no migrations, no `backend/app/core/db.py`** are introduced — see the assumptions below.

No frontend work: the acceptance criteria describe an API contract only, and adding UI for it would be gold plating (`user_story_alignment.md` Section 3).

### Assumptions (recorded per `user_story_alignment.md` Section 2, to be carried into the PR description)
1. **How TEST-02 obtains database connectivity.** The connectivity probe is a direct `psycopg` (v3) connection opened per request in `backend/app/repositories/health_repository.py`, executing `SELECT 1` and closing immediately, with a module-level connect timeout constant of 2 seconds so an unreachable database fails fast instead of hanging the endpoint. Rationale: the only thing the criterion asks for is "is PostgreSQL reachable"; an ORM, an engine, a session factory, or a connection pool are all larger than the question. `psycopg[binary]` is added to `backend/pyproject.toml`; SQLAlchemy is **not**.
2. **A shared DB layer is out of scope, deliberately.** TEST-03 ("Simple note form", open PR, not merged and not a dependency of TEST-02) introduces `backend/app/core/db.py` with a SQLAlchemy engine/session layer. That branch is not in this worktree and this plan does not build against it. Once TEST-03 is merged, folding the health probe onto the shared engine is a reasonable follow-up refactor; it is not part of TEST-02. See `shared_risks.md` for the merge-order consequence.
3. **`DATABASE_URL` unset counts as unreachable.** `Settings.database_url` is `str | None`. When it is `None` (or empty), the repository does not attempt a connection and reports the database as unreachable, so the endpoint answers `503 {"status": "degraded"}`. A misconfigured backend is not a healthy backend, and this keeps the endpoint total — it never raises.
4. **`503` uses the same body shape as `200`.** Only the two literal bodies in the criteria (`{"status": "ok"}` / `{"status": "degraded"}`) are returned. No `detail`, no error code, no per-dependency breakdown, no version field.
5. **No `AppException` subclass is introduced.** `coding_standards.md` Section 2.3 asks for custom exceptions with global handlers for error paths; an unreachable database is a *modelled state* of this endpoint rather than an error propagated to the client, so the repository catches `psycopg.Error`/`OSError`, logs a warning with context via the stdlib `logging` module (`CLAUDE.md` names no logging library), and returns `False`. Introducing an exception hierarchy for a state the endpoint reports as a normal response would be over-engineering (Section 1, KISS). Recorded here so it reads as a decision, not an omission.
6. **CI needs `DATABASE_URL` for the integration tier.** `.github/workflows/pr-tests.yml` starts Docker Compose (which publishes Postgres on host port 5432) but exports no `DATABASE_URL` to the pytest steps, so the backend test process would currently see it unset. The integration step gets an explicit `env:` block; the tests themselves hardcode no connection string (`testing_standards.md` Section 5) and skip with a clear reason when the variable is absent, which keeps a developer's `uv run pytest` green without Compose running while CI always exercises the real path.

## Frontend Plan
No frontend changes required. Both acceptance criteria are API-level; nothing renders this endpoint and no criterion asks for it. Consuming `/api/health` from the UI is explicitly out of scope (`user_story_alignment.md` Section 3).

## Backend Plan
- **Endpoints:** `GET /api/health` — reports service liveness plus PostgreSQL reachability. Registered on a router with prefix `/api` and tag `health`.
- **Router** (`backend/app/routers/health.py`): declares the route, calls the service, and maps the outcome to an HTTP status code (`200` for `ok`, `503 SERVICE_UNAVAILABLE` for `degraded`) by setting `response.status_code` on the injected `fastapi.Response`. No business logic, no database access (`coding_standards.md` Section 2.2 point 1). Declares `response_model=HealthResponse` and `responses={503: {"model": HealthResponse}}` so the OpenAPI schema documents both outcomes.
- **Service layer** (`backend/app/services/health_service.py`): `get_health() -> HealthResponse` — the one piece of business logic, translating "is the database reachable" into the reported status (`"ok"` / `"degraded"`). No transactional boundary is needed: the probe is a single read-only statement that opens and closes its own connection.
- **Repository layer** (`backend/app/repositories/health_repository.py`): `is_database_reachable() -> bool` — returns `False` immediately when `settings.database_url` is falsy; otherwise opens a `psycopg.connect(..., connect_timeout=HEALTH_CHECK_CONNECT_TIMEOUT_SECONDS)` inside a context manager, executes `SELECT 1`, and returns `True`. Catches `psycopg.Error` and `OSError`, logs a warning with the failure reason (never the credentials), and returns `False`. `HEALTH_CHECK_CONNECT_TIMEOUT_SECONDS = 2` is a module-level constant (`UPPER_SNAKE_CASE`, Section 2.1) so the degraded path is fast and bounded.
- **Schemas (DTO)** (`backend/app/schemas/health.py`): `HealthResponse(BaseModel)` with `status: Literal["ok", "degraded"]`. Kept separate from any domain model (Section 2.2 point 4); there is no domain model here.
- **Models (domain):** none. This feature reads no application data.
- **Migrations:** none. No schema changes; the probe runs `SELECT 1`.
- **App wiring** (`backend/app/main.py`): `create_app()` gains one `app.include_router(health.router)` call. The factory's existing shape is untouched, exactly as its own docstring anticipates.
- **Dependencies** (`backend/pyproject.toml`): add `psycopg[binary]>=3.2` to `[project].dependencies`; `backend/uv.lock` is regenerated by `uv sync`/`uv lock`.

## API Integration Plan
No external API integration. The endpoint is internal and consumes no third-party service.

## API Contract
- **Method:** `GET`
- **URL:** `/api/health`
- **Request:** no path parameters, no query parameters, no body, no authentication.
- **Response, database reachable — HTTP 200, `application/json`:**

  ```json
  { "status": "ok" }
  ```

- **Response, database unreachable or `DATABASE_URL` unset — HTTP 503, `application/json`:**

  ```json
  { "status": "degraded" }
  ```

- **No other status codes are produced.** The endpoint never raises: every connectivity failure is caught in the repository and surfaced as `degraded`. Worst-case latency on the degraded path is the 2-second connect timeout.

## File Manifest
### New files
- `backend/app/routers/health.py`: `APIRouter` (prefix `/api`, tag `health`) exposing `GET /health`; maps the service result to 200/503.
- `backend/app/services/health_service.py`: `get_health() -> HealthResponse`, the ok/degraded decision.
- `backend/app/repositories/health_repository.py`: `is_database_reachable() -> bool`, short-lived `psycopg` connection running `SELECT 1` with a 2-second connect timeout; catches and logs connection failures.
- `backend/app/schemas/health.py`: `HealthResponse` DTO (`status: Literal["ok", "degraded"]`).
- `backend/tests/unit/test_health_service_unit.py`: unit tests for the service with the repository patched.
- `backend/tests/unit/test_health_repository_unit.py`: unit tests for the repository with `psycopg.connect` patched.
- `backend/tests/integration/test_health_integration.py`: router tests through the real HTTP cycle against the Compose PostgreSQL instance (200 path) and against an unreachable endpoint (503 path).
- `e2e/uat/scenarios/TEST-02_health_endpoint.feature`: Gherkin UAT scenarios (UAT Generation ENABLED).
- `e2e/uat/scripts/TEST-02_health_endpoint_uat_script.md`: manual UAT clickthrough/curl script.

### Modified files
- `backend/app/main.py`: register the health router in `create_app()` (one `include_router` line plus its import). No other change to the factory.
- `backend/pyproject.toml`: add `psycopg[binary]>=3.2` to `[project].dependencies`.
- `backend/uv.lock`: regenerated to include `psycopg` and its transitive dependencies.
- `backend/tests/unit/test_main_unit.py`: `test_create_app_registers_no_feature_routes` asserts the app has **no** custom routes and will fail the moment the health router lands. Replace it with `test_create_app_registers_health_route`, asserting `/api/health` is among the app's routes. The other two tests in the file are unaffected.
- `.github/workflows/pr-tests.yml`: add an `env:` block to the "Backend integration tests" step exporting `DATABASE_URL: postgresql://tasknotes:tasknotes@localhost:5432/tasknotes` (matching the `docker-compose.yml` defaults for the published host port), so the integration tier reaches the Compose database instead of skipping. No other step or guard changes.

> `backend/app/core/config.py` and `backend/tests/conftest.py` are deliberately **not** modified: `Settings.database_url` already exposes what the repository needs, and the degraded-path fixture stays local to the integration test module rather than being added to the shared `conftest.py`. Both files are on TEST-03's open-PR surface, so leaving them untouched removes two merge conflicts for free (`shared_risks.md`).

## Testing Strategy
- **Unit tests:** the service's ok/degraded decision (repository patched) and the repository's connection handling (`psycopg.connect` patched). Per `testing_standards.md` Section 1.1, each tested function gets a happy path, an edge case, and an error case:
  - `test_health_service_unit.py` — reachable database returns `status="ok"`; unreachable database returns `status="degraded"`; a repository that raises unexpectedly propagates nothing beyond the documented contract (the service is asserted to depend only on the boolean, so a raising repository is a genuine defect and the test pins the boundary).
  - `test_health_repository_unit.py` — a stubbed connection yielding `SELECT 1` returns `True` (happy path); `DATABASE_URL` unset returns `False` without attempting a connection (edge case); `psycopg.connect` raising `psycopg.OperationalError` returns `False` and logs a warning (error case).
  - Naming follows `test_{method_or_action}_{scenario}_{expected_outcome}` (`testing_standards.md` Section 3).
  - Directory: `backend/tests/unit/` — naming `test_{module}_unit.py` (per `CLAUDE.md` Test Configuration).
- **Integration tests:** ENABLED. Router layer through the full HTTP request/response cycle against the real PostgreSQL instance from `docker-compose.yml`:
  - happy path — `GET /api/health` returns `200` and exactly `{"status": "ok"}`;
  - error path — with `DATABASE_URL` pointed at a closed port on localhost (a real connection attempt to a dead endpoint, not a mocked database — `testing_standards.md` Section 5), the same request returns `503` and exactly `{"status": "degraded"}`.
  - Both use a function-scoped `TestClient` built after the environment is patched, defined in the test module (not in the shared `conftest.py`), so the two cases cannot leak state into each other or into the session-scoped `client` fixture.
  - The connection string is read from `DATABASE_URL`, never hardcoded; the module skips with an explicit reason when it is unset (CI always sets it, per assumption 6).
  - Directory: `backend/tests/integration/` — naming `test_{module}_integration.py`.
- **E2E tests:** no new spec is warranted for this item, and no existing spec changes. The E2E toggle is ENABLED and stays on for the project, but TEST-02 adds no UI surface: neither acceptance criterion involves navigation or interaction (`testing_standards.md` Section 6, tier-selection table), and driving `/api/health` from Playwright would be an API call dressed as a browser test — the explicit anti-pattern in Section 5 ("do NOT write E2E tests that bypass the UI, that is a router integration test"). The browser-level coverage that exists (`e2e/tests/TEST-01_static_landing_page.spec.ts`) is unaffected by this change, and both criteria are covered end-to-end by the router integration tests above.
  - Directory (unchanged, no file added): `e2e/tests/`
- **UAT scenarios:** ENABLED. One Gherkin scenario per acceptance criterion plus one edge-case scenario (`DATABASE_URL` unset ⇒ degraded), verifiable by a human with Docker Compose and `curl`. Gherkin well-formedness is validated by CI on merge to main; the manual script is the human artifact.
  - Directory: `e2e/uat/scenarios/` (`TEST-02_health_endpoint.feature`) and `e2e/uat/scripts/` (`TEST-02_health_endpoint_uat_script.md`).

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/health` returns HTTP 200 with `{"status": "ok"}` | No browser spec (no UI surface; browser-level coverage would bypass the UI — see Testing Strategy). Covered by `test_health_integration.py` happy path: real HTTP request through `TestClient` against the Compose PostgreSQL instance, asserting status 200 and the exact body | Given Docker Compose is up with a healthy `db` service, When I `curl -i http://localhost:8000/api/health`, Then I see `HTTP/1.1 200 OK` and the body `{"status": "ok"}` |
| 2 | Unreachable PostgreSQL returns HTTP 503 with `{"status": "degraded"}` | No browser spec (same reason). Covered by `test_health_integration.py` error path: same real HTTP request with `DATABASE_URL` pointed at a closed local port, asserting status 503 and the exact body | Given Docker Compose is up, When I stop the `db` service (`docker compose stop db`) and `curl -i http://localhost:8000/api/health`, Then I see `HTTP/1.1 503 Service Unavailable` and the body `{"status": "degraded"}` within a couple of seconds |
| — | Edge case (no criterion, covered for robustness) | Not applicable | Given the backend runs with `DATABASE_URL` unset, When I `curl -i http://localhost:8000/api/health`, Then I see `HTTP/1.1 503 Service Unavailable` and `{"status": "degraded"}` rather than a 500 or a hang |
