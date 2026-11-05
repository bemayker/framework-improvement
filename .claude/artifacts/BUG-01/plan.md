# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> A defect staged 2026-10-02 for sitting 2 of the 0.3.250 release run (wave 1). **Its reproduction only runs on the deployed environment**: locally there is no edge cache, so the bug cannot be seen. It exercises the `to_verify` route (merged, awaiting verification on the deployed environment).
>
> ## Defect
>
> On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> ## Reproduction (deployed only)
>
> 1. `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`
> 2. Expected: two different `now` values. Actual: identical values.
>
> Locally both calls differ, because nothing caches them.
>
> ## Acceptance criteria
>
> 1. `GET /api/time` responses carry `Cache-Control: no-store`.
> 2. A test asserts the header on the response.
> 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).
>
> ## Notes
>
> Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete.
>
> Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Plan Overview
Backend-only fix. `GET /api/time` sets `Cache-Control: no-store` on every response so the CDN in front of the deployed API stops storing it.

**Recorded assumption (the endpoint is absent from main).** FEAT-1 is `complete` in the tracker, but its code is not on `main` at plan base 6094657 (no `backend/app/routers/server_time.py`, no `/api/time` registration in `backend/app/main.py`; the sandbox reset removed it, as the `feature_map.md` BUG-01 row records). A header cannot be set on a route that does not exist, so this plan recreates `GET /api/time` to FEAT-1's own tracker contract, and only that contract: `200` with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, the body a Pydantic schema under `backend/app/schemas/`, router registered in `create_app()`. This is the minimum needed for criterion 1 to be satisfiable, not new scope; nothing beyond FEAT-1's contract plus the header is added (no other headers, no middleware, no change to other routes).

Layers: schema, service (time source), router (header), registration in `main.py`, plus unit and integration tests. No frontend, no database, no migration, no dependency change.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the current server time in UTC, response header `Cache-Control: no-store` on every response.
- Router (`backend/app/routers/server_time.py`): `APIRouter(prefix="/api", tags=["time"])`, same shape as `backend/app/routers/version.py`. The handler takes FastAPI's injected `response: Response` and sets `response.headers["Cache-Control"]` from a module constant `CACHE_CONTROL_NO_STORE = "no-store"`, with a one-line comment saying why (the CDN stores any response without a cache directive). Returns `ServerTimeResponse(now=..., timezone="UTC")` with `response_model=ServerTimeResponse`. The header is set in the router because it is an HTTP concern of this one route, not business logic and not app-wide policy.
- Service layer (`backend/app/services/server_time_service.py`): `get_current_utc_time() -> datetime`, returning `datetime.now(timezone.utc)`, called once per request so `now` is never cached in process. Timezone-aware, never naive.
- Schema (`backend/app/schemas/server_time.py`): `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: str`. Pydantic serialises an aware UTC datetime as ISO 8601 with an explicit offset (`...Z` or `+00:00`); the tests assert an explicit offset is present, not a particular spelling.
- Registration (`backend/app/main.py`): import `router as server_time_router` and add `app.include_router(server_time_router)` in `create_app()`, next to the existing registrations. Update the module docstring's list of registered routers by one clause. No other change to `main.py` (CORS, lifespan untouched).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters
- Response: `200 OK`, `Content-Type: application/json`, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-05T13:20:24.123456Z", "timezone": "UTC"}
```

- `now` is computed per request and always carries an explicit UTC offset (`Z` or `+00:00`).
- `POST /api/time` returns `405 Method Not Allowed` (FastAPI default; the only reachable error case).

## Technology Selection
- Current time: chose the standard library's `datetime.now(timezone.utc)` over any time dependency, because the stdlib covers an aware UTC timestamp completely.
- Cache directive: chose FastAPI's injected `Response` header (an installed dependency, already used by `backend/app/routers/health.py`) over a new caching middleware or package, because one header on one route needs no middleware.
- Response schema: chose Pydantic `BaseModel` (installed with FastAPI) over a bare dict, as FEAT-1's contract requires.
- No new dependency is added.

## File Manifest
<!--
  Phase tags: [0S]=Infrastructure Scaffolding, [A]=Frontend Plan, [B]=Backend Plan, [C]=API Integration Plan, [D]=Testing Strategy, [G]=Acceptance Test Outline, [Docs]=-
-->
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` from the `CACHE_CONTROL_NO_STORE` constant
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: datetime`, `timezone: str`)
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` returning an aware UTC datetime per call
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware, UTC offset zero, fresh per call)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests: 200 shape, `Cache-Control: no-store` header, explicit offset, per-request freshness, 405 on POST, answers with DATABASE_URL unset
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register `server_time_router` in `create_app()`; docstring router list gains one clause
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is registered

