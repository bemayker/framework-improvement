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
- Comment (tracker): framework bot "PR opened" notes from earlier runs, no human or actionable comment → Addressed by: not acted on, because none states a requirement, correction or amendment to the item.
- Scope change (assumption, recorded per `user_story_alignment.md` Section 4): the item says "FEAT-1 is complete" and points at `backend/app/routers/server_time.py`, but on `origin/main` at 02cd3e510d02ff7b14fc6abd36401e6843160456 neither `backend/app/routers/server_time.py`, a server-time schema, nor a `/api/time` registration in `backend/app/main.py` exists (verified with `git ls-tree -r origin/main backend/app` and a grep for `server_time` and `/api/time` over `backend/`; the map's shared-risk cell attributes the absence to the sandbox reset c5a6e64). `GET /api/time` therefore answers 404 on main today. Criterion 1 cannot hold on an endpoint that does not exist, so this plan recreates the minimal FEAT-1 endpoint (router, Pydantic schema, one service function, registration in `main.py`) to FEAT-1's own tracker contract, and adds the header on it. Nothing beyond FEAT-1's contract plus the header is added.
- Merged since the last plan: n/a (fresh plan, branched from current main 02cd3e5; no `[merged-since]` lines in the dispatch).

## Plan Overview
Backend only. Recreate `GET /api/time` (FEAT-1's contract: 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request) and make every response from it carry `Cache-Control: no-store`, so a shared cache (the CDN on the deployed environment) never stores it. Layers: router `backend/app/routers/server_time.py`, schema `backend/app/schemas/server_time.py`, service `backend/app/services/server_time_service.py`, registration in `backend/app/main.py`. Tests at unit and integration tiers; no frontend, no database, no new dependency.

**Reproduction reasoning (the reproduction class is decided after plan approval; this is the input to that decision).**
- The user-visible symptom (two identical `now` values a second apart) is **deployed-only**: it needs the edge cache, which no local or CI environment has. It cannot be reproduced locally, and no test here claims to reproduce it.
- The **cause** is locally observable and deterministic: the response carries no cache directive. On main today the stronger form of it holds, the route is absent (404). A locally failing-first test is therefore available for the cause, not the symptom: `test_get_time_returns_cache_control_no_store` fails on main (404, and no header) and passes after the fix.
- Criterion 3 stays a human check on the deployed environment after merge (the `to_verify` route); the plan's tests cover its local precondition (fresh `now` per request plus the `no-store` directive), which is the strongest local evidence available.

**`backend/app/main.py`: YES, BUG-01 touches it** (one import and one `app.include_router(server_time_router)` line). TEST-09 is planned concurrently and may also edit it; serialize the builds when both File Manifests list it.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time with `Cache-Control: no-store` on the response.
- Service layer: `backend/app/services/server_time_service.py` → `get_server_time() -> datetime`, returning `datetime.now(timezone.utc)` (timezone-aware, computed per call, never naive). Constant `SERVER_TIMEZONE = "UTC"`.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, handler `get_time(response: Response) -> ServerTimeResponse` that sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=get_server_time(), timezone=SERVER_TIMEZONE)`. The header is set in the route (not a global middleware) because only this endpoint's value is per-request time; widening the directive to every route is not asked for.
- Schema: `backend/app/schemas/server_time.py` → `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (pydantic's aware-datetime type rejects a naive value) and `timezone: Literal["UTC"]`. Pydantic serialises a UTC-aware datetime as ISO 8601 with an explicit offset (`Z` or `+00:00`).
- Registration: `backend/app/main.py` imports the router and calls `app.include_router(server_time_router)`; module docstring line extended to name it.
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
  {"now": "2026-11-17T01:23:45.678901Z", "timezone": "UTC"}
  ```
  `now` is ISO 8601 in UTC with an explicit offset (`Z` or `+00:00`), never naive. Non-GET methods answer 405.

## Technology Selection
- Cache directive: chose a plain `Response` header set in the route over a caching middleware or a new dependency, because FastAPI's injected `Response` already covers it in one line.
- Current time: chose the standard library's `datetime.now(timezone.utc)` over any time library; the stdlib covers a timezone-aware UTC now.
- Response schema: chose pydantic's installed `AwareDatetime` and `Literal` over hand-written validation, because the installed pydantic already enforces "never naive".
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: GET /api/time router, sets `Cache-Control: no-store`
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema
- [B] backend/app/services/server_time_service.py: `get_server_time()` returning aware UTC now
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service and schema
- [B] backend/tests/integration/test_server_time_integration.py: HTTP cycle tests for GET /api/time, including the header
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios per criterion
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script

### Modified files
- [B] backend/app/main.py: import and register the server-time router (shared with TEST-09; serialize)
- [B] backend/tests/unit/test_main_unit.py: assert `/api/time` is registered
No dependency changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` edit: the feature changes no project structure, run configuration, dependency or test infrastructure.
No E2E spec: no criterion requires navigation or interaction through the UI (see Criterion coverage).

## Testing Strategy
- Unit tests: `server_time_service.get_server_time()` returns an aware datetime with UTC offset zero; two calls differ (per-call freshness); `ServerTimeResponse` rejects a naive datetime (error case) and serialises `now` with an explicit offset; `create_app()` registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: real HTTP cycle through `create_app()` and the session `client` fixture: 200 with the contract shape and explicit-offset `now`; `Cache-Control: no-store` on the response; two requests return different `now`; POST answers 405. No database needed.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. The item is backend only and no criterion involves navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question, asked per criterion).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus one edge case (POST returns 405).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_time_returns_cache_control_no_store` | verifying it needs no navigation or interaction: it is a response header on a router, read off the HTTP cycle |
| 2 | A test asserts the header on the response | Integration | `test_get_time_returns_cache_control_no_store` | the criterion is the existence of that router test itself; no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment) | Integration | `test_get_time_returns_fresh_now_per_request`, `test_get_time_returns_200_with_utc_now_and_timezone` | the symptom needs the deployed edge cache, which no test tier has; locally the router test proves the precondition (fresh `now` per request, plus criterion 1's directive), and the human deployed check in the Manual verification plan closes it |

Unit tests backing the same criteria (not covering tests for a row): `test_get_server_time_returns_aware_utc_datetime`, `test_get_server_time_returns_a_new_value_per_call`, `test_server_time_response_rejects_naive_datetime`, `test_create_app_registers_time_route`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the backend runs, When I GET /api/time, Then the response header Cache-Control is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When I run the server-time integration tests, Then the run passes |
| 3 | Two deployed requests a second apart differ | covered at Integration, see Criterion coverage; deployed check is manual | Given the deployed host, When I GET /api/time twice a second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Not verifiable through the UI: the item has no frontend. The observable check is the response header.
Prerequisites: backend running locally (`docker compose up` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8000`).
1. In a terminal, run `curl -si http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a body like `{"now":"2026-11-17T01:23:45.678901Z","timezone":"UTC"}`.
2. Check the `now` value → it ends in `Z` or `+00:00` (explicit offset, never a bare time).
3. Run `curl -si -X POST http://localhost:8000/api/time` → status `405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
Not verifiable through the UI. The observable check is the test run.
Prerequisites: repository checked out at the merged commit, uv installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the summary line reports no failed or errored test, and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → `test_get_time_returns_cache_control_no_store` asserts the response's `Cache-Control` header equals `no-store`.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable through the UI and not locally (no edge cache locally). The observable check is the deployed reproduction, run by a human after the merge reaches the deployed environment.
Prerequisites: the merge is deployed; you know the deployed API host.
1. Run `curl -si https://<deployed-host>/api/time` → 200, header `cache-control: no-store` present (a CDN may add its own headers such as `age` or `x-cache`; `age` should be absent or 0, `x-cache` should not read HIT).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ by about one second.
3. Repeat step 2 twice more → every pair differs. Any identical pair means the edge still caches the response: the item fails verification.
