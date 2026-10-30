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
- Comment (tracker): 17 comments read, 0 actionable (all framework PR notices from earlier runs, per this run's decisions log) → Addressed by: nothing to act on; recorded so the count is visible.
- Merged since the last plan: n/a (fresh plan, branched from current main at plan base 8e90cb7).
- Assumption (map note, verified against the code): FEAT-1 is Done in the tracker, but `backend/app/routers/server_time.py` and `backend/app/schemas/server_time.py` do not exist on main at 8e90cb7 and `backend/app/main.py` registers no time router (the sandbox reset removed them; `git log` shows the FEAT-1 commit f293b27 and two earlier BUG-01 fixes, 2044c80 and 847a16e, each later reset away). The defect cannot be fixed on a route that does not exist, so this plan recreates the minimal `GET /api/time` slice in FEAT-1's original shape (`now` as a timezone-aware UTC datetime, `timezone` fixed to `UTC`) and adds the `Cache-Control: no-store` header to it. No other FEAT-1 behaviour is invented beyond that response shape.
- Assumption: the deployed environment, its host and its CDN are not part of this repository, so criterion 3 is a post-deploy human check; this plan covers its mechanism locally (two sequential requests return different `now` values, each carrying `no-store`) and leaves the deployed verification to the manual plan below.

## Plan Overview
Backend only. Recreate the `GET /api/time` router and its Pydantic response schema, set `Cache-Control: no-store` on every response from that route, and register the router in the app factory. Tests: one router-registration unit test in the existing `test_main_unit.py`, and an integration test file asserting the 200 body, the header, and that two sequential calls each carry the header and return different `now` values. No service or repository layer: reading the clock is not business logic, and the endpoint touches no database. No new dependencies, no configuration, no frontend.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time, with response header `Cache-Control: no-store` so no shared cache (the CDN) or browser cache may store it.
- Router `backend/app/routers/server_time.py`: `APIRouter(prefix="/api", tags=["time"])`, a handler that takes FastAPI's `Response` parameter, sets `response.headers["Cache-Control"]` from a module-level constant `NO_STORE_CACHE_CONTROL = "no-store"` (with a one-line comment saying why: the CDN caches any response without a directive), and returns `ServerTimeResponse(now=datetime.now(UTC))`. The clock read is a module-level function `utc_now()` so a test can substitute it.
- Schema `backend/app/schemas/server_time.py`: `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"] = "UTC"`.
- App factory `backend/app/main.py`: import `server_time_router` and `app.include_router(server_time_router)` after the existing three; extend the module docstring's router list by one clause. No other change to `main.py`.
- Service layer: none (no business logic; the router reads the clock directly, as FEAT-1 did).
- Repository layer: none.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-10-30T19:12:03.481920Z", "timezone": "UTC"}
```

  (`now` is an ISO 8601 timestamp with a UTC offset, serialized by Pydantic from a timezone-aware datetime; it may render as `Z` or `+00:00`, and tests parse it rather than compare the string.) Any other method returns 405.

## Technology Selection
- Cache directive: chose a per-route header set on FastAPI's injected `Response` (a stdlib-level string constant) over a new caching middleware or dependency, because only this one route is affected and an installed framework feature covers it in one line.
- Timestamp: chose stdlib `datetime.now(UTC)` with Pydantic's built-in datetime serialization (Pydantic is already installed) over a date library, because the standard library and an installed dependency fully cover it.
- No new dependency is introduced; `pyproject.toml` and `uv.lock` are untouched.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router, sets `Cache-Control: no-store` on the response (recreates FEAT-1's route, removed by the sandbox reset)
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now`, `timezone`)
- [B] backend/tests/integration/test_server_time_integration.py: 200 body shape, `Cache-Control: no-store` header, two sequential calls each carry the header and return different `now`, POST returns 405
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus a 405 edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register `server_time_router`; one clause added to the module docstring
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the custom routes

No lockfile entry: this item changes no dependency manifest. No `README.md` or `docs/DEVELOPMENT.md` entry: neither lists the API's endpoints, and the change alters no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: router registration in the app factory (`/api/time` present among custom routes), added to the existing file.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (existing `test_main_unit.py`)
- Integration tests: full HTTP cycle through the session `client` fixture: 200 with `now` parseable as a timezone-aware UTC datetime and `timezone == "UTC"`; `response.headers["cache-control"] == "no-store"`; two sequential requests each carry `no-store` and return different `now` values (substitute `utc_now` via `monkeypatch` with two distinct instants, so the assertion is deterministic rather than relying on clock resolution); POST returns 405. The endpoint needs no database, so these tests do not take the `database_url` fixture.
  - Directory: backend/tests/integration/
  - Naming: test_{module}_integration.py (`test_server_time_integration.py`)
- E2E tests: none. No criterion requires navigation or interaction through the UI; the endpoint has no frontend consumer. E2E is ENABLED, but no browser spec is warranted for this item.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus the 405 edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a response header on a router, read off the HTTP response |
| 2 | A test asserts the header on the response | Integration | The criterion is satisfied by the integration test itself, which asserts the header on the real request/response cycle |
| 3 | After deploy, the reproduction above returns two different values (human-verified on the deployed environment) | Integration | No UI is involved and no test can reach the deployed CDN; the integration test covers the mechanism (two sequential calls, each `no-store`, return different `now`), and the deployed check is the human step in the Manual verification plan |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then the response carries Cache-Control: no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then they pass with 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; deployed check is manual | Given the deployed environment, When GET /api/time is requested twice a second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
This criterion is a response header and has no UI; the observable check is the header on the HTTP response.
Prerequisites: the backend running locally on port 8000 (for example `docker compose up backend`, or `uv run --directory backend uvicorn app.main:app --port 8000`).
1. In a terminal run `curl -si http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a JSON body with a `now` timestamp and `"timezone":"UTC"`.
2. Run `curl -si -X POST http://localhost:8000/api/time` → status `405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py` → the run ends with `0 failed`, and the header test in `test_server_time_integration.py` is among the passed tests.

### Criterion 3: After deploy, the reproduction returns two different values
This is a post-deploy check on the deployed environment, which this repository does not hold; it is done by a human once the fix is merged and deployed (the item's `to_verify` route).
Prerequisites: the fix deployed; the deployed host name known (written `<deployed-host>` below).
1. Run `curl -si https://<deployed-host>/api/time` → `200`, header `cache-control: no-store` present on the response as delivered through the CDN.
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ (the second about one second later).
3. If the values are identical, check the response for a CDN cache-hit header (for example `x-cache: HIT` or `cf-cache-status: HIT`) and record it on the item: the fix is then not reaching the edge (a CDN rule overriding origin headers), not a code defect in this change.
