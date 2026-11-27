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
- Comment (tracker): 25 framework notices of the form "mayker-dev: PR opened for BUG-01 ... (#1064, #1057, #1047, ... #733)", newest first → not acted on because they are run-log notices, not stakeholder feedback, and every PR they name was reset off `main` (latest reset `ad2cb5cf`). One fact they repeat was checked rather than trusted: FEAT-1's `/api/time` code is absent from `main` (see the assumption below).
- Assumption (dependency state): FEAT-1 reads `complete` in the tracker, but at plan base `ad2cb5cf` there is no `backend/app/routers/server_time.py`, no server-time schema or service, and `backend/app/main.py` registers only the version, notes and health routers (checked with `git ls-files` and by reading `main.py`). The defect cannot be fixed on an endpoint that does not exist, so this plan recreates FEAT-1's slice to FEAT-1's own acceptance criteria (read from its tracker item: 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, never naive, body defined by a Pydantic schema in `backend/app/schemas/`, router registered in `backend/app/main.py`) and adds the `Cache-Control: no-store` fix on top. Nothing beyond FEAT-1's contract and this defect is added.
- Assumption (offset spelling): FEAT-1 asks for an "explicit offset". Pydantic v2 serialises an aware UTC `datetime` with a `Z` suffix; this plan types `now` as `str` built from `datetime.now(timezone.utc).isoformat()`, which yields `+00:00`, so the offset is the explicit numeric form and the serialisation does not depend on the Pydantic version.
- Merged since the last plan: n/a (fresh plan, no earlier plan on this branch; branched from current `main` at `ad2cb5cf`).

## Plan Overview
Backend-only fix. Recreate the FEAT-1 server-time slice in the project's Router to Service layering (schema, service, router, registration in the app factory) and have the router set `Cache-Control: no-store` on every `GET /api/time` response, so an edge cache in front of the API stops storing it. Unit tests cover the service (shape, explicit offset, freshness); integration tests cover the HTTP cycle, including the header assertion criterion 2 asks for. No frontend, no database, no new dependency. Criterion 3 is verified by a human on the deployed environment after merge (the item carries the `mayker:to-verify` tag).

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time; every response carries `Cache-Control: no-store`.
- Service layer: `backend/app/services/server_time_service.py` exposes `get_server_time() -> ServerTimeResponse`, returning the schema built from the ISO string and the constant timezone name `"UTC"`, computed from a module-level `_utc_now()` helper that returns `datetime.now(timezone.utc)`. `_utc_now` exists so tests can substitute the clock; the service formats with `.isoformat()` (never `utcnow()`, which is naive). Module docstring names FEAT-1 and BUG-01 and the layer's reason, per `.claude/project-standards.md` Documentation convention.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, route `@router.get("/time", response_model=ServerTimeResponse)` taking FastAPI's injected `response: Response` and setting `response.headers["Cache-Control"] = "no-store"` before returning the schema instance. The header is set in the router, scoped to this route only, because the defect is about this endpoint; a global middleware would change caching for every route, which no criterion asks for.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: str` and `timezone: Literal["UTC"]`.
- App factory: `backend/app/main.py` imports the router and adds `app.include_router(server_time_router)` after the existing three; module docstring gains one clause naming FEAT-1/BUG-01's registration. CORS middleware untouched (GET is already allowed).
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-27T18:30:00.123456+00:00", "timezone": "UTC"}
```

- Other methods: `POST /api/time` returns 405 (FastAPI default for an undeclared method).

