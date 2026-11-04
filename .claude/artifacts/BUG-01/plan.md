# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> A defect staged 2026-10-02 for sitting 2 of the 0.3.250 release run (wave 1). **Its reproduction only runs on the deployed environment**: locally there is no edge cache, so the bug cannot be seen. It exercises the `to_verify` route (merged, awaiting verification on the deployed environment).
>
> **Defect:** On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> **Reproduction (deployed only):**
> 1. `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`
> 2. Expected: two different `now` values. Actual: identical values.
>
> Locally both calls differ, because nothing caches them.
>
> **Acceptance criteria**
> 1. `GET /api/time` responses carry `Cache-Control: no-store`.
> 2. A test asserts the header on the response.
> 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).
>
> **Notes:** Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete.
>
> Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): 24 comments, all the framework's own "PR opened" notices from earlier runs whose code was reset → not acted on because none states a requirement, correction or clarification; they describe branches that no longer exist on main.
- Assumption (no comment, recorded so the plan reviewer can see it): FEAT-1 is `complete` in the tracker, but its code is absent from main. `backend/app/routers/server_time.py`, any server-time schema or service, its tests, and its registration in `backend/app/main.py` do not exist (checked: a search of `backend/` for `server_time` and `api/time` returns nothing; `create_app()` registers only the version, notes and health routers). The defect cannot be fixed on an endpoint that does not exist, and a `GET /api/time` returning 404 would make criteria 1 and 3 unverifiable. This plan therefore recreates the endpoint exactly to FEAT-1's own acceptance criteria (200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, body defined by a Pydantic schema in `backend/app/schemas/`, unit and integration tests for shape, offset and freshness) and adds the `Cache-Control: no-store` fix on top. Nothing beyond FEAT-1's criteria is added (no query parameters, no other timezones, no frontend). The `feature_map.md` row for BUG-01 records the same conclusion.
- Assumption: "explicit offset" is read as the numeric `+00:00` suffix that Python's `datetime.isoformat()` produces for an aware UTC value, not the `Z` designator Pydantic's default datetime serialiser emits; the schema serialises `now` through `isoformat()` so the wire value always ends `+00:00`.
- Merged since the last plan: n/a (fresh plan, branched from current main f7e2be6).

## Plan Overview
Recreate the `GET /api/time` endpoint (FEAT-1's contract, absent from main since the sandbox reset) in the existing Router to Service to Schema layering used by the version and health endpoints, and make every response from it carry `Cache-Control: no-store` so an edge cache in front of the API never stores it. The header is set in the router on the injected FastAPI `Response`, from one module constant, so it is present on every response the route produces. The router is registered in `create_app()` in `backend/app/main.py`. Backend only: no frontend, no database, no new dependency. Criterion 3 is a human check on the deployed environment after merge; locally it is represented by the header assertion (the cause) and a per-request freshness test (the symptom).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` (new file `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, `response_model=ServerTimeResponse`). The handler takes `response: Response` (FastAPI's injected response), sets `response.headers["Cache-Control"] = NO_STORE` where `NO_STORE = "no-store"` is a module constant, and returns `ServerTimeResponse(now=get_current_utc_time(), timezone="UTC")`. No other method is defined, so `POST /api/time` is 405.
- Service layer: new `backend/app/services/server_time_service.py` with `get_current_utc_time() -> datetime`, returning `datetime.now(timezone.utc)` on every call (never cached at import or in the router), so two calls a second apart differ and the value is always timezone-aware.
- Schema: new `backend/app/schemas/server_time.py` with `ServerTimeResponse(BaseModel)`: `now: datetime`, `timezone: Literal["UTC"]`, plus a `@field_serializer("now")` returning `value.isoformat()` so the JSON value carries the explicit `+00:00` offset.
- App factory: `backend/app/main.py` imports the router and adds `app.include_router(server_time_router)` in `create_app()`, and the module docstring's list of registered routers gains it. The CORS middleware and lifespan are untouched.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no parameters.
- Response: 200, `application/json`, schema `ServerTimeResponse`, header `Cache-Control: no-store`:

```json
{"now": "2026-11-04T20:42:29.123456+00:00", "timezone": "UTC"}
```

`now` is computed per request, always timezone-aware UTC, serialised with an explicit `+00:00` offset (never naive, never `Z`). `timezone` is always the literal `"UTC"`. `POST /api/time` returns 405 (FastAPI default; no handler).

