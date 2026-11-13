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
- Comment (tracker): 41 comments on the ticket, all framework PR notices from earlier runs → not acted on because none carries feedback on the defect or its criteria (dispatch: "none actionable").
- Map note (feature_map.md, not a comment): FEAT-1 is complete in the tracker but its code is absent from main at plan base 62be9fd (sandbox reset) → Addressed by: verified in the tree (no `backend/app/routers/server_time.py`, no `/api/time` registration in `backend/app/main.py`), so this plan recreates FEAT-1's minimal slice (schema, service, router, registration) as the carrier of the fix. Assumption recorded: recreating the endpoint is in scope because criterion 1 cannot be met on an endpoint that does not exist; the recreated slice keeps FEAT-1's own contract (`{"now": ISO 8601 UTC with explicit offset, "timezone": "UTC"}`, computed per request) and adds nothing beyond it.
- Merged since the last plan: n/a (fresh plan, branched from current main 62be9fd).

## Plan Overview
Backend only. Add `Cache-Control: no-store` to every `GET /api/time` response so the CDN in front of the deployed API stops serving one cached `now`. Because the endpoint itself is missing from main, the build first recreates FEAT-1's endpoint following the existing version slice's Router to Service to Schema shape (`routers/version.py`, `services/version_service.py`, `schemas/version.py`), registers it in `create_app()`, and sets the header in the router. Integration tests over the real HTTP cycle assert the header and the per-request freshness; the deployed reproduction is a human check after deploy (the `to_verify` route). No database, no frontend, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`: returns the current server time in UTC; every response carries `Cache-Control: no-store`.
- Service layer: `backend/app/services/server_time_service.py`: `to_utc_iso(moment: datetime) -> str` converts an aware datetime to an ISO 8601 UTC string with an explicit `+00:00` offset and raises `ValueError` on a naive datetime; `get_server_time() -> str` returns `to_utc_iso(datetime.now(UTC))`, evaluated on every call (no module-level caching, no `lru_cache`).
- Router: `backend/app/routers/server_time.py`: `APIRouter(prefix="/api", tags=["server-time"])`, `@router.get("/time", response_model=ServerTimeResponse)`; takes FastAPI's injected `Response` and sets `response.headers["Cache-Control"] = "no-store"` before returning `ServerTimeResponse(now=get_server_time(), timezone="UTC")`. No business logic in the router.
- Schema: `backend/app/schemas/server_time.py`: `ServerTimeResponse(BaseModel)` with `now: str` and `timezone: Literal["UTC"]`.
- Registration: `backend/app/main.py`: import `router as server_time_router` and add `app.include_router(server_time_router)` in `create_app()`, alongside the existing three; nothing else in the factory changes (CORS `allow_methods` already includes GET).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, body:
```json
{"now": "2026-11-13T09:12:34.567890+00:00", "timezone": "UTC"}
```
- Any other method on `/api/time` (e.g. POST): 405 Method Not Allowed (FastAPI default).

## Technology Selection
- Cache directive: chose a single `response.headers["Cache-Control"] = "no-store"` on FastAPI's injected `Response` over a new caching or middleware dependency and over a global middleware, because one header on one route is a one-line stdlib-free change and a middleware would widen it to routes the defect does not name.
- Server time (recreated FEAT-1 service): chose the standard library's `datetime.now(UTC)` and `datetime.isoformat()` over a date library (e.g. `pendulum`, `arrow`), because the stdlib already produces an aware UTC value with an explicit offset.
- Response schema: chose `pydantic.BaseModel` with `typing.Literal`, both already installed via FastAPI, over any new dependency.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` schema (`now: str`, `timezone: Literal["UTC"]`) for `GET /api/time`.
- [B] backend/app/services/server_time_service.py: `to_utc_iso()` and `get_server_time()`, the UTC-with-explicit-offset, per-call time logic.
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on every response; no business logic.
- [B] backend/tests/unit/test_server_time_service_unit.py: service unit tests: explicit `+00:00` offset, a non-UTC aware input converted to UTC, a naive input raises `ValueError`, two calls with a patched clock differ.
- [B] backend/tests/integration/test_server_time_integration.py: full HTTP cycle: `Cache-Control: no-store` header, 200 body shape with an aware UTC `now`, per-request freshness, 405 on POST.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case (POST gets 405).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/BUG-01/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import and register the server-time router in `create_app()` (one import, one `include_router` line).
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is wired in.

