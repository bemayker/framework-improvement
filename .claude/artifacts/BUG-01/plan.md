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
- Comment (tracker): 49 comments on the ticket, all framework PR notices from earlier runs (per the dispatch and `.claude/artifacts/BUG-01/decisions.md`) → Addressed by: not acted on because none states a requirement or correction; none overrides the description.
- Scope assumption (no comment; recorded per `user_story_alignment.md` (unopened section)): the item says "FEAT-1 is complete", but `backend/app/routers/server_time.py` does not exist on `main` at the plan base d7663f0d (verified: `git log -- backend/app/routers/server_time.py` shows the sandbox reset d7663f0d removed it, and `backend/app/main.py` registers only the version, notes and health routers). The route this defect fixes is therefore absent, so this plan **recreates the FEAT-1 slice** (`GET /api/time`, its Pydantic schema, service, router registration in `backend/app/main.py`, and tests) to FEAT-1's own acceptance criteria as read from its tracker item, and adds the `Cache-Control: no-store` fix on top. Nothing beyond FEAT-1's criteria plus this defect's is added.

## Plan Overview
Backend only. Recreate `GET /api/time` (FEAT-1: returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, body defined by a Pydantic schema) in the project's Router to Service to Schema layering, following the TEST-05 version slice (`routers/version.py`, `services/version_service.py`, `schemas/version.py`). The router sets `Cache-Control: no-store` on every response from this route via an injected `fastapi.Response` parameter, which is the defect fix. Register the router in `backend/app/main.py` with one import and one `include_router` line. Unit tests cover the service (UTC-aware, explicit offset, per-call freshness); integration tests cover the HTTP cycle, the shape, the header and per-request freshness. No database, no frontend, no new dependency.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time, with response header `Cache-Control: no-store`. Router `backend/app/routers/server_time.py`: `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time(response: Response) -> ServerTimeResponse` with `response_model=ServerTimeResponse`; it sets `response.headers["Cache-Control"] = "no-store"` and returns the schema built from the service. The header value is a module-level constant (`NO_STORE = "no-store"`) so the test and the router name the same literal intent; no middleware (the fix is scoped to this one route, as the item asks, and touches no other endpoint).
- Service layer: `backend/app/services/server_time_service.py` with `get_current_utc_time() -> datetime` returning `datetime.now(timezone.utc)` (timezone-aware, so serialisation always carries an explicit offset; never `datetime.utcnow()`, which is naive), and constant `SERVER_TIMEZONE = "UTC"`.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: str` and `timezone: str`. The router fills `now` from `get_current_utc_time().isoformat()`, which yields `+00:00` for an aware UTC datetime (explicit offset, never `Z`-less naive).
- App factory: `backend/app/main.py` imports `app.routers.server_time.router as server_time_router` and calls `app.include_router(server_time_router)`; module docstring gains one sentence naming BUG-01 (recreating FEAT-1's route). CORS `allow_methods` already includes GET; nothing else in the factory changes.
- Repository layer: none (no data access).
- Migrations: none.
- Every new module opens with a module docstring naming the work item and the design reason, and every public function/class carries a docstring (project standards: ruff D101/D102/D103 gate).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-18T02:41:07.123456+00:00", "timezone": "UTC"}
```

- Other methods on `/api/time` (e.g. POST) return FastAPI's default 405.

