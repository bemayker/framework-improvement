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
- Comment (tracker): 18 comments on the item, all the framework's own "PR opened" notices from earlier runs whose product a reset removed from main → not acted on because none carries stakeholder feedback; nothing in them amends the description.
- Assumption (dependency state): FEAT-1 is `complete` in ClickUp, but `origin/main` at 77b48c2 has no `backend/app/routers/server_time.py`, no server-time schema or service, and `backend/app/main.py` registers only the version, notes and health routers (checked with `git ls-tree origin/main backend/app` and by reading `main.py`). The endpoint this defect fixes therefore does not exist on main. This plan recreates the FEAT-1 slice (schema, service, router, registration, its tests) to FEAT-1's own acceptance criteria as read from the tracker, and adds the no-store header on top. Recreating it is the minimum needed to make criterion 1 true at all; it is not scope added beyond the item, and nothing past FEAT-1's criteria is added.
- Merged since the last plan: n/a (fresh plan, branched from current main 77b48c2; no `[merged-since]` lines in the dispatch).

## Plan Overview
Backend only. Restore `GET /api/time` (FEAT-1's contract: `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, computed per request) following the existing Router to Service to Schema layering of the version endpoint, register it in `backend/app/main.py`, and make the router set `Cache-Control: no-store` on every response so no CDN or edge cache in front of the API stores it. Unit tests cover the service; integration tests cover the HTTP cycle, including the header assertion (criterion 2) and two sequential calls returning different `now` values. Criterion 3 is a post-deploy human check, carried by the `mayker:to-verify` route and the manual verification plan below.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI).

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current time in UTC and sets `Cache-Control: no-store` on the response. Router `APIRouter(prefix="/api", tags=["time"])`, `response_model=ServerTimeResponse`, same shape as `backend/app/routers/version.py`. The header is set through FastAPI's injected `Response` parameter (`response.headers["Cache-Control"] = NO_STORE_CACHE_CONTROL`), with `NO_STORE_CACHE_CONTROL = "no-store"` a module-level constant in the router so tests import the value rather than repeat the literal.
- Service layer: `backend/app/services/server_time_service.py` with `get_server_time() -> datetime` returning `datetime.now(timezone.utc)` (timezone-aware, computed on every call, never cached or module-level), and a `UTC_TIMEZONE_NAME = "UTC"` constant.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: str` and `timezone: str`. The router builds `now` with `get_server_time().isoformat()`, which yields an explicit `+00:00` offset (Pydantic's own datetime serialisation would emit `Z`, so the string is built explicitly to keep FEAT-1's "explicit offset" wording literal).
- Registration: `backend/app/main.py` imports `server_time_router` and adds `app.include_router(server_time_router)` beside the existing three; the module docstring gains one clause naming FEAT-1/BUG-01's time router. Nothing else in `create_app()` changes (no middleware: the directive is scoped to this endpoint, which is what the defect names).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/time
- Request: no body, no parameters
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-01T06:21:50.123456+00:00", "timezone": "UTC"}
```

- Any other method on `/api/time`: 405 (FastAPI default), unchanged by this item.

## Technology Selection
- Current UTC time: chose the standard library's `datetime.now(timezone.utc)` and `.isoformat()` over any date library; the stdlib covers an aware UTC timestamp with an explicit offset completely.
- Cache directive: chose FastAPI's injected `Response` header (an installed dependency) on the one endpoint over a new middleware or a cache-control package, because only `GET /api/time` is in scope and one header assignment covers it.
- Router, schema and service modules: no stdlib call, native platform feature or installed dependency replaces the project's own Router/Schema/Service files, so they are built here on the existing FastAPI and Pydantic install; no new dependency, so no lockfile change.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router, sets `Cache-Control: no-store` from the `NO_STORE_CACHE_CONTROL` constant
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now`, `timezone`)
- [B] backend/app/services/server_time_service.py: `get_server_time()` returning an aware UTC datetime per call
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware UTC, explicit offset, per-call freshness)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests (200 shape, `Cache-Control: no-store` header, two sequential calls differ, POST 405)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import and register the server-time router; docstring names it
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is a custom route

No dependency is added or changed, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit and no [Docs] entry is listed.

## Testing Strategy
- Unit tests: `server_time_service.get_server_time()`: happy path (returns a datetime whose `tzinfo` is not None and whose `utcoffset()` is zero); edge case (its `isoformat()` ends in `+00:00`, never naive); per-call freshness (patch the module's clock source with two distinct values and assert two calls return them in turn, no sleep). `create_app()` registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py (test_server_time_service_unit.py; test_main_unit.py extended)
- Integration tests: `GET /api/time` through the session `client` fixture: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value with zero offset; `response.headers["cache-control"] == NO_STORE_CACHE_CONTROL` (criterion 2's assertion); two sequential requests both carry the header and return different `now` values; `POST /api/time` returns 405. No database is needed, so these tests do not request the database fixtures.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion requires navigation or interaction through the UI; this item has no frontend. No spec is written.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one Gherkin scenario per criterion plus one edge case (a second request is not served from a cache), validated for well-formedness.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | verifying it needs no navigation or interaction: it is a response header on a router, asserted on the real HTTP cycle |
| 2 | A test asserts the header on the response | Integration | the criterion is the test itself: `test_get_time_response_carries_cache_control_no_store` in the integration file |
| 3 | After deploy, the reproduction returns two different values | Integration | no UI is involved and no edge cache exists locally; the local half (header present on every response, two sequential calls differ) is asserted at integration level, and the deployed half is a human check after deploy, carried by `mayker:to-verify` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response carries Cache-Control: no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration locally, human check after deploy | Given the deployed environment, When GET /api/time is requested twice a second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the backend is running locally (`docker compose up -d` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8000`), reachable at `http://localhost:8000`. This criterion has no UI; the observable check is the response header.
1. In a terminal, run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers of that same response → one header reads `cache-control: no-store` (header names are case-insensitive).
3. Read the body → JSON of the form `{"now":"2026-11-01T06:21:50.123456+00:00","timezone":"UTC"}`: `now` ends in `+00:00` and `timezone` is `UTC`.

### Criterion 2: A test asserts the header on the response
Prerequisites: `uv` installed; run from the repo root.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → expected result `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_time_response_carries_cache_control_no_store` asserts the `cache-control` header equals `no-store`.

### Criterion 3: After deploy, the reproduction returns two different values
Prerequisites: the change is merged and deployed; you know the deployed API host. This cannot be verified locally (no edge cache), so it is a human check on the deployed environment.
1. Run `curl -si https://<deployed-host>/api/time` → `HTTP` status 200 and a `cache-control: no-store` header (if the CDN adds an `age` or `x-cache: HIT` header, the fix is not effective).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ by roughly one second.
3. Repeat step 2 once more → again two different `now` values; record pass and remove the item's `mayker:to-verify` label.
