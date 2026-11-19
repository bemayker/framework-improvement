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
- Comment (tracker): earlier runs' bot "PR opened" notes only → not acted on because they carry no feedback on scope or behaviour.
- Merged since the last plan: n/a (fresh plan, branched from current main at 49c5d32d; no previous BUG-01 plan exists on main, the reset commit removed it).

## Plan Overview
Backend-only fix: `GET /api/time` sets `Cache-Control: no-store` on every response so the edge cache never stores it.

**Scope decision (restoring FEAT-1).** Verified on main at 49c5d32d: `backend/app/routers/server_time.py`, `backend/app/schemas/server_time.py` and `backend/app/services/server_time_service.py` do not exist and `backend/app/main.py` registers only the version, notes and health routers. Commit 49c5d32d ("reset Arm E code") deleted them. FEAT-1 is `complete` in the tracker, so this fix cannot apply a header to an endpoint that does not exist. The plan therefore restores the FEAT-1 server-time slice (schema, service, router, registration in `main.py`) to FEAT-1's own acceptance criteria — `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request and timezone-aware, body defined by a Pydantic schema — and adds the `no-store` header on top. Nothing beyond FEAT-1's criteria and BUG-01's criteria is built (no other headers, no middleware, no caching config for other routes). Recorded under `## Scope changes`.

Layers: schema, service, router, app factory registration, unit and integration tests, UAT artifacts. No frontend, no database, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` — returns the server's current UTC time; every response carries `Cache-Control: no-store`.
- Schema (`backend/app/schemas/server_time.py`): `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic rejects a naive datetime) and `timezone: Literal["UTC"]`. Module docstring names FEAT-1 and BUG-01.
- Service layer (`backend/app/services/server_time_service.py`): `get_server_time() -> datetime` returning `datetime.now(timezone.utc)` on every call; no module-level cache.
- Router (`backend/app/routers/server_time.py`): `APIRouter(prefix="/api", tags=["time"])`, `@router.get("/time", response_model=ServerTimeResponse)`, handler takes `response: Response` and sets `response.headers["Cache-Control"]` from a module constant `CACHE_CONTROL_NO_STORE = "no-store"` with a one-line "why" comment (the CDN caches responses without a directive). Same shape as `backend/app/routers/version.py`.
- App factory (`backend/app/main.py`): import `router as server_time_router` from `app.routers.server_time` and `app.include_router(server_time_router)` after the existing three; add FEAT-1/BUG-01 to the module docstring's registration list. No change to CORS (GET is already allowed) or lifespan.
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
{"now": "2026-11-19T00:30:12.345678Z", "timezone": "UTC"}
```

`now` is ISO 8601 with an explicit UTC offset (Pydantic serialises an aware UTC datetime as `Z`; `+00:00` is equally valid), never naive.

## Technology Selection
- Cache directive: chose a `Response` parameter header set in the router (FastAPI, already installed) over a new caching middleware or dependency, because one header on one route needs no middleware and the criterion scopes it to `GET /api/time` only.
- Current time: chose the standard library `datetime.now(timezone.utc)` over any time library; the stdlib covers it.
- Aware-datetime validation: chose Pydantic's `AwareDatetime` (already installed with FastAPI) over a hand-written validator.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (restored FEAT-1 slice)
- [B] backend/app/services/server_time_service.py: `get_server_time()` returning an aware UTC datetime per call (restored FEAT-1 slice)
- [B] backend/app/routers/server_time.py: `GET /api/time` router setting `Cache-Control: no-store` (the BUG-01 fix, on the restored FEAT-1 router)
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware UTC, per-call freshness) and the schema (naive datetime rejected)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP request/response tests for `GET /api/time` (shape, offset, header, method not allowed)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios per acceptance criterion (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and `include_router` the server-time router; docstring registration list updated
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` edit: the feature changes no project structure, run configuration, dependency or test infrastructure. No E2E spec: no criterion requires UI navigation or interaction (see Criterion coverage).

