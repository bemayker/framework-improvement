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
- Comment (tracker): framework PR-opened notes from earlier runs only (27 read, 0 actionable, per `.claude/artifacts/BUG-01/decisions.md`) → not acted on because none carries feedback on the item's scope or content.
- Assumption (no comment, recorded here as the ambiguity rule asks): the item says "FEAT-1 is complete" and names `backend/app/routers/server_time.py` as the file to change, but on the plan base (a7ddb99, a sandbox reset) that file, its schema and its service are absent and `GET /api/time` is not registered in `backend/app/main.py` (confirmed by reading the tree; `feature_map.md`'s BUG-01 row says the same). A header cannot be added to an endpoint that does not exist, so this plan recreates the FEAT-1 endpoint exactly as FEAT-1's acceptance criteria define it (200, `{"now": <ISO 8601 UTC with explicit offset>, "timezone": "UTC"}`, `now` computed per request, body defined by a Pydantic schema in `backend/app/schemas/`) and adds the `Cache-Control: no-store` directive. Nothing beyond FEAT-1's contract and BUG-01's header is added (no pagination, no query parameters, no other headers).

## Plan Overview
Backend only. Recreate the `GET /api/time` slice in the existing Router to Service layering (router, Pydantic response schema, a one-function time service), register the router in `backend/app/main.py`, and set `Cache-Control: no-store` on every response of that route so a CDN or any other shared cache in front of the deployed API never stores it. No database, no frontend, no external API. Criterion 3 is a human check on the deployed environment; locally it is proxied by an integration test showing two calls differ and both carry the directive.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the current server time in UTC and sets `Cache-Control: no-store` on the response.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])` matching `routers/version.py`. The handler takes FastAPI's injected `Response` and sets `response.headers["Cache-Control"] = "no-store"` (the value held in a module constant with a one-line "why" comment naming the edge cache), then returns `ServerTimeResponse(now=..., timezone="UTC")`. Set in the router rather than as app-wide middleware: the defect and criterion 1 concern this one route, and a global directive would change the caching of `/api/version` and `/api/health`, which nobody asked for.
- Service layer: `backend/app/services/server_time_service.py`, `get_current_utc_time() -> datetime` returning `datetime.now(timezone.utc)`, timezone-aware and computed on every call (no module-level or `lru_cache` value).
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: str`. Pydantic serialises an aware UTC datetime as ISO 8601 with an explicit `Z` offset, never naive.
- Registration: `backend/app/main.py` gains one import and one `app.include_router(server_time_router)` line in `create_app()`; the factory's structure is unchanged.
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
{"now": "2026-11-05T18:04:08.123456Z", "timezone": "UTC"}
```

- Any other method (for example POST) answers 405, FastAPI's default.

## Technology Selection
- Current UTC time: chose the standard library's `datetime.now(timezone.utc)` over any time or date dependency, because the stdlib already yields an aware UTC instant.
- Cache directive: chose FastAPI's injected `Response` header (already installed) over a new middleware or caching dependency, because one header on one route is a single assignment.
- Response schema: chose Pydantic (already installed through FastAPI) over a bare dict, because FEAT-1's criteria require a schema and Pydantic's datetime serialisation already emits the explicit offset.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on the response.
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: datetime`, `timezone: str`).
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()`, aware UTC `datetime` computed per call.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the time service (aware, UTC offset, fresh per call, patched clock).
- [B] backend/tests/integration/test_server_time_integration.py: integration tests for the route (200 and shape, `Cache-Control: no-store` header, explicit offset, two calls differ and both carry the header, 405 on POST).
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus an edge case.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script build-feature writes.

### Modified files
- [B] backend/app/main.py: import the server time router and register it in `create_app()` (one import, one `include_router` line).
- [B] backend/tests/unit/test_main_unit.py: assert `/api/time` is among the app's registered routes.
- [Docs] docs/DEVELOPMENT.md: one paragraph next to the existing `GET /api/version` notes saying `GET /api/time` is never cacheable and why (the deployed CDN), so an operator does not "fix" the header away.

No dependency changes, so no lockfile is regenerated. `README.md` needs no edit: no project structure, run configuration or test infrastructure changes.

## Testing Strategy
- Unit tests: `server_time_service.get_current_utc_time()`: returns an aware datetime whose `utcoffset()` is zero (happy path); two consecutive calls each read the clock anew, shown by patching the module's `datetime` to return two distinct instants and getting both back (edge: freshness); the result is never naive (error-guard case). `create_app()` registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (test_server_time_service_unit.py; test_main_unit.py extended)
- Integration tests: full HTTP cycle through the session `client` fixture in `backend/tests/conftest.py`: 200 with keys exactly `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value with zero offset; the response's `Cache-Control` header equals `no-store`; two requests, with `get_current_utc_time` patched via `monkeypatch` to return two distinct instants (no real sleep), return different `now` values and both carry `no-store`; POST answers 405. The route needs no database, so these tests do not request `database_url`.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No criterion involves navigation or interaction through the UI (the endpoint has no frontend consumer), so no spec is written; see Criterion coverage.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus an edge case (POST is rejected and carries no cached body).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | verifying it needs no navigation or interaction: it is a response header of a router, read off the HTTP response |
| 2 | A test asserts the header on the response | Integration | the criterion is satisfied by the integration test itself (`test_get_time_sets_cache_control_no_store`), which asserts the header on a real request/response cycle |
| 3 | After deploy, the reproduction returns two different values | Integration | no UI is involved and no local tier has the deployed CDN; the integration test proves the precondition (two calls differ and both carry `no-store`), and the deployed check itself is the human step in the Manual verification plan (the item's `mayker:to-verify` route) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response status is 200 And the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration tests run, Then the header test passes with 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the deployed API, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
This item has no UI: every check below reads an HTTP response or a test run, which is the observable check the criteria name.

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the stack is running locally (`docker compose up -d --build` from the repository root), backend on `http://localhost:8010`.
1. In a terminal, run `curl -si http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK`, the headers include `cache-control: no-store`, and the body looks like `{"now":"2026-11-05T18:04:08.123456Z","timezone":"UTC"}`.
2. Check the `now` value from step 1 → it ends in `Z` (an explicit UTC offset), and `timezone` is `UTC`.
3. Run `curl -si -X POST http://localhost:8010/api/time` → `HTTP/1.1 405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
Prerequisites: a checkout of the feature branch with `uv` installed.
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the run ends with `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named for the header (for example `test_get_time_sets_cache_control_no_store`) asserts `response.headers["cache-control"] == "no-store"`.

### Criterion 3: After deploy, the reproduction returns two different values
Prerequisites: this item is merged and deployed; you know the deployed host (replace `deployed-host` below). This is the item's to-verify step, done by a human on the deployed environment only.
1. Run `curl -si https://deployed-host/api/time` → 200, headers include `cache-control: no-store`; note the `now` value (for example `2026-11-05T18:10:00.100000Z`).
2. Wait one second, then run `curl -s https://deployed-host/api/time` again → a `now` value one second or more later than step 1's (for example `2026-11-05T18:10:01.250000Z`), not identical to it.
3. Check the second response's headers for any CDN cache-hit marker (for example `x-cache: HIT` or a non-zero `age:`) → none is present; a `HIT` means the CDN still caches and the item is not verified.