No dependency manifest changes, so no lockfile (`backend/uv.lock`, `frontend/package-lock.json`) is regenerated.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the change adds one route inside the existing backend layout and alters no project structure, run configuration, dependency or test infrastructure.
No E2E spec file: no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: `server_time_service.get_current_utc_time()` returns a timezone-aware datetime whose `utcoffset()` is zero (happy path); two successive calls are non-decreasing and are distinct objects computed per call (edge case, monkeypatching the clock source rather than sleeping); `create_app()` registers `/api/time` (in `test_main_unit.py`, alongside the existing route assertions).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: through the session `client` fixture in `backend/tests/conftest.py`, real HTTP request/response cycle, no database needed:
  - `GET /api/time` returns 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`.
  - The response carries `Cache-Control: no-store` (criterion 1 and 2), asserted on two consecutive responses so the header is not a first-response accident.
  - `now` parses as ISO 8601 with an explicit offset equal to zero (never naive).
  - Per-request freshness: two calls return different `now` values, made deterministic by monkeypatching `get_current_utc_time` (or the clock it reads) to return two distinct instants, never by `sleep`.
  - `POST /api/time` returns 405.
  - The endpoint answers 200 with `DATABASE_URL` unset (fresh `create_app()`, as `test_version_integration.py` does), since the time route must not depend on the database.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E Tests is ENABLED, but no criterion requires navigation or interaction through the UI (the endpoint has no frontend consumer), so per `testing_standards.md` Section 6 the browser tier is not warranted; Section 4's E2E row is scoped to E2E-tier criteria, of which there are none.
  - Directory: e2e/tests/
  - File: none (would be BUG-01_server_time_edge_cache.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (POST returns 405), API-level steps; criterion 3's scenario is tagged as deployed-environment only.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a response header on a router, asserted through the real HTTP cycle |
| 2 | A test asserts the header on the response | Integration | The criterion is satisfied by the integration test itself (`test_server_time_integration.py`), which asserts the header on real responses; no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | No UI path and no edge cache locally; the integration tier covers its two local preconditions (the `no-store` header and per-request freshness of `now`), and the deployed check itself is the human step in the Manual verification plan, run on the `to_verify` route after merge |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then the response status is 200 and the Cache-Control header is no-store |
| 2 | A test asserts the header on the response | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the header assertion passes with 0 failed |
| 3 | After deploy, the reproduction returns two different values | covered at Integration, see Criterion coverage (deployed check is human) | Given the fix is deployed behind the CDN, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally, e.g. the handover stack or `uv run --directory backend uvicorn app.main:app --port 8000`; no database is needed for this route.
1. In a terminal run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the response headers of that same output → a line `cache-control: no-store` is present (header names are case-insensitive).
3. Read the body → JSON of the form `{"now":"2026-11-05T13:20:24.123456Z","timezone":"UTC"}`, where `now` ends in `Z` or `+00:00` and `timezone` is `UTC`.
4. Run `curl -si -X POST http://localhost:8000/api/time` → status `405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out on the BUG-01 branch, `uv` installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the run ends with `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test asserts `response.headers["cache-control"] == "no-store"` on the `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable through the UI and not reproducible locally (there is no edge cache locally). The observable check is on the deployed environment, performed by a human after merge, while the item carries `mayker:to-verify`.
Prerequisites: the merge is deployed; you know the deployed API host (`docs/DEVELOPMENT.md` → Test environments currently has no row, so take the host from whoever operates the deployment).
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header, and no `age:` header greater than 0 and no CDN cache-hit marker (such as `x-cache: HIT` or `cf-cache-status: HIT`).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ (the second is about one second later).
3. If both checks hold, remove the `mayker:to-verify` tag from the tracker item; if the two `now` values are identical, run `/fix BUG-01`.
