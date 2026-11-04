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
- [ ] `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] A test asserts the header on the response.
- [ ] After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): 23 comments on the item, all framework "PR opened" notes from earlier runs → Addressed by: not acted on, because none carries a correction or requirement (dispatch and `decisions.md`: actionable 0).
- Assumption (no comment, recorded here instead of a question): the item says FEAT-1 is complete, but `backend/app/routers/server_time.py` does not exist on main at 3e00ad2 (the sandbox reset 892a631 removed it; `feature_map.md` BUG-01 row says the same). `GET /api/time` therefore returns 404 today, and criterion 1 cannot hold on a route that does not exist. This plan recreates FEAT-1's endpoint to FEAT-1's own acceptance criteria (200 with `{"now": ISO 8601 UTC with explicit offset, "timezone": "UTC"}`, `now` per request, Pydantic schema in `backend/app/schemas/`, unit and integration tests) and adds the header. That is the minimum for this defect's criteria, not gold plating; it is why `backend/app/main.py` is in the manifest (router registration).

## Plan Overview
Backend only. Recreate the `GET /api/time` slice in the existing Router to Service layering (router, schema, service, the same shape as `routers/version.py` and `services/version_service.py`), register the router in `create_app()`, and set `Cache-Control: no-store` on every response from the route. No database, no frontend, no external API, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` returns the server's current UTC time, with response header `Cache-Control: no-store`.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["server-time"])`, handler takes FastAPI's injected `Response` and sets `response.headers["Cache-Control"]` from a module constant `NO_STORE = "no-store"` (one source for the literal; tests import it). `response_model=ServerTimeResponse`.
- Service layer: `backend/app/services/server_time_service.py`, `get_server_time() -> datetime` returning `datetime.now(timezone.utc)` (timezone-aware, computed per call, never naive).
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: str` (ISO 8601 with `+00:00` offset, from `datetime.isoformat()` on an aware value) and `timezone: str` (`"UTC"`).
- Registration: `backend/app/main.py` imports the router and adds `app.include_router(server_time_router)` beside the existing three; the module docstring gains one clause naming FEAT-1/BUG-01. No other change to the factory, CORS or lifespan.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters
- Response: 200, headers include `Cache-Control: no-store`, body:
  `{"now": "2026-11-04T19:40:12.345678+00:00", "timezone": "UTC"}`
- Other methods: 405 (FastAPI default for an unregistered method on the path).

## Technology Selection
- Current UTC time: chose the standard library `datetime.now(timezone.utc)` over any time library, because the stdlib returns an aware UTC value with an explicit offset.
- Cache directive: chose a plain response header set on FastAPI's injected `Response` (already installed) over a caching middleware or a new dependency, because one header on one route is the whole need.
- Response schema: chose Pydantic `BaseModel` (already installed with FastAPI) over a bare dict, per FEAT-1's criterion.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router, sets `Cache-Control: no-store` from the `NO_STORE` constant
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now`, `timezone`)
- [B] backend/app/services/server_time_service.py: `get_server_time()` returning an aware UTC datetime per call
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware, UTC offset, per-call freshness with a patched clock)
- [B] backend/tests/integration/test_server_time_integration.py: router tests (200 shape, explicit offset, `Cache-Control: no-store` header, two calls differ, 405 on POST)
- [G] e2e/uat/scenarios/BUG-01_server_time_no_store.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_no_store_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the server_time router in `create_app()`
- [B] backend/tests/unit/test_main_unit.py: add a test that `create_app()` registers `/api/time`

No dependency manifest changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: `server_time_service.get_server_time()` happy path (aware datetime, `utcoffset()` is zero), edge case (two calls with a patched clock return distinct values, proving per-call computation), error/robustness case (returned value is never naive: `tzinfo` is not None); `create_app()` registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle through the session `client` fixture: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` and carries a `+00:00` offset, response header `Cache-Control` equals the router's `NO_STORE` constant, two calls with a patched service clock return different `now`, POST returns 405. No database needed (follows `test_version_integration.py`).
  - Directory: backend/tests/integration/
- E2E tests: none warranted. The endpoint has no UI and no criterion involves navigation or interaction, so no `e2e/tests/` spec is written.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus one edge case (header present on a second consecutive request), in the scenarios file above.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | verifying it needs no navigation or interaction: it is a response header of a router, read from the HTTP response |
| 2 | A test asserts the header on the response | Integration | the criterion is the integration test itself (`test_get_time_sets_cache_control_no_store`); there is no UI to drive |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | the deployed edge cache cannot run in any test tier; the executed coverage is the integration test that two calls return different `now` plus the header that stops a cache from storing them, and the deployed check itself is the manual step below (the item's `to_verify` route) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Responses carry `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running When I GET /api/time Then the response has header Cache-Control no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite When I run the server_time integration tests Then 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the deployed API When I GET /api/time twice a second apart Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Not verifiable through the UI: the endpoint has no screen. Read the response header instead.
Prerequisites: backend running locally (`docker compose up backend` or `uv run --directory backend uvicorn app.main:app --port 8000`).
1. Run `curl -si http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`.
2. Read the headers in that output → a line `cache-control: no-store` is present.
3. Read the body in that output → JSON with `now` ending in `+00:00` and `"timezone":"UTC"`.

### Criterion 2: A test asserts the header on the response
Prerequisites: a checkout of the merged branch; no database required.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test asserts `response.headers["cache-control"]` equals the router's `NO_STORE` constant.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable through the UI: it is a deployed-environment cache behaviour. Run the item's reproduction on the deployed host.
Prerequisites: the fix is merged and deployed; you know the deployed host name.
1. Run `curl -si https://{deployed-host}/api/time` → 200, header `cache-control: no-store`, note the `now` value.
2. Wait one second, then run the same command again → a `now` value later than the first (they differ).
3. If the CDN adds a cache-status header (for example `cf-cache-status` or `x-cache`), read it on the second response → it reports a miss or bypass, never a hit.
