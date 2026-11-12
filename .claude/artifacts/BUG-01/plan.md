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
- Comment (tracker): 38 comments on the item, all automated PR notes from earlier runs (decisions.md, run deliver-20261112T230601Z) → not acted on because none states a requirement, a correction or an amendment to the defect; the description above is the whole input.
- Merged since the last plan: none. No `[merged-since]` lines reached this dispatch; this is a first plan for this run, branched from main at c90cdbe (plan base in decisions.md).
- Assumption (no comment, recorded so a reviewer sees it): the dependency FEAT-1 is `complete` in the tracker, but its code is absent from main after the sandbox reset. Checked against the code at c90cdbe: `backend/app/routers/server_time.py`, `backend/app/schemas/server_time.py` and `backend/app/services/server_time_service.py` do not exist, and `backend/app/main.py` registers only the version, notes and health routers, so `GET /api/time` answers 404 today. The feature map's BUG-01 row says BUG-01 must recreate the router and register it. This plan therefore restores FEAT-1's endpoint exactly to FEAT-1's own contract (200, body `{"now": ISO 8601 UTC with explicit offset, "timezone": "UTC"}`, computed per request, Pydantic schema in `backend/app/schemas/`) and adds the `Cache-Control: no-store` header. Nothing beyond FEAT-1's contract and this item's criteria is added: no other cache headers, no middleware, no ETag, no client change.

## Plan Overview
Backend only. Add `GET /api/time` (restored FEAT-1 contract) following the existing version slice's Router to Service to Schema shape (`backend/app/routers/version.py`, `services/version_service.py`, `schemas/version.py`), register its router in `backend/app/main.py`, and set `Cache-Control: no-store` on every response of that route so the CDN in front of the deployed API does not cache it. The header is set on this route only, never app-wide, because the defect and the criteria name this endpoint alone.

Reproduction classification (`/fix` Section R1, carried for the build and the handover):

- Repro: deployed-only: `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time`, expect two different `now` values (source: item)
- Reason: the stale `now` comes from the CDN edge cache in front of the deployed API; the local stack has no edge cache, so locally both calls already differ and the symptom cannot be produced.
- Environment: the deployed environment the item names. `docs/DEVELOPMENT.md` → `## Test environments` has no rows yet, so no URL is recorded and the PR's test section will read `Deployed: not configured`.
- Local regression coverage: the cause (no cache directive on the response) is expressible locally, and the integration tests below assert the header on responses through the application's own test client, so criteria 1 and 2 are covered by executed tests. Criterion 3 is the deployed half and stays a human verification; the handover therefore labels the PR `mayker:to-verify` per `/fix` Section R3.

## Frontend Plan
No frontend changes required. Design reference: Design Reference mode is NONE and this item renders no UI, so no values are recorded.

## Backend Plan
- Endpoints: `GET /api/time`, returns the server's current UTC time, response header `Cache-Control: no-store`. The router takes FastAPI's `Response` parameter and sets `response.headers["Cache-Control"] = "no-store"` before returning the schema instance. Router prefix `/api`, tag `server_time`, same shape as `routers/version.py`.
- Service layer: `backend/app/services/server_time_service.py` exposes `current_utc_time_iso(clock=_utc_now) -> str`. `_utc_now()` returns `datetime.now(timezone.utc)`. The function calls the clock per invocation (never cached at import or module level, which is what keeps `now` per request), rejects a naive datetime with `ValueError` (FEAT-1: never naive), converts to UTC with `astimezone(timezone.utc)` and returns `isoformat()`, which carries the explicit `+00:00` offset. The `clock` parameter exists so unit tests inject fixed datetimes instead of sleeping. Constant `UTC_TIMEZONE_NAME = "UTC"`.
- Schema: `backend/app/schemas/server_time.py`, `ServerTimeResponse(BaseModel)` with `now: str` and `timezone: str`. `now` is a pre-formatted string so the wire format is exactly `isoformat()`'s `+00:00` and not Pydantic's `Z` serialization of a datetime field.
- Router registration: `backend/app/main.py` imports `router as server_time_router` from `app.routers.server_time` and adds `app.include_router(server_time_router)` after the existing three; the module docstring gains BUG-01 (restoring FEAT-1) to its list of registering features. No other line of `main.py` changes, and CORS is untouched: `GET` is already an allowed method.
- Repository layer: none, the endpoint reads no data.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-13T09:41:07.512334+00:00", "timezone": "UTC"}
```

- Errors: any method other than GET returns 405 (FastAPI default); no other error is reachable.

## Technology Selection
- Current time in UTC: chose the standard library's `datetime.now(timezone.utc)` and `isoformat()` over any date library (none is needed, and none is installed).
- Cache directive: chose FastAPI's `Response` parameter setting one header in the route (FastAPI is already installed) over a custom middleware or a new caching-header dependency, because the header applies to one route and a middleware would widen it to every endpoint, which no criterion asks for.
- Response schema: chose Pydantic `BaseModel` (already installed, the existing `schemas/version.py` pattern); no alternative rung applies.
- No new dependency, so `backend/pyproject.toml` and `backend/uv.lock` are unchanged.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router; sets `Cache-Control: no-store` on the response and returns `ServerTimeResponse`
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema (`now: str`, `timezone: str`)
- [B] backend/app/services/server_time_service.py: `current_utc_time_iso(clock)`, per-call UTC time with explicit `+00:00` offset, rejects naive datetimes
- [B] backend/tests/unit/test_server_time_service_unit.py: unit tests for the service (offset, per-call freshness, naive rejection)
- [B] backend/tests/integration/test_server_time_integration.py: router tests through the app's test client (header, shape, freshness across two requests, 405)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/BUG-01/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [B] backend/app/main.py: import and register `server_time_router`; docstring line naming BUG-01 restoring FEAT-1's router
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_server_time_route`

