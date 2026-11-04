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
- Comment (tracker): 22 comments read by the dispatching session, all earlier runs' "PR opened" notices; none of those PRs left code on main 1f1df4f. → Not acted on because none carries a correction or amendment to the feature text.
- Assumption (dependency state): the tracker marks FEAT-1 complete, but `GET /api/time` does not exist on main 1f1df4f. `git log` shows `backend/app/routers/server_time.py` last removed by the sandbox reset 1f1df4f (#525), and `git ls-tree origin/main backend/app` lists no `server_time` router, schema or service. Criterion 1 cannot be met on an endpoint that does not exist, so this plan **recreates the FEAT-1 endpoint** to FEAT-1's own acceptance criteria (read from ClickUp task 123k99ctzxk: 200 with `{"now": "<ISO 8601 UTC with explicit offset>", "timezone": "UTC"}`, `now` computed per request, body defined by a Pydantic schema in `backend/app/schemas/`) and adds the `Cache-Control: no-store` directive in the same router. Nothing beyond FEAT-1's contract and this defect's header is added. The PR description must state this assumption.
- Merged since the last plan: n/a (fresh plan, branched from current main 1f1df4f; no `[merged-since]` lines in the dispatch).

## Plan Overview
Backend only. Recreate the FEAT-1 server time slice in the existing Router to Service shape the health and version slices use (`routers/`, `schemas/`, `services/`), register the router in `backend/app/main.py`, and have the router set `Cache-Control: no-store` on every `GET /api/time` response so an edge cache in front of the API never stores it. Unit tests cover the service's UTC, explicit-offset, per-call clock read; integration tests cover the HTTP response's status, shape, offset and header, plus per-request freshness through HTTP; the app factory unit test gains the route registration check. Criterion 3 is a human check on the deployed environment, recorded as the manual verification plan; it is not automatable locally because there is no edge cache.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time and always carries the response header `Cache-Control: no-store`.
- Service layer: `backend/app/services/server_time_service.py` exposes `get_server_time() -> datetime`, returning `datetime.now(timezone.utc)` read on every call (never cached at module level), so the value is timezone-aware UTC and per request. The clock read goes through one module-level function (`_utc_now`) so unit and integration tests substitute the clock with `monkeypatch` instead of sleeping.
- Router: `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["server-time"])`, handler takes FastAPI's `Response` parameter, sets `response.headers["Cache-Control"] = NO_STORE` where `NO_STORE = "no-store"` is a module constant (the one source of the directive the tests import), and returns `ServerTimeResponse(now=current.isoformat(), timezone="UTC")`. `isoformat()` on an aware UTC datetime yields an explicit `+00:00` offset, never a naive value.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: str` and `timezone: Literal["UTC"]`, mirroring the `Literal` style of `schemas/health.py`.
- Registration: `backend/app/main.py` imports the router and calls `app.include_router(server_time_router)` alongside the existing three; the module docstring gains one line naming FEAT-1/BUG-01. No change to CORS (`GET` is already allowed).
- Repository layer: none, the endpoint touches no database.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters.
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-04T01:47:48.123456+00:00", "timezone": "UTC"}
```

- Errors: any other method returns FastAPI's own 405.

## Technology Selection
- Cache directive: chose a single `Response.headers` assignment in the router over a new HTTP-caching middleware or dependency, because the standard FastAPI `Response` parameter (installed `fastapi`) covers one header on one route and the criterion names only this endpoint.
- Current time with explicit offset: chose the standard library `datetime.now(timezone.utc).isoformat()` over a date library such as `pendulum` or `arrow`, because the stdlib produces an aware UTC value with a `+00:00` offset directly.
- Response schema: chose the installed `pydantic` `BaseModel` (already used by every schema in `backend/app/schemas/`), no alternative needed.
- Server time service module: no stdlib call, native platform feature or installed dependency covers the project's Router to Service layering, so the one-function service is built here, following `services/version_service.py` and `services/health_service.py`.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: str`, `timezone: Literal["UTC"]`).
- [B] backend/app/services/server_time_service.py: `_utc_now()` clock read and `get_server_time()` returning an aware UTC datetime per call.
- [B] backend/app/routers/server_time.py: `GET /api/time` router, `NO_STORE` constant, sets `Cache-Control: no-store` on the response.
- [B] backend/tests/unit/test_server_time_service_unit.py: service returns aware UTC (offset zero, never naive), reads the clock on every call (two patched clock values give two different results), and propagates a clock failure (patched `_utc_now` raising surfaces unchanged).
- [B] backend/tests/integration/test_server_time_integration.py: 200 with exactly the keys `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value whose `utcoffset()` is zero and the string ends in `+00:00`; `Cache-Control` header equals the router's `NO_STORE` constant; two requests with a patched clock return two different `now` values each carrying the header; `POST /api/time` returns 405.
- [G] e2e/uat/scenarios/BUG-01_server_time_no_store.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (header present on the second of two consecutive requests).
- [G] e2e/uat/scripts/BUG-01_server_time_no_store_uat_script.md: manual UAT script expanded from `## Manual verification plan`.
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [B] backend/app/main.py: import `server_time` router and `app.include_router(server_time_router)`; docstring names the new registration.
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route` asserting `/api/time` is among the custom paths.

No lockfile changes: the feature adds no dependency. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file lists endpoints.

## Testing Strategy
- Unit tests: `server_time_service.get_server_time()` (happy path aware UTC with zero offset; edge case two calls with two patched clock values return two different values; error case a raising clock propagates) and the app factory's route registration.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: the full HTTP cycle of `GET /api/time` through `create_app()` with the session `client` fixture (no database needed): status, body shape, explicit `+00:00` offset, the `Cache-Control: no-store` header asserted against the router's `NO_STORE` constant, per-request freshness with a patched clock, and the 405 error case.
  - Directory: backend/tests/integration/
- E2E tests: none. No criterion involves navigation or interaction through the UI; the endpoint has no frontend consumer.
  - Directory: e2e/tests/
  - File: none written (no criterion's covering tier is E2E).
- UAT scenarios: one scenario per criterion plus the second-request edge case, verifying the header and the deployed reproduction.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store`. | Integration | Verifying it needs no navigation or interaction: it is a response header of a router, asserted over the real HTTP cycle. |
| 2 | A test asserts the header on the response. | Integration | The criterion is satisfied by the integration test itself (`test_get_time_returns_cache_control_no_store`); no UI is involved. |
| 3 | After deploy, the reproduction above returns two different values (verified by a human on the deployed environment). | Manual (deployed environment) | The defect only exists behind the deployed edge cache, which no local tier can reproduce; the criterion itself names human verification. Per-request freshness without a cache is also asserted at integration level. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` carries `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the backend is running, When a client requests GET /api/time, Then the response status is 200 And the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When the server time integration tests run, Then they report 0 failed |
| 3 | Deployed reproduction returns two different values | covered by manual verification on the deployed environment, see Criterion coverage | Given the fix is deployed behind the edge cache, When GET /api/time is requested twice one second apart, Then the two now values differ |

