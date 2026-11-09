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
- Comment (tracker): 34 comments on the item, all the framework's own "PR opened" notices from earlier runs → Addressed by: not acted on because none carries stakeholder feedback, a correction or an amendment to the description (relayed by the dispatching session; this planner did not read them itself).
- Merged since the last plan: n/a (fresh plan, branched from current main b95ad3ead46d2fb5c513e1406080dcd0ce464b7d; no `[merged-since]` lines in the dispatch).
- Assumption (dependency state): FEAT-1 is `complete` in the tracker, but its code is absent from main. `backend/app/routers/server_time.py` does not exist at plan base b95ad3e, and no file under `backend/app`, `backend/tests`, `frontend/src` or `e2e` mentions `server_time` or `Cache-Control` (sandbox reset 0c1f1ea removed it). The defect cannot be fixed on an endpoint that does not exist, so this plan recreates `GET /api/time` to FEAT-1's own contract (read from FEAT-1's tracker description) and adds the header in the same change. Recreating the endpoint is the minimum needed to satisfy criterion 1, not extra scope. Nothing beyond FEAT-1's contract and the header is added.

## Plan Overview
Backend only. Recreate the server-time slice FEAT-1 specified (schema, service, router, registration in `backend/app/main.py`) in the shape of the existing version slice (`routers/version.py`, `services/version_service.py`, `schemas/version.py`). The router sets `Cache-Control: no-store` on every `GET /api/time` response. Scope it to this one endpoint, not as app-wide middleware, because only this endpoint's freshness is in question and a global directive would change the caching of `/api/version`, `/api/health` and the notes endpoints, which no criterion asks for.

Defect classification inputs (for the post-approval reproduction step): the observable symptom (identical `now` across two requests) **reproduces only on the deployed environment**, behind the CDN. Locally nothing caches, so the bug cannot be reproduced locally. What can be checked locally is the cause: the response header. Before the fix the header is absent (and the route itself is absent on this base). After the fix it reads `no-store`. Criterion 3 is therefore a human, post-deploy verification (`to_verify` route). Automated tests cover criteria 1 and 2 and the local freshness of `now`.

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this item)

## Backend Plan
- Endpoints: `GET /api/time`: returns the server's current UTC time, with response header `Cache-Control: no-store`. Read-only, no input, no database.
- Service layer: `backend/app/services/server_time_service.py`, `get_current_utc_time() -> datetime` returns `datetime.now(UTC)` (an aware UTC datetime), evaluated on every call and never memoised (a stored value would bring the stale-time defect back inside the app).
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"]`. Add a `field_serializer("now")` returning `value.isoformat()`, so the wire format carries an explicit `+00:00` offset (FEAT-1: "ISO 8601 UTC with explicit offset, never naive") rather than pydantic's default `Z` suffix.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, handler `get_server_time(response: Response) -> ServerTimeResponse`. It sets `response.headers["Cache-Control"]` from a module constant `CACHE_CONTROL_NO_STORE = "no-store"`, with a one-line "why" comment naming the CDN, and returns `ServerTimeResponse(now=get_current_utc_time(), timezone="UTC")`.
- Registration: `backend/app/main.py` imports `server_time` router and calls `app.include_router(server_time_router)` after the existing three. Update the module docstring's registration list to name BUG-01. No other change to the factory, lifespan or CORS (GET is already an allowed method).
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
{"now": "2026-11-09T20:48:23.512345+00:00", "timezone": "UTC"}
```

- `now` differs between two requests made a second apart, always carries a `+00:00` offset, and is never naive. Any other method on `/api/time` returns 405 (FastAPI default).

## Technology Selection
- Current UTC time: chose the standard library `datetime.now(UTC)` over any time library (none needed; the stdlib returns an aware UTC datetime directly).
- Cache directive: chose a plain response header set on FastAPI's injected `Response` (a framework feature already installed) over a caching middleware or a new dependency. One header on one route needs no middleware.
- Explicit-offset serialisation: chose pydantic's `field_serializer` (installed with FastAPI) calling stdlib `datetime.isoformat()` over a custom JSON encoder or a string-typed field computed in the router, so the schema stays the single definition of the body (FEAT-1 criterion 3).
- Router, service and schema modules: no stdlib call, native platform feature or installed dependency provides them; they are built here, in the existing version slice's shape.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now` aware datetime serialised with explicit offset, `timezone` literal `UTC`)
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` returning `datetime.now(UTC)` per call
- [B] backend/app/routers/server_time.py: `GET /api/time` router setting `Cache-Control: no-store`
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware UTC, offset zero, fresh per call)
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests (200 plus body shape, `Cache-Control: no-store` header, explicit `+00:00` offset, two calls differ, 405 on POST)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the server-time router; docstring names BUG-01's registration
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the custom routes

No lockfile changes: no dependency is added (`uv.lock` and `package-lock.json` untouched).
No README.md or docs/DEVELOPMENT.md edit: this item adds one endpoint and changes no project structure, run configuration, dependencies or test infrastructure, and neither doc lists endpoints today.

## Testing Strategy
- Unit tests: `server_time_service.get_current_utc_time` returns an aware datetime whose `utcoffset()` is zero (happy path). Two successive calls are non-decreasing and come from separate `datetime.now` calls (edge: patch the module's clock to return two distinct instants and assert both come through, proving no memoisation). The schema rejects a non-`UTC` timezone value with a `ValidationError` (error case). `create_app` registers `/api/time`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: through the session `client` fixture (no database needed). `GET /api/time` returns 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`. `response.headers["cache-control"] == "no-store"` (criteria 1 and 2). `now` parses with `datetime.fromisoformat`, is aware, and its string ends in `+00:00`. Two requests with the service clock patched to two instants one second apart return different `now` values, so freshness is asserted deterministically without sleeping. POST returns 405.
  - Directory: backend/tests/integration/
