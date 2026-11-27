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
Tracker comments read: 61 across three pages (25, 25, 11), no threaded replies (every reply_count is 0). All 61 start with `mayker-dev:` (PR-opened notices of earlier runs), so there are 0 human comments to carry; none overrides the description.

Assumptions recorded here instead of a blocking question:

- Assumption (FEAT-1 code absent): the 91e19ee3 reset removed FEAT-1's `/api/time` slice from main although FEAT-1 is complete in the tracker. This item recreates the minimum FEAT-1 contract it needs (router, schema, service, router registration) so criterion 1 has a route to carry the header. That is not gold plating: without the route no criterion can be met.
- Assumption (FEAT-1 contract): response body `{"now": "<ISO 8601 UTC, explicit +00:00 offset>", "timezone": "UTC"}`, taken from this item's own last recreation (commit ee0d3429 on main's history), since FEAT-1's code is not on main to read.
- Assumption (scope of the header): `Cache-Control: no-store` is set on the `/api/time` route only, not as a global middleware, because the item names `backend/app/routers/server_time.py` and a global change would alter caching of other routes (no-gold-plating).
- Assumption (deployed host): `docs/DEVELOPMENT.md` → `## Test environments` has no row, so the deployed host is unnamed; criterion 3 is verified by a human on "the deployed environment" the item names, through the `to_verify` route. Use GET (`curl -si`), not HEAD: the route declares GET only and a HEAD gets 405.

## Plan Overview
Backend-only fix. Recreate FEAT-1's `GET /api/time` in the canonical router, service, schema layering (`backend/app/routers/server_time.py`, `backend/app/services/server_time_service.py`, `backend/app/schemas/server_time.py`), register the router in `backend/app/main.py`, and set `Cache-Control: no-store` on every response of that route so the CDN in front of the deployed API stops caching it. Unit and integration tests assert the header and the freshness of `now`. No frontend, no database, no configuration change.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time; every response carries `Cache-Control: no-store`.
- Router (`backend/app/routers/server_time.py`): `APIRouter(prefix="/api", tags=["time"])`; handler takes FastAPI's injected `Response` and sets `response.headers["Cache-Control"] = "no-store"` (module constant `CACHE_CONTROL_NO_STORE`), then returns `ServerTimeResponse(now=get_server_time(), timezone=SERVER_TIMEZONE)`. Module docstring names BUG-01 and why the directive is route-scoped.
- Service layer (`backend/app/services/server_time_service.py`): `SERVER_TIMEZONE = "UTC"`; `_utc_now()` seam returning `datetime.now(timezone.utc)`; `get_server_time()` returns it, computed on every call (no caching in the app either).
- Schema (`backend/app/schemas/server_time.py`): `ServerTimeResponse(now: AwareDatetime, timezone: Literal["UTC"])`, with a field serializer emitting `value.isoformat()` (explicit `+00:00`).
- `backend/app/main.py`: import `router as server_time_router` and `app.include_router(server_time_router)` beside the existing three; update the module docstring line listing which item registers which router. CORS `allow_methods` stays `["GET", "POST"]` (GET already allowed).
- Repository layer: none (no data access).
- Migrations: none.
- Every public function and class carries a one-line docstring (project-standards Gate: ruff D101, D102, D103).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters
- Response: 200, header `Cache-Control: no-store`, body `{"now": "2026-11-27T17:05:12.345678+00:00", "timezone": "UTC"}`
- Other methods: 405 (e.g. POST, HEAD)