No dependency changes, so no lockfile is regenerated. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. No E2E spec: no criterion's covering tier is E2E (see Criterion coverage).

## Testing Strategy
- Unit tests: `server_time_service` (offset is always `+00:00`, non-UTC aware input converted to UTC, naive input raises `ValueError`, two calls under a patched clock return different values) and the app factory route registration.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` over the real HTTP cycle with the shared `client` fixture from `backend/tests/conftest.py`: the `Cache-Control: no-store` header, the 200 body shape with a parseable aware UTC `now`, two requests returning different `now` values (clock patched in the service module so the test is deterministic, no sleep), and 405 on POST. No database is touched.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py
- E2E tests: not warranted. The defect is a response header on an API endpoint with no UI surface; no criterion requires navigation or interaction through the UI (`testing_standards.md` Section 6, asked per criterion below).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus one edge case (POST gets 405); the deployed reproduction is the human check.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: it is a response header on a router, read over the real HTTP cycle |
| 2 | A test asserts the header on the response | Integration | `test_get_time_sets_cache_control_no_store` | the criterion is met by that integration test existing and passing; no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | `test_get_time_returns_fresh_now_per_request`, `test_get_time_returns_200_with_utc_now_and_timezone` | the edge cache exists only on the deployed environment and no local tier can reproduce it; locally the tests cover the cause (the header, row 1) and per-request freshness, and the deployed reproduction is the human check in the Manual verification plan (`to_verify` route) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends `GET /api/time`, Then the status is 200 and the `Cache-Control` header is `no-store` |
| 2 | A test asserts the header on the response | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then `test_get_time_sets_cache_control_no_store` passes with 0 failed |
| 3 | After deploy, two calls a second apart return different `now` | covered at Integration locally, human check on the deployed environment | Given the change is deployed behind the CDN, When two `GET /api/time` requests are sent one second apart, Then the two `now` values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
This criterion has no UI surface (a response header); the observable check is the header on the HTTP response.
Prerequisites: backend running locally on port 8000 (`uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this endpoint.
1. Run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers in the same output → a line `cache-control: no-store` is present.
3. Read the body → JSON of the form `{"now":"2026-11-13T09:12:34.567890+00:00","timezone":"UTC"}`, with `now` ending in `+00:00`.
4. Run `curl -si -X POST http://localhost:8000/api/time` → status `405 Method Not Allowed`.

### Criterion 2: a test asserts the header on the response
No UI surface; the observable check is the test run.
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the summary reports `0 failed`.
2. Run `uv run --directory backend pytest -q -k test_get_time_sets_cache_control_no_store` → that one test is reported as passed and the summary reports `0 failed`.

### Criterion 3: after deploy, the reproduction returns two different values
Verified by a human on the deployed environment only (the `to_verify` route); locally there is no edge cache, so a local run cannot reproduce the defect.
Prerequisites: the merged change is deployed behind the CDN; you know the deployed API host (`<deployed-host>`).
1. Run `curl -s https://<deployed-host>/api/time` → a JSON body with a `now` value, e.g. `2026-11-13T09:20:01.104512+00:00`.
2. Wait one second, then run `curl -s https://<deployed-host>/api/time` again → a `now` value later than the one from step 1 (the two differ).
3. Run `curl -sI https://<deployed-host>/api/time` → the response headers include `cache-control: no-store`, and no CDN cache-hit header (for example `x-cache: HIT` or `cf-cache-status: HIT`) is present.
