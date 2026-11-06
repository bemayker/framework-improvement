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
- Comment (tracker): 31 comments read (decisions.md, this run), all framework "PR opened" notices from earlier runs → Addressed by: not acted on because none carries a correction, amendment or reviewer instruction; the item description stands as written.
- Assumption (dependency state): FEAT-1 is `complete` in the tracker, but on `main` at the plan base bb5fc2a (`chore: reset Arm E code ... (#625)`, which reverted this item's earlier merge #623 together with TEST-09's #622) none of the endpoint's code exists: no `backend/app/routers/server_time.py`, no schema, no service, and `backend/app/main.py` registers only the version, notes and health routers. The item's Notes ("Backend only, backend/app/routers/server_time.py") presuppose that router. This plan therefore recreates the minimal FEAT-1 slice `GET /api/time` needs (schema, service, router, registration) to FEAT-1's contract, so the header has a response to sit on. This is not gold plating: without it criteria 1 and 2 have no endpoint to test. Nothing beyond FEAT-1's contract and this item's header is added. The feature_map.md row records the same instruction.
- Assumption (earlier merge #623): its plan and code were read as a reference only (`git show 4fb5ad8`); this plan is written against the tree at bb5fc2a, and nothing from #623 is assumed present.
- Assumption (mayker:to-verify label): the item carries the `mayker:to-verify` label; criterion 3 is the human check on the deployed environment, handed over after merge and not something the build can execute.

## Plan Overview
Backend only. Recreate `GET /api/time` (FEAT-1 contract: 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, body defined by a Pydantic schema) following the existing Router to Service layering of the version and health slices, and set `Cache-Control: no-store` on that route's responses only. Register the router in `backend/app/main.py`. No database, no frontend, no external API.

- Repro: deployed-only: on the deployed environment, `curl -s https://<deployed-host>/api/time`, wait one second, repeat; expect two different `now` values (source: item). Reason: the stale value comes from the CDN in front of the deployed API, which a local checkout does not have; locally both calls already differ with or without the fix. Environment: the deployed environment the item names (`docs/DEVELOPMENT.md` → `## Test environments` has no row). The cause-level check, the header itself, is local-automated (criterion 2's integration test).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the current server time in UTC and sets `Cache-Control: no-store` on the response. Registered on `APIRouter(prefix="/api", tags=["time"])`, matching `routers/version.py`.
- Router (`backend/app/routers/server_time.py`): takes FastAPI's `Response` parameter, sets `response.headers["Cache-Control"] = "no-store"` (value held in a module constant), returns `ServerTimeResponse(now=get_current_utc_time(), timezone="UTC")`. A short "why" comment says the header exists for the deployed CDN and has no local effect, so nobody removes it as redundant. Header set on this route only, never as app-wide middleware: the item scopes the defect to `/api/time`.
- Service layer (`backend/app/services/server_time_service.py`): `get_current_utc_time() -> datetime` returning `datetime.now(timezone.utc)`, timezone-aware, computed per call (never cached at module level).
- Schema (`backend/app/schemas/server_time.py`): `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: str`; Pydantic serialises an aware UTC datetime with an explicit `Z`/`+00:00` offset, never naive.
- App factory (`backend/app/main.py`): import the `server_time` router and add one `app.include_router(server_time_router)` line beside the existing three; extend the module docstring's list of registered routers.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no query parameters
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-06T22:30:12.345678Z", "timezone": "UTC"}
```

`now` is ISO 8601 with an explicit UTC offset (`Z` or `+00:00`, whichever Pydantic emits for an aware UTC datetime); clients parse it as an offset-bearing timestamp. `POST /api/time` returns 405 (FastAPI default for an undeclared method).

## Technology Selection
- Current UTC time: chose the standard library `datetime.now(timezone.utc)` over any time library, because the stdlib returns an aware UTC datetime directly.
- Cache directive: chose setting the header on FastAPI's injected `Response` (installed framework) over a custom middleware or a caching dependency, because one header on one route needs no new component.
- Response schema: chose Pydantic `BaseModel` (already installed via FastAPI) over a hand-rolled serialiser, because it serialises an aware datetime with its offset natively.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` schema (`now: datetime`, `timezone: str`) for `GET /api/time`.
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` returning an aware UTC datetime per call.
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on the response; no business logic.
- [B] backend/tests/unit/test_server_time_service_unit.py: service unit tests: returns an aware datetime, offset is zero (UTC), two calls with a patched clock return the respective values (not cached).
- [B] backend/tests/integration/test_server_time_integration.py: full HTTP cycle: 200 with the body shape and an explicit-offset `now`, `Cache-Control` header equals `no-store` (criterion 2), two requests return different `now` values (local proxy for criterion 3's freshness), 405 on POST.
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per acceptance criterion plus one edge case.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script, expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/BUG-01/uat_script.md: the artifact copy of the manual script that build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import and register the server time router in `create_app()` (one `include_router` line, matching version/notes/health), docstring extended.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is wired in, using the existing `_collect_route_paths` helper.

No lockfile changes: this item adds no dependency.
No README.md or docs/DEVELOPMENT.md edit: neither project structure, run configuration, dependencies nor test infrastructure change, and `docs/DEVELOPMENT.md` (line 669 at bb5fc2a) already documents that `GET /api/time` sends `Cache-Control: no-store` on that route only.

## Testing Strategy
- Unit tests: `server_time_service.get_current_utc_time()` (aware, UTC offset zero, per-call value with a patched clock), and app-factory route registration.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through the real HTTP cycle with the session `client` fixture from `backend/tests/conftest.py` (the endpoint needs no database): status 200, body keys and `timezone == "UTC"`, `now` parses with a zero `utcoffset()`, `response.headers["cache-control"] == "no-store"`, two requests return different `now` values (microsecond-resolution values; no hardcoded sleep), POST returns 405.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. The item has no UI and no criterion involves navigation or interaction; an E2E test that calls the API directly is a router integration test by definition.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: Gherkin scenarios for the header, the test, and the deployed freshness check, plus one edge case (POST rejected).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | Verifying it needs no navigation or interaction: it is a response header on a router, read off the HTTP cycle. |
| 2 | A test asserts the header on the response. | Integration | The criterion is satisfied by the integration test itself (`test_get_time_sets_cache_control_no_store`); no UI is involved. |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Integration (local freshness proxy) plus manual check on the deployed environment | No UI exists and the stale value appears only behind the deployed CDN; the integration test proves two local requests differ and the header is present, and a human runs the item's curl reproduction after deploy. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Responses carry `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the backend is running When a client requests GET /api/time Then the response carries Cache-Control: no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite When the server time integration tests run Then the header assertion passes with 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration plus manual deployed check, see Criterion coverage | Given the fix is deployed When GET /api/time is requested twice one second apart Then the two now values differ |

## Manual verification plan
This item has no UI; every check below is an HTTP call or a test run. Local backend base URL: `http://localhost:8010` (the `docker-compose.yml` backend service).

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`.
Prerequisites: the stack is running with `docker compose up -d --build` from the repository root, and the backend answers on `http://localhost:8010`.
1. Run `curl -si http://localhost:8010/api/time` → status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a JSON body with `now` (ISO 8601 ending in `Z` or `+00:00`) and `"timezone":"UTC"`.
2. Run `curl -si http://localhost:8010/api/version` → status 200 and no `cache-control: no-store` header line (the directive is scoped to `/api/time` only).

### Criterion 2: A test asserts the header on the response.
Prerequisites: the backend dependencies are installed (`uv sync --directory backend`); no database is needed for these files.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction above returns two different values.
Not verifiable locally: the stale value is produced by the deployed environment's CDN, which a local stack does not have. The observable check, run by a human after the merge is deployed:
Prerequisites: the merge containing BUG-01 is deployed; `<deployed-host>` is the deployed API's host (no row exists yet in `docs/DEVELOPMENT.md` → `## Test environments`, so take the host from whoever operates the deployment).
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header line on the response the CDN returns.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ (the second about one second later). Identical values mean the defect persists; record the response headers of both calls in the verification note.