## Technology Selection
- Current UTC time: chose the standard library's `datetime.now(timezone.utc)` and `.isoformat()` over any date library, because the stdlib produces an aware UTC timestamp with an explicit `+00:00` offset directly.
- Cache directive: chose FastAPI's injected `Response` header assignment in the route (already installed) over a caching middleware or a new dependency, because one header on one route is a single line.
- Server-time schema, service and router: no stdlib call, native platform feature or installed dependency provides an endpoint, so they are built here on the installed FastAPI and Pydantic, following the version slice's shape.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: str`, `timezone: Literal["UTC"]`)
- [B] backend/app/services/server_time_service.py: `get_server_time()` and the substitutable `_utc_now()` clock helper
- [B] backend/app/routers/server_time.py: `GET /api/time` route setting `Cache-Control: no-store`
- [B] backend/tests/unit/test_server_time_service_unit.py: service tests for shape, explicit UTC offset, per-call freshness
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests for 200 body, `Cache-Control: no-store` header, freshness across two requests, 405 on POST
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature writes

### Modified files
- [B] backend/app/main.py: import and register the server-time router; docstring clause
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route`
No lockfile entry: the change adds no dependency. No `README.md` or `docs/DEVELOPMENT.md` edit: the change adds one endpoint and alters no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: service layer, `get_server_time()` with `_utc_now` substituted via `monkeypatch`: returns `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value whose `utcoffset()` is zero and whose string ends in `+00:00`; two calls with two different patched clock values return two different `now` (freshness, no memoisation); edge case on a midnight boundary value. App factory: the route is registered.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: full HTTP cycle through the session `client` fixture in `backend/tests/conftest.py`: 200 with the exact body shape; the `Cache-Control` response header equals `no-store` (criterion 2's test); two requests with `_utc_now` patched to return successive values produce two different `now` (the router does not cache either); POST returns 405. No database needed, so these run without `DATABASE_URL`.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. Enabled per CLAUDE.md, but no criterion requires navigation or interaction through the UI: the endpoint has no frontend consumer (`testing_standards.md` Section 6, fourth question, asked per criterion below).
  - Directory: e2e/tests/
  - File: none (no spec warranted)
- UAT scenarios: one scenario per criterion plus one edge case (POST is rejected), API-level Given/When/Then.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_time_sets_cache_control_no_store`, `test_get_time_returns_200_with_utc_now_and_timezone` | verifying it needs no navigation or interaction: it is a response header of a router, read off the HTTP cycle |
| 2 | A test asserts the header on the response | Integration | `test_get_time_sets_cache_control_no_store` | the criterion is the existence of that router-level test itself; no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human on the deployed environment) | Integration | `test_get_time_returns_fresh_now_on_each_request`, `test_get_server_time_returns_fresh_value_per_call` | no UI path exists and an edge cache exists only on the deployed host; locally the tests prove the origin never reuses a value and criterion 1's header is what stops the CDN storing it; the deployed check itself is the human step in the Manual verification plan |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response has header Cache-Control "no-store" |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then they pass |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage; human check on deploy | Given the deployed API, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
This criterion has no UI; the observable check is the response header.
Prerequisites: the backend runs locally (`uv run --directory backend uvicorn app.main:app --port 8000`); no database is needed for this endpoint.
1. In a terminal run `curl -si http://localhost:8000/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. Read the headers of that response → one line reads `cache-control: no-store`.
3. Read the body → JSON like `{"now":"2026-11-27T18:30:00.123456+00:00","timezone":"UTC"}`, with `now` ending in `+00:00`.

### Criterion 2: A test asserts the header on the response
Prerequisites: a checkout of the merged branch with backend dependencies installed (`uv sync --directory backend`).
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`.

### Criterion 3: After deploy, the reproduction returns two different values
This criterion has no UI and can only be checked on the deployed environment, by a human, after merge and deploy.
Prerequisites: the merged commit is deployed; you know the deployed API host (`<deployed-host>` below, the host the reproduction in the item uses).
1. Run `curl -si https://<deployed-host>/api/time` → status 200, a `cache-control: no-store` header line, and a body with a `now` value; note it.
2. Wait one second and run the same command again → a second `now` value that differs from the first (the later value is about one second after the first).
3. If the CDN adds an `age:` or a cache-status header (for example `cf-cache-status` or `x-cache`), read it on the second response → it shows no cache hit (`age` absent or `0`; status `MISS`, `BYPASS` or `DYNAMIC`, not `HIT`).
