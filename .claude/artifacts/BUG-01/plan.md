# Implementation Plan, BUG-01: Server time is served stale from the edge cache on the deployed environment

## Feature
> On the deployed environment, two requests to `GET /api/time` a second apart return the same `now`. The CDN in front of the API caches the response because it carries no cache directive.
>
> Reproduction (deployed only): `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`. Expected: two different `now` values. Actual: identical values. Locally both calls differ, because nothing caches them.
>
> Notes: Backend only, `backend/app/routers/server_time.py`. FEAT-1 is complete. Depends on: FEAT-1.

## Acceptance Criteria
- [ ] `GET /api/time` responses carry `Cache-Control: no-store`.
- [ ] A test asserts the header on the response.
- [ ] After deploy, the reproduction above returns two different values (verified by a human on the deployed environment).

## Re-Plan Feedback
- Comment (tracker): the item's tracker comments are all framework PR notices (dispatch: "none actionable") → Addressed by: not acted on, because none states a requirement or correction.
- Assumption (no comment, recorded per the ambiguity rule): FEAT-1 is `complete` in the tracker, but its code (`backend/app/routers/server_time.py`, its schema and service, and the router registration in `backend/app/main.py`) is absent from `main` at plan base 7508f8f4 after the sandbox reset. A header cannot be added to a route that does not exist, so this plan recreates the FEAT-1 slice exactly to FEAT-1's own acceptance criteria (`GET /api/time` returns 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, body defined by a Pydantic schema in `backend/app/schemas/`) and adds the `no-store` directive on top. No behaviour beyond FEAT-1's contract and this defect's fix is added.
- Merged since the last plan: n/a (fresh plan, branched from current main at 7508f8f4).

## Plan Overview
Backend only. Recreate the `GET /api/time` slice in the project's Router to Service to Schema layering (canonical modules: `routers/notes.py`, `services/note_service.py`), register the router in `create_app()`, and set `Cache-Control: no-store` on that route's response so no edge cache stores it. The directive is set on this route only, not app-wide: the defect is about this endpoint, and an app-wide middleware would change the caching behaviour of `/api/version`, `/api/health` and `/api/notes`, which no criterion asks for. No database access, no new dependency, no frontend change.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time; every response carries `Cache-Control: no-store`.
- Service layer: `backend/app/services/server_time_service.py` exposes `get_current_utc_time() -> datetime`, returning `datetime.now(timezone.utc)` on every call (never computed at import), and the constant `UTC_TIMEZONE_NAME = "UTC"`. Module docstring names FEAT-1 and BUG-01 and the reason (fresh per request).
- Schema: `backend/app/schemas/server_time.py` defines `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (pydantic rejects a naive value, so the serialised value always carries an offset) and `timezone: Literal["UTC"]`.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time(response: Response) -> ServerTimeResponse` sets `response.headers["Cache-Control"] = NO_STORE` (module constant `NO_STORE = "no-store"`) and returns the schema built from the service. Module docstring names BUG-01 and why the directive is there (the CDN cached a response that carried no cache directive).
- App factory: `backend/app/main.py` imports `router as server_time_router` and adds `app.include_router(server_time_router)` after the existing three registrations; the module docstring's list of registering features gains FEAT-1/BUG-01. CORS middleware and lifespan untouched.
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
{"now": "2026-11-17T19:45:12.345678Z", "timezone": "UTC"}
```

`now` is ISO 8601 in UTC with an explicit offset (pydantic serialises a UTC-aware datetime with `Z`; `+00:00` is equally valid per the FEAT-1 contract, tests parse the value rather than matching the literal suffix). A `POST /api/time` returns 405 (FastAPI default).

## Technology Selection
- Current time: chose the standard library's `datetime.now(timezone.utc)` over any time library, because the stdlib returns an aware UTC datetime directly.
- Naive-datetime guard: chose pydantic's installed `AwareDatetime` type over a hand-written validator, because the installed dependency already rejects naive values.
- Cache directive: chose setting the header on FastAPI's injected `Response` in the one handler (installed dependency) over a new middleware or a caching library, because a single header on a single route needs no new module.
- No new dependency, so no lockfile change.

## File Manifest
<!-- Phase tags are defined in plan-feature Section 8's template. -->
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime`, `timezone: Literal["UTC"]`)
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` and `UTC_TIMEZONE_NAME`
- [B] backend/app/routers/server_time.py: `GET /api/time` handler that sets `Cache-Control: no-store`
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware UTC, per-call freshness, offset)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for `GET /api/time` (200 shape, `Cache-Control: no-store`, per-request freshness, 405)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the server time router; docstring lists FEAT-1/BUG-01
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`
No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: `server_time_service.get_current_utc_time()` returns an aware datetime whose `utcoffset()` is zero; two calls return different values when the clock advances (clock patched via `monkeypatch` on the module's `datetime`, no real sleep); `UTC_TIMEZONE_NAME == "UTC"`. App factory registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (test_server_time_service_unit.py, test_main_unit.py)
- Integration tests: through the session `client` fixture (no database needed): 200 with body keys exactly `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value with zero offset; `response.headers["cache-control"] == "no-store"`; two requests with the service clock patched to return distinct values yield distinct `now`; `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion requires navigation or interaction through the UI; the endpoint has no frontend consumer.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus an edge case (POST returns 405), written as API-level Given/When/Then; the deployed check of criterion 3 is a human step.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_time_sets_cache_control_no_store` | Verifying it needs no navigation or interaction: it is a response header on a router, read over a real HTTP cycle. |
| 2 | A test asserts the header on the response | Integration | `test_get_time_sets_cache_control_no_store` | The criterion is the existence of that router test itself; a browser adds nothing to reading a header. |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | `test_get_time_returns_fresh_now_per_request`, `test_get_current_utc_time_returns_new_value_per_call` | The edge cache exists only on the deployed environment, so no local tier can reproduce it; the automated tiers prove `now` is computed per request and the header forbids storing it, and the deployed curl check in the Manual verification plan closes the criterion. |

Supporting tests (FEAT-1 contract recreated here): `test_get_time_returns_200_with_utc_now_and_timezone`, `test_post_time_returns_405_method_not_allowed`, `test_get_current_utc_time_returns_aware_utc_datetime`, `test_create_app_registers_server_time_route`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the API is running, When a client sends GET /api/time, Then the response has header Cache-Control: no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When test_server_time_integration.py runs, Then it passes and includes the header assertion |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the deployed API behind the CDN, When GET /api/time is called twice a second apart, Then the two `now` values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally on port 8000 (for example `uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this endpoint.
1. In a terminal run `curl -si http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a body like `{"now":"2026-11-17T19:45:12.345678Z","timezone":"UTC"}`.
2. Check the `now` value → it ends in `Z` or `+00:00` (an explicit UTC offset), never a bare timestamp.

### Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out on the BUG-01 branch, uv installed.
1. Open `backend/tests/integration/test_server_time_integration.py` → it contains `test_get_time_sets_cache_control_no_store`, which asserts the response header `cache-control` equals `no-store`.
2. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` → the summary line reports no failed or errored test, and the command exits 0.

### Criterion 3: After deploy, the reproduction returns two different values
This criterion cannot be verified locally (no edge cache exists there); the observable check is on the deployed environment, after the merge has deployed.
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header as served through the CDN (also note any `age` or CDN cache-status header: it should not report a cache hit).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ, by roughly one second.
3. Repeat step 2 once more → the values differ again, confirming the response is not stored at the edge.
