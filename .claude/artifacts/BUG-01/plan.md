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
- Comment (tracker): 20 comments read by the dispatching session, 0 actionable (all are framework PR-opened notes from earlier runs) → not acted on because none carries a stakeholder correction or amendment.
- Assumption (no comment, recorded per item 4): FEAT-1 is `complete` in the tracker, but its code is absent from `main` at ba107df (`backend/app/routers/server_time.py`, `backend/app/schemas/server_time.py` and any `/api/time` registration do not exist; `git ls-tree origin/main -- backend/app` holds no time module, and `backend/app/main.py` registers only version, notes and health). The `feature_map.md` row for BUG-01 already records this ("BUG-01 must recreate backend/app/routers/server_time.py and register it in backend/app/main.py"). A `Cache-Control` header cannot be added to an endpoint that does not exist, so this plan recreates the minimal FEAT-1 endpoint (its own acceptance criteria: 200 with `{"now": ISO 8601 UTC with explicit offset, "timezone": "UTC"}`, `now` computed per request, Pydantic schema under `backend/app/schemas/`) and adds the no-store directive. Nothing beyond FEAT-1's contract and BUG-01's header is added. The PR description must state this scope as a documented assumption.

## Plan Overview
Backend only. Recreate `GET /api/time` in the existing Router to Service to Schema shape the version slice uses (`routers/version.py`, `services/version_service.py`, `schemas/version.py`), register it in `create_app()` in `backend/app/main.py`, and set `Cache-Control: no-store` on every response of that route so the CDN in front of the deployed API stops caching it. Tests: unit tests for the service (UTC, explicit offset, per-call freshness), integration tests for the route (status, body shape, the header). Criterion 3 is a human check on the deployed environment and cannot be executed locally (no edge cache exists there).

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this item)

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time with `Cache-Control: no-store`.
- Service layer: `backend/app/services/server_time_service.py` exposes `get_server_now() -> datetime`, returning `datetime.now(timezone.utc)` (timezone-aware, never naive), evaluated on each call. No caching, no module-level timestamp.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, handler takes FastAPI's `Response` parameter and sets `response.headers["Cache-Control"] = "no-store"` before returning `ServerTimeResponse(now=get_server_now())`. The header value is a module constant with a one-line comment saying why (the CDN caches undirected responses). Setting it in the handler, not as app-wide middleware: the bug is scoped to this route and no criterion asks for a global cache policy (`user_story_alignment.md` Section 3).
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"] = "UTC"`. Pydantic serialises an aware UTC datetime with an explicit offset (`+00:00` or `Z`); the integration test asserts the parsed value is offset-aware with zero offset rather than asserting a literal suffix.
- App factory: `backend/app/main.py` imports the router and adds `app.include_router(server_time_router)` beside the existing three; the module docstring gains one line naming the registration. No other change to the factory, CORS or lifespan.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, headers include `Cache-Control: no-store`, body:

```json
{"now": "2026-11-02T22:40:01.123456Z", "timezone": "UTC"}
```

- `now`: ISO 8601, UTC, explicit offset (`Z` or `+00:00`), never naive. Two calls a second apart differ.
- Other methods: 405 (FastAPI default for an unregistered method on the path).

## Technology Selection
- Current UTC time: chose the standard library `datetime.now(timezone.utc)` over any time library (none needed; stdlib covers aware UTC timestamps).
- Cache directive: chose FastAPI's built-in `Response` parameter header assignment (an installed dependency) over a custom middleware or a new caching package, because one route needs one header and a middleware would widen scope to every route.
- Response schema: chose Pydantic `BaseModel` (installed) with `datetime` and `Literal`, over hand-serialising an ISO string, because Pydantic already emits the offset for an aware datetime.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router, sets `Cache-Control: no-store`, returns `ServerTimeResponse`.
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: datetime`, `timezone: Literal["UTC"]`).
- [B] backend/app/services/server_time_service.py: `get_server_now()` returning a timezone-aware UTC datetime per call.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for `get_server_now()` (aware, zero UTC offset, fresh per call).
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for `GET /api/time` (200 and body shape, explicit offset, `Cache-Control: no-store`, per-request freshness, 405 on POST).
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios per criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [B] backend/app/main.py: import and register the server-time router in `create_app()`; docstring line naming it.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the custom routes.

No E2E spec is written: no criterion is assigned to E2E (see Criterion coverage). No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the item adds one endpoint and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `get_server_now()` returns an aware datetime (`tzinfo` not None), with `utcoffset() == timedelta(0)`; two calls straddling a monkeypatched or real clock advance differ (edge case); and the result is not a naive value (error case guard: assert `tzinfo is not None`). Route registration in `create_app()`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through the shared `client` fixture (`backend/tests/conftest.py`): 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`; `now` parses with `datetime.fromisoformat` to an aware value with zero offset; `response.headers["cache-control"] == "no-store"` (criterion 1 and 2); two calls separated by a short real delay return different `now`; `POST /api/time` returns 405. The endpoint needs no database, mirroring `test_get_version_answers_when_database_url_is_unset`.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI; the item has no frontend.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus an edge case (POST returns 405, or header present on repeated calls).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | verifying it needs no navigation or interaction: it is a response header on a router, asserted through the real HTTP cycle |
| 2 | A test asserts the header on the response | Integration | the criterion is satisfied by the integration test itself (`test_get_time_sets_cache_control_no_store`); no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration (header and per-request freshness) plus manual check on the deployed environment | the defect only reproduces behind the deployed CDN, which no local tier has; the integration test covers the cause (the header) and freshness, and the human deployed check covers the effect |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response has header Cache-Control no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then they pass with 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration plus manual deployed check, see Criterion coverage | Given the deployed environment, When GET /api/time is requested twice a second apart, Then the two now values differ |

## Manual verification plan
None of the three criteria is verifiable through the UI: the item has no frontend. Each block gives the observable check instead.

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally (for example `uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this endpoint.
1. Run `curl -si http://localhost:8000/api/time` in a terminal → status line `HTTP/1.1 200 OK`.
2. Read the response headers → a line `cache-control: no-store` is present.
3. Read the body → JSON with keys `now` (for example `2026-11-02T22:40:01.123456Z`, ending in `Z` or `+00:00`) and `timezone` equal to `"UTC"`.

### Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out on the feature branch, uv installed, the run's backing database available per CLAUDE.md Backing Services (the shared conftest may require it).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test asserts `response.headers["cache-control"] == "no-store"`.

### Criterion 3: After deploy, the reproduction returns two different values
Prerequisites: the change is merged and deployed; you know the deployed API host (`<deployed-host>`). This check runs only on the deployed environment; locally there is no edge cache.
1. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies are printed.
2. Compare the two `now` values → they differ (the second is about one second later).
3. Run `curl -sI https://<deployed-host>/api/time` → the headers include `cache-control: no-store`, and no CDN cache-hit header (for example `x-cache: HIT` or `cf-cache-status: HIT`) is shown.
