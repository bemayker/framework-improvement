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
- Comment (tracker): 25 comments read, all framework PR notices; none carries feedback on this item → Addressed by: nothing to act on, recorded so the read is visible.
- Map note (ingestion, not a comment): "FEAT-1 code for /api/time may be absent from main at 354266a" → Verified on main at 354266a: `backend/app/routers/server_time.py`, `backend/app/schemas/server_time.py` and `backend/app/services/server_time_service.py` do not exist and `backend/app/main.py` registers only the version, notes and health routers. The last commit to add them (1f9d4f4, #558) was undone by the reset 4cc3ac7 (#563). Addressed by: this plan recreates the FEAT-1 endpoint to FEAT-1's own acceptance criteria (ClickUp task 123k99ctzxk, status complete) and adds the `Cache-Control: no-store` fix in the same router. Assumption, recorded per the ambiguity rule: the bug's own fix is unverifiable without the endpoint, so recreating it is the minimum needed to meet criterion 1, not gold plating; FEAT-1's contract is reproduced exactly and nothing beyond it is added.
- Merged since the last plan: n/a (fresh plan, branched from current main 354266a).
- Concurrency note (dispatch): TEST-09 is planned concurrently and may edit `backend/app/main.py` → unchanged: this plan must list `main.py` (router registration); the edit is two added lines, and the build must be serialized with TEST-09 when both manifests list `main.py` (feature_map row for both items says the same). Flagged in shared_risks.md.

## Plan Overview
Backend only. Recreate the `GET /api/time` endpoint FEAT-1 specified (router, Pydantic response schema, a one-function service) following the existing version slice's Router to Service shape (`routers/version.py`, `services/version_service.py`, `schemas/version.py`), register it in `create_app()`, and set `Cache-Control: no-store` on every response of that route so the CDN in front of the deployed API never stores it. Covered by an integration test asserting the header and FEAT-1's shape and per-request freshness, unit tests for the service, and a route-registration unit test. No frontend, no database, no new dependency.

## Frontend Plan
No frontend changes required.

## Backend Plan
- Endpoints: `GET /api/time` returns the current server time in UTC with response header `Cache-Control: no-store`. Router `backend/app/routers/server_time.py`, `APIRouter(prefix="/api", tags=["time"])`, handler takes FastAPI's `Response` parameter and sets `response.headers["Cache-Control"] = "no-store"` before returning the schema instance. The header value lives in a module constant with a one-line why-comment (the CDN caches any response with no directive). The header is set on this route only, not as app-wide middleware: the defect and criterion 1 name this endpoint, and changing caching for `/api/version`, `/api/notes` and `/api/health` is outside scope.
- Service layer: `backend/app/services/server_time_service.py` → `get_current_utc_time() -> datetime` returning `datetime.now(timezone.utc)`, computed on every call (never at import time), so two calls a second apart differ and the value is never naive.
- Schema: `backend/app/schemas/server_time.py` → `ServerTimeResponse(BaseModel)` with `now: datetime` and `timezone: Literal["UTC"]`, and a `field_serializer("now")` returning `value.isoformat()` so the explicit offset is serialised as `+00:00` (FEAT-1 asks for an explicit offset; Pydantic's default would emit `Z`).
- Registration: `backend/app/main.py` imports `router as server_time_router` from `app.routers.server_time` and calls `app.include_router(server_time_router)` after the existing three; module docstring gains the BUG-01 server-time router in its list. No other change to the factory.
- Repository layer: none, the endpoint touches no data.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/time`
- Request: no body, no query parameters
- Response: 200, header `Cache-Control: no-store`, body:

```json
{"now": "2026-11-05T08:40:22.123456+00:00", "timezone": "UTC"}
```

- Other methods: `POST /api/time` returns 405 (FastAPI default for an undeclared method).

## Technology Selection
- `Cache-Control` header on the response: chose FastAPI's own `Response` parameter (installed dependency) over a custom middleware or a new caching package, because one header on one route is a single assignment and no package is needed.
- Current UTC time: chose the standard library's `datetime.now(timezone.utc)` over any time library, because the stdlib returns a timezone-aware UTC value directly.
- Response schema: chose Pydantic `BaseModel` with `field_serializer` (installed via FastAPI) over a bare dict, because FEAT-1 requires a schema and the serializer is the stdlib `isoformat()` call.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [B] backend/app/routers/server_time.py: `GET /api/time` router that sets `Cache-Control: no-store` and returns `ServerTimeResponse`
- [B] backend/app/schemas/server_time.py: `ServerTimeResponse` Pydantic schema with explicit-offset serialisation of `now`
- [B] backend/app/services/server_time_service.py: `get_current_utc_time()` returning an aware UTC datetime per call
- [B] backend/tests/integration/test_server_time_integration.py: HTTP-cycle tests asserting `Cache-Control: no-store`, 200 shape, explicit `+00:00` offset, per-request freshness, 405 on POST
- [B] backend/tests/unit/test_server_time_service_unit.py: service unit tests (aware UTC value, fresh per call, offset is zero)
- [G] e2e/uat/scenarios/BUG-01_server_time_edge_cache.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/BUG-01_server_time_edge_cache_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/BUG-01/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register the server-time router; docstring lists it
- [B] backend/tests/unit/test_main_unit.py: add `test_create_app_registers_time_route` asserting `/api/time` is among the custom routes

No lockfile entry: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` entry: the item changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `get_current_utc_time()` returns an aware datetime whose `utcoffset()` is zero (happy path); two consecutive calls are non-decreasing and not the same object, with `datetime.now` patched to two distinct values to prove per-call evaluation (edge case, deterministic, no sleep); `ServerTimeResponse` serialises `now` with `+00:00` and rejects a `timezone` other than `"UTC"` (error case). Plus the route-registration test in `test_main_unit.py`.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: through the shared `client` fixture, `GET /api/time` returns 200, response header `cache-control` equals `no-store`, body keys are exactly `now` and `timezone`, `timezone == "UTC"`, `now` parses with `datetime.fromisoformat` to an aware value ending in `+00:00`; two requests with the service patched to return two different instants return two different `now` values (freshness without a sleep); `POST /api/time` returns 405. No database is needed: the lifespan skips schema setup when `DATABASE_URL` is unset, as the version integration tests already rely on.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion involves navigation or interaction through a UI; the endpoint has no frontend consumer (`testing_standards.md` Section 6, fourth question asked per criterion: no for all three).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus one edge case (POST returns 405), each verified against the API response rather than a browser page.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | `GET /api/time` responses carry `Cache-Control: no-store` | Integration | Verifying it needs no navigation or interaction: it is a response header of a router, asserted on the real HTTP cycle |
| 2 | A test asserts the header on the response | Integration | The criterion is satisfied by the integration test itself (`test_get_time_sets_cache_control_no_store`); no UI is involved |
| 3 | After deploy, the reproduction returns two different values (human-verified on the deployed environment) | Integration | No UI exists for it and CI has no edge cache; the integration tier covers the two causes it depends on (no-store header present, `now` computed per request), and the deployed check itself is the human step in the Manual verification plan |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `Cache-Control: no-store` on `GET /api/time` | covered at Integration, see Criterion coverage | Given the API is running, When I request GET /api/time, Then the response status is 200 And the Cache-Control header is no-store |
| 2 | A test asserts the header | covered at Integration, see Criterion coverage | Given the backend test suite, When I run the server-time integration tests, Then 0 failed |
| 3 | Deployed reproduction returns two different values | covered at Integration, see Criterion coverage | Given the fix is deployed behind the CDN, When I request GET /api/time twice one second apart, Then the two now values differ |

## Manual verification plan
None of the three criteria has a UI: `/api/time` has no frontend consumer, so each check below reads the HTTP response or the test run instead of a screen.

### Criterion 1: `GET /api/time` responses carry `Cache-Control: no-store`
Prerequisites: the stack is up with `docker compose up -d --build` from the repository root, and the backend answers on `http://localhost:8010` (the port `docker-compose.yml` publishes).
1. In a terminal, run `curl -si http://localhost:8010/api/time` → the status line reads `HTTP/1.1 200 OK`.
2. In the same output, read the headers → a line `cache-control: no-store` is present.
3. Read the body → it has exactly two keys, `now` (for example `2026-11-05T08:40:22.123456+00:00`, ending in `+00:00`) and `timezone` with the value `UTC`.
4. Run `curl -si http://localhost:8010/api/version` → no `cache-control` header is added there (the fix is scoped to `/api/time`).

### Criterion 2: A test asserts the header on the response
Prerequisites: backend dependencies installed (`uv sync --directory backend`).
1. From the repository root, run `uv run --directory backend pytest -q tests/integration/test_server_time_integration.py tests/unit/test_server_time_service_unit.py tests/unit/test_main_unit.py` → the run ends with `0 failed`.
2. Open `backend/tests/integration/test_server_time_integration.py` → a test named `test_get_time_sets_cache_control_no_store` asserts `response.headers["cache-control"] == "no-store"`.

### Criterion 3: After deploy, the reproduction returns two different values
Prerequisites: the merged fix is deployed to the environment behind the CDN; the deployed host name is known to the verifier (it is not recorded in this repository).
1. Run `curl -s https://<deployed-host>/api/time; sleep 1; curl -s https://<deployed-host>/api/time` → two JSON bodies print.
2. Compare the two `now` values → they differ (the second is about one second later). Identical values mean the CDN still caches and the item fails verification.
3. Run `curl -sI https://<deployed-host>/api/time` → the response carries `cache-control: no-store`, and any CDN cache-status header (for example `cf-cache-status` or `x-cache`) does not report a HIT.