## Manual verification plan
This feature has no UI: every criterion is verified through the HTTP response or the test run, and each block below says which observable check to read instead of a click path.

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the backend is running locally (for example `docker compose up -d backend`), reachable at `http://localhost:8010`.
1. In a terminal run `curl -i http://localhost:8010/api/time` → status line `HTTP/1.1 200 OK`, a header line `cache-control: no-store`, and a JSON body such as `{"now":"2026-11-04T01:47:48.123456+00:00","timezone":"UTC"}` whose `now` ends in `+00:00`.
2. Run the same command a second time → again `200 OK` with `cache-control: no-store` on this response too.

### Criterion 2: A test asserts the header on the response
Prerequisites: the repository is checked out with `uv` installed.
1. From the repository root run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the summary line reports `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_time_returns_cache_control_no_store` asserts the response's `Cache-Control` header equals the router's `NO_STORE` constant.

### Criterion 3: After deploy, the reproduction returns two different values
Prerequisites: this change is merged and deployed; you know the deployed host name (shown below as `<deployed-host>`).
1. In a terminal run `curl -si https://<deployed-host>/api/time` → `200` with `cache-control: no-store` among the headers (if the CDN adds an `age:` or a cache-status header, it must not report a cache hit).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ (the second about one second later than the first).
3. Record the two `now` values in the item's verification note; identical values mean the defect persists and the item stays in `to_verify`.