## Technology Selection
- Current time: chose the standard library `datetime.now(timezone.utc)` over any time library (`pendulum`, `arrow`), because the stdlib produces an aware UTC value and its `isoformat()` already emits the explicit offset.
- Cache directive: chose a plain `Cache-Control` response header set on FastAPI's injected `Response` (platform HTTP feature, installed framework) over a caching middleware or a dependency such as `fastapi-cache`, because one header on one route is all the defect needs and a middleware would widen it to routes nobody asked about.
- Response schema: chose Pydantic `BaseModel` with a `field_serializer` (installed via FastAPI) over a bare dict or a string-typed `now`, because FEAT-1 requires a Pydantic schema and keeping `now` a `datetime` keeps the awareness checkable in the service.
- Router, service and schema modules: no stdlib call, native platform feature or installed dependency replaces them; they follow the existing `version` and `health` module shape.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` from the `NO_STORE` constant on every response
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()`, per-call aware UTC time
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` (`now: datetime` serialised via `isoformat()`, `timezone: Literal["UTC"]`)
- [B] backend/tests/unit/test_server_time_service_unit.py: service returns aware UTC, zero offset, fresh value per call
- [B] backend/tests/integration/test_server_time_integration.py: HTTP cycle for shape, offset, freshness, the `Cache-Control: no-store` header, 405 on POST, OpenAPI schema reference
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (header present on every repeated call)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the server-time router in `create_app()`; docstring router list updated
- [B] backend/tests/unit/test_main_unit.py: assert `create_app()` registers `/api/time`

No dependency changes, so no lockfile (`backend/uv.lock`, `package-lock.json`) is regenerated.
No `README.md` or `docs/DEVELOPMENT.md` edit is expected: the feature adds a route but changes no project structure, run configuration, dependency or test infrastructure, and neither document lists the API's endpoints.
No E2E spec is produced: no criterion is assigned to the E2E tier (see Criterion coverage).

## Testing Strategy
- Unit tests: `server_time_service.get_current_utc_time()` and the app factory's registration.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (new `test_server_time_service_unit.py`; extend existing `test_main_unit.py`)
  - Cases: happy path, the result's `tzinfo` is not None and `utcoffset()` is zero; edge case, two calls with the module's clock monkeypatched to return successive instants return different values (proves no caching, with no sleep); error-shape case, the `isoformat()` of the result ends with `+00:00` and never parses as naive. `test_main_unit.py` gains `test_create_app_registers_server_time_route`.
- Integration tests: full HTTP cycle on `GET /api/time` through the session-scoped `client` fixture; no database needed.
  - Directory: backend/tests/integration/
  - Cases: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`; `now` parses with `datetime.fromisoformat`, is aware, has zero offset and the raw string ends `+00:00`; `response.headers["cache-control"] == "no-store"` (criteria 1 and 2); a second request also carries the header (edge case: not only the first response); two requests return different `now` when the service clock is monkeypatched to successive instants (freshness without a hardcoded wait); `POST /api/time` is 405; `GET /openapi.json` shows the 200 response of `/api/time` referencing `ServerTimeResponse` with required properties `now` and `timezone`.
- E2E tests: none. No criterion requires navigation or interaction through the UI; the feature has no UI.
  - Directory: e2e/tests/
  - File: none (would be BUG-01_server_time_edge_cache.spec.ts)
- UAT scenarios: the header on the response, the test asserting it, and the deployed-environment reproduction returning two different values.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a response header, asserted through the real HTTP cycle |
| 2 | A test asserts the header on the response | Integration | Verifying it needs no navigation or interaction: it is satisfied by the integration test that asserts the header existing and passing |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration, plus the human check on the deployed environment | Verifying it needs no navigation or interaction, and no local test can reproduce an edge cache: the integration tier covers its two local preconditions (the `no-store` header that stops the CDN storing the response, and `now` differing per request); the deployed check itself is the human step in the Manual verification plan, done at `to_verify` after merge |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then the status is 200 and the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then 0 fail and one of them asserts Cache-Control equals no-store |
| 3 | Deployed reproduction returns two different values | covered at Integration plus human deployed check, see Criterion coverage | Given the fix is deployed behind the CDN, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
This feature has no UI; every criterion is verified against the API with curl, the test suite, or the deployed environment.

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the repository checked out on `feature/BUG-01-server-time-edge-cache`, Docker running, port 8010 free.
1. From the repository root run `docker compose up -d --build backend` → the `backend` container reports running.
2. Run `curl -i http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK`, the headers include `cache-control: no-store`, and the body looks like `{"now":"2026-11-04T20:42:29.123456+00:00","timezone":"UTC"}` with `now` ending in `+00:00`.
3. Run the same command a second time → `cache-control: no-store` is present again and `now` is later than in step 2.

### Criterion 2: a test asserts the header on the response
Prerequisites: `uv` installed; no database needed for these files.
1. Run `uv run --directory backend pytest -q tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py` → the summary reports `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → one test asserts the response's `cache-control` header equals `no-store`.

### Criterion 3: after deploy, the reproduction returns two different values
Prerequisites: the fix merged and deployed; the item at `to_verify`; the deployed host name known (written `<deployed-host>` below).
1. Run `curl -s -i https://<deployed-host>/api/time` → status 200, headers include `cache-control: no-store`, and no CDN cache-hit header reports a hit (for example `x-cache` or `cf-cache-status` is absent, `MISS`, `BYPASS` or `DYNAMIC`, depending on the CDN).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ by about one second.
3. Record the two `now` values on the tracker item; if they are identical, the item fails verification and goes back with the response headers from step 1 attached.
