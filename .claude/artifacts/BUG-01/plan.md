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
- Comment (tracker): none actionable. The dispatch reports 62 tracker comments read, 0 actionable (all are mayker-dev's own PR-opened notes, per `.claude/artifacts/BUG-01/decisions.md`) → Addressed by: nothing to act on.
- Assumption (dependency code absent): FEAT-1 reads `complete` in the tracker, but at plan base 5f937c3e there is no `GET /api/time` on main. `backend/app/routers/server_time.py`, its schema and its service do not exist, and `backend/app/main.py` registers only the version, notes and health routers (verified by reading the tree at 5f937c3e; the feature map row attributes the absence to a sandbox reset). A `Cache-Control` header cannot be added to an endpoint that does not exist, so this plan recreates FEAT-1's endpoint to FEAT-1's own acceptance criteria (200 with `{"now": ISO 8601 UTC with explicit offset, "timezone": "UTC"}`, `now` computed per request, a Pydantic response schema, unit and integration tests) and adds the header on it. This is the minimum needed to satisfy BUG-01's criteria, not new scope: nothing beyond FEAT-1's stated contract is added.
- Merged since the last plan: n/a (fresh plan, branched from current main at 5f937c3e).

## Plan Overview
Backend only. Recreate the `GET /api/time` endpoint (router, response schema, service) in the project's router to service layering, set `Cache-Control: no-store` on its response so no edge cache or browser stores it, and register the router in `backend/app/main.py`. Tests: unit tests for the service (UTC-aware, per-call freshness) and the schema serialisation (explicit offset); integration tests for the HTTP cycle, the header, per-request freshness, independence from the database, and 405 on a write; one unit test asserting the route is registered. No database, no migration, no frontend, no external API. Criterion 3 is a deployed-only human verification (the item carries the `mayker:to-verify` tag); the build covers its precondition in CI (header present, two calls differ) and the manual verification plan carries the deployed check.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time in UTC and sets `Cache-Control: no-store` on the response. Registered via `app.include_router(server_time_router)` in `backend/app/main.py`, alongside the existing three, with the module docstring's registration list extended by one line naming FEAT-1/BUG-01. No other change to `main.py` (the CORS middleware and lifespan are untouched).
- Router (`backend/app/routers/server_time.py`): `router = APIRouter(prefix="/api", tags=["time"])`; handler `get_server_time_endpoint(response: Response) -> ServerTimeResponse` sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=get_server_time(), timezone="UTC")`, with `response_model=ServerTimeResponse`. The header value lives in one module constant, `CACHE_CONTROL_NO_STORE = "no-store"`, imported by the tests rather than retyped.
- Service layer (`backend/app/services/server_time_service.py`): `get_server_time() -> datetime` returns `datetime.now(timezone.utc)`, called on every request (never cached at import or module level, which is what FEAT-1's freshness criterion forbids).
- Schema (`backend/app/schemas/server_time.py`): `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic's built-in aware-datetime type, so a naive value is rejected at construction) and `timezone: Literal["UTC"]`. Pydantic serialises an aware UTC datetime as ISO 8601 with an explicit offset (`...Z`); the unit test pins the offset form actually emitted.
- Repository layer: none, no data access.
- Migrations: none.
- Docstrings: module docstring naming the work item and the layer's reason, plus a one-line docstring per public function and class (`.claude/project-standards.md` Documentation convention; the commit gate's `docstrings` row checks D101 to D103).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, `Content-Type: application/json`, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-27T17:45:12.345678Z", "timezone": "UTC"}
```

- Errors: `POST /api/time` (any non-GET method) returns 405, FastAPI's default. No database is needed, so the endpoint answers 200 with `DATABASE_URL` unset.

## Technology Selection
- Current time: chose the standard library `datetime.now(timezone.utc)` over any time library, because the stdlib returns an aware UTC datetime directly.
- Aware-datetime validation: chose Pydantic's built-in `AwareDatetime` (an installed dependency) over a hand-written validator, because it already rejects naive datetimes.
- Cache directive: chose FastAPI's injected `Response` parameter to set one header in the handler over a new middleware or a new dependency, because the defect is on one route and a middleware would widen the change to every route (scope containment).
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime`, `timezone: Literal["UTC"]`).
- [B] backend/app/services/server_time_service.py: `get_server_time()` returning the current UTC-aware datetime per call.
- [B] backend/app/routers/server_time.py: `GET /api/time` router that sets `Cache-Control: no-store` and returns `ServerTimeResponse`.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (UTC-aware, fresh per call) and the schema (explicit offset, naive datetime rejected).
- [B] backend/tests/integration/test_server_time_integration.py: integration tests for the HTTP cycle, the `Cache-Control: no-store` header, per-request freshness, no-database operation and 405 on POST.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature writes.