## Testing Strategy
- Unit tests: service layer `get_server_time()` (returns aware datetime with UTC offset zero; two calls with a stubbed clock return the two clock values, proving no caching; error case: the schema rejects a naive datetime with a `ValidationError`); app factory registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through `TestClient(create_app())` (no database needed, the endpoint touches none; build the client unmanaged like `test_get_health_returns_503_degraded_when_the_database_is_unreachable` or use the shared `client` fixture): 200 with exact keys `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware datetime with `utcoffset() == timedelta(0)`; `Cache-Control` header equals `no-store`; two sequential requests both carry the header and the second `now` is not earlier than the first; `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: none warranted. No acceptance criterion involves navigation or interaction through the UI; the endpoint has no frontend consumer.
  - Directory: e2e/tests/
  - File: none (would be BUG-01_server_time_edge_cache.spec.ts)
- UAT scenarios: one scenario per criterion plus an edge case (`POST /api/time` is rejected), as API-level Given/When/Then with no UI steps.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_server_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: it is a response header on a router, observable only over HTTP |
| 2 | A test asserts the header on the response | Integration | `test_get_server_time_sets_cache_control_no_store` | the criterion is met by the existence and pass of that router integration test; no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment) | Integration | `test_get_server_time_sets_no_store_on_every_response`, `test_get_server_time_computes_a_new_value_per_call` | the deployed edge cache cannot run in any test tier; the automated proxy is that every response forbids storage and `now` is computed per call, and the deployed check itself is the human step in the Manual verification plan |

Supporting tests for the restored FEAT-1 behaviour (not separate criteria of this item): `test_get_server_time_returns_now_and_utc_timezone`, `test_get_server_time_now_has_explicit_utc_offset`, `test_post_server_time_returns_405_method_not_allowed`, `test_get_server_time_returns_aware_utc_datetime`, `test_server_time_response_rejects_naive_datetime`, `test_create_app_registers_server_time_route`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the backend is running, When a client sends GET /api/time, Then the response status is 200 And the Cache-Control header is no-store |
| 2 | A test asserts the header on the response | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the header test passes |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the deployed environment, When GET /api/time is requested twice a second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
This criterion is not visible in the UI (a response header); the observable check is the header on the HTTP response.
Prerequisites: the stack is running (`docker compose up -d`), backend on `http://localhost:8010`.
1. In a terminal, run `curl -si http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers of that same output → a line `cache-control: no-store` is present (header names are case-insensitive).
3. Read the body → JSON with exactly two keys, `now` (for example `2026-11-19T00:30:12.345678Z`, ending in `Z` or `+00:00`) and `timezone` with value `UTC`.

### Criterion 2: A test asserts the header on the response
Prerequisites: a checkout of the branch with `uv` installed.
1. From the repo root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → `test_get_server_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`.

### Criterion 3: After deploy, the reproduction returns two different values
This criterion is verified only on the deployed environment (no edge cache exists locally); the observable check is two response bodies.
Prerequisites: this item is merged and deployed; the deployed API host is known (substitute it for `<deployed-host>`).
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header; note the `now` value.
2. Wait one second, then run `curl -s https://<deployed-host>/api/time` again → the `now` value is later than the one noted in step 1, not identical.
3. Repeat steps 1 and 2 once more → the values differ again, confirming the CDN did not serve a stored copy (an `age` header, if the CDN sends one, is absent or `0`).

## Scope changes

- 2026-11-19 Restore the FEAT-1 server-time slice absent from main at 49c5d32d: create backend/app/schemas/server_time.py, backend/app/services/server_time_service.py and backend/app/routers/server_time.py, and register the router in backend/app/main.py (with backend/tests/unit/test_main_unit.py). Reason: commit 49c5d32d (sandbox reset) deleted FEAT-1's code while FEAT-1 stays complete in the tracker, and BUG-01's header fix needs GET /api/time to exist; restored to FEAT-1's own acceptance criteria only.
