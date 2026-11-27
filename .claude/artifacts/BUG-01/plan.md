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
- Comment (tracker): all comments on the ticket are framework PR notices, per the dispatch; none carries a requirement → Addressed by: not acted on because none states or amends a requirement.
- Tracker label (tracker): the item carries a stale `mayker:to-verify` label → Addressed by: not acted on; it describes lifecycle state from an earlier run, not scope, and the dispatch says to ignore it.
- Assumption (scope change, recorded per `user_story_alignment.md` Section 4): the dependency FEAT-1 is `complete` in the tracker, but `GET /api/time` does not exist on main at plan base 7ec0ce6e (no `server_time` router, schema, service or test in `git ls-files`; `backend/app/main.py` registers only version, notes and health; the feature map row records the sandbox reset c5a6e64 that removed it). A header cannot be added to a route that does not exist, so this plan recreates FEAT-1's endpoint to FEAT-1's own acceptance criteria (200 with `{"now": ..., "timezone": "UTC"}`, `now` per request in UTC with an explicit offset, a Pydantic schema, unit and integration tests for shape, offset and freshness) and nothing beyond them, then applies the BUG-01 fix on it. Recreating FEAT-1 is not gold plating: it is the minimum for criteria 1 to 3 to be satisfiable. No pagination, no timezone parameter, no frontend.
- Merged since the last plan: n/a (fresh plan, no earlier BUG-01 plan; branched from current main 7ec0ce6e).

## Plan Overview
Backend only. Recreate the FEAT-1 server-time slice in the project's layering (router, service, schema; `.claude/project-standards.md` Layout) and make the router set `Cache-Control: no-store` on every `GET /api/time` response, which tells the CDN in front of the deployed API not to store it. Register the router in `backend/app/main.py`. Cover the header and FEAT-1's contract with unit and integration tests; criterion 3 is a deployed-environment human check, recorded in the manual verification plan and the UAT artifacts.

Reproduction class (per /fix Section R1 terms): **deployed-only**. Locally there is no edge cache, so the symptom (identical `now` values) cannot be reproduced; the root cause (missing cache directive) is observable locally with `curl -si http://localhost:8000/api/time` showing no `Cache-Control` header (once the route exists). The symptom command is the ticket's own: `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time; every response carries the header `Cache-Control: no-store`.
- Service layer: `backend/app/services/server_time_service.py`, function `get_server_time() -> datetime` returning `datetime.now(timezone.utc)` (timezone-aware, computed per call). The clock is read through a module-level `_utc_now()` helper so unit tests can substitute it without sleeping. Module constant `SERVER_TIMEZONE = "UTC"`.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, handler `get_time(response: Response) -> ServerTimeResponse` that sets `response.headers["Cache-Control"] = "no-store"` and returns `ServerTimeResponse(now=get_server_time(), timezone=SERVER_TIMEZONE)`. Module constant `CACHE_CONTROL_NO_STORE = "no-store"` so tests assert against one source. The header is set in the router, not in a global middleware: the defect and criterion 1 are scoped to this route, and a middleware would change caching for version, health and notes too.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: AwareDatetime` (Pydantic refuses a naive datetime) and `timezone: Literal["UTC"]`, plus a `field_serializer("now")` returning `value.isoformat()` so the JSON carries `+00:00` (an explicit offset, per FEAT-1) rather than Pydantic's default `Z`.
- Registration: `backend/app/main.py` imports the router and calls `app.include_router(server_time_router)`; the module docstring gains one line naming BUG-01 (recreating FEAT-1's route). CORS `allow_methods` already includes GET; no change.
- Repository layer: none, no data access.
- Migrations: none.
- Docstrings: module docstring naming the work item, one-line docstring per public function and class (`.claude/project-standards.md` Documentation convention; the `docstrings` gate row checks D101 to D103).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, headers include `Cache-Control: no-store`, body:

```json
{"now": "2026-11-27T16:06:12.345678+00:00", "timezone": "UTC"}
```

- Errors: `POST /api/time` returns 405 (FastAPI default, the only reachable error case).

## Technology Selection
- Cache directive: chose FastAPI's injected `Response` parameter (`response.headers[...]`, already installed) over a custom middleware or a new caching dependency, because the header applies to one route and the framework already exposes it per response.
- Current time: chose the standard library `datetime.now(timezone.utc)` over any date library (for example pendulum or arrow), because stdlib produces a timezone-aware UTC value directly.
- Naive-datetime guard: chose Pydantic's built-in `AwareDatetime` type (installed with FastAPI) over a hand-written validator, because it already refuses naive values.
- Offset serialisation: chose `datetime.isoformat()` in a Pydantic `field_serializer` over string formatting by hand, because stdlib emits `+00:00` for a UTC-aware value.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: AwareDatetime` serialised with `+00:00`, `timezone: Literal["UTC"]`).
- [B] backend/app/services/server_time_service.py: `get_server_time()` returning the aware UTC now per call, `_utc_now()` clock seam, `SERVER_TIMEZONE`.
- [B] backend/app/routers/server_time.py: `GET /api/time`, sets `Cache-Control: no-store`, returns the schema.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware UTC value, zero offset, per-call freshness via the clock seam).
- [B] backend/tests/integration/test_server_time_integration.py: integration tests for `GET /api/time` (header, shape, offset, freshness, 405).
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case.
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below.
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import and register the server-time router; docstring line naming BUG-01.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is registered.