## Technology Selection
- Current UTC time: chose the standard library `datetime.now(timezone.utc)` over any third-party time library (none needed), because the stdlib returns an aware UTC datetime whose `isoformat()` carries the explicit `+00:00` offset.
- Cache directive: chose FastAPI's injected `Response` parameter setting one header (installed dependency) over a custom middleware or a new caching library, because the defect is one header on one route and FastAPI already exposes it.
- Response schema: chose Pydantic `BaseModel` (installed, the project's existing schema convention) over a bare dict, which FEAT-1's criteria forbid.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now`, `timezone`).
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` and `SERVER_TIMEZONE`.
- [B] backend/app/routers/server_time.py: `GET /api/time` router, sets `Cache-Control: no-store`.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service.
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for the route, shape, header and freshness.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script.
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/main.py: import and register the server time router; one docstring sentence.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is registered.

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` edit: the item changes no project structure, run configuration, dependency or test infrastructure. No E2E spec: no criterion requires UI navigation or interaction (see Criterion coverage).

## Testing Strategy
- Unit tests: `server_time_service.get_current_utc_time` returns a timezone-aware datetime with zero UTC offset; its `isoformat()` ends with `+00:00`; two calls separated by a short delay return different values (edge: per-call freshness, no caching in the service). The time source is the stdlib clock; tests patch nothing beyond what is needed for determinism.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py, i.e. `test_server_time_service_unit.py`; plus one case added to `test_main_unit.py`
- Integration tests: full HTTP cycle via the session `client` fixture in `backend/tests/conftest.py`: 200 with the exact key set `{"now", "timezone"}`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware datetime with zero offset; the response header `cache-control` equals `no-store`; two requests about a second apart (stdlib `time.sleep(1.1)` inside the test, acceptable here because it is the criterion's own wording and not a wait on the app) return different `now` values and both carry `no-store`; POST returns 405 (error case). No database needed.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. The feature has no UI, and no criterion requires navigation or interaction (`testing_standards.md` Section 6, asked per criterion).
  - Directory: e2e/tests/ (no file for this item)
  - File: none
- UAT scenarios: header present on `GET /api/time`; two calls a second apart differ; deployed-environment reproduction check as a manual step.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | `test_get_time_sets_cache_control_no_store` | Verifying it needs no navigation or interaction: it is a response header on a router, read off the HTTP response. |
| 2 | A test asserts the header on the response. | Integration | `test_get_time_sets_cache_control_no_store`, `test_get_time_two_requests_differ_and_both_are_no_store` | Verifying it needs no navigation or interaction: the criterion is satisfied by the existence and pass of a router-level test. |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Integration | `test_get_time_two_requests_differ_and_both_are_no_store`, `test_get_current_utc_time_returns_fresh_value_per_call` | No UI involved; the edge cache exists only on the deployed host, so the automated proxy is per-request freshness plus the no-store header locally, and the deployed check is the human step in the Manual verification plan (`to_verify` route). |

Further tests the builder writes (not criterion-bound, cover FEAT-1's recreated contract): `test_get_time_returns_200_with_utc_now_and_timezone`, `test_post_time_returns_405_method_not_allowed`, `test_get_current_utc_time_is_timezone_aware_utc`, `test_get_current_utc_time_isoformat_has_explicit_offset`, `test_create_app_registers_time_route`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response carries Cache-Control: no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration tests run, Then they pass |
| 3 | Deployed reproduction returns two different values | covered at Integration locally plus a human check on the deployed host, see Criterion coverage | Given the deployed environment, When GET /api/time is called twice a second apart, Then the two now values differ |

## Manual verification plan
This item has no UI; every check reads an HTTP response or a test run.

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`.
Prerequisites: backend running locally (`uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this route.
1. In a terminal run `curl -si http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a JSON body like `{"now":"2026-11-18T02:41:07.123456+00:00","timezone":"UTC"}`.
2. Check the `now` value → it ends in `+00:00` (explicit offset) and `timezone` reads `UTC`.

### Criterion 2: A test asserts the header on the response.
Prerequisites: repository checked out on the feature branch; `uv` installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` → the summary line reports no failed or errored test and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → `test_get_time_sets_cache_control_no_store` asserts the `cache-control` response header equals `no-store`.

### Criterion 3: After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).
Prerequisites: the change is merged and deployed; you know the deployed API host.
1. Run `curl -si https://{deployed-host}/api/time` → header `cache-control: no-store` is present on the response that came through the CDN.
2. Run `curl -s https://{deployed-host}/api/time; sleep 1; curl -s https://{deployed-host}/api/time` → two JSON bodies whose `now` values differ (the second is about one second later).
3. Repeat step 2 once more → the values still differ, confirming the edge cache is not serving a stored copy.
