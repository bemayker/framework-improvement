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

## Re-Plan Feedback
- Comment (tracker): 21 comments read on the ClickUp task, all framework "PR opened" notes from earlier runs → Addressed by: not acted on, because none carries a correction or amendment to the item's description or criteria.
- Comment (tracker, feature-map ingestion note): "BUG-01 must recreate backend/app/routers/server_time.py and register it in backend/app/main.py (FEAT-1 is complete in the tracker but its code is absent from main after the sandbox reset)" → Addressed by: verified against the code at plan base fd23f86. `backend/app/routers/` holds only `health.py`, `notes.py` and `version.py`, and `backend/app/main.py` registers only those three routers, so `GET /api/time` does not exist on main. Assumption recorded: the fix cannot add a header to an endpoint that does not exist, so this plan recreates the minimal FEAT-1 endpoint (router, Pydantic schema, service, registration) to FEAT-1's own acceptance criteria (200 with `now` as ISO 8601 UTC with explicit offset and `timezone: "UTC"`, computed per request, body from a schema in `backend/app/schemas/`) and adds the `Cache-Control: no-store` header. Nothing beyond FEAT-1's contract plus the header is built (no gold plating).
- Merged since the last plan: n/a (fresh plan, branched from current main fd23f86; no previous plan.md for this item in this checkout).

## Plan Overview
Backend-only defect fix. `GET /api/time` is absent from main, so the fix recreates it in the existing Router to Service to Schema layering used by the version endpoint (`routers/version.py`, `services/version_service.py`, `schemas/version.py`), registers it in `create_app()` in `backend/app/main.py`, and sets `Cache-Control: no-store` on every response from the router. No database, no frontend, no external API. Tests: a unit test for the service (UTC, explicit offset, never naive), a unit assertion that `create_app()` registers `/api/time`, and integration tests over the real HTTP cycle asserting the header, the body shape and per-request freshness.

Reproduction class expected: `deployed-only`. The ticket's symptom (identical `now` across two calls) needs the CDN in front of the deployed API and cannot be seen locally; the integration test asserting the header is the local regression guard, and the human check on the deployed environment closes criterion 3.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time; every response carries `Cache-Control: no-store`.
- Router (`backend/app/routers/server_time.py`): `APIRouter(prefix="/api", tags=["time"])`, handler `get_time(response: Response) -> ServerTimeResponse` with `response_model=ServerTimeResponse`; sets `response.headers["Cache-Control"] = "no-store"` (a module constant `CACHE_CONTROL_NO_STORE`, with a one-line comment saying why: the deployed CDN caches responses that carry no cache directive). The header is set in the router because it is a transport concern of this one endpoint, not business logic.
- Service layer (`backend/app/services/server_time_service.py`): `get_server_now() -> datetime` returning `datetime.now(timezone.utc)`, a timezone-aware value computed per call.
- Schema (`backend/app/schemas/server_time.py`): `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"] = "UTC"`. Pydantic serialises an aware UTC datetime with an explicit offset (`2026-11-04T00:40:12.345678Z` form); a naive datetime must never reach it, which the service guarantees and the unit test asserts.
- Registration (`backend/app/main.py`): import the router and add `app.include_router(server_time_router)` beside the existing three; update the module docstring's list of registering features. No restructuring of the factory, the lifespan or the CORS middleware.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no parameters, no body.
- Response: 200, header `Cache-Control: no-store`, body:
  `{"now": "2026-11-04T00:40:12.345678Z", "timezone": "UTC"}`
  (`now` is ISO 8601 in UTC with an explicit offset, `Z` or `+00:00`, never naive; computed per request.)
- Error: `POST /api/time` returns 405 (the endpoint is read-only and takes no input).

## Technology Selection
- Current UTC time: chose the standard library `datetime.now(timezone.utc)` over any time library, because stdlib covers it fully.
- Response schema: chose the already-installed Pydantic (via FastAPI) `BaseModel` over a hand-built dict, because FEAT-1 requires a schema and Pydantic serialises aware datetimes with an explicit offset natively.
- Cache directive: chose FastAPI's own `Response` header parameter over a middleware or a new dependency, because one header on one route needs nothing more; no new dependency is added.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router setting `Cache-Control: no-store`
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now`, `timezone`)
- [B] backend/app/services/server_time_service.py: `get_server_now()` returning an aware UTC datetime per call
- [B] backend/tests/unit/test_server_time_service_unit.py: service returns aware UTC, explicit offset, fresh per call
- [B] backend/tests/integration/test_server_time_integration.py: HTTP cycle asserting the `Cache-Control: no-store` header, body shape, per-request freshness, 405 on POST
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios per criterion (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the server time router; docstring lists it
- [B] backend/tests/unit/test_main_unit.py: assert `create_app()` registers `/api/time`

No dependency changes, so no lockfile entry. Neither README.md nor docs/DEVELOPMENT.md needs an edit: the fix changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `get_server_now()` returns a timezone-aware datetime whose `utcoffset()` is zero (happy path); two calls return non-decreasing, distinct values when the clock is patched to advance (edge case: freshness without sleeping); a `ServerTimeResponse` built from it serialises `now` with an explicit offset and `timezone` `"UTC"`. `create_app()` registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: real HTTP request/response through the `client` fixture: 200, `Cache-Control` header equal to `no-store` (criteria 1 and 2), body keys exactly `now` and `timezone`, `now` parses with a zero UTC offset, two requests return different `now` values (patch the service clock rather than sleeping), `POST /api/time` returns 405. The endpoint needs no database, so the test needs no `DATABASE_URL`.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI; the endpoint has no frontend consumer.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus an edge case (POST is rejected), with criterion 3 written as the deployed-environment check.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a router response header, asserted on the real HTTP cycle |
| 2 | A test asserts the header on the response | Integration | It is satisfied by the integration test itself (`test_get_time_sets_cache_control_no_store`); no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | No UI exists for it and no local tier can include the CDN: the integration test covers the local half (header present, two calls differ), and the deployed half is the human check in the Manual verification plan (reproduction class deployed-only) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running When a client requests GET /api/time Then the response has header Cache-Control no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite When the server time integration tests run Then 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration locally plus human deployed check, see Criterion coverage | Given the fix is deployed When two requests to /api/time are made a second apart Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Not verifiable through the UI: it is a response header. Observable check instead.
Prerequisites: backend running locally (`docker compose up -d backend`, or `uv run --directory backend uvicorn app.main:app --port 8000`).
1. Run `curl -si http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a body like `{"now":"2026-11-04T00:40:12.345678Z","timezone":"UTC"}`.
2. Read the `now` value → it ends in `Z` or `+00:00` (explicit UTC offset), never a bare time with no offset.

### Criterion 2: A test asserts the header on the response
Not verifiable through the UI: it is a test. Observable check instead.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable through the UI and not locally (no edge cache locally). Observable check on the deployed environment, by a human, after the merge has deployed.
Prerequisites: the merge commit of this fix is live on the deployed environment; you know its host (`<deployed-host>`).
1. Run `curl -si https://<deployed-host>/api/time` → header `cache-control: no-store` is present on the response that passed through the CDN.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ (by about one second).
3. Repeat step 2 once more → the values again differ, confirming the first pair was not a cache miss by chance.
