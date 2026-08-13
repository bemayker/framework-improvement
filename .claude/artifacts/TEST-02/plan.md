# Implementation Plan, TEST-02: Health endpoint

## Feature
> Tracker twin of `docs/issues/TEST-02.md` in `bemayker/framework-improvement` (the validation sandbox). Under Work Item Source `hybrid` this task is the authoritative source for TEST-02; the local file is shadowed. Created by MDF-034 so milestone validation exercises real tracker MCP calls.
>
> **Description / expected behaviour:** Add a health-check endpoint to the FastAPI backend so the frontend and CI can verify the backend is up. Deliberately trivial; exercises the backend slice of the framework lifecycle.
>
> **Acceptance criteria:**
> - [ ] `GET /api/health` returns HTTP 200 with JSON `{"status": "ok"}`.
> - [ ] The endpoint reports database connectivity: when PostgreSQL is unreachable it returns HTTP 503 with `{"status": "degraded"}`.
>
> **Framework metadata:** type: feature; branch: `feature/TEST-02-health-endpoint`; depends_on: TEST-01; scaffold: false.

## Acceptance Criteria
- [ ] `GET /api/health` returns HTTP 200 with JSON `{"status": "ok"}` (payload extended with a `database` key per the 2026-07-31 tracker comment, see Re-Plan Feedback).
- [ ] The endpoint reports database connectivity: when PostgreSQL is unreachable it returns HTTP 503 with `{"status": "degraded"}`.

## Re-Plan Feedback
- Comment (tracker, 2026-07-31, id 90150246755487, item 1): "The endpoint should report the database connection state, not just return 200." → Addressed by: acceptance criterion 2 plus the design below. The endpoint never answers from configuration alone: the service layer runs a real `SELECT 1` probe against PostgreSQL on every request, and only a successful probe yields 200 `{"status": "ok"}`. Any probe failure, including an unset `DATABASE_URL`, yields 503 `{"status": "degraded"}`.
- Comment (tracker, 2026-07-31, id 90150246755487, item 2): "Return the resolved database host and port in the payload, not the configured ones." → Addressed by: the API Contract adds a `database: {host, port}` object to both responses. When healthy, host and port are read from the **live connection** (`psycopg` `Connection.info.host` / `.port`, the values as connected, which is where a host-assigned port shows up), never from the configured URL. When degraded, no live connection exists, so the payload reports the **attempted** target parsed from `DATABASE_URL` (`psycopg.conninfo.conninfo_to_dict`; port defaults to 5432 when the URL names none, matching libpq), and `{"host": null, "port": null}` when `DATABASE_URL` is unset. Recorded assumption: this comment overrides criterion 1's literal payload `{"status": "ok"}` (a tracker comment overrides the description where the two disagree), so the 200 body carries `status` plus `database` and tests assert exactly that shape.
- Comment (tracker, 2026-07-31, id 90150246755487, item 3): "One unit test is not enough; cover the unhealthy path too." → Addressed by: the Testing Strategy covers the unhealthy path at two tiers. Unit: the service returns degraded when the probe raises and when `DATABASE_URL` is unset (probe mocked). Integration: a real HTTP request against an app whose `DATABASE_URL` points at an unreachable target (`127.0.0.1:9`) must return 503 with `{"status": "degraded"}` through the full request/response cycle.
- Comment (tracker, 2026-07-28, id 90150245599545): historical state-reconciliation note about the status-mapping defect (MDF-058), since fixed. → Not acted on because it carries no planning content for this feature; recorded here so no comment is silently dropped.

## Plan Overview
Backend-only feature. Add `GET /api/health` to the FastAPI app following the project's existing Router → Service pattern (see `app/routers/version.py`, `app/services/version_service.py`): a `health` router delegating to a `health_service`, which runs a bounded connectivity probe through a new low-level helper in `app/core/db.py` (the module that already owns all `psycopg` connection concerns). Healthy → 200 `{"status": "ok", "database": {host, port}}` with host/port from the live connection; unreachable or unset database → 503 `{"status": "degraded", "database": {...}}` with the attempted target. No frontend work, no migrations, no new dependencies.

Two recorded design constraints:
- The probe passes `connect_timeout` (constant, 2 seconds) to `psycopg.connect`, so an unreachable host answers 503 in bounded time instead of hanging the request. A health probe that hangs is not a probe; this is required to satisfy criterion 2, not gold plating.
- Known pre-existing constraint, out of scope: `app/main.py`'s lifespan calls `ensure_schema()` at startup and raises when the database is down at boot (TEST-03 behaviour). This feature reports database health at **runtime**; it does not change startup behaviour. Noted for the PR description.

