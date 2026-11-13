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
- Comment (tracker): all comments on the ClickUp task are mayker-dev bot notices from earlier runs (per the dispatch) → not acted on because none carries a stakeholder correction or amendment to the feature text.
- Assumption (map note, verified on main at 283fc31): FEAT-1 is `complete` in the tracker, but its code is absent from main after the sandbox reset: no `backend/app/routers/server_time.py`, no schema or service for it, and `backend/app/main.py` registers only the version, notes and health routers. `GET /api/time` therefore returns 404 on main today, and criterion 1 cannot be met by adding a header to a route that does not exist. → Addressed by: this plan recreates the minimal FEAT-1 slice (schema, service, router, registration in `main.py`) to FEAT-1's own acceptance criteria (200 with `{"now": <ISO 8601 UTC with explicit offset>, "timezone": "UTC"}`, `now` computed per request, Pydantic schema in `backend/app/schemas/`), and adds the `Cache-Control: no-store` header on that route. Nothing beyond FEAT-1's contract plus the header is added (no other endpoints, no middleware-wide cache policy).
- Merged since the last plan: n/a (fresh plan, no prior plan for this item on this branch; plan base 283fc31296537221cbdef4aedabbd59d0237dc95 is current main).

## Plan Overview
Backend only. Recreate `GET /api/time` in the project's Router to Service layering (no repository: no data access), following the TEST-05 version slice's shape (`routers/version.py`, `services/version_service.py`, `schemas/version.py`), and set `Cache-Control: no-store` on every response of that route so a CDN or browser never stores it. Register the router in `backend/app/main.py`. Unit tests cover the service (UTC, explicit offset, per-call freshness); integration tests cover the HTTP cycle, the body shape and the header. Criterion 3 is a post-deploy human check; the item goes to `to_verify` after merge. No frontend, no external API, no migration, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time; every response carries `Cache-Control: no-store`.
- Router (`backend/app/routers/server_time.py`): `router = APIRouter(prefix="/api", tags=["time"])`; handler `get_server_time(response: Response) -> ServerTimeResponse` with `response_model=ServerTimeResponse`. It sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=get_current_utc_time(), timezone="UTC")`. The header value lives in one module-level constant (`CACHE_CONTROL_NO_STORE = "no-store"`) so the router and the tests name one source. Comment the header with the why (a CDN in front of the API caches responses that carry no directive), not the what.
- Service layer (`backend/app/services/server_time_service.py`): `get_current_utc_time() -> datetime` returns `datetime.now(timezone.utc)`, called on every request (never cached at import or module level), always timezone-aware.
- Schema (`backend/app/schemas/server_time.py`): `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: str`. Pydantic serialises an aware UTC datetime as ISO 8601 with an explicit offset (`...Z` or `+00:00`); the tests assert the offset is present and zero, not a particular spelling.
- Registration (`backend/app/main.py`): import `router as server_time_router` and `app.include_router(server_time_router)` after the existing three. No other change to `create_app()` (the CORS middleware already allows `GET`). Update the module docstring's list of registered routers with one clause for BUG-01.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no parameters.
- Response: 200, headers include `Cache-Control: no-store`; body:

```json
{"now": "2026-11-13T16:40:12.345678Z", "timezone": "UTC"}
```

- Error: `POST /api/time` returns 405 (FastAPI default for a GET-only route); no other error path exists.

## Technology Selection
- Current time in UTC (`server_time_service.py`): chose the standard library's `datetime.now(timezone.utc)` over any time library, because the stdlib covers an aware UTC timestamp completely.
- Cache directive on the response (`routers/server_time.py`): chose FastAPI's injected `Response` parameter (an installed dependency) to set the header on this one route, over a Starlette middleware or a custom response class, because the defect is scoped to `/api/time` and a middleware would impose a cache policy on every route the criteria do not mention.
- Response schema (`schemas/server_time.py`): chose Pydantic `BaseModel` (installed, used by every existing schema) over a bare dict, per FEAT-1's contract.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic model (`now: datetime`, `timezone: str`).
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` returning an aware UTC `datetime`, computed per call.
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on the response; `CACHE_CONTROL_NO_STORE` constant.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware UTC, zero offset, per-call freshness).
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for `GET /api/time` (200, body shape, explicit offset, two calls differ, `Cache-Control: no-store`, 405 on POST).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios (UAT Generation is ENABLED).
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import and register `server_time_router`; one docstring clause.

No dependency changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` edit: the project structure, run configuration, dependencies and test infrastructure are unchanged (README's structure block names layers, not individual routers). No E2E spec: no criterion has a UI.

## Testing Strategy
- Unit tests: `server_time_service.get_current_utc_time` (service layer): returns an aware datetime, its `utcoffset()` is zero, and two calls return different values (computed per call, not cached). Error case: none reachable in the stdlib clock; the edge case is the offset being explicit (not naive).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, so `test_server_time_service_unit.py`
- Integration tests: `GET /api/time` through the real FastAPI app with the session-scoped `client` fixture (no database needed): 200 and exact key set, `now` parses as ISO 8601 with an explicit zero offset, `timezone == "UTC"`, two consecutive calls return different `now`, the response carries `Cache-Control: no-store`, and `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. The feature has no UI; Section 6's fourth question is answered no for every criterion (see Criterion coverage).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion (header present, test asserts it, deployed reproduction returns two different values) plus one edge-case scenario (a POST is rejected with 405 and serves no cached body).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_server_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: it is a response header on a router endpoint with no UI |
| 2 | A test asserts the header on the response | Integration | `test_get_server_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: the criterion is satisfied by the existence and pass of the router-level test itself |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | `test_get_server_time_two_calls_return_different_now`, `test_get_server_time_sets_cache_control_no_store`, `test_get_current_utc_time_returns_fresh_value_per_call` | no UI, and the edge cache exists only on the deployed environment; the executed tests cover the two halves locally (fresh `now` per request, and the directive that stops the CDN storing it), and the deployed check itself is the human `to_verify` step in the Manual verification plan |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/time, Then the response status is 200 And the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the Cache-Control assertion passes with 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is human | Given the API is deployed behind the CDN, When a client calls GET /api/time twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Not verifiable through the UI (no page renders this endpoint); the observable check is the response header.
Prerequisites: the app stack is running locally (`docker compose up`), backend reachable at `http://localhost:8000`.
1. In a terminal run `curl -si http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store` (header names are case-insensitive), and a body like `{"now":"2026-11-13T16:40:12.345678Z","timezone":"UTC"}`.
2. Check the body's `now` → it ends in `Z` or `+00:00` (an explicit UTC offset, never a bare time), and `timezone` is `UTC`.
3. Run `curl -si -X POST http://localhost:8000/api/time` → `HTTP/1.1 405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
Not a UI behaviour; the observable check is the test run.
Prerequisites: repository checked out on the merged branch, `uv` installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` → the run ends with `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_server_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
Deployed environment only: locally nothing caches, so a local run cannot show the defect or its fix. The item stays `to_verify` until this is done.
Prerequisites: the merge is deployed; you know the deployed API host (`<deployed-host>`).
1. Run `curl -si https://<deployed-host>/api/time` → 200, a `cache-control: no-store` header, and no CDN cache-hit indicator (for example no `age:` header above 0, and any `x-cache` or `cf-cache-status` header reads a miss or bypass, not a hit).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ (the second is about one second later).
3. Repeat step 2 once more → the `now` values differ again. When both repetitions differ, remove the `mayker:to-verify` label from the tracker item.