### Modified files
- [B] backend/app/main.py: import and `include_router` the server time router; extend the module docstring's registration list by one line. Nothing else changes.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`.

No lockfile changes: no dependency is added or upgraded. No `README.md` or `docs/DEVELOPMENT.md` change: one endpoint is added and the project structure, run configuration, dependencies and test infrastructure are unchanged.

## Testing Strategy
- Unit tests: service `get_server_time()` (returns an aware datetime whose offset is zero; two calls with a patched clock return the two clock values, proving no caching), schema `ServerTimeResponse` (serialises `now` with an explicit UTC offset; rejects a naive datetime), and app factory route registration.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle through the session `client` fixture in `backend/tests/conftest.py`: 200 with `now` and `timezone`; `Cache-Control` header equals `no-store`; two successive calls return different `now`; 200 on a fresh app with `DATABASE_URL` unset; 405 on POST. Assert the header against the router's `CACHE_CONTROL_NO_STORE` constant and also against the literal `no-store` the tracker criterion names, since the literal is the contract.
  - Directory: backend/tests/integration/
- E2E tests: none. No acceptance criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question asked per criterion): the endpoint has no frontend consumer.
  - Directory: e2e/tests/
  - File: none for this item.
- UAT scenarios: one scenario per criterion plus an edge case (a POST is refused), API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | `test_get_time_sets_cache_control_no_store`, `test_get_time_returns_200_with_now_and_timezone` | Verifying it needs no navigation or interaction: it is a response header on a router, read in the HTTP cycle. |
| 2 | A test asserts the header on the response. | Integration | `test_get_time_sets_cache_control_no_store` | Verifying it needs no navigation or interaction: the criterion is satisfied by the existence and pass of that router test. |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Integration | `test_get_time_two_calls_return_different_now`, `test_get_time_sets_cache_control_no_store`, `test_get_server_time_returns_fresh_value_per_call` | No UI is involved, and no tier in CI can reach the deployed edge cache: CI covers the two preconditions (the endpoint is fresh per request and tells caches not to store it), and the deployed check itself is the human step in the Manual verification plan (to-verify route). |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/time, Then the response status is 200 and its Cache-Control header is no-store |
| 2 | A test asserts the header on the response. | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration tests run, Then the header test passes |
| 3 | After deploy, the reproduction above returns two different values. | covered at Integration, see Criterion coverage; deployed check is manual | Given the deployed API behind its CDN, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`.
Prerequisites: the backend is running locally on port 8000 (`docker compose up -d backend`, or `uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this endpoint.
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. In the same output, read the headers → a line `cache-control: no-store` is present (header names are case-insensitive).
3. Read the body → it is JSON shaped like `{"now":"2026-11-27T17:45:12.345678Z","timezone":"UTC"}`: `now` ends in `Z` or `+00:00`, never a bare time with no offset, and `timezone` is `UTC`.
4. Run `curl -si -X POST http://localhost:8000/api/time` → the status line reads `HTTP/1.1 405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response.
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_time_sets_cache_control_no_store` asserts that the `Cache-Control` response header equals `no-store`.
2. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the run passes: its summary line reports no failed or errored test, and the command exits 0.

### Criterion 3: After deploy, the reproduction above returns two different values.
This criterion cannot be verified locally or through a UI: locally nothing caches the response, so it is checked on the deployed environment once the fix is deployed.
Prerequisites: the merge of this fix is deployed, and you know the deployed API host (written `<deployed-host>` below).
1. Run `curl -si https://<deployed-host>/api/time` → status 200, a `cache-control: no-store` header, and a JSON body with a `now` value; note that value.
2. Wait one second, then run `curl -s https://<deployed-host>/api/time` again → the `now` value differs from the one noted in step 1.
3. Optional, if the CDN exposes its cache status (an `age`, `x-cache` or `cf-cache-status` header) → step 1's response shows no cache hit (`age` absent or 0, or a MISS, BYPASS or DYNAMIC status).
4. If both `now` values are identical, the fix is not effective on the deployed environment: record the full response headers of both calls on the item rather than marking it verified.