## Frontend Plan
No frontend changes required. (The feature exposes a backend endpoint; nothing in the acceptance criteria renders it. Design reference mode is NONE and no UI is planned.)

## Backend Plan
- Endpoints: `GET /api/health` (router `app/routers/health.py`, prefix `/api`, tags `["health"]`, matching the version router's shape). Returns 200 with `HealthResponse` when the probe succeeds; returns 503 with the same schema (`status: "degraded"`) via a `JSONResponse` when it fails. No business logic in the router.
- Service layer: `app/services/health_service.py` with `get_health() -> HealthReport` (frozen dataclass: `status`, `host`, `port`). Logic: read `get_settings().database_url`; unset → degraded with `host=None, port=None` (logged as an error, matching `get_connection`'s posture); otherwise call the probe; success → `ok` with the connection's own resolved host/port; `psycopg.Error` → degraded with the attempted target from `psycopg.conninfo.conninfo_to_dict` (logged with context). No `print()`, standard `logging` as in the existing modules.
- Repository layer: none. There is no domain data access; the connectivity probe is a connection concern and lives in `app/core/db.py` as `probe_connection(database_url: str) -> tuple[str, int]`: connect with `connect_timeout=2`, execute `SELECT 1`, return `(connection.info.host, connection.info.port)`, close; raises `psycopg.Error` on any failure.
- Migrations: none. No schema change.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/health`
- Request: none (no parameters, no body)
- Response 200 (database reachable):

  ```json
  {"status": "ok", "database": {"host": "db", "port": 5432}}
  ```

  `database.host`/`database.port` are the live connection's resolved values (`Connection.info`), not the configured ones.
- Response 503 (database unreachable or `DATABASE_URL` unset):

  ```json
  {"status": "degraded", "database": {"host": "db", "port": 5432}}
  ```

  `database` reports the attempted target parsed from `DATABASE_URL`; both fields are `null` when `DATABASE_URL` is unset.
- Schema: `HealthResponse` in `app/schemas/health.py` (`status: Literal["ok", "degraded"]`, `database: DatabaseTarget` with `host: str | None`, `port: int | None`).
- Any other method on the path: 405 (FastAPI default, as with `/api/version`).

## Technology Selection
- Database connectivity probe: chose the already-installed `psycopg` (`psycopg.connect` + `SELECT 1`) over a stdlib `socket` TCP check, because an accepted TCP connection does not prove PostgreSQL can authenticate and serve a query, which is what "reports database connectivity" means here. No new dependency.
- Resolved host/port reporting: chose `psycopg`'s own `Connection.info` (healthy path) and `psycopg.conninfo.conninfo_to_dict` (degraded path) over stdlib `urllib.parse`, because psycopg parses every libpq conninfo form the configured `DATABASE_URL` may take and is already installed; `urllib.parse` handles only the URL form.
- Response schema: pydantic `BaseModel` (already installed with FastAPI, matching every existing file in `app/schemas/`); no alternative considered necessary.
- No net-new dependency is added by this feature.

## File Manifest
### New files
- [B] backend/app/schemas/health.py: `HealthResponse` and `DatabaseTarget` response schemas for `GET /api/health`.
- [B] backend/app/services/health_service.py: health business logic (`get_health()` mapping probe outcome to ok/degraded plus resolved target).
- [B] backend/app/routers/health.py: `GET /api/health` router, 200/503 mapping, no business logic.
- [B] backend/tests/unit/test_health_service_unit.py: service unit tests (probe mocked): happy path, unset-`DATABASE_URL` edge case, probe-failure error case.
- [B] backend/tests/integration/test_health_integration.py: full HTTP cycle: 200 healthy against the real database, 503 degraded against an unreachable target, 405 on POST.
- [G] e2e/uat/scenarios/TEST-02_health_endpoint.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (unset `DATABASE_URL`).
- [G] e2e/uat/scripts/TEST-02_health_endpoint_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-02/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/core/db.py: add `probe_connection(database_url)` (bounded `SELECT 1` probe returning the live connection's resolved host/port).
- [B] backend/app/main.py: register the health router in `create_app()` (one `include_router` line, matching version/notes).
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_health_route` asserting `/api/health` is wired in.

No dependency manifest changes, so no lockfile is touched (`psycopg`, FastAPI and pydantic are already installed). Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure, and the README documents none of the existing endpoints.

## Testing Strategy
- Unit tests: `health_service.get_health()` with the probe mocked. Happy path (probe returns a resolved target → `ok`), edge case (unset `DATABASE_URL` → `degraded` with null target, probe never called), error case (probe raises `psycopg.OperationalError` → `degraded` with the attempted target). Plus the app-factory registration test in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (`test_health_service_unit.py`; route registration goes into the existing `test_main_unit.py`)
- Integration tests: router through the full HTTP request/response cycle. 200 healthy against the real PostgreSQL instance (via the shared `database_url` fixture in `backend/tests/conftest.py`, so the CI fail / local skip semantics of `require_database_url` apply); 503 degraded with `DATABASE_URL` monkeypatched to `postgresql://tasknotes:tasknotes@127.0.0.1:9/tasknotes` (closed port, fails fast under the probe's `connect_timeout`); 405 on POST. Test note for the builder: the 503 test must use `TestClient(app)` **without** entering its context manager, because the app lifespan runs `ensure_schema()` and would raise against the unreachable target before any request is made.
  - Directory: backend/tests/integration/ (`test_health_integration.py`)
- E2E tests: not warranted for this feature. Neither criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6's fourth question, per criterion: both are HTTP status/payload behaviours of a backend endpoint no UI consumes), so no `e2e/tests/TEST-02_*.spec.ts` is produced and the per-feature edge-case spec obligation does not attach.
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge-case scenario (unset `DATABASE_URL` → degraded), validated for well-formedness, not executed as browser tests.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/health` returns HTTP 200 with JSON `{"status": "ok"}` (plus resolved `database` target per tracker comment) | Integration | Verifying it needs no navigation or interaction: it is a router behaviour over the real HTTP cycle and real database; no UI consumes the endpoint |
| 2 | When PostgreSQL is unreachable the endpoint returns HTTP 503 with `{"status": "degraded"}` | Integration | Same: failure is injected via `DATABASE_URL`, asserted over the real HTTP cycle; a browser adds nothing and a smoke test can never reach this path (tracker comment item 3) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/health` returns 200 `{"status": "ok"}` with resolved database target | covered at Integration, see Criterion coverage | Given the backend and PostgreSQL are running, When a client requests GET /api/health, Then the response is HTTP 200 with status "ok" and the database host and port as actually connected |
| 2 | Unreachable PostgreSQL → 503 `{"status": "degraded"}` | covered at Integration, see Criterion coverage | Given the backend is running and PostgreSQL is stopped, When a client requests GET /api/health, Then the response is HTTP 503 with status "degraded" and the attempted database target |

## Manual verification plan
### Criterion 1: `GET /api/health` returns HTTP 200 with JSON `{"status": "ok"}`
This criterion is not verifiable through the UI (no frontend consumes the endpoint); the observable check is the HTTP response itself, read with curl.
Prerequisites: Docker running; the stack up via `docker compose up -d` from the repo root; wait until `docker compose ps` shows the `db` service healthy and `backend` running.
1. In a terminal, run `curl -i http://localhost:8010/api/health` → the first response line reads `HTTP/1.1 200 OK`.
2. Read the response body → exactly `{"status":"ok","database":{"host":"db","port":5432}}`: `status` is `ok`, and `database.host`/`database.port` are the values the backend actually connected with inside the compose network (`db`, `5432`), not the host-published port `5442`, which is the "resolved, not configured" behaviour the tracker comment asks for.

### Criterion 2: when PostgreSQL is unreachable the endpoint returns HTTP 503 with `{"status": "degraded"}`
This criterion is not verifiable through the UI either; the observable check is the HTTP response after stopping the database.
Prerequisites: criterion 1 just verified, stack still up.
1. In a terminal, run `docker compose stop db` → the command reports the `db` container stopped.
2. Run `curl -i http://localhost:8010/api/health` → the first response line reads `HTTP/1.1 503 Service Unavailable`, within roughly 2 seconds (the probe's connect timeout), never hanging.
3. Read the response body → `{"status":"degraded","database":{"host":"db","port":5432}}`: `status` is `degraded` and `database` still names the attempted target.
4. Run `docker compose start db`, wait for `docker compose ps` to show `db` healthy again, and re-run `curl -i http://localhost:8010/api/health` → `HTTP/1.1 200 OK` with `{"status":"ok",...}`, confirming recovery without a backend restart.