No dependency changes, so no lockfile is regenerated. No E2E spec: no criterion needs navigation or interaction through a UI (see Criterion coverage). README.md and docs/DEVELOPMENT.md need no edit: the item changes no project structure, run configuration, dependency or test infrastructure; it adds one endpoint inside the existing backend layout.

## Testing Strategy
- Unit tests: `server_time_service.current_utc_time_iso` with an injected clock: happy path (returns a string ending in `+00:00` that `datetime.fromisoformat` parses to an aware UTC datetime), edge case (a non-UTC aware clock value, e.g. `+02:00`, is converted to UTC), per-call freshness (a clock yielding two different datetimes gives two different strings, proving nothing is cached in the service), error case (a naive datetime raises `ValueError`). Plus the app-factory route registration in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: `GET /api/time` through the session `client` fixture from `backend/tests/conftest.py` (no database needed): 200 with the `Cache-Control: no-store` header; body shape `{"now", "timezone": "UTC"}` with an aware `+00:00` `now`; two consecutive requests, with `app.services.server_time_service._utc_now` monkeypatched to yield two fixed distinct datetimes, return two different `now` values and both carry `no-store` (no application-side caching); `POST /api/time` returns 405.
  - Directory: backend/tests/integration/
- E2E tests: none for this item. The criteria are response-header and deployed-environment behaviour, and no criterion needs navigation or interaction through the UI (`testing_standards.md` Section 6, asked per criterion below).
  - Directory: e2e/tests/
  - File: none written (`BUG-01_server_time_edge_cache.spec.ts` would be the name; not warranted)
- UAT scenarios: one scenario per criterion (header present; a test asserts it; deployed reproduction returns two different values) plus one edge case (a non-GET method is rejected with 405 and is not part of the cached surface).
  - Directory: e2e/uat/scenarios/

Reproduction for the build: class `deployed-only` (see Plan Overview). The integration test `test_get_server_time_sets_cache_control_no_store` is also the local regression check on the cause; on the base commit it fails (the route answers 404), on the fix it passes.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | `test_get_server_time_sets_cache_control_no_store` | Verifying it needs no navigation or interaction: it is a response header on a router, read through the app's test client |
| 2 | A test asserts the header on the response | Integration | `test_get_server_time_sets_cache_control_no_store`, `test_get_server_time_now_differs_between_requests` | Verifying it needs no navigation or interaction: the criterion is itself the existence of a router-level header assertion |
| 3 | After deploy, the reproduction returns two different values (human, deployed) | Integration | `test_get_server_time_now_differs_between_requests`, `test_current_utc_time_iso_differs_between_calls` | No UI is involved and the edge cache exists only on the deployed environment; locally the tests prove per-request `now` with `no-store` on every response, and the deployed half is the human verification under the `mayker:to-verify` label |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | covered at Integration, see Criterion coverage | Given the API is running When a client requests GET /api/time Then the response status is 200 and its Cache-Control header is no-store |
| 2 | A test asserts the header on the response | covered at Integration, see Criterion coverage | Given the backend test suite When the server time tests run Then the header assertion runs and 0 tests fail |
| 3 | After deploy, the reproduction returns two different values | covered at Integration locally, plus human verification on the deployed environment | Given the fix is deployed behind the CDN When two requests to GET /api/time are made one second apart Then the two now values differ |

## Manual verification plan
None of the three criteria can be verified through the UI: the endpoint has no screen, so each block below is an HTTP or test-run check a developer executes from a terminal at the repository root.

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the branch is checked out and backend dependencies are installed (`uv sync --directory backend`); nothing listens on port 8000. No database is needed: the app starts without `DATABASE_URL` and only logs a warning.
1. Start the API: `uv run --directory backend uvicorn app.main:app --port 8000` → the log shows `Uvicorn running on http://127.0.0.1:8000`.
2. In a second terminal run `curl -si http://localhost:8000/api/time` → the status line is `HTTP/1.1 200 OK` and a header line reads `cache-control: no-store`.
3. Read the body printed by the same call → it is `{"now":"<date>T<time>+00:00","timezone":"UTC"}`, with `now` ending in `+00:00`.
4. Run `curl -si -X POST http://localhost:8000/api/time` → the status line is `HTTP/1.1 405 Method Not Allowed`.

### Criterion 2: A test asserts the header on the response
Prerequisites: the branch is checked out and backend dependencies are installed.
1. Run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the summary line reports `0 failed` (no failures and no errors).
2. Open `backend/tests/integration/test_server_time_integration.py` and find `test_get_server_time_sets_cache_control_no_store` → it asserts `response.headers["cache-control"] == "no-store"` on a `GET /api/time` response.

### Criterion 3: After deploy, the reproduction returns two different values
This is the deployed-only half: it cannot be observed locally, because the local stack has no edge cache. The observable check is two `now` values on the deployed host.
Prerequisites: the PR has merged and the deployed environment has picked up the new build; you know the deployed API host (no row exists yet in `docs/DEVELOPMENT.md` → `## Test environments`, so take it from whoever operates the deployment).
1. Run `curl -si https://<deployed-host>/api/time` → status 200 and a `cache-control: no-store` header line (if the CDN rewrites headers, the edge may add its own; the value from the origin must still be `no-store`).
2. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies whose `now` values differ, by about one second.
3. If both values are identical, the edge still caches the route: do not remove the label; run `/fix BUG-01`.
4. If they differ, remove the `mayker:to-verify` label from the item, which marks it verified.