No E2E spec: no criterion requires UI navigation or interaction (see Criterion coverage), so Phase D produces no file. No lockfile: no dependency changes. No `README.md` or `docs/DEVELOPMENT.md` edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and README lists no endpoints.

## Testing Strategy
- Unit tests: service layer, `get_server_time()` returns a timezone-aware value with `utcoffset() == timedelta(0)`; two calls with a substituted `_utc_now` one second apart return different values; schema refuses a naive datetime (Pydantic `ValidationError`) and serialises `now` with `+00:00`. App factory registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle on `GET /api/time` through the session `client` fixture (no database needed): 200, `Cache-Control` header equals `no-store`, body keys exactly `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to a zero-offset aware value and ends in `+00:00`; two requests with the service clock monkeypatched to successive instants return different `now` values; `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. E2E is ENABLED, but no criterion involves navigation or interaction through the UI (backend-only, no frontend consumer of `/api/time`).
  - Directory: e2e/tests/
  - File: none (would be BUG-01_server_time_edge_cache.spec.ts)
- UAT scenarios: one scenario per criterion (header present, test asserts header, deployed freshness) plus an edge case (two rapid local requests differ).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | `test_get_time_sets_cache_control_no_store`, `test_get_time_returns_200_with_utc_now_and_timezone` | verifying it needs no navigation or interaction: it is a response header on a router endpoint |
| 2 | A test asserts the header on the response. | Integration | `test_get_time_sets_cache_control_no_store` | verifying it needs no navigation or interaction: the criterion is satisfied by the existence and pass of that router test |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Integration | `test_get_time_returns_fresh_now_per_request`, `test_get_server_time_returns_new_value_per_call` | verifying it needs no navigation or interaction, and no automated tier can reach the deployed edge cache: the executed tests prove per-request freshness at origin, and the deployed check is the human step in the Manual verification plan |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the API is running, When I request GET /api/time, Then the response carries Cache-Control: no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the header test passes |
| 3 | Deployed reproduction returns two different values | covered at Integration (origin freshness) plus a human deployed check | Given the fix is deployed, When I request GET /api/time twice a second apart on the deployed host, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`.
Prerequisites: backend running locally on port 8000 (`uv run --directory backend uvicorn app.main:app --port 8000`); no database needed for this route.
1. In a terminal, run `curl -si http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`.
2. Read the response headers → a line `cache-control: no-store` is present.
3. Read the body → JSON of the form `{"now":"2026-11-27T16:06:12.345678+00:00","timezone":"UTC"}`, with `now` ending in `+00:00`.

### Criterion 2: A test asserts the header on the response.
Prerequisites: a PostgreSQL connection is not required for this file; repository checked out on the BUG-01 branch.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py` → the summary line reports no failed or errored test and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`.

### Criterion 3: After deploy, the reproduction above returns two different values.
This cannot be verified through the UI or locally: the edge cache exists only on the deployed environment. The observable check is the ticket's own reproduction.
Prerequisites: the BUG-01 change is merged and deployed; you know the deployed API host.
1. Run `curl -si https://<deployed-host>/api/time` → 200 with a `cache-control: no-store` header (if the CDN rewrites headers, an `age:` header must be absent or `0`).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ (the second about one second later).
3. Repeat step 2 once more → the `now` values again differ, ruling out a cache that expired between runs.