- E2E tests: no spec. The item has no UI, so no criterion needs navigation or interaction through a browser (see Criterion coverage).
  - Directory: e2e/tests/
  - File: none for this item (would be BUG-01_server_time_edge_cache.spec.ts)
- UAT scenarios: one scenario per criterion plus an edge case (POST is refused), with criterion 3 written as a deployed-environment scenario.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a response header on a router, asserted over a real HTTP request/response cycle |
| 2 | A test asserts the header on the response | Integration | Verifying it needs no navigation or interaction: the integration test that asserts the header is itself the deliverable |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment) | Integration (local freshness, deterministic) plus manual post-deploy check | Verifying it needs no navigation or interaction, and the edge cache exists only on the deployed host, so no local browser test can reach it. The integration test proves `now` is per request and the header is set, and the human `curl` check in the Manual verification plan confirms the CDN honours it |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response carries Cache-Control no-store |
| 2 | A test asserts the header on the response | covered at Integration, see Criterion coverage | Given the backend test suite, When the server-time integration tests run, Then the header assertion passes |
| 3 | After deploy, two requests a second apart return different `now` | covered at Integration plus manual deployed check, see Criterion coverage | Given the fix is deployed behind the CDN, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: backend running locally from the feature branch, e.g. `uv run --directory backend uvicorn app.main:app --port 8000` (DATABASE_URL may be unset; this endpoint needs no database).
1. In a terminal, run `curl -i http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`, and a header line `cache-control: no-store`.
2. Read the body of the same response → JSON of the form `{"now":"2026-11-09T20:48:23.512345+00:00","timezone":"UTC"}`, where `now` ends in `+00:00` and `timezone` is `UTC`.
3. Run `curl -i -X POST http://localhost:8000/api/time` → status `405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
Prerequisites: repository checked out on the feature branch, `uv` installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → one test asserts the response's `cache-control` header equals `no-store`.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable locally: the edge cache exists only on the deployed environment, and locally both calls differ even without the fix. Verify by hand after deploy.
Prerequisites: the fix is merged and deployed; you know the deployed API host.
1. Run `curl -si https://<deployed-host>/api/time` → `cache-control: no-store` is present in the headers that reach you through the CDN (an `age:` header, if the CDN sends one, is absent or `0`).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ by about one second (e.g. `...T20:48:23.51...+00:00` then `...T20:48:24.53...+00:00`). Identical values mean the defect persists.
