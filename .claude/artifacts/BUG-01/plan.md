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
- Comment (tracker): 36 comments read by the dispatching session (2 pages), none actionable: all are framework PR notices from earlier runs → Addressed by: not acted on, because none states a requirement or a correction of the item text.
- Assumption (ingestion note, verified against the code): the item's Notes say "FEAT-1 is complete" and point at `backend/app/routers/server_time.py`, but neither that router nor its schema, service or `main.py` registration exists on `main` (checked at c6196fa, which is also `origin/main`; `backend/app/routers/` holds only `health.py`, `notes.py`, `version.py`). FEAT-1 is `complete` in the tracker but its code was removed by a sandbox reset. A no-store header cannot be put on a route that does not exist, so this plan recreates the FEAT-1 endpoint to FEAT-1's own acceptance criteria (200 with `{"now", "timezone": "UTC"}`, `now` computed per request, aware UTC with an explicit `+00:00` offset, Pydantic schema in `backend/app/schemas/`) and adds the header. Nothing beyond FEAT-1's criteria and this item's is added.
- Merged since the last plan: n/a (fresh plan, branched from current main c6196fa; no earlier plan for this item exists on main).

## Plan Overview
Backend only. Recreate `GET /api/time` in the existing router / schema / service shape that `GET /api/version` uses (`backend/app/routers/version.py`, `backend/app/schemas/version.py`, `backend/app/services/version_service.py`), register it in `create_app()`, and set `Cache-Control: no-store` on every response of that route so the CDN in front of the deployed API never stores it. The header is set in the route handler through FastAPI's injected `Response`, scoped to this one route: no app-wide middleware, because no other endpoint is in this item's scope. Tests: a unit module for the service, an integration module asserting the header, the body shape and per-request freshness, and one assertion added to the app-factory unit test that the route is registered.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`: returns the server's current UTC time; every response carries `Cache-Control: no-store`. Registered in `backend/app/main.py` with `app.include_router(server_time_router)` after the existing three `include_router` calls, and its import beside the other router imports. No other line of `create_app()` or `lifespan` changes.
- Router (`backend/app/routers/server_time.py`): `APIRouter(prefix="/api", tags=["server-time"])`; handler `get_server_time(response: Response) -> ServerTimeResponse` with `response_model=ServerTimeResponse`. It sets `response.headers["Cache-Control"]` to a module constant `NO_STORE = "no-store"` (a one-line comment says why: the CDN caches any response without a directive) and returns `ServerTimeResponse(now=get_current_utc_time())`. The service function is called inside the handler, never at import time.
- Schema (`backend/app/schemas/server_time.py`): Pydantic `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"] = "UTC"`. A `field_validator("now")` rejects a naive datetime (`tzinfo is None` or `utcoffset() is None` raises `ValueError`). A `field_serializer("now")` returns `value.astimezone(UTC).isoformat()`, so the wire value ends in `+00:00` (Pydantic's default would emit `Z`).
- Service layer (`backend/app/services/server_time_service.py`): `get_current_utc_time() -> datetime` returning `datetime.now(UTC)`, evaluated per call.
- Repository layer: none, the endpoint reads no data.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-10T12:34:56.789012+00:00", "timezone": "UTC"}
```

- Any other method on `/api/time` (e.g. POST): 405, FastAPI's default.

## Technology Selection
- Cache directive: chose a `Cache-Control: no-store` header set in the route handler through FastAPI's injected `Response` (installed dependency) over an app-wide middleware or a new caching library, because a single header on a single route is one line and no other endpoint is in scope.
- Current time: chose the standard library's `datetime.now(UTC)` over any third-party time library, which nothing here needs.
- Response schema: chose Pydantic `BaseModel` with `field_validator` and `field_serializer` (installed through FastAPI) over a hand-written dict or a new serialisation dependency; FEAT-1's criteria require a Pydantic schema.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on the response
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema, aware-UTC validator and `+00:00` serializer
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` returning `datetime.now(UTC)` per call
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service and the schema's validator and serializer
- [B] backend/tests/integration/test_server_time_integration.py: HTTP tests asserting the no-store header, the body shape and offset, per-request freshness, and 405 on POST
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import `server_time` router and add one `app.include_router(server_time_router)` call; the module docstring gains one sentence naming BUG-01's router
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom routes

No lockfile entry: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` entry: neither file lists API endpoints, and this item changes no project structure, run configuration, dependency or test infrastructure. No E2E spec: no criterion is verified through the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: `get_current_utc_time()` returns an aware datetime with zero UTC offset (happy path), returns a new value on each call with a patched clock (edge case: no import-time caching); `ServerTimeResponse` serialises `now` with a `+00:00` suffix, converts a non-UTC aware input to UTC (edge case), and rejects a naive datetime with a `ValidationError` (error case).
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (test_server_time_service_unit.py; the registration check is added to the existing test_main_unit.py)
- Integration tests: through the shared session `client` fixture (no database needed): `GET /api/time` returns 200 with header `cache-control` equal to `no-store`; the body's key set is exactly `{"now", "timezone"}`, `timezone == "UTC"`, `now` ends with `+00:00` and parses with zero offset; two requests with the router's `get_current_utc_time` monkeypatched to an advancing clock return different `now` values and both carry `no-store`; `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: no spec. The item has no UI and no criterion is verified through navigation or interaction (per-criterion answers below).
  - Directory: e2e/tests/ (unused for this item)
  - File: none (would be BUG-01_server_time_edge_cache.spec.ts)
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (POST returns 405, or a non-UTC conversion), validated for well-formedness by CI.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a response header of a router, asserted on a real HTTP request/response cycle. |
| 2 | A test asserts the header on the response | Integration | The criterion is satisfied by the integration test itself (`test_get_server_time_sets_cache_control_no_store`); no UI is involved. |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | No UI is involved and no local tier contains the CDN: locally the integration test asserts per-request freshness plus `no-store` on both responses (the cause the CDN honours), and the deployed check itself is the human step in the Manual verification plan, carried by the `deployed-only` reproduction and the `mayker:to-verify` route. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response status is 200 And the Cache-Control header is "no-store" |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then they report 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage | Given the fix is deployed, When a client requests GET /api/time twice one second apart, Then the two "now" values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally on port 8000 (e.g. `uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this endpoint.
1. Run `curl -si http://localhost:8000/api/time` in a terminal → the status line reads `HTTP/1.1 200 OK`.
2. Read the response headers in the same output → a `cache-control: no-store` header is present.
3. Read the body in the same output → JSON with exactly two keys, `now` (an ISO 8601 timestamp ending in `+00:00`) and `timezone` with value `UTC`.
This criterion has no UI; the header in step 2 is the observable check.

### Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out on the BUG-01 branch, `uv` installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the run ends with `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_server_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`.

### Criterion 3: After deploy, the reproduction returns two different values
Prerequisites: the merged fix is deployed to the environment the item names (`<deployed-host>`; `docs/DEVELOPMENT.md` → Test environments has no row yet, so the verifier supplies the host). Not verifiable locally: there is no edge cache.
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header, as served through the CDN.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ (the second about one second later).
3. If both checks hold, remove the `mayker:to-verify` label from the item → the item may be marked verified. If the `now` values are identical, the item is not fixed: leave the label and reopen.
