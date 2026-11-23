# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> Reproduction (deployed only): `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`. Expected: two different `now` values. Actual: identical values. Locally both calls differ, because nothing caches them.
>
> Notes: Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.

## Acceptance Criteria
- [ ] 1. `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] 2. A test asserts the header on the response.
- [ ] 3. After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): 53 comments read over 3 pages, all automated `mayker-dev:` notices from earlier runs → not acted on because none carries a stakeholder correction or amendment to the feature text.
- Comment (tracker, tag): the item carries `mayker:to-verify` while its status is `to do` → not acted on by the plan: it routes the item to the to_verify path after merge, which criterion 3 already reflects; it changes nothing that is built.
- Assumption (scope): `backend/app/routers/server_time.py` does not exist on the plan base 8b2ca059 (FEAT-1 is complete in the tracker but its code is absent from main after the sandbox reset, per this item's `feature_map.md` row). A header cannot be added to an endpoint that does not exist, so this plan recreates FEAT-1's endpoint exactly to FEAT-1's own acceptance criteria (`{"now": ISO 8601 UTC with explicit offset, "timezone": "UTC"}`, per-request `now`, Pydantic schema) and adds the fix on top. Nothing beyond FEAT-1's contract plus the header is built.

## Plan Overview
Backend only. Recreate the `GET /api/time` slice in the project's router, service, schema layering (mirroring the TEST-05 version slice), register its router in `backend/app/main.py`, and set `Cache-Control: no-store` on every response of that route so no edge cache stores it. Unit tests cover the service's per-call UTC timestamp; integration tests cover the HTTP shape, the offset, the header and freshness across two calls. No frontend, no database, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time with `Cache-Control: no-store` on the response.
- Router (`backend/app/routers/server_time.py`): `APIRouter(prefix="/api", tags=["server-time"])`; handler takes FastAPI's injected `response: Response`, sets `response.headers["Cache-Control"] = "no-store"`, and returns `ServerTimeResponse(now=get_server_time(), timezone="UTC")` with `response_model=ServerTimeResponse`. The header is set in the handler (route-scoped), not in a global middleware, so no other route's caching changes.
- Service layer (`backend/app/services/server_time_service.py`): `get_server_time() -> datetime` returning `datetime.now(timezone.utc)`, computed on every call; constant `SERVER_TIMEZONE = "UTC"` used by the router for the `timezone` field. Module docstring names FEAT-1 and BUG-01 (project documentation convention).
- Schema (`backend/app/schemas/server_time.py`): `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: str`. Pydantic serialises an aware UTC datetime with an explicit offset (`Z` or `+00:00`); the tests assert the parsed value is timezone-aware with zero offset rather than one literal spelling.
- Registration: `backend/app/main.py` imports the router and adds `app.include_router(server_time_router)` after the existing three; the module docstring's list of registered routers gains one clause. No other change to `create_app()` or the CORS middleware.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no query parameters
- Response: 200, header `Cache-Control: no-store`, body `{"now": "2026-11-23T15:04:35.123456Z", "timezone": "UTC"}` where `now` is an ISO 8601 timestamp in UTC with an explicit offset (`Z` or `+00:00`), never naive, computed per request.
- Other methods: `POST /api/time` returns 405 (FastAPI default for an unregistered method).

## Technology Selection
- Current UTC timestamp: chose the standard library `datetime.now(timezone.utc)` over any time library, because the stdlib returns an aware UTC datetime directly.
- Cache directive: chose FastAPI's injected `Response` header (an installed dependency, set in the route handler) over a custom middleware or a new caching package, because one header on one route needs no new component.
- Response schema: chose the installed Pydantic `BaseModel` over a bare dict, as FEAT-1 requires; no alternative rung applies.
- No new dependency is introduced.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: datetime`, `timezone: str`)
- [B] backend/app/services/server_time_service.py: `get_server_time()` returning the aware UTC now, plus `SERVER_TIMEZONE`
- [B] backend/app/routers/server_time.py: `GET /api/time` router that sets `Cache-Control: no-store`
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for `get_server_time()`
- [B] backend/tests/integration/test_server_time_integration.py: HTTP tests for shape, offset, header and freshness
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the server time router; one clause added to the module docstring
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` changes: the feature adds one route and alters no project structure, run configuration, dependency or test infrastructure, and neither document lists API endpoints.

## Testing Strategy
- Unit tests: `get_server_time()` in the service layer, with the module's clock patched where determinism is needed.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
  - Cases: happy path `test_get_server_time_returns_timezone_aware_utc` (tzinfo is set and utcoffset is zero); edge case `test_get_server_time_computes_a_new_value_per_call` (patched clock returns two distinct instants, two calls return them in order, so nothing is memoised); error case `test_get_server_time_never_returns_naive_datetime` (result's `utcoffset()` is not None). Registration: `test_create_app_registers_server_time_route` in test_main_unit.py asserts `/api/time` is among the custom routes.
- Integration tests: real HTTP cycle through the session `client` fixture; no database needed.
  - Directory: backend/tests/integration/
  - Cases: `test_get_time_returns_200_with_utc_now_and_timezone` (status 200, exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value with zero offset); `test_get_time_sets_cache_control_no_store` (`response.headers["cache-control"] == "no-store"`); `test_get_time_two_requests_return_different_now` (two sequential requests, both carry `no-store`, parsed `now` values differ); `test_post_time_returns_405_method_not_allowed`.
- E2E tests: no criterion of this item involves navigation or interaction through a UI (backend only, no frontend surface), so no spec is written; see Criterion coverage.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus one edge case (a second request is not served from cache), written as API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: it is a response header on a router, read off the HTTP response |
| 2 | A test asserts the header on the response | Integration | `test_get_time_sets_cache_control_no_store`, `test_get_time_two_requests_return_different_now` | the criterion is the existence of an executed header assertion, which these router tests are; no UI exists |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | `test_get_time_two_requests_return_different_now`, `test_get_server_time_computes_a_new_value_per_call` | the edge cache exists only on the deployed environment, so no local tier can reproduce it; locally the tests pin both halves of the cause (fresh value per request and the no-store directive), and the deployed observation itself is the human step in the Manual verification plan |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response has status 200 and header Cache-Control no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration tests run, Then the header test passes |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the deployed API behind its CDN, When a client requests GET /api/time twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally (`uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this route.
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the response headers of the same output → a line `cache-control: no-store` is present.
3. Read the body → JSON of the shape `{"now":"2026-...Z","timezone":"UTC"}`, where `now` ends in `Z` or `+00:00`.

### Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out on the feature branch, uv installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` → the summary line reports no failed or errored test, and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → `test_get_time_sets_cache_control_no_store` asserts `cache-control` equals `no-store` on the response.

### Criterion 3: After deploy, the reproduction returns two different values
Cannot be verified locally: the edge cache exists only on the deployed environment. The observable check is the deployed response.
Prerequisites: this change merged and deployed; the deployed API host name known.
1. In a terminal, run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header; note the `now` value.
2. Wait one second and run the same command again → the `now` value differs from step 1's.
3. In the second response, check for a CDN cache-hit header (for example `cf-cache-status`, `x-cache` or `age`) → it does not report a cache hit (`HIT`) and `age` is absent or 0.
