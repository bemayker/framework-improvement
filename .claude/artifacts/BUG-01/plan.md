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
- Comment (tracker): 28 comments read by the dispatching session, all the framework's own PR-opened notes from earlier runs → not acted on because none carries feedback on the item's content (no correction, no amendment).
- Assumption (no comment, recorded so it is visible): FEAT-1 is `complete` in the tracker but its code is absent from `main` at the plan base 64dae872f765e6a62b6dd6388ddf3e1e76326829. Verified in the code: there is no `backend/app/routers/server_time.py`, no server-time schema or service, and `backend/app/main.py` registers only the version, notes and health routers. The defect's endpoint must exist for criterion 1 to be satisfiable, so this plan (re)creates `GET /api/time` to FEAT-1's contract (200, body `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, Pydantic schema in `backend/app/schemas/`) and adds the `Cache-Control: no-store` fix on it. This is the minimum needed to make the bug fix land, not gold plating: no other FEAT-1 behaviour is added.

## Plan Overview
Backend-only fix. Add the `GET /api/time` endpoint (router, schema, service, following the TEST-05 version slice's Router to Service shape) and set `Cache-Control: no-store` on every response from it, so the CDN in front of the deployed API never stores the body. Register the router in `backend/app/main.py`. Cover the header at integration level (criterion 2) and the time computation at unit level. Criterion 3 is a human check on the deployed environment after merge (the item carries the `mayker:to-verify` tag), so it has no automated tier.

**`backend/app/main.py` IS touched by this plan** (one import, one `include_router` line). TEST-09 may edit the same file: serialize the two builds.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time, with response header `Cache-Control: no-store`.
- Router (`backend/app/routers/server_time.py`): `APIRouter(prefix="/api", tags=["time"])`; the handler takes FastAPI's injected `Response` and sets `response.headers["Cache-Control"] = "no-store"` before returning the schema instance, so the directive is on the 200 response. Keep the header value as a named module constant with a one-line "why" comment (the deployed CDN caches any response without a directive).
- Service layer (`backend/app/services/server_time_service.py`): `get_current_utc_time() -> datetime` returning `datetime.now(timezone.utc)`, a timezone-aware value computed on every call (never cached at module level).
- Schema (`backend/app/schemas/server_time.py`): `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: str`. Pydantic serialises an aware UTC datetime as ISO 8601 with an explicit offset (`Z` or `+00:00`); the integration test asserts an explicit offset is present rather than one literal form.
- App factory (`backend/app/main.py`): import `router as server_time_router` from `app.routers.server_time` and add `app.include_router(server_time_router)` after the existing registrations. Update the module docstring's list of registered routers with one clause. Nothing else in the factory changes; CORS `allow_methods` already includes GET.
- Repository layer: none (no data access).
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no parameters, no body.
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-06T11:20:31.482913Z", "timezone": "UTC"}
```

- Error: `POST /api/time` answers 405 (FastAPI default; the route is GET only).

## Technology Selection
- `Cache-Control: no-store` header: chose setting the header on FastAPI's injected `Response` (already installed framework) over a new caching middleware or a dependency such as a cache-control package, because one header on one route is one line and a middleware would widen the change to every route, which the criteria do not ask for.
- Current-time service: chose the standard library `datetime.now(timezone.utc)` over any time library, because the stdlib returns an aware UTC value directly.
- Response schema: chose Pydantic `BaseModel` (already installed, the project's schema convention) over a bare dict, per FEAT-1's contract.
- No new dependency is added.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on the response.
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` schema (`now: datetime`, `timezone: str`).
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()`, aware UTC datetime computed per call.
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (aware value, UTC offset zero, fresh per call with a patched clock).
- [B] backend/tests/integration/test_server_time_integration.py: integration tests for the route (200 and body shape, `Cache-Control: no-store` header present, explicit offset in `now`, two calls both carry the header, 405 on POST).
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED).
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature writes.

### Modified files
- [B] backend/app/main.py: import the server time router and register it in `create_app()` (one import, one `include_router` line, one docstring clause). Shared with TEST-09: serialize the builds.
- [B] backend/tests/unit/test_main_unit.py: one test asserting `/api/time` is among the app's registered routes, in the existing `test_create_app_registers_*_route` shape.

No dependency is added or changed, so no lockfile changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the change adds one route inside the existing backend layout and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `get_current_utc_time()` in the service layer: returns an aware datetime, its `utcoffset()` is zero, and two calls with a patched clock return the two patched values (no module-level caching); plus the route-registration test in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through the real HTTP cycle with the shared `client` fixture: 200; `response.headers["cache-control"] == "no-store"`; body has exactly `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value with zero offset; two consecutive requests both carry the header; `POST /api/time` returns 405. No database is needed.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. No criterion involves navigation or interaction through the UI, and the app has no UI for server time; the header is a router behaviour covered at integration level.
  - Directory: e2e/tests/
  - File: none created (BUG-01 warrants no spec)
- UAT scenarios: one scenario per criterion plus one edge case (POST is rejected and carries no body to cache); criterion 3's scenario is a deployed-environment human check.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | verifying it needs no navigation or interaction: it is a response header a router test reads directly |
| 2 | A test asserts the header on the response | Integration | the criterion is the integration test itself (`test_server_time_integration.py` asserting the header); no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human, deployed environment) | Integration (local proxy) plus manual post-deploy verification | it needs the deployed CDN, which no automated tier here can reach; the integration test asserts the cause (the header) and two local calls differing, and the human runs the curl reproduction on the deployed host |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the API is running, When a client requests GET /api/time, Then the response carries Cache-Control no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration tests run, Then the header assertion passes with 0 failed |
| 3 | Two deployed calls a second apart differ | manual, deployed environment only | Given the fix is deployed behind the CDN, When GET /api/time is requested twice a second apart, Then the two now values differ |

## Manual verification plan
### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Not verifiable through the UI: the app has no screen for server time. The observable check is the response header.
Prerequisites: backend running locally (`docker compose up` from the repo root, or `uv run --directory backend uvicorn app.main:app --port 8000`).
1. Run `curl -si http://localhost:8000/api/time` → status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a body shaped like `{"now":"2026-11-06T11:20:31.482913Z","timezone":"UTC"}`.
2. Check the `now` value from step 1 → it ends in `Z` or `+00:00` (an explicit offset), and `timezone` is `UTC`.
3. Run `curl -si -X POST http://localhost:8000/api/time` → status `405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
Not verifiable through the UI: it is a test in the backend suite. The observable check is the test run.
Prerequisites: repo checked out at the merged commit, uv installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the summary line shows `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → one test asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
Not verifiable through the UI and not locally (no edge cache locally). The observable check is the reproduction on the deployed environment.
Prerequisites: the fix merged and deployed; the deployed host name known (the item's `mayker:to-verify` tag marks it awaiting this check).
1. Run `curl -si https://<deployed-host>/api/time` → `200`, header `cache-control: no-store` present (a CDN may add its own headers; `no-store` must still be there).
2. Wait one second, then run `curl -s https://<deployed-host>/api/time` again → its `now` value differs from step 1's `now`.
3. Repeat steps 1 and 2 once more → the values differ again (a CDN hit would return the identical body).