## Technology Selection
- Server clock: chose the standard library `datetime.now(timezone.utc)` over any time library; stdlib covers it.
- Cache directive: chose FastAPI's injected `Response` header on the route (installed dependency) over a custom middleware or a new caching library; one header line covers the need.
- Response schema: chose Pydantic `AwareDatetime` (installed with FastAPI) over hand-formatting strings.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: GET /api/time route, sets Cache-Control no-store
- [B] backend/app/services/server_time_service.py: UTC clock read on every call, SERVER_TIMEZONE constant
- [B] backend/app/schemas/server_time.py: ServerTimeResponse (now, timezone)
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests of get_server_time
- [B] backend/tests/integration/test_server_time_integration.py: HTTP tests of GET /api/time, including the Cache-Control header
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios per criterion (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and include the server_time router; docstring names it
- [B] backend/tests/unit/test_main_unit.py: assert /api/time is registered
No dependency is added, so no lockfile changes. Neither README.md nor docs/DEVELOPMENT.md needs an edit: no project structure, run configuration, dependency or test-infrastructure change.

## Testing Strategy
- Unit tests: `get_server_time` returns a timezone-aware UTC datetime and reads the clock on every call (seam `_utc_now` monkeypatched); `create_app` registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: real HTTP cycle through the session `client` fixture: 200 with the contract body, `Cache-Control: no-store` on the response, two calls with distinct patched instants return distinct `now`, POST returns 405. No database needed.
  - Directory: backend/tests/integration/
- E2E tests: none. No criterion needs navigation or interaction through the UI (backend-only, no frontend consumer); E2E toggle is ENABLED but warranted for no criterion.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus an edge case (POST returns 405), in Gherkin; criterion 3 scenario is tagged for the deployed environment.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_time_sets_cache_control_no_store`, `test_get_time_returns_200_with_utc_now_and_timezone` | verifying it needs no navigation or interaction: it is a response header of a router |
| 2 | A test asserts the header on the response | Integration | `test_get_time_sets_cache_control_no_store` | the criterion is itself the router-level test; no UI exists for this route |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | `test_get_time_returns_fresh_now_on_each_call`, `test_get_server_time_reads_clock_on_every_call` | the CDN exists only on the deployed environment, so the automated tier proves the app itself serves a fresh `now`; the deployed check is the human `to_verify` step, not a browser flow |

Other tests the builder writes: `test_get_server_time_returns_timezone_aware_utc_datetime` (unit), `test_post_time_returns_405_method_not_allowed` (integration), `test_create_app_registers_time_route` (unit).

### Reproduction (fix Section R1)
- Repro: deployed-only: `curl -si https://<deployed-host>/api/time; sleep 1; curl -si https://<deployed-host>/api/time` (source: item)
- Reason: the defect is caused by the CDN edge cache in front of the deployed API; locally nothing caches the response, so both calls already differ and no local command can reproduce the stale value.
- Environment: the deployed environment the item names (no row in `docs/DEVELOPMENT.md` → `## Test environments`; host unnamed).
- Expected after deploy: each response shows `cache-control: no-store` and the two `now` values differ. Use GET, never HEAD (405).

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running When a client sends GET /api/time Then the response has status 200 and header Cache-Control no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite When the server-time integration tests run Then they pass |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the fix is deployed When two GET /api/time requests are sent one second apart Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
This criterion has no UI: it is a response header. Observable check instead:
Prerequisites: the backend running locally, for example `uv run --directory backend uvicorn app.main:app --port 8000` (no database needed for this route).
1. In a terminal run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`, the headers include `cache-control: no-store`, and the body looks like `{"now":"2026-11-27T17:05:12.345678+00:00","timezone":"UTC"}`.
2. Run `curl -si -X POST http://localhost:8000/api/time` → the status line reads `HTTP/1.1 405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
Prerequisites: the repository checked out on the branch `feature/BUG-01-server-time-edge-cache`, uv installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → the test `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`.

### Criterion 3: After deploy, the reproduction returns two different values
This criterion has no UI and runs only on the deployed environment (the host is not yet recorded in `docs/DEVELOPMENT.md` → `## Test environments`). Observable check instead:
Prerequisites: the merged fix deployed; the deployed API host known to the tester (replace `<deployed-host>`).
1. Run `curl -si https://<deployed-host>/api/time` → status 200, header `cache-control: no-store`, a body with a `now` value; note it.
2. Wait one second, then run `curl -si https://<deployed-host>/api/time` again → status 200, header `cache-control: no-store`, and a `now` value later than the one noted in step 1 (the two differ).
3. If the two values are identical or the header is missing, the item fails verification: record the two responses on the item. Use GET as above, never `curl -I` (HEAD returns 405 on this route).

## Scope changes

- 2026-11-27 Removed the unused `import os` from backend/app/main.py, which the plan did not list. Reason: the commit gate's `uv run ruff check` row covers every changed *.py file and refused main.py on that pre-existing F401.
